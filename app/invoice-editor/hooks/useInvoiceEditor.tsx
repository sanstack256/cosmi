"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRef } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useInvoices, Invoice } from "@/app/providers/InvoiceProvider";
import { useToast } from "@/app/providers/ToastProvider";

/* ------------------------------------------
   Types
------------------------------------------- */

export type Company = {
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  gstin?: string;
  logoURL?: string;
};

export type LineItem = {
  desc: string;
  qty: number;
  rate: string;
};

/* ------------------------------------------
   Helpers
------------------------------------------- */

export function formatCurrencyINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/* ------------------------------------------
   Hook
------------------------------------------- */

export function useInvoiceEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get("id") ?? null;

  const duplicateId = searchParams?.get("duplicateId") ?? null;

  const { showToast } = useToast();

  const hasInitializedDuplicate = useRef(false);

  const { user, isPro } = useAuth();
  const [shouldUpsellClient, setShouldUpsellClient] = useState(false);
  const { invoices, clients, addInvoice, updateInvoice, addClient } = useInvoices();

  /* ---------- Company ---------- */

  const [company, setCompany] = useState<Company>({});
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [hasCompanyProfile, setHasCompanyProfile] = useState(false);

  /* ---------- Invoice ---------- */

  const editingInvoice = useMemo(
    () => (editId ? invoices.find((i) => i.id === editId) ?? null : null),
    [editId, invoices]
  );

  const [client, setClient] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [currency, setCurrency] = useState<"INR" | "USD">("INR")
  const [paymentStatus, setPaymentStatus] =
    useState<Invoice["paymentStatus"]>("unpaid");

  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [notes, setNotes] = useState("");

  const [lineItems, setLineItems] = useState<LineItem[]>([
    { desc: "", qty: 1, rate: "" },
  ]);

  const [dueDate, setDueDate] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [discount, setDiscount] = useState(0);

  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null);

  /* ------------------------------------------
     Load invoice when editing
  ------------------------------------------- */

  useEffect(() => {
    if (!editingInvoice) return;

    setClient(editingInvoice.client);
    setClientEmail((editingInvoice as any).clientEmail || "");
    setPaymentStatus(editingInvoice.paymentStatus || "unpaid");

    if (editingInvoice.currency) {
      setCurrency(editingInvoice.currency);
    }

    try {
      const parsed = new Date(editingInvoice.dueDate);
      if (!isNaN(parsed.getTime())) {
        setDate(parsed.toISOString().slice(0, 10));
      }
    } catch { }

    setNotes(editingInvoice.meta?.notes ?? "");

    if (editingInvoice.meta?.lineItems?.length) {
      setLineItems(
        editingInvoice.meta.lineItems.map((li: any) => ({
          desc: li.desc,
          qty: li.qty,
          rate: String(li.rate ?? ""),
        }))
      );

    }

  }, [editingInvoice]);




  useEffect(() => {
    if (!duplicateId || editId) return;

    const source = invoices.find((i) => i.id === duplicateId);
    if (!source) return;

    // 🚨 prevent double execution (Strict Mode fix)
    if (hasInitializedDuplicate.current) return;
    hasInitializedDuplicate.current = true;

    // 🔥 populate fields
    setClient(source.client || "");
    setClientEmail((source as any).clientEmail || "");
    setPaymentStatus(source.paymentStatus || "unpaid");

    if (source.currency) {
      setCurrency(source.currency);
    }

    // date → set as today (not copied)
    setDate(new Date().toISOString().slice(0, 10));

    setNotes(source.meta?.notes ?? "");

    if (source.meta?.lineItems?.length) {
      setLineItems(
        source.meta.lineItems.map((li: any) => ({
          desc: li.desc,
          qty: li.qty,
          rate: String(li.rate ?? ""),
        }))
      );
    }

    setDueDate("");
    setClientAddress("");
    setTaxRate(0);
    setDiscount(0);

    // ✅ show only once
    showToast("Invoice duplicated. Review details before issuing.");
  }, [duplicateId, editId, invoices]);



  /* ------------------------------------------
     Load company profile
  ------------------------------------------- */

  useEffect(() => {
    if (!user) {
      setLoadingCompany(false);
      return;
    }

    async function loadCompany() {
      try {
        const ref = doc(db, "users", user!.uid);
        const snap = await getDoc(ref);

        if (snap.exists() && snap.data().company) {
          setCompany(snap.data().company);
          setHasCompanyProfile(true);
        } else {
          setHasCompanyProfile(false);
        }
      } catch (err) {
        console.error("Failed to load company:", err);
      } finally {
        setLoadingCompany(false);
      }
    }

    loadCompany();
  }, [user]);

  /* ------------------------------------------
     Calculations
  ------------------------------------------- */

  const subtotal = useMemo(
    () =>
      lineItems.reduce(
        (sum, it) => sum + it.qty * Number(it.rate || 0),
        0
      ),
    [lineItems]
  );

  const taxAmount = useMemo(() => {
    return (subtotal * Number(taxRate || 0)) / 100;
  }, [subtotal, taxRate]);

  const total = useMemo(() => {
    return subtotal + taxAmount - Number(discount || 0);
  }, [subtotal, taxAmount, discount]);
  /* ------------------------------------------
     Line item helpers
  ------------------------------------------- */

  function updateLine(index: number, patch: Partial<LineItem>) {
    setLineItems((prev) =>
      prev.map((li, i) => (i === index ? { ...li, ...patch } : li))
    );
  }

  function addLine() {
    setLineItems((prev) => [
      ...prev,
      { desc: "New item", qty: 1, rate: "0" },
    ]);
  }

  function removeLine(index: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }

  /* ------------------------------------------
     Limits & Save
  ------------------------------------------- */

  const invoiceCountThisMonth = useMemo(() => {
    const now = new Date();

    return invoices.filter((inv: any) => {
      if (!inv.createdAt) return false;

      const d = inv.createdAt.toDate
        ? inv.createdAt.toDate()
        : new Date(inv.createdAt);

      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [invoices]);

  async function ensurePublicLink(invoiceId: string) {
    try {
      const publicId = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      const token = crypto.randomUUID().replace(/-/g, "").slice(0, 24);

      await setDoc(doc(db, "publicInvoices", publicId), {
        invoicePath: `users/${user?.uid}/invoices/${invoiceId}`,
        token,
        createdAt: serverTimestamp(),
      });

      console.log("✅ PUBLIC LINK READY:");
      console.log(`https://cosmi-ten.vercel.app/invoice/${publicId}?t=${token}`);

    } catch (err) {
      console.error("Public link creation failed:", err);
    }
  }

  async function saveInvoice(
    showToast: (msg: string) => void
  ): Promise<any | null> {
    try {

      console.log("CLIENT EMAIL STATE:", clientEmail);


      const existingClient = clients.find(
        (c) => c.name.toLowerCase() === client.toLowerCase()
      );





      const invoiceData: any = {
        client,
        clientEmail: clientEmail?.trim() || null,
        amount: formatCurrencyINR(total),
        paymentStatus,
        date: date,
        dueDate,
        currency,

        remindersSent: {
          d7: false,
          d3: false,
          d1: false,
          due: false,
          overdue: false,
        },

        meta: {
          lineItems: lineItems.map((li) => ({
            ...li,
            rate: Number(li.rate || 0),
          })),
          notes,
        },

        company,
      };

      // 1. If editing existing invoice
      if (editingInvoice) {
        const updated = await updateInvoice(editingInvoice.id, invoiceData);
        showToast("Invoice updated");
        return updated;
      }

      // 2. If already created once → update SAME draft
      if (createdInvoiceId) {
        const updated = await updateInvoice(createdInvoiceId, invoiceData);

        // 🔥 ENSURE PUBLIC LINK EXISTS
        await ensurePublicLink(createdInvoiceId);

        showToast("Invoice updated");
        return updated;
      }

      // 3. First time → create new draft
      const created = await addInvoice(invoiceData) as any;

      const invoiceId = created?.id || created?.docId || created;

      if (!invoiceId) {
        console.error("Invoice ID missing:", created);
        throw new Error("Invoice ID not returned");
      }
      console.log("CREATED INVOICE:", created);


      // 🔥 CREATE PUBLIC LINK HERE
      console.log("🚀 CALLING ensurePublicLink with:", invoiceId);
      await ensurePublicLink(invoiceId);


      setCreatedInvoiceId(invoiceId);

      // 🚀 TRIGGER UPSELL AFTER SUCCESS
      if (!isPro && client.trim() && !existingClient) {
        setShouldUpsellClient(true);
      }

      showToast("Invoice saved");

      return { ...created, id: invoiceId };

    } catch (err) {
      console.error("SAVE ERROR:", err);
      showToast(String(err));
      return null;
    }
  }

  /* ------------------------------------------
     Public API
  ------------------------------------------- */

  const idToUse =
    editingInvoice?.invoiceNumber ||
    (createdInvoiceId ? "Generating..." : "Draft");

  return {
    loadingCompany,
    hasCompanyProfile,
    editingInvoice,

    client,
    setClient,
    clientEmail,
    setClientEmail,
    status: paymentStatus,
    setStatus: setPaymentStatus,
    date,
    setDate,
    dueDate,
    setDueDate,
    clientAddress,
    setClientAddress,
    taxRate,
    setTaxRate,
    discount,
    setDiscount,
    notes,
    setNotes,
    lineItems,
    currency,
    setCurrency,

    company,

    subtotal,
    taxAmount,
    total,

    updateLine,
    addLine,
    removeLine,
    saveInvoice,
    idToUse,

    createdInvoiceId,
    ensurePublicLink,

    shouldUpsellClient,
    setShouldUpsellClient,

    setLineItems,
  };
}