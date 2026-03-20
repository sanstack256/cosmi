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

  const { user, plan } = useAuth();
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

  /* ------------------------------------------
     Load invoice when editing
  ------------------------------------------- */

  useEffect(() => {
    if (!editingInvoice) return;

    setClient(editingInvoice.client);
    setClientEmail((editingInvoice as any).clientEmail || "");
    setPaymentStatus(editingInvoice.paymentStatus || "unpaid");

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

  const taxAmount = 0;
  const total = subtotal + taxAmount;

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

  async function saveInvoice(showToast: (msg: string) => void) {
    try {
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

      console.log("CLIENT EMAIL STATE:", clientEmail);


      const existingClient = clients.find(
        (c) => c.name.toLowerCase() === client.toLowerCase()
      );

      if (!existingClient) {
        await addClient({
          name: client,
          email: clientEmail || "",
        });
      }



      const invoiceData: any = {
        client,
        clientEmail: clientEmail?.trim() || null,
        amount: formatCurrencyINR(total),
        paymentStatus,
        date: formattedDate,
        dueDate: date,
        currency: "INR",

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

      if (editingInvoice) {
        await updateInvoice(editingInvoice.id, invoiceData);
        showToast("Invoice updated");
      } else {
        await addInvoice(invoiceData);
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

  const idToUse = editingInvoice?.invoiceNumber || "Draft";

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


    company,

    subtotal,
    taxAmount,
    total,

    updateLine,
    addLine,
    removeLine,
    saveInvoice,
    idToUse,
  };
}