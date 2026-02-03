"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthProvider";
import {
  collection,
  addDoc,
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
} from "firebase/firestore";

/* ------------------------------
   Invoice Type
------------------------------- */
export type Invoice = {
  id: string;
  client: string;
  amount: string;
  status: "Paid" | "Pending" | "Overdue";
  date: string;

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
};


/* ------------------------------
   Context Setup
------------------------------- */
type InvoiceContextType = {
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, "id" | "createdAt">) => Promise<void>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  removeInvoice: (id: string) => Promise<void>;
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
const FREE_LIMIT = 5;

function getMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

/* ------------------------------
   Provider Component
------------------------------- */
export function InvoiceProvider({ children }: { children: React.ReactNode }) {
  const { user, plan } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  /* 🔄 Realtime invoices */
  useEffect(() => {
    if (!user) {
      setInvoices([]);
      return;
    }

    const ref = collection(db, "users", user.uid, "invoices");
    const q = query(ref, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (snap) => {
      const list: Invoice[] = snap.docs.map((d) => ({
        ...(d.data() as Omit<Invoice, "id">),
        id: d.id,
      }));
      setInvoices(list);
    });

    return () => unsub();
  }, [user]);

  /* ➕ Add invoice with FREE limit enforcement */
  async function addInvoice(invoice: Omit<Invoice, "id" | "createdAt">) {
    if (!user) throw new Error("Not authenticated");

    // 🔒 Enforce FREE plan limit
    if (plan === "free") {
      const { start, end } = getMonthRange();

      const ref = collection(db, "users", user.uid, "invoices");
      const q = query(
        ref,
        where("createdAt", ">=", Timestamp.fromDate(start)),
        where("createdAt", "<", Timestamp.fromDate(end))
      );

      const snap = await getCountFromServer(q);

      if (snap.data().count >= FREE_LIMIT) {
        throw new Error("FREE_LIMIT_REACHED");
      }
    }

    const ref = collection(db, "users", user.uid, "invoices");

    await addDoc(ref, {
      ...invoice,
      createdAt: serverTimestamp(),
    });

  }

  /* ✏️ Update invoice */
  async function updateInvoice(id: string, invoice: Partial<Invoice>) {
    if (!user) throw new Error("Not authenticated");
    const ref = doc(db, "users", user.uid, "invoices", id);
    await updateDoc(ref, invoice as any);
  }

  /* ❌ Delete invoice */
  async function removeInvoice(id: string) {
    if (!user) throw new Error("Not authenticated");
    const ref = doc(db, "users", user.uid, "invoices", id);
    await deleteDoc(ref);
  }

  return (
    <InvoiceContext.Provider
      value={{
        invoices,
        addInvoice,
        updateInvoice,
        removeInvoice,
      }}
    >
      {children}
    </InvoiceContext.Provider>
  );
}
