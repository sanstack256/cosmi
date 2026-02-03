"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import InvoiceForm from "@/app/invoice-editor/components/invoice/InvoiceForm";
import InvoicePreview from "@/app/invoice-editor/components/invoice/InvoicePreview";
import { formatCurrencyINR } from "@/app/invoice-editor/hooks/useInvoiceEditor";

import { useInvoiceEditor } from "./hooks/useInvoiceEditor";

/* ------------------------------------------
   Page
------------------------------------------- */

export default function InvoiceEditorPage() {
  const router = useRouter();

  const {
    // flags
    loadingCompany,
    hasCompanyProfile,
    editingInvoice,

    // invoice state
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
  } = useInvoiceEditor();

  /* ------------------------------------------
     Toast
  ------------------------------------------- */

  const [toast, setToast] = useState<string | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 1600);
  }

  

  /* ------------------------------------------
     UI
  ------------------------------------------- */

  return (
    <div className="min-h-screen bg-[#050509] text-slate-100 p-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <div className="px-4 py-2 rounded-xl bg-emerald-500 text-black text-sm font-semibold shadow-lg">
            {toast}
          </div>
        </div>
      )}


      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        {/* LEFT: FORM */}
        <div className="col-span-12 lg:col-span-4">
          <InvoiceForm
            loadingCompany={loadingCompany}
            hasCompanyProfile={hasCompanyProfile}
            editingInvoice={editingInvoice}
            idToUse={idToUse}
            client={client}
            setClient={setClient}
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
            onSave={() => saveInvoice(showToast)} saving={false}          />
        </div>

        {/* RIGHT: PREVIEW */}
        <div className="col-span-12 lg:col-span-8">
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
          />
        </div>
      </div>
    </div>
  );
}
