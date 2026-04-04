"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  where,
  getCountFromServer,
  serverTimestamp,
  Timestamp,
  setDoc,
  runTransaction,
  arrayUnion,
  limit,
  startAfter,
} from "firebase/firestore";

function parseAmount(value: any): number {
  if (!value) return 0;
  if (typeof value === "number") return value;
  return Number(String(value).replace(/[^0-9.-]+/g, "")) || 0;
}



function ensureFinancialIntegrity(inv: unknown): Invoice | null {
  if (!inv || typeof inv !== "object") return null;

  const i = inv as Invoice;

  // ✅ Currency must exist
  if (!i.currency) {
    console.error("Missing currency:", i.id);
    return null;
  }

  // ✅ FIX legacy normalizedAmount
  if (
    typeof i.normalizedAmount !== "number" ||
    !Number.isFinite(i.normalizedAmount) ||
    i.normalizedAmount <= 0
  ) {
    const fallback = Math.round(parseAmount(i.amount) * 100);

    if (!fallback || !Number.isFinite(fallback)) {
      console.error("Invalid normalizedAmount:", {
        id: i.id,
        value: i.normalizedAmount,
      });
      return null;
    }

    i.normalizedAmount = fallback;
  }

  // ✅ FIX legacy exchangeRate
  if (
    typeof i.exchangeRate !== "number" ||
    !Number.isFinite(i.exchangeRate) ||
    i.exchangeRate <= 0
  ) {
    i.exchangeRate = 1;
  }

  return i;
}

/* ------------------------------
   Invoice Type
------------------------------- */

export type InvoiceLifecycle =
  | "draft"
  | "issued"
  | "cancelled";

export type PaymentStatus =
  | "unpaid"
  | "paid"


export type Invoice = {
  id: string;
  invoiceNumber?: string;
  client: string;
  amount: number;
  lifecycle: InvoiceLifecycle;
  paymentStatus: PaymentStatus;
  createdAt?: any;
  updatedAt?: any;
  issuedAt?: any;
  exchangeRate?: number;
  cancelledAt?: any;
  date: string;
  dueDate: string;

  payments?: {
    amount: number
    date: any
    method?: string
    note?: string
  }[]

  remindersSent?: {
    d7: boolean
    d3: boolean
    d1: boolean
    due: boolean
    overdue: boolean
  }

  company?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    gstin?: string;
  };

  meta?: {
    notes?: string;
    lineItems?: Array<{ desc: string; qty: number; rate: number }>;
  };

  activity?: {
    type: string;
    timestamp: any;
  }[];

  currency?: "INR" | "USD";

  normalizedAmount?: number;
  normalizedCurrency?: string;

};

export type Client = {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  createdAt?: any
}

/* ------------------------------
   Context Setup
------------------------------- */

type InvoiceContextType = {
  invoices: Invoice[];
  clients: Client[];

  addClient: (client: Omit<Client, "id">) => Promise<void>;
  recordPayment: (
    invoiceId: string,
    amount: number,
    method: string,
    note?: string
  ) => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, "id" | "createdAt">) => Promise<{ id: string }>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  removeInvoice: (id: string) => Promise<void>;
  issueInvoice: (id: string) => Promise<void>;
  cancelInvoice: (id: string) => Promise<void>;
};

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export function useInvoices() {
  const ctx = useContext(InvoiceContext);
  if (!ctx) throw new Error("useInvoices must be inside InvoiceProvider");
  return ctx;
}

/* ------------------------------
   Helpers
------------------------------- */



function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

function pad(num: number) {
  return String(num).padStart(4, "0");
}

/* ------------------------------
   Provider Component
------------------------------- */

