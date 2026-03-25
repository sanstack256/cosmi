"use client";

import React, { useState, useRef } from "react";

import InvoiceForm from "@/app/invoice-editor/components/invoice/InvoiceForm";
import InvoicePreview from "@/app/invoice-editor/components/invoice/InvoicePreview";
import { formatCurrencyINR } from "@/app/invoice-editor/hooks/useInvoiceEditor";
import { useInvoiceEditor } from "./hooks/useInvoiceEditor";
import { useAuth } from "@/app/providers/AuthProvider";
import { useInvoices } from "@/app/providers/InvoiceProvider";
import { useRouter } from "next/navigation";
import { getCurrencySymbol, formatCurrency } from "@/app/utils/currency";


export default function InvoiceEditorPage() {

  const router = useRouter();

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

    currency,
    setCurrency,

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
  } = useInvoiceEditor();

  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const dueDateRef = useRef<HTMLInputElement>(null);
  const lineItemsRef = useRef<HTMLDivElement>(null);
  const isValidating = useRef(false);


  const [highlightSection, setHighlightSection] = useState<string | null>(null);

  const [errors, setErrors] = useState({
    client: false,
    clientEmail: false,
    date: false,
    dueDate: false,
    lineItems: false,
  });


  const { invoices, issueInvoice } = useInvoices();

  const currentInvoice = editingInvoice;


  const { plan } = useAuth();

  const currencySymbol = getCurrencySymbol(currency);

  const formatNumber = (value: number) =>
    formatCurrency(value, currency);
  function handlePrint() {
    if (!printRef.current) return;

    const printContents = printRef.current.innerHTML;
    const win = window.open("", "", "width=900,height=650");

    if (!win) return;

    win.document.write(`
    <html>
      <head>
        <title>Invoice</title>
      </head>
      <body>
        ${printContents}
      </body>
    </html>
  `);

    win.document.close();
    win.focus();
    win.print();
    win.close();
  }

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

