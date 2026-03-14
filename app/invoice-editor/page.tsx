"use client";

import React, { useState } from "react";

import InvoiceForm from "@/app/invoice-editor/components/invoice/InvoiceForm";
import InvoicePreview from "@/app/invoice-editor/components/invoice/InvoicePreview";
import { formatCurrencyINR } from "@/app/invoice-editor/hooks/useInvoiceEditor";
import { useInvoiceEditor } from "./hooks/useInvoiceEditor";
import { useAuth } from "@/app/providers/AuthProvider";


export default function InvoiceEditorPage() {
  const {
    loadingCompany,
    hasCompanyProfile,
    editingInvoice,

    client,
    setClient,
    clientEmail,
    setClientEmail,

    status,
    setStatus,
    date,
    setDate,
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
  } = useInvoiceEditor();

  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { plan } = useAuth();

  async function handleSendEmail() {
    if (!clientEmail) {
      showToast("Client email is required to send invoice");
      return;
    }
    try {
      console.log("Sending invoice email to:", clientEmail);
      const response = await fetch("/api/send-reminder", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    to: clientEmail,
    subject: `Invoice ${idToUse} from ${company?.name || "Cosmi"}`,
    html: `
      <h2>Invoice ${idToUse}</h2>

      <p>Hello ${client},</p>

      <p>Your invoice has been generated.</p>

      <p><strong>Total:</strong> ${formatCurrencyINR(total)}</p>

      <p>
        <a href="https://cosmi.vercel.app/invoice/${idToUse}">
          View Invoice
        </a>
      </p>

      <p>Thank you,<br/>${company?.name || "Cosmi"}</p>
    `,
  }),
});

      const result = await response.json();

      if (result.error) {
        showToast("Failed to send email");
      } else {
        showToast("Invoice email sent!");
      }
    } catch (err) {
      showToast("Error sending email");
    }
  }


  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1800);
  }

  /* ------------------------------------------
     Validation Before Save
  ------------------------------------------- */

  async function handleSave() {
    if (!client.trim()) {
      showToast("Client name is required");
      return;
    }

    if (!date) {
      showToast("Invoice date is required");
      return;
    }

    if (!lineItems.length) {
      showToast("Add at least one line item");
      return;
    }

    const hasInvalidItem = lineItems.some(
      (item) =>
        !item.desc.trim() ||
        Number(item.qty) <= 0 ||
        Number(item.rate || 0) <= 0
    );

    if (hasInvalidItem) {
      showToast("All line items must have description, qty & rate");
      return;
    }

    try {
      setSaving(true);
      await saveInvoice(showToast);
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------------------
     UI
  ------------------------------------------- */

  return (
    <div className="min-h-screen bg-[#050509] text-slate-100 flex">

      {/* LEFT PANEL */}
      <div className="w-[600px] xl:w-[700px] 2xl:w-[750px] border-r border-white/5 p-6">

        <InvoiceForm
          loadingCompany={loadingCompany}
          hasCompanyProfile={hasCompanyProfile}
          editingInvoice={editingInvoice}
          idToUse={idToUse}
          client={client}
          setClient={setClient}
          clientEmail={clientEmail}
          setClientEmail={setClientEmail}
          status={status}
          setStatus={setStatus}
          date={date}
          setDate={setDate}
          notes={notes}
          setNotes={setNotes}
          lineItems={lineItems}
          updateLine={updateLine}
          addLine={addLine}
          removeLine={removeLine}
          subtotalFormatted={formatCurrencyINR(subtotal)}
          onSave={handleSave}
          saving={saving}
        />
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex justify-center py-6 px-4">
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleSendEmail}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm"
          >
            Send Invoice Email
          </button>

          <InvoicePreview
            id={idToUse}
            client={client}
            date={date}
            lineItems={lineItems}
            subtotal={subtotal}
            taxAmount={taxAmount}
            total={total}
            notes={notes}
            company={company}
            plan={plan}
          />
        </div>
      </div>

    </div>
  );



}
