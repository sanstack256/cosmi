"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

import { useAuth } from "@/app/providers/AuthProvider";
import { useInvoices, Invoice } from "@/app/providers/InvoiceProvider";

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
  rate: number;
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

function generateId() {
  return `INV-${Math.floor(Math.random() * 9000 + 1000)}`;
}

/* ------------------------------------------
   Hook
------------------------------------------- */

export function useInvoiceEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams?.get("id") ?? null;

  const { user, plan } = useAuth();
  const { invoices, addInvoice, updateInvoice } = useInvoices();

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
  const [status, setStatus] = useState<Invoice["status"]>("Pending");
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { desc: "Design work", qty: 1, rate: 12500 },
  ]);

  const [previewId] = useState(() => generateId());
  const idToUse = editingInvoice ? editingInvoice.id : previewId;

  /* ------------------------------------------
     Load invoice when editing
  ------------------------------------------- */

  useEffect(() => {
    if (!editingInvoice) return;

    setClient(editingInvoice.client);
    setStatus(editingInvoice.status);

    try {
      const parsed = new Date(editingInvoice.date);
      if (!isNaN(parsed.getTime())) {
        setDate(parsed.toISOString().slice(0, 10));
      }
    } catch {}

    setNotes(editingInvoice.meta?.notes ?? "");

    if (editingInvoice.meta?.lineItems?.length) {
      setLineItems(
        editingInvoice.meta.lineItems.map((li) => ({
          desc: li.desc,
          qty: li.qty,
          rate: li.rate,
        }))
      );
    }
  }, [editingInvoice]);

  /* ------------------------------------------
     Load company profile
  ------------------------------------------- */

  useEffect(() => {
    if (!user) {
      setLoadingCompany(false);
      return;
    }

    const uid = user.uid;

    async function loadCompany() {
      try {
        const ref = doc(db, "users", uid);
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
    () => lineItems.reduce((sum, it) => sum + it.qty * it.rate, 0),
    [lineItems]
  );

  const taxAmount = 0;
  const total = subtotal + taxAmount;

  /* ------------------------------------------
     Line items helpers
  ------------------------------------------- */

  function updateLine(index: number, patch: Partial<LineItem>) {
    setLineItems((prev) =>
      prev.map((li, i) => (i === index ? { ...li, ...patch } : li))
    );
  }

  function addLine() {
    setLineItems((prev) => [
      ...prev,
      { desc: "New item", qty: 1, rate: 0 },
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

  async function saveInvoice(showToast: (msg: string) => void) {
    if (!editingInvoice && plan === "free" && invoiceCountThisMonth >= 5) {
      showToast("Free plan allows only 5 invoices per month");
      return;
    }

    if (!client.trim()) {
      showToast("Client name is required");
      return;
    }

    const formattedDate = new Date(date).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const invoice: Invoice & { createdAt?: any; company?: Company } = {
      id: idToUse,
      client,
      amount: formatCurrencyINR(total),
      status,
      date: formattedDate,
      meta: { lineItems, notes },
      company,
      createdAt: editingInvoice
        ? (editingInvoice as any).createdAt
        : new Date(),
    };

    try {
      if (editingInvoice) {
        await updateInvoice(idToUse, invoice);
        showToast("Invoice updated");
      } else {
        await addInvoice(invoice);
        showToast("Invoice saved");
      }

      setTimeout(() => router.push("/dashboard"), 900);
    } catch (err) {
      console.error(err);
      showToast("Failed to save invoice");
    }
  }

  /* ------------------------------------------
     Public API
  ------------------------------------------- */

  return {
    // flags
    loadingCompany,
    hasCompanyProfile,
    editingInvoice,

    // invoice
    client,
    setClient,
    status,
    setStatus,
    date,
    setDate,
    notes,
    setNotes,
    lineItems,

    // company
    company,

    // totals
    subtotal,
    taxAmount,
    total,

    // helpers
    updateLine,
    addLine,
    removeLine,
    saveInvoice,

    // ids
    idToUse,
  };
}