<p><strong>Total:</strong> ${currencySymbol}${formatNumber(total)}</p>

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

  function smoothScrollTo(targetY: number, duration = 500) {
    const startY = window.scrollY;
    const diff = targetY - startY;
    let start: number | null = null;

    function easeInOutCubic(t: number) {
      return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function step(timestamp: number) {
      if (!start) start = timestamp;
      const progress = (timestamp - start) / duration;
      const eased = easeInOutCubic(Math.min(progress, 1));

      window.scrollTo(0, startY + diff * eased);

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }

    requestAnimationFrame(step);
  }

  async function handleIssue() {
    if (saving) return;
    console.log("ISSUE CLICKED");

    // 1. Reset errors
    // ✅ 1. Validate everything at once

    let newErrors = {
      client: false,
      clientEmail: false,
      date: false,
      dueDate: false,
      lineItems: false,
    };

    // Field checks
    if (!client.trim()) newErrors.client = true;
    if (!clientEmail.trim()) newErrors.clientEmail = true;
    if (!date) newErrors.date = true;
    if (!dueDate) newErrors.dueDate = true;

    // Line items
    if (!lineItems.length) {
      newErrors.lineItems = true;
    } else {
      const hasInvalidItem = lineItems.some(
        (item) =>
          !item.desc.trim() ||
          Number(item.qty) <= 0 ||
          Number(item.rate || 0) <= 0
      );

      if (hasInvalidItem) newErrors.lineItems = true;
    }

    // ✅ 2. Apply errors
    setErrors(newErrors);

    // ❌ 3. Stop if any error
    if (Object.values(newErrors).some(Boolean)) {
      showToast("Please fill all required fields");

      // Prevent client onBlur from interfering
      isValidating.current = true;

      // Wait for React to paint the error styles, then scroll + focus
      setTimeout(() => {
        let targetRef: React.RefObject<HTMLElement | null> | null = null;

        if (newErrors.client) targetRef = clientRef;
        else if (newErrors.clientEmail) targetRef = emailRef;
        else if (newErrors.date) targetRef = dateRef;
        else if (newErrors.dueDate) targetRef = dueDateRef;
        else if (newErrors.lineItems) {
          setHighlightSection("lineItems");
          lineItemsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
          setTimeout(() => setHighlightSection(null), 3000);
          isValidating.current = false;
          return;
        }

        if (targetRef?.current) {
          targetRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          // Focus after scroll animation settles
          setTimeout(() => {
            targetRef.current?.focus();
          }, 300);
        } else {
          isValidating.current = false;
        }
      });

      return;
    }

    // ✅ ONLY AFTER VALIDATION → SAVE

    let invoiceId: string | null = null;

    // 🔥 ALWAYS SAVE FIRST (single source of truth)
    try {
      setSaving(true);
      const saved = await saveInvoice(showToast);

      if (shouldUpsellClient) {
        showToast("Save clients & autofill with Pro");
        setShouldUpsellClient(false);
      }

      invoiceId = saved?.id;

      console.log("🔥 FINAL INVOICE ID:", invoiceId);

    } finally {
      setSaving(false);
    }

    if (!invoiceId) {
      showToast("Failed to save invoice");
      return;
    }

    // Safety check
    if (!invoiceId) {
      showToast("Failed to save invoice");
      return;
    }

    // ✅ Issue
    await issueInvoice(invoiceId);

    // 🔥 REAL FIX
    await ensurePublicLink(invoiceId);


    showToast("Invoice issued");

    router.push("/dashboard");
  }

  async function handleSave() {
    if (saving) return;

    if (!client.trim()) {
      showToast("Client name is required");
      return;
    }

    if (!date) {
      showToast("Invoice date is required");
      return;
    }

    if (!dueDate) {
      showToast("Due date is required");
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
      const result = await saveInvoice(showToast);

      if (shouldUpsellClient) {
        showToast("Save clients & autofill with Pro");
        setShouldUpsellClient(false);
      }
    } finally {
      setSaving(false);
    }
  }

  /* ------------------------------------------
     UI
  ------------------------------------------- */

  return (
    <div className="min-h-screen bg-[#050509] text-slate-100 flex overflow-y-auto">

      {/* LEFT PANEL */}
      <div
        className="w-[600px] xl:w-[700px] 2xl:w-[750px] border-r border-white/5 p-6"
      >


        <InvoiceForm

          clientRef={clientRef}
          dateRef={dateRef}
          emailRef={emailRef}
          dueDateRef={dueDateRef}
          lineItemsRef={lineItemsRef}
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
          dueDate={dueDate}
          setDueDate={setDueDate}
          clientAddress={clientAddress}
          setClientAddress={setClientAddress}
          taxRate={taxRate}
          setTaxRate={setTaxRate}
          discount={discount}
          setDiscount={setDiscount}
          notes={notes}
          setNotes={setNotes}
          lineItems={lineItems}
          updateLine={updateLine}
          addLine={addLine}
          removeLine={removeLine}
          subtotalFormatted={formatCurrencyINR(subtotal)}
          onSave={handleSave}
          saving={saving}
          currency={currency}
          setCurrency={setCurrency}
          onSendEmail={handleSendEmail}
          onIssue={handleIssue}
          highlightSection={highlightSection}
          errors={errors}
          setErrors={setErrors}
          isValidating={isValidating}
          setLineItems={setLineItems}
        />

      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex justify-center py-6 px-4">
        <div className="flex flex-col items-center gap-4">

          <InvoicePreview
            id={idToUse}
            client={client}
            date={date}
            dueDate={dueDate}
            clientAddress={clientAddress}
            lineItems={lineItems}
            subtotal={subtotal}
            taxAmount={taxAmount}
            total={total}
            notes={notes}
            company={company}
            currency={currency}
            plan={plan}
            discount={discount}
          />
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-lg bg-[#111118] border border-white/10 text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>


  );



}
