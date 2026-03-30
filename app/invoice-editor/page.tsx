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
import { Calendar, Crown } from "lucide-react";
import { format } from "date-fns";
import { collection, addDoc, query, where, onSnapshot, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getNextRunDate } from "@/lib/recurring";
import "react-day-picker/dist/style.css";
import CosmiCalendar from "@/app/components/ui/CosmiCalendar";
import { useToast } from "@/app/providers/ToastProvider";



function formatDateLocal(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}



function getNextRunPreview({
  interval,
  customDays,
  startDate,
}: {
  interval: "weekly" | "monthly" | "custom";
  customDays: number;
  startDate: string;
}) {
  if (!startDate) return null;

  const next = getNextRunDate({
    interval,
    customDays,
    startDate,
  });

  return next;
}


function formatPrettyDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getIntervalLabel(
  interval: "weekly" | "monthly" | "custom",
  customDays: number
) {
  if (interval === "weekly") return "week";
  if (interval === "monthly") return "month";
  return customDays ? `${customDays} days` : "custom interval";
}



function getSmartStartDate({
  interval,
  customDays,
}: {
  interval: "weekly" | "monthly" | "custom";
  customDays: number;
}) {
  const base = new Date();

  if (interval === "weekly") {
    base.setDate(base.getDate() + 7);
  } else if (interval === "monthly") {
    base.setMonth(base.getMonth() + 1);
  } else if (interval === "custom") {
    const days = Math.max(1, customDays || 1);
    base.setDate(base.getDate() + days);
  }

  return formatDateLocal(base);
}




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
  const endButtonRef = useRef<HTMLButtonElement>(null);


  const isValidating = useRef(false);

  const [customDays, setCustomDays] = useState<number | "">("");

  const [openUpwards, setOpenUpwards] = useState(false);

  const [endPickerUpwards, setEndPickerUpwards] = useState(false);

  const [startPickerUpwards, setStartPickerUpwards] = useState(false);

  const { showToast } = useToast();

  const [paymentStatus, setPaymentStatus] = useState("unpaid");

  const [showStartPicker, setShowStartPicker] = useState(false);

  const [showRecurringModal, setShowRecurringModal] = useState(false);

  const [interval, setInterval] = useState<"weekly" | "monthly" | "custom">("monthly");

  const [recurringData, setRecurringData] = useState<any>(null);

  const [startDate, setStartDate] = useState("");

  const [showEndPicker, setShowEndPicker] = useState(false);


  const [endDate, setEndDate] = useState("");

  const [showProModal, setShowProModal] = useState(false);

  const [highlightSection, setHighlightSection] = useState<string | null>(null);



  const [errors, setErrors] = useState({
    client: false,
    clientEmail: false,
    date: false,
    dueDate: false,
    lineItems: false,
  });


  const isEndBeforeStart =
    Boolean(startDate && endDate) &&
    new Date(endDate) < new Date(startDate);

  const isMonthlyEdgeCase =
    interval === "monthly" &&
    startDate &&
    new Date(startDate).getDate() >= 29;

  const safeCustomDays = Number(customDays) || 0;

  const suggestedInterval =
    interval === "custom"
      ? safeCustomDays === 7
        ? "weekly"
        : safeCustomDays === 30
          ? "monthly"
          : null
      : null;

  const isCustomIntervalInvalid =
    interval === "custom" &&
    (safeCustomDays < 1 || safeCustomDays > 365);


  const isRecurringInvalid =
    !startDate ||
    Boolean(isEndBeforeStart) ||
    (interval === "custom" && isCustomIntervalInvalid);


  const { invoices, issueInvoice } = useInvoices();

  const currentInvoice = editingInvoice;

  const invoiceId = currentInvoice?.id;

  const { user, plan } = useAuth();

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
    if (!invoiceId || !user) return;

    if (!invoiceId || !user?.uid) return;

    const q = query(
      collection(db, "recurringInvoices"),
      where("invoiceId", "==", invoiceId),
      where("userId", "==", user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        setRecurringData({ id: doc.id, ...doc.data() });
      } else {
        setRecurringData(null);
      }
    });

    return () => unsubscribe();
  }, [invoiceId, user]);


  useEffect(() => {
    if (!recurringData || !showRecurringModal) return;

    setInterval(recurringData.interval);
    setCustomDays(recurringData.customDays || "");
    setStartDate(recurringData.startDate);
    setEndDate(recurringData.endDate || "");
  }, [recurringData, showRecurringModal]);

  useEffect(() => {
    if (!showRecurringModal) return;

    const smartDate = getSmartStartDate({
      interval,
      customDays: safeCustomDays,
    });

    setStartDate(smartDate);
  }, [interval, customDays, showRecurringModal]);

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

    // ALWAYS SAVE FIRST (single source of truth)
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

  const handleSaveRecurring = async () => {

    console.log("SAVE RECURRING CLICKED");

    let finalInvoiceId = invoiceId;

    if (!finalInvoiceId) {
      const saved = await saveInvoice(showToast);
      finalInvoiceId = saved?.id;
    }

    if (!finalInvoiceId) {
      showToast("Failed to prepare invoice");
      return;
    }

    if (!user) {
      showToast("User not authenticated");
      return;
    }

    try {
      const nextRunAt = getNextRunDate({
        interval,
        customDays: safeCustomDays,
        startDate,
      });

      const existingQuery = query(
        collection(db, "recurringInvoices"),
        where("invoiceId", "==", finalInvoiceId),
        where("userId", "==", user.uid)
      );

      const existingSnap = await getDocs(existingQuery);

      if (!existingSnap.empty) {
        const docRef = existingSnap.docs[0].ref;

        await updateDoc(docRef, {
          interval,
          customDays:
            interval === "custom" ? Math.max(1, safeCustomDays) : null,
          startDate,
          endDate: endDate || null,
          nextRunAt,
        });

        showToast("Recurring updated");
      } else {
        await addDoc(collection(db, "recurringInvoices"), {

          userId: user.uid,
          invoiceId: finalInvoiceId, // ✅ FIXED

          interval,
          customDays:
            interval === "custom" ? Math.max(1, safeCustomDays) : null,

          startDate,
          endDate: endDate || null,

          nextRunAt,
          lastGeneratedAt: null,
          status: "active",

          template: {
            client,
            clientEmail,
            paymentStatus,
            lineItems,
            notes,
            taxRate,
            discount,
            currency,
          },

          history: [],
        });

        showToast("Recurring invoice created", "success");

        setShowRecurringModal(false);
      }

      setShowRecurringModal(false); // ✅ always runs now
    } catch (err) {
      console.error(err);
      showToast("Failed to create recurring invoice", "error");
    }
  };

  const nextRunPreview =
    interval === "custom" && isCustomIntervalInvalid
      ? null
      : getNextRunPreview({
        interval,
        customDays: safeCustomDays,
        startDate,
      });



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
          {recurringData ? (
            <div className="w-full max-w-md p-4 rounded-xl border border-violet-500/20 bg-white/[0.03]">

              <div className="text-sm text-white font-medium">
                Recurring • {recurringData.interval.charAt(0).toUpperCase() + recurringData.interval.slice(1)}
              </div>

              <div className="text-xs text-slate-400 mt-1">
                Next: {recurringData.nextRunAt ? formatPrettyDate(recurringData.nextRunAt) : "-"}
              </div>

              <button
                onClick={() => setShowRecurringModal(true)}
                className="mt-3 text-xs text-violet-400 hover:text-violet-300 transition"
              >
                Manage
              </button>
            </div>
          ) : (


            <button
              onClick={() => {
                if (plan !== "pro") {
                  setShowProModal(true);
                  return;
                }

                if (!invoiceId) {
                  showToast("Save & issue the invoice before enabling recurring");
                  return;
                }

                setShowRecurringModal(true);
              }}
              className={`
  group
  w-full max-w-md p-4 rounded-xl
  bg-white/[0.04] border border-white/10
  text-left
  transition-all duration-200

  ${!invoiceId
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:border-violet-500/40 hover:bg-violet-500/5 hover:-translate-y-[1px] hover:shadow-[0_0_20px_rgba(124,58,237,0.15)]"
                }
`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">
                    Make this recurring
                  </div>
                  <div className="text-xs text-slate-300/80 mt-1">
                    Automatically generate invoices
                  </div>
                </div>

                <div className="flex items-center gap-2 text-violet-400 text-sm font-medium opacity-80 group-hover:opacity-100 transition">

                  {plan !== "pro" && (
                    <Crown size={14} className="text-violet-400" />
                  )}

                  Setup →
                </div>
              </div>
            </button>


          )}

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
            status={status}
            payments={currentInvoice?.payments || []}
          />
        </div>
      </div>

      {showRecurringModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRecurringModal(false);
            }
          }}
        >
          <div
            ref={modalRef}
            onClick={(e) => e.stopPropagation()}
            className="w-[480px] max-h-[90vh] overflow-y-auto rounded-2xl border border-violet-500/20 
