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
  );



}