export function InvoiceProvider({ children }: { children: React.ReactNode }) {
  const { user, isPro, userData } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  /* 🔄 Realtime invoices */

  useEffect(() => {
    if (!user) {
      setInvoices([]);
      return;
    }

    const ref = collection(db, "users", user.uid, "invoices");
    const q = query(
      ref,
      orderBy("createdAt", "desc"),
      limit(50)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: Invoice[] = snap.docs
        .map((d) => ({
          ...(d.data() as Omit<Invoice, "id">),
          id: d.id,
        }))
        .map(ensureFinancialIntegrity)
        .filter((inv): inv is Invoice => inv !== null);

      setInvoices(list);
    });

    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setClients([]);
      return;
    }

    const ref = collection(db, "users", user.uid, "clients");
    const q = query(ref, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const list: Client[] = snap.docs.map((d) => ({
        ...(d.data() as Omit<Client, "id">),
        id: d.id,
      }));

      setClients(list);
    });

    return () => unsub();
  }, [user]);

  /* ➕ Create Draft */

  async function addInvoice(
    invoice: Omit<Invoice, "id" | "createdAt">
  ): Promise<{ id: string }> {
    if (!user) throw new Error("Not authenticated");

    const baseCurrency: "INR" | "USD" =
      (user as any)?.company?.currency || "INR";

    console.log("BASE CURRENCY:", baseCurrency);
    console.log("FULL USER DATA:", userData);

    if (!baseCurrency) {
      console.warn("Missing currency, defaulting to INR");
    }

    if (!invoice.client) throw new Error("Client required");
    if (!invoice.date) throw new Error("Date required");
    if (!invoice.dueDate) throw new Error("Due date required");

    const rawAmount = parseAmount(invoice.amount);
    const cleanedAmount = Number(rawAmount.toFixed(2));

    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      throw new Error("Invalid amount");
    }


    const fromCurrency = invoice.currency || baseCurrency;

    const invoicesRef = collection(db, "users", user.uid, "invoices");
    const newInvoiceRef = doc(invoicesRef);




    console.log("Creating invoice with reminders:", {
      ...invoice,
      remindersSent: {
        d7: false,
        d3: false,
        d1: false,
        due: false,
        overdue: false,
      }
    });


    async function getExchangeRate(from: string, to: string) {
      if (from === to) return 1;

      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const res = await fetch(
          `https://api.exchangerate.host/convert?from=${from}&to=${to}`,
          { signal: controller.signal }
        );

        clearTimeout(timeout);

        const data = await res.json();
        const rate = Number(data?.result);

        if (!rate || !Number.isFinite(rate) || rate <= 0) {
          throw new Error("Invalid rate");
        }

        return rate;
      } catch (err) {
        console.error("Exchange rate failed:", err);
        console.warn("Exchange rate failed, using fallback");
        return 1;
      }
    }

    let rate = 1;

    try {
      rate = await getExchangeRate(fromCurrency, baseCurrency);
    } catch (err) {
      console.warn("Exchange fallback triggered:", err);
      rate = 1;
    }



    const normalizedAmount = Math.round((cleanedAmount * rate) * 100);

    if (!normalizedAmount || !Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
      throw new Error("Invalid normalized amount");
    }


    const payload = {
      ...invoice,

      normalizedAmount,
      exchangeRate: rate,
      normalizedCurrency: baseCurrency,

      lifecycle: "draft",
      paymentStatus: "unpaid",
      payments: [],
      invoiceNumber: null,

      remindersSent: {
        d7: false,
        d3: false,
        d1: false,
        due: false,
        overdue: false,
      },

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      issuedAt: null,
      cancelledAt: null,

      activity: [
        {
          type: "draft_created",
          timestamp: new Date(),
        },
      ],
    };
    console.log("FIRESTORE PAYLOAD:", JSON.stringify(payload, null, 2));

    await setDoc(newInvoiceRef, payload);
    return { id: newInvoiceRef.id };




    // await setDoc(newInvoiceRef, {
    //   ...invoice,

    //   lifecycle: "draft",
    //   paymentStatus: invoice.paymentStatus ?? "unpaid",
    //   payments: [],
    //   invoiceNumber: null,

    //   remindersSent: {
    //     d7: false,
    //     d3: false,
    //     d1: false,
    //     due: false,
    //     overdue: false,
    //   },

    //   createdAt: serverTimestamp(),
    //   updatedAt: serverTimestamp(),
    //   issuedAt: null,
    //   cancelledAt: null,

    //   activity: [
    //     {
    //       type: "draft_created",
    //       timestamp: new Date(),
    //     },
    //   ],
    // });


  }

  async function addClient(client: Omit<Client, "id">) {
    if (!user) throw new Error("Not authenticated");

    // 🔒 Prevent premature execution before plan loads
    if (!isPro) {
      throw new Error("PRO_REQUIRED_CLIENTS");
    }

    const ref = collection(db, "users", user.uid, "clients");
    const newClientRef = doc(ref);

    await setDoc(newClientRef, {
      ...client,
      createdAt: serverTimestamp(),
    });
  }

  /* ✏️ Update Draft */

  async function updateInvoice(id: string, invoice: Partial<Invoice>) {
    if (!user) throw new Error("Not authenticated");

    const ref = doc(db, "users", user.uid, "invoices", id);

    const updates: any = {
      ...invoice,
      updatedAt: serverTimestamp(),
    };

    // 🚫 NEVER allow financial mutation
    delete updates.normalizedAmount;
    delete updates.exchangeRate;
    delete updates.normalizedCurrency;
    delete updates.paymentStatus;

    /* 🔔 Detect payment received */
    if (invoice.paymentStatus === "paid") {
      updates.activity = arrayUnion({
        type: "payment_received",
        timestamp: new Date(),
      });
    }

    await updateDoc(ref, updates);
  }


  async function recordPayment(
    invoiceId: string,
    amount: number,
    method: string,
    note?: string
  ) {
    if (!user) throw new Error("Not authenticated");

    const ref = doc(db, "users", user.uid, "invoices", invoiceId);

    const invoice = invoices.find((i) => i.id === invoiceId);
    if (!invoice) return;

    const existingPayments = invoice.payments || [];

    const safeAmount = Math.round(Number(amount) * 100);

    if (!Number.isFinite(safeAmount) || safeAmount <= 0) {
      throw new Error("Invalid payment amount");
    }

    const newPayments = [
      ...existingPayments,
      {
        amount: safeAmount,
        date: new Date(),
        method,
        note
      }
    ];

    const totalPaid = newPayments.reduce(
      (sum, p) => sum + p.amount,
      0
    );

    const invoiceAmount = invoice.normalizedAmount;

    if (
      typeof invoiceAmount !== "number" ||
      !Number.isFinite(invoiceAmount) ||
      invoiceAmount <= 0
    ) {
      throw new Error("Invalid invoice amount");
    }

    let status: PaymentStatus = "unpaid";

    if (totalPaid >= invoiceAmount) {
      status = "paid";
    }

    await updateDoc(ref, {
      payments: newPayments,
      paymentStatus: status
    });
  }


  /* ❌ Delete Draft */

  async function removeInvoice(id: string) {
    if (!user) throw new Error("Not authenticated");

    const ref = doc(db, "users", user.uid, "invoices", id);
    await deleteDoc(ref);
  }



  async function issueInvoice(id: string) {
    if (!user) throw new Error("Not authenticated");

    const counterRef = doc(db, "users", user.uid, "meta", "counters");
    const invoiceRef = doc(db, "users", user.uid, "invoices", id);

    await runTransaction(db, async (transaction) => {

      const counterDoc = await transaction.get(counterRef);
      const invoiceDoc = await transaction.get(invoiceRef);

      if (!invoiceDoc.exists()) {
        throw new Error("Invoice not found");
      }

      const invoiceData = invoiceDoc.data();

      if (invoiceData.lifecycle !== "draft") {
        throw new Error("Only drafts can be issued");
      }

      let counter = 1;

      if (counterDoc.exists()) {
        counter = (counterDoc.data().invoiceCounter || 0) + 1;
      }

      transaction.set(counterRef, { invoiceCounter: counter }, { merge: true });

      const year = new Date().getFullYear();
      const padded = String(counter).padStart(4, "0");

      const invoiceNumber = `INV-${year}-${padded}`;

      transaction.update(invoiceRef, {
        invoiceNumber,
        lifecycle: "issued",
        issuedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),

        activity: arrayUnion({
          type: "issued",
          timestamp: new Date(),
        }),

      });
    });
  }

  async function cancelInvoice(id: string) {
    if (!user) throw new Error("Not authenticated");

    const invoice = invoices.find((i) => i.id === id);
    if (!invoice) throw new Error("Invoice not found");

    // 🚫 Prevent cancelling paid invoices
    if (invoice.paymentStatus === "paid") {
      throw new Error("PAID_INVOICE_CANNOT_BE_CANCELLED");
    }

    const ref = doc(db, "users", user.uid, "invoices", id);

    await updateDoc(ref, {
      lifecycle: "cancelled",
      cancelledAt: serverTimestamp(),
      updatedAt: serverTimestamp(),

      activity: arrayUnion({
        type: "cancelled",
        timestamp: new Date(),


      }),
    });
  }



  return (
    <InvoiceContext.Provider
      value={{
        invoices,
        clients,
        addClient,
        addInvoice,
        recordPayment,
        updateInvoice,
        removeInvoice,
        issueInvoice,
        cancelInvoice,

      }}
    >
      {children}
    </InvoiceContext.Provider>


  );
}