bg-[#0b0b12] p-6 
shadow-[0_0_60px_rgba(124,58,237,0.25)]"
          >
            {/* TITLE */}
            <h3 className="text-lg font-semibold text-white mb-5">
              {recurringData ? "Manage recurring invoice" : "Make this invoice recurring"}
            </h3>

            {/* INTERVAL */}
            <label className="text-xs text-slate-400">Interval</label>
            <div className="grid grid-cols-3 gap-2 mt-2 mb-4">
              {[
                { key: "monthly", label: "Monthly", desc: "Every month" },
                { key: "weekly", label: "Weekly", desc: "Every 7 days" },
                { key: "custom", label: "Custom", desc: "Flexible" },
              ].map((item) => {
                const isActive = interval === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setInterval(item.key as any)}
                    className={`
          text-left p-3 rounded-xl border transition-all
          
          ${isActive
                        ? "bg-violet-600/10 border-violet-500 text-white shadow-[0_0_20px_rgba(124,58,237,0.25)]"
                        : "bg-white/[0.03] border-white/5 text-white/70 hover:bg-white/[0.06]"
                      }
        `}
                  >
                    <div className="text-sm font-medium">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-white/50 mt-0.5">
                      {item.desc}
                    </div>
                  </button>
                );
              })}
            </div>


            <div
              className={`
    overflow-hidden transition-[max-height,opacity]
    duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
    ${interval === "custom" ? "max-h-[200px] opacity-100 mt-3" : "max-h-0 opacity-0 transition-all duration-300"}
  `}
            >
              <div
                className={`
      transition-all duration-200 delay-75
      ${interval === "custom" ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
    `}
              >
                <label className="text-xs text-slate-400">
                  Repeat every (days)
                </label>

                <input
                  type="number"
                  min={1}
                  placeholder="Enter custom interval"
                  value={customDays}
                  onChange={(e) => {
                    const val = e.target.value;

                    if (val === "") {
                      setCustomDays("");
                      return;
                    }

                    const num = Number(val);

                    if (!isNaN(num)) {
                      setCustomDays(num);
                    }
                  }}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  className={`
    w-full mt-3 rounded-xl px-4 py-3 text-sm text-white

    bg-[#0f0f17]

    border border-violet-500/20   /* 🔥 base border like tab (lighter) */
    
    ${customDays !== "" && isCustomIntervalInvalid
                      ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/30"
                      : "focus:border-violet-500 focus:ring-violet-500/30"
                    }

    focus:outline-none focus:ring-2

    placeholder:text-slate-500

    transition-all duration-200

    hover:border-violet-400/30
  `}
                />

                {interval === "custom" && customDays !== "" && isCustomIntervalInvalid && (
                  <div className="mt-1 text-xs text-red-400">
                    Enter a valid interval between 1 and 365 days
                  </div>
                )}

                {suggestedInterval && (
                  <div className="mt-2 text-xs text-amber-400 flex items-center justify-between">
                    <span>
                      {suggestedInterval === "weekly"
                        ? "This looks like a weekly schedule."
                        : "This looks like a monthly schedule."}
                    </span>

                    <button
                      type="button"
                      onClick={() => setInterval(suggestedInterval)}
                      className="ml-3 px-2 py-1 rounded-md text-xs 
                      bg-white/[0.05] hover:bg-white/[0.1] text-white transition"
                    >
                      Switch
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* START DATE */}
            <div className="mb-4">
              <label className="text-xs text-slate-400">Start date</label>

              <button
                type="button"
                onClick={() => {
                  setShowStartPicker((prev) => !prev);
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

              <div
                className={`
            overflow-hidden transition-all duration-300
            ${showStartPicker ? "max-h-[400px] opacity-100 mt-3" : "max-h-0 opacity-0"}
          `}
              >
                <CosmiCalendar
                  value={startDate ? new Date(startDate) : null}
                  onChange={(date) => {
                    setStartDate(date);
                    setShowStartPicker(false);
                  }}
                  showQuickActions={true}
                />
              </div>
            </div>

            {/* END DATE */}
            <div className="mb-6">
              <label className="text-xs text-slate-400">
                End date (optional)
              </label>

              <button
                type="button"
                onClick={() => {
                  setShowEndPicker((prev) => !prev);
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

              <div
                className={`
                  overflow-hidden transition-all duration-300
                  ${showEndPicker ? "max-h-[420px] opacity-100 mt-3" : "max-h-0 opacity-0"}
                `}
              >
                <CosmiCalendar
                  value={endDate ? new Date(endDate) : null}
                  onChange={(date) => {
                    setEndDate(date);
                    setShowEndPicker(false);
                  }}
                  showQuickActions={false}
                />

                <div className="mt-3 pt-2 border-t border-white/5 flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">
                    Optional
                  </span>

                  <button
                    onClick={() => {
                      setEndDate("");
                      setShowEndPicker(false);
                    }}
                    className="text-xs px-2 py-1 rounded-md 
              text-slate-400 hover:text-white 
              hover:bg-white/5 transition"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>



            {/* SUMMARY */}
            <div className="mb-6 p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <p className="text-xs text-slate-400 mb-2">
                You will generate:
              </p>

              <div className="space-y-1 text-sm text-white/90">
                <div>
                  • Invoice every{" "}
                  <span className="text-white font-medium">
                    {getIntervalLabel(interval, safeCustomDays)}
                  </span>
                </div>

                <div>
                  • Starting{" "}
                  <span className="text-white font-medium">
                    {startDate ? formatPrettyDate(startDate) : "-"}
                  </span>
                </div>

                <div>
                  •{" "}
                  {endDate ? (
                    <>
                      Until{" "}
                      <span className="text-white font-medium">
                        {formatPrettyDate(endDate)}
                      </span>
                    </>
                  ) : (
                    "No end date"
                  )}
                </div>
              </div>

              {nextRunPreview && (
                <div className="pt-2 mt-2 border-t border-white/5 text-xs text-slate-400">
                  Next invoice:{" "}
                  <span className="text-white font-medium">
                    {formatPrettyDate(nextRunPreview)}
                  </span>
                </div>
              )}

              {/* ⚠ VALIDATION + INTELLIGENCE */}
              <div className="mt-2 space-y-1 text-xs">

                {/* End date error */}
                {isEndBeforeStart && (
                  <div className="text-red-400 transition-all duration-200">
                    ⚠ End date is before start date
                  </div>
                )}

                {/* Monthly edge case */}
                {isMonthlyEdgeCase && (
                  <div className="text-amber-400">
                    Adjusts for shorter months
                  </div>
                )}

                {/* Empty start state */}
                {!startDate && (
                  <div className="text-slate-500">
                    Pick a start date to begin
                  </div>
                )}

              </div>

            </div>



            {/* ✅ ACTIONS (CORRECT PLACE) */}
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
                  if (isRecurringInvalid) {

                    if (interval === "custom" && isCustomIntervalInvalid) {
                      showToast("Enter a valid interval (1–365 days)");
                      return;
                    }

                    if (!startDate) {
                      showToast("Start date is required");
                      startPickerRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                      setShowStartPicker(true);
                      return;
                    }

                    if (isEndBeforeStart) {
                      showToast("End date cannot be before start date");
                      endPickerRef.current?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                      setShowEndPicker(true);
                      return;
                    }

                    return;
                  }

                  handleSaveRecurring();
                }}

                className={`
                      px-4 py-2 rounded-lg text-white transition

                      ${isRecurringInvalid
                    ? "bg-white/10 text-white/40 cursor-not-allowed"
                    : "bg-violet-500 hover:bg-violet-600"
                  }
                `}
              >
                Save recurring
              </button>
            </div>
          </div>
        </div>

      )}

      {showProModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-violet-500/20 
      bg-[#0b0b12] p-6 
      shadow-[0_0_60px_rgba(124,58,237,0.25)]"
          >
            {/* TITLE */}
            <div className="text-lg font-semibold text-white mb-2">
              Recurring invoices are a Pro feature
            </div>

            {/* DESCRIPTION */}
            <div className="text-sm text-slate-400 mb-6 leading-relaxed">
              Automatically generate recurring invoices and save time on manual billing.
              Upgrade to Pro to unlock this feature.
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowProModal(false)}
                className="px-4 py-2 rounded-lg border border-white/10 
          text-slate-300 hover:bg-white/5 transition"
              >
                Maybe later
              </button>

              <button
                onClick={() => {
                  setShowProModal(false);
                  router.push("/pricing");
                }}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white transition"
              >
                View plans
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}