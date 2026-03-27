"use client";

import React, { useState, useRef, useEffect } from "react";
import InvoiceForm from "@/app/invoice-editor/components/invoice/InvoiceForm";
import InvoicePreview from "@/app/invoice-editor/components/invoice/InvoicePreview";
import { formatCurrencyINR } from "@/app/invoice-editor/hooks/useInvoiceEditor";
import { useInvoiceEditor } from "./hooks/useInvoiceEditor";
import { useAuth } from "@/app/providers/AuthProvider";
import { useInvoices } from "@/app/providers/InvoiceProvider";
import { useRouter } from "next/navigation";
import { getCurrencySymbol, formatCurrency } from "@/app/utils/currency";
import { Calendar } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";


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
  const modalRef = useRef<HTMLDivElement | null>(null);
  const startPickerRef = useRef<HTMLDivElement>(null);
  const endPickerRef = useRef<HTMLDivElement>(null);
  const isValidating = useRef(false);

  const [showStartPicker, setShowStartPicker] = useState(false);

  const [showRecurringModal, setShowRecurringModal] = useState(false);

  const [recurringType, setRecurringType] = useState<"weekly" | "monthly" | "custom">("monthly");

  const [intervalDays, setIntervalDays] = useState(30);

  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );

  const [showEndPicker, setShowEndPicker] = useState(false);

  const [endDate, setEndDate] = useState("");


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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        startPickerRef.current &&
        !startPickerRef.current.contains(e.target as Node)
      ) {
        setShowStartPicker(false);
      }

      if (
        endPickerRef.current &&
        !endPickerRef.current.contains(e.target as Node)
      ) {
        setShowEndPicker(false);
      }
    }

    if (showStartPicker || showEndPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showStartPicker, showEndPicker]);


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

          {/* 🔥 RECURRING BUTTON */}
          <button
            onClick={() => {
              if (plan !== "pro") {
                showToast("Recurring invoices are a Pro feature");
                return;
              }
              setShowRecurringModal(true);
            }}
            className="
  w-full max-w-md px-4 py-2 rounded-lg
  bg-gradient-to-r from-violet-600 to-indigo-600
  text-white font-medium
  hover:opacity-90 transition-all
  shadow-[0_0_20px_rgba(124,58,237,0.35)]
"
          >
            Make recurring
          </button>

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

      {showRecurringModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm "
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRecurringModal(false);
            }
          }}
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            className="w-[480px] rounded-2xl border border-violet-500/20 
                 bg-[#0b0b12] p-6 
                 shadow-[0_0_60px_rgba(124,58,237,0.25)]"
          >
            {/* TITLE */}
            <h3 className="text-lg font-semibold text-white mb-5">
              Make this invoice recurring
            </h3>

            {/* INTERVAL */}
            <label className="text-xs text-slate-400">Interval</label>
            <select
              value={recurringType}
              onChange={(e) => setRecurringType(e.target.value as any)}
              className="w-full mt-1 mb-4 bg-white/5 border border-white/10 
                   rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="custom">Custom</option>
            </select>

            {/* CUSTOM INTERVAL */}
            {recurringType === "custom" && (
              <div className="mb-4">
                <label className="text-xs text-slate-400">
                  Repeat every (in days)
                </label>

                <div className="relative mt-1">
                  <input
                    type="number"
                    value={intervalDays}
                    onChange={(e) => setIntervalDays(Number(e.target.value))}
                    className="w-full bg-white/5 border border-white/10 
                   rounded-lg px-3 py-2 pr-14 text-sm text-white"
                  />

                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    days
                  </span>
                </div>

                <p className="text-[11px] text-slate-500 mt-1">
                  Example: 30 = every month
                </p>
              </div>
            )}

            {/* START DATE */}
            <div className="mb-4 relative">
              <label className="text-xs text-slate-400">Start date</label>

              <button
                type="button"
                onClick={() => {
                  setShowStartPicker((p) => !p);
                  setShowEndPicker(false);
                }}
                className="w-full mt-1 bg-white/5 border border-white/10 
               rounded-lg px-3 py-2 text-sm text-left text-white 
               flex justify-between items-center"
              >
                {startDate
                  ? format(new Date(startDate), "dd MMM yyyy")
                  : "Select date"}

                <Calendar size={16} className="text-white/60" />
              </button>

              {showStartPicker && (
                <div
                  ref={startPickerRef}
                  className="absolute z-50 mt-2 bg-[#0b0b12] border border-white/10 rounded-xl p-3 shadow-xl">
                  <DayPicker
                    mode="single"
                    selected={
                      startDate
                        ? new Date(
                          Number(startDate.slice(0, 4)),
                          Number(startDate.slice(5, 7)) - 1,
                          Number(startDate.slice(8, 10))
                        )
                        : undefined
                    }
                    onSelect={(date) => {
                      if (!date) return;

                      const local = new Date(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate()
                      );

                      const formatted = local.toLocaleDateString("en-CA");

                      setStartDate(formatted);
                      setShowStartPicker(false);
                    }}
                    classNames={{
                      months: "text-white",
                      month: "space-y-2",
                      caption: "flex justify-between items-center text-sm text-white mb-2",
                      nav: "flex gap-2",
                      nav_button:
                        "h-7 w-7 rounded-md border border-white/10 hover:bg-white/10 text-white",
                      table: "w-full border-collapse",
                      head_row: "flex",
                      head_cell: "text-xs text-slate-400 w-9 text-center",
                      row: "flex w-full mt-1",
                      cell: "w-9 h-9 text-center text-sm",
                      day: "w-9 h-9 rounded-lg hover:bg-violet-500/20 transition-all duration-150",
                      day_selected: "bg-violet-600 text-white",
                      day_today: "text-violet-400",
                      day_outside: "text-slate-600",

                      // 🔥 CRITICAL: remove all weird states
                      day_range_start: "",
                      day_range_end: "",
                      day_range_middle: "",
                    }}
                    styles={{
                      day: {
                        outline: "none",
                        boxShadow: "none",
                      },
                    }}
                  />
                </div>
              )}
            </div>

            {/* END DATE */}
            <div className="mb-6 relative">
              <label className="text-xs text-slate-400">
                End date (optional)
              </label>

              <button
                type="button"
                onClick={() => {
                  setShowEndPicker((p) => !p);
                  setShowStartPicker(false);
                }}
                className="w-full mt-1 bg-white/5 border border-white/10 
               rounded-lg px-3 py-2 text-sm text-left text-white 
               flex justify-between items-center"
              >
                {endDate
                  ? format(new Date(endDate), "dd MMM yyyy")
                  : "No end date"}

                <Calendar size={16} className="text-white/60" />
              </button>

              {showEndPicker && (
                <div
                  ref={endPickerRef}
                  className="
  absolute left-0 top-full mt-2
  z-50
  bg-[#0b0b12]
  border border-violet-500/20
  rounded-xl p-3
  shadow-[0_0_40px_rgba(124,58,237,0.25)]
  max-w-[90vw]
"
                >
                  <DayPicker
                    mode="single"
                    selected={
                      endDate
                        ? new Date(
                          Number(endDate.slice(0, 4)),
                          Number(endDate.slice(5, 7)) - 1,
                          Number(endDate.slice(8, 10))
                        )
                        : undefined
                    }
                    onSelect={(date) => {
                      if (!date) return;

                      const local = new Date(
                        date.getFullYear(),
                        date.getMonth(),
                        date.getDate()
                      );

                      const formatted = local.toLocaleDateString("en-CA");

                      setEndDate(formatted);          // ✅ FIXED
                      setShowEndPicker(false);        // ✅ FIXED
                    }}
                    classNames={{
                      months: "text-white",
                      month: "space-y-2",
                      caption: "flex justify-between items-center text-sm text-white mb-2",
                      nav: "flex gap-2",
                      nav_button:
                        "h-7 w-7 rounded-md border border-white/10 hover:bg-white/10 text-white",
                      table: "w-full border-collapse",
                      head_row: "flex",
                      head_cell: "text-xs text-slate-400 w-9 text-center",
                      row: "flex w-full mt-1",
                      cell: "w-9 h-9 text-center text-sm",
                      day: "w-9 h-9 rounded-lg hover:bg-violet-500/20 transition-all duration-150",
                      day_selected: "bg-violet-600 text-white",
                      day_today: "text-violet-400",
                      day_outside: "text-slate-600",

                      // 🔥 kill weird styles
                      day_range_start: "",
                      day_range_end: "",
                      day_range_middle: "",
                    }}
                    styles={{
                      day: {
                        outline: "none",
                        boxShadow: "none",
                      },
                    }}
                  />

                  {/* 🔥 CLEAR BUTTON */}
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => {
                        setEndDate("");
                        setShowEndPicker(false);
                      }}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>


            {/* ACTIONS */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRecurringModal(false)}
                className="px-4 py-2 rounded-lg border border-white/10 
                     text-slate-300 hover:bg-white/5 transition"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  showToast("Recurring setup saved (next step coming)");
                  setShowRecurringModal(false);
                }}
                className="px-4 py-2 rounded-lg bg-violet-500 
                     hover:bg-violet-600 text-white transition"
              >
                Save recurring
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-[#111118] border border-white/10 text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>


  );



}
