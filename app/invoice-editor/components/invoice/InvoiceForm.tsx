"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Invoice } from "@/app/providers/InvoiceProvider";
import { LineItem } from "@/app/invoice-editor/hooks/useInvoiceEditor";
import { useInvoices } from "@/app/providers/InvoiceProvider";
import { useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { getCurrencySymbol, getLocale } from "@/app/utils/currency";
import { useAuth } from "@/app/providers/AuthProvider";
import { Crown } from "lucide-react";




type Props = {
  loadingCompany: boolean;
  hasCompanyProfile: boolean;
  editingInvoice: Invoice | null;

  client: string;
  setClient: (v: string) => void;

  clientEmail: string;
  setClientEmail: (v: string) => void;

  date: string;
  setDate: (v: string) => void;


  dueDate: string;
  setDueDate: (v: string) => void;

  clientAddress: string;
  setClientAddress: (v: string) => void;

  taxRate: number;
  setTaxRate: (v: number) => void;

  currency: "INR" | "USD" | "";
  setCurrency: (v: "INR" | "USD") => void;

  currencySource: "manual" | "client" | "company" | "edit" | null;
  setCurrencySource: (v: "manual" | "client" | "company" | "edit" | null) => void;
  previousClientCurrency: "INR" | "USD" | null;
  setPreviousClientCurrency: (v: "INR" | "USD" | null) => void;


  discount: number;
  setDiscount: (v: number) => void;

  subtotal: number;
  taxAmount: number;
  total: number;

  notes: string;
  setNotes: (v: string) => void;

  lineItems: LineItem[];
  updateLine: (index: number, patch: Partial<LineItem>) => void;
  addLine: () => void;
  removeLine: (index: number) => void;

  setLineItems: (items: LineItem[]) => void;

  subtotalFormatted: string;

  onSave: () => void;
  saving: boolean;
  justSaved: boolean;

  idToUse: string;

  terms: string;
  setTerms: (v: string) => void;

  poNumber: string;
  setPoNumber: (v: string) => void;


  userTouchedCurrency: boolean;
  setUserTouchedCurrency: (v: boolean) => void;

  onSendEmail: () => void;

  onIssue: () => void;

  highlightSection: string | null;

  clientRef: React.RefObject<HTMLInputElement | null>;
  emailRef: React.RefObject<HTMLInputElement | null>;
  dateRef: React.RefObject<HTMLInputElement | null>;
  dueDateRef: React.RefObject<HTMLInputElement | null>;
  lineItemsRef: React.RefObject<HTMLDivElement | null>;
  currencyRef: React.RefObject<HTMLDivElement | null>;


  errors: {
    client: boolean;
    clientEmail: boolean;
    date: boolean;
    dueDate: boolean;
    lineItems: boolean;
    currency: boolean;
  };

  setErrors: React.Dispatch<React.SetStateAction<{
    client: boolean;
    clientEmail: boolean;
    date: boolean;
    dueDate: boolean;
    lineItems: boolean;
    currency: boolean;
  }>>;

  isValidating: React.RefObject<boolean>;

  extraFields: {
    key: string;
    label: string;
    value: string;
  }[];

  setExtraFields: React.Dispatch<
    React.SetStateAction<{
      key: string;
      label: string;
      value: string;
    }[]>
  >;

};




export default function InvoiceForm({
  loadingCompany,
  hasCompanyProfile,
  editingInvoice,

  client,
  setClient,
  clientEmail,
  setClientEmail,
  date,
  setDate,
  dateRef,

  clientRef,
  emailRef,
  dueDateRef,
  lineItemsRef,

  dueDate,
  setDueDate,

  clientAddress,
  setClientAddress,

  currency,
  setCurrency,
  currencyRef,

  taxRate,
  setTaxRate,

  discount,
  setDiscount,

  notes,
  setNotes,

  lineItems,
  updateLine,
  addLine,
  removeLine,

  terms,
  setTerms,

  poNumber,
  setPoNumber,

  subtotalFormatted,
  total,
  onSave,
  saving,
  justSaved,
  taxAmount,

  idToUse,
  onSendEmail,

  onIssue,
  highlightSection,
  userTouchedCurrency,
  setUserTouchedCurrency,
  currencySource,
  setCurrencySource,

  errors,
  setErrors,
  isValidating,
  setLineItems,
  previousClientCurrency,
  setPreviousClientCurrency,

  extraFields,
  setExtraFields,

}: Props) {


  const router = useRouter();
  const { clients, invoices } = useInvoices();

  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);

  const [showMoreDetails, setShowMoreDetails] = useState(false);

  const [activeIndex, setActiveIndex] = useState(-1);

  const { isPro } = useAuth();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<"save" | "issue" | null>(null);

  const baseInput =
    "w-full rounded-xl bg-white/[0.03] backdrop-blur-sm px-3 py-2 text-sm text-white transition-all duration-200 outline-none";

  const normalState =
    "border border-white/10 hover:border-white/20 hover:bg-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

  const focusState =
    "focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 focus:bg-white/[0.06] shadow-[0_0_0_1px_rgba(124,58,237,0.35)]";
  const errorState =
    "border border-rose-500/60 ring-2 ring-rose-500/30 bg-rose-500/[0.04]";

  const [paymentTerms, setPaymentTerms] = useState<"due_on_receipt" | "net_7" | "net_15" | "net_30">("due_on_receipt");


  const filteredClients = isPro
    ? clients.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    )
    : [];


  const FIELD_PRESETS = [
    { key: "poNumber", label: "PO Number" },
    { key: "projectId", label: "Project ID" },
    { key: "reference", label: "Reference" },
  ];


  const currencyMismatch =
    previousClientCurrency &&
    currency &&
    previousClientCurrency !== currency;


  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };


  const handlePrint = () => {
    window.print();
  };

  const currencySymbol = currency ? getCurrencySymbol(currency) : "";


  const isIssued = editingInvoice?.lifecycle === "issued";

  const lockStyle = isIssued
    ? "opacity-60 cursor-not-allowed bg-white/[0.03] border-white/5"
    : "";

  const containerRef = useRef<HTMLDivElement>(null);

  const firstDescRef = useRef<HTMLInputElement>(null);

  const extraFieldRefs = useRef<(HTMLInputElement | null)[]>([]);


  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  useEffect(() => {
    function handleSaveShortcut(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        onSave();
      }
    }




    window.addEventListener("keydown", handleSaveShortcut);

    return () => {
      window.removeEventListener("keydown", handleSaveShortcut);
    };
  }, [onSave]);


  useEffect(() => {
    if (!isIssued) {
      clientRef.current?.focus();
    }
  }, [isIssued]);


  function focusNext(e: React.KeyboardEvent<any>) {
    if (e.key !== "Enter") return;

    e.preventDefault();

    const focusable = Array.from(
      document.querySelectorAll(
        'input, select, textarea, button'
      )
    ).filter((el) => !(el as HTMLInputElement).disabled);

    const index = focusable.indexOf(e.currentTarget);
    const next = focusable[index + 1] as HTMLElement;

    next?.focus();
  }


  function getDueContext() {
    if (!date || !dueDate) return null;

    const d1 = new Date(date);
    const d2 = new Date(dueDate);

    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return "Due same day";
    if (diff > 0) return `Due in ${diff} day${diff > 1 ? "s" : ""}`;
    return `Overdue by ${Math.abs(diff)} day${diff < -1 ? "s" : ""}`;
  }

  const dueContext = getDueContext();

  function applyPaymentTerms(baseDate: string, term: string) {
    if (!baseDate) return "";

    const d = new Date(baseDate);

    switch (term) {
      case "net_7":
        d.setDate(d.getDate() + 7);
        break;
      case "net_15":
        d.setDate(d.getDate() + 15);
        break;
      case "net_30":
        d.setDate(d.getDate() + 30);
        break;
      default:
        return baseDate;
    }

    return d.toISOString().split("T")[0];
  }



  function SectionCard({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) {
    return (
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
        <div className="text-[11px] uppercase tracking-[0.2em] text-white/30 font-medium">
          {title}
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    );
  }


  const derivedCurrencySource =
    currencySource ||
    (currency && client && !userTouchedCurrency ? "client" : null);



  return (
    <>
      {/* Company Warning */}
      {!loadingCompany && !hasCompanyProfile && (
        <div className="mb-6 rounded-xl p-4 bg-violet-500/10 border border-violet-500/30 text-sm text-violet-200 no-print">
          <div className="font-semibold mb-1">
            Set up your company profile
          </div>
          <p className="text-xs text-slate-300">
            Add your business details once and Cosmi will auto-fill them on every invoice.
          </p>

          <button
            onClick={() => router.push("/company")}
            className="mt-3 inline-flex items-center px-4 py-1.5 rounded-lg bg-violet-500 hover:bg-violet-600 text-black text-xs font-semibold transition"
          >
            Go to Company Profile
          </button>
        </div>
      )}

      <div className="space-y-6 bg-gradient-to-b from-[#050509] via-[#06060c] to-[#050509] p-6 rounded-2xl">


        {/* Top Bar */}
        <div className="flex justify-between items-center mb-6 no-print">
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 text-sm transition"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          <div className="text-xs text-slate-500 font-mono">
            ID: {idToUse}
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">

          {/* LEFT: Invoice Info */}
          <div>
            <div className="text-xs text-white/50 font-medium uppercase tracking-widest">
              Invoice
            </div>

            <div className="text-xl font-semibold text-white mt-1">
              {editingInvoice?.invoiceNumber || "Draft"}
            </div>
          </div>

          {/* RIGHT: Status Badge */}
          <div>
            {isIssued ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Issued
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                Draft
              </span>
            )}
          </div>

        </div>

        <h2 className="text-lg font-semibold text-white mb-4">
          {editingInvoice ? "Edit Invoice" : "Create Invoice"}
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-6">

          {/* Currency */}
          <div
            ref={currencyRef}
            className={`space-y-1 transition
  ${!currency ? "ring-1 ring-amber-500/30 rounded-lg p-2" : ""}
  ${errors.currency ? "ring-2 ring-rose-500/40 rounded-lg p-2" : ""}
`}
          >
            <label className="text-xs text-slate-400">
              Currency <span className="text-red-400">*</span>
            </label>
            <select
              disabled={isIssued}
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value as "INR" | "USD");
                setUserTouchedCurrency(true);
                setCurrencySource("manual");
              }}
              className={`
  w-full rounded-xl px-3 py-2 text-sm transition-all duration-300 outline-none
  ${!currency
                  ? "text-white/40 border border-amber-500/40 bg-amber-500/5"
                  : derivedCurrencySource === "client"

                    ? "text-white border border-amber-500/40 bg-amber-500/10 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                    : "text-white border border-white/10 bg-white/[0.04] hover:bg-white/[0.06]"
                }
  focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500
`}
            >
              <option value="" disabled>
                Select currency
              </option>
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
            </select>

            {!currency && (
              <div className="text-[11px] text-amber-400 mt-1">
                Select a currency before issuing
              </div>
            )}

            {derivedCurrencySource === "client" && (
              <div className="flex items-center gap-2 text-[11px] text-amber-300 mt-1 font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Auto-selected from this client’s previous invoice
              </div>
            )}

            {derivedCurrencySource === "manual" && (
              <div className="text-[11px] text-emerald-400 mt-1">
                Currency locked for this invoice
              </div>
            )}



            {currencyMismatch && (
              <div className="text-[11px] text-amber-400 mt-1">
                Previously used {previousClientCurrency} for this client
              </div>
            )}

          </div>



        </div>


        <SectionCard title="Customer">
          {/* CLIENT */}
          <div ref={containerRef} className="space-y-1 mb-5 relative">
            <label className="text-xs text-slate-400">
              Client <span className="text-red-400">*</span>
            </label>

            <input ref={clientRef}
              disabled={isIssued}
              title={isIssued ? "Locked after issuing invoice" : ""}
              value={client}
              placeholder="Search or type client name..."
              onChange={(e) => {

                const value = e.target.value;
                setClient(value);
                setActiveIndex(-1);
                setSearch(value);
                setShowResults(true);

                if (errors.client) {
                  setErrors(prev => ({ ...prev, client: false }));
                }


                // 🔥 SMART AUTOFILL (PRO ONLY)
                if (isPro) {

                  // 🚨 SAFETY: don't run on empty input
                  if (!value.trim()) return;

                  const match = clients.find(
                    c => c.name.toLowerCase() === value.toLowerCase()
                  );

                  if (match) {
                    // ✅ Email
                    setClientEmail(match.email || "");

                    // 🔥 Find last invoice for this client
                    const lastInvoice = invoices
                      .filter(inv => inv.client.toLowerCase() === match.name.toLowerCase())
                      .sort((a, b) => {
                        return new Date(b.date).getTime() - new Date(a.date).getTime();
                      })[0];

                    if (lastInvoice) {
                      // Currency
                      if (lastInvoice.currency && !userTouchedCurrency) {
                        setCurrency(lastInvoice.currency);
                        setCurrencySource("client");
                        setPreviousClientCurrency(lastInvoice.currency);
                      }

                    }
                  }
                }
              }}

              onFocus={() => setShowResults(true)}


              onBlur={() => {
                if (!isValidating.current) setShowResults(false);
              }}

              onKeyDown={(e) => {
                if (!showResults || filteredClients.length === 0) return;

                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIndex((prev) =>
                    prev < filteredClients.length - 1 ? prev + 1 : 0
                  );
                }

                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredClients.length - 1
                  );
                }

                if (e.key === "Enter") {
                  e.preventDefault();

                  if (activeIndex >= 0) {
                    const selected = filteredClients[activeIndex];

                    setClient(selected.name);
                    setClientEmail(selected.email || "");

                    setSearch("");
                    setShowResults(false);
                    setActiveIndex(-1);
                  } else {
                    // fallback (typed value)
                    setClient(search);
                    setSearch("");
                    setShowResults(false);
                  }

                  focusNext(e);
                }
              }}

              className={`
  ${baseInput}
  ${errors.client ? errorState : normalState}
  ${!errors.client ? focusState : ""}
`}
            />

            {errors.client && (
              <div className="text-[11px] text-rose-400 mt-1">
                Client is required
              </div>
            )}

            {/* 🚀 PRO GHOST CTA */}
            {!isPro && client.trim() && (
              <button
                type="button"
                onClick={() => setShowUpgradeModal(true)}
                className="mt-1 text-[11px] text-violet-400 hover:text-violet-300 transition"
              >
                <span className="inline-flex items-center gap-1">
                  <Crown className="w-3 h-3 text-violet-400" />
                  Save this client for future use — Pro
                </span>
              </button>
            )}

            {isPro && showResults && search && (
              <div className="absolute z-20 mt-2 w-full bg-[#0f0f18] border border-white/10
rounded-xl shadow-lg max-h-48 overflow-y-auto
transition-all duration-150
bg-[#0f0f18]">

                {filteredClients.map((c, idx) => (
                  <div
                    key={c.id}
                    onMouseDown={() => {
                      setClient(c.name);
                      setClientEmail(c.email || "");
                      setSearch("");
                      setShowResults(false);

                      if (isPro) {
                        const lastInvoice = invoices
                          .filter(inv => inv.client.toLowerCase() === c.name.toLowerCase())
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

                        if (lastInvoice) {
                          if (lastInvoice.currency && !userTouchedCurrency) {
                            setCurrency(lastInvoice.currency);
                            setCurrencySource("client");
                            setPreviousClientCurrency(lastInvoice.currency);
                          }


                        }
                      }
                    }}
                    className={`px-3 py-2 text-sm text-white cursor-pointer rounded-md transition
  ${activeIndex === idx ? "bg-white/15" : "hover:bg-white/10"}
`}
                  >
                    {c.name}
                  </div>
                ))}

                {search && !clients.some(c => c.name.toLowerCase() === search.toLowerCase()) && (
                  <div
                    onClick={async () => {
                      setClient(search);
                      setSearch("");
                      setShowResults(false);
                    }}
                    className="px-3 py-2 text-sm text-white cursor-pointer rounded-md transition hover:bg-white/10"
                  >
                    + Create "{search}"
                  </div>
                )}

              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-5">

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">
                Client Email <span className="text-red-400">*</span>
              </label>

              <input ref={emailRef}
                type="email"
                value={clientEmail}
                onChange={(e) => {
                  const value = e.target.value;
                  setClientEmail(value);

                  if (errors.clientEmail && isValidEmail(value)) {
                    setErrors(prev => ({ ...prev, clientEmail: false }));
                  }
                }}
                onBlur={() => {
                  if (!clientEmail || !isValidEmail(clientEmail)) {
                    setErrors(prev => ({ ...prev, clientEmail: true }));
                  }
                }}
                onKeyDown={focusNext}
                placeholder="client@email.com"
                className={`
                ${baseInput}
                ${errors.clientEmail ? errorState : normalState}
                ${!errors.clientEmail ? focusState : ""}
              `}
              />

              {errors.clientEmail && (
                <div className="text-[11px] text-rose-400 mt-1">
                  {!clientEmail
                    ? "Client email is required"
                    : "Enter a valid email address"}
                </div>
              )}

            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">
                Client Address
              </label>

              <textarea
                disabled={isIssued}
                value={clientAddress}
                onChange={(e) => setClientAddress(e.target.value)}
                rows={2}
                className={`
                ${baseInput}
                ${normalState}
                ${focusState}
                ${lockStyle}
              `}
              />
            </div>

          </div>

        </SectionCard>

        <SectionCard title="Invoice Details">

          <div className="grid grid-cols-2 gap-3">
            {/* DATE */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">
                Date <span className="text-red-400">*</span>
              </label>

              <div className="relative">
                <input
                  disabled={isIssued}
                  title={isIssued ? "Locked after issuing invoice" : ""}
                  ref={dateRef}
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);

                    if (errors.date) {
                      setErrors(prev => ({ ...prev, date: false }));
                    }
                  }}
                  onKeyDown={focusNext}
                  className={`
                  ${baseInput}
                  ${errors.date ? errorState : normalState}
                  ${!errors.date ? focusState : ""}
                `}
                />

                {errors.date && (
                  <div className="text-[11px] text-rose-400 mt-1">
                    Invoice date is required
                  </div>
                )}

                <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 font-medium" />
              </div>
            </div>

            {/* DUE DATE */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400">
                Due Date <span className="text-red-400">*</span>
              </label>

              <div className="relative">
                <input ref={dueDateRef}
                  type="date"
                  value={dueDate}
                  onChange={(e) => {
                    setDueDate(e.target.value);

                    if (errors.dueDate) {
                      setErrors(prev => ({ ...prev, dueDate: false }));
                    }
                  }}
                  onKeyDown={focusNext}
                  className={`
                  ${baseInput}
                  ${errors.dueDate ? errorState : normalState}
                  ${!errors.dueDate ? focusState : ""}
                `}
                />

                {errors.dueDate && (
                  <div className="text-[11px] text-rose-400 mt-1">
                    Due date is required
                  </div>
                )}

                <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 font-medium" />
              </div>

              {dueContext && (
                <div className="text-[11px] text-white/50 font-medium mt-1">
                  {dueContext}
                </div>
              )}
            </div>



            <div className="col-span-2">
              <div className="space-y-1 w-full max-w-xs">
                <label className="text-xs text-slate-400">
                  Payment Terms
                </label>

                <select
                  value={paymentTerms}
                  onChange={(e) => {
                    const term = e.target.value as typeof paymentTerms;
                    setPaymentTerms(term);

                    if (date) {
                      const newDue = applyPaymentTerms(date, term);
                      setDueDate(newDue);
                    }
                  }}
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-violet-500/40 focus:outline-none"
                >
                  <option value="due_on_receipt">Due on receipt</option>
                  <option value="net_7">Net 7</option>
                  <option value="net_15">Net 15</option>
                  <option value="net_30">Net 30</option>
                </select>
              </div>
            </div>



            <div className="col-span-2 mt-2">
              <button
                type="button"
                onClick={() => setShowMoreDetails((prev) => !prev)}
                className="text-sm text-violet-400 hover:text-violet-300 transition"
              >
                {showMoreDetails ? "Hide details" : "Add details"}
              </button>
            </div>


            {showMoreDetails && (
              <div className="col-span-2 mt-2 space-y-4 border border-white/5 rounded-2xl p-4 bg-white/[0.02]">



                {/* 🔥 Dynamic Fields */}
                {FIELD_PRESETS.filter(
                  (preset) => !extraFields.find((f) => f.key === preset.key)
                ).length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs text-slate-500">
                        Add structured details to your invoice
                      </div>

                      {extraFields.length === 0 && (
                        <div className="text-xs text-slate-500">
                          No additional details added yet
                        </div>
                      )}


                      <div className="flex flex-wrap gap-2">


                        {FIELD_PRESETS
                          .filter((preset) => !extraFields.find((f) => f.key === preset.key))
                          .map((preset) => (
                            <button
                              key={preset.key}
                              onClick={() => {
                                setExtraFields((prev) => {
                                  const updated = [...prev, { ...preset, value: "" }];

                                  setTimeout(() => {
                                    extraFieldRefs.current[updated.length - 1]?.focus();
                                  }, 0);

                                  return updated;
                                });
                              }}
                              className="text-xs px-2 py-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 text-white/70"
                            >
                              + {preset.label}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}



                {FIELD_PRESETS.filter(
                  (preset) => !extraFields.find((f) => f.key === preset.key)
                ).length === 0 && (
                    <div className="text-xs text-slate-500">
                      All standard fields added. You can still add custom fields below.
                    </div>
                  )}

                <div className="space-y-2">
                  {extraFields.map((field, index) => (
                    <div
                      key={field.key}
                      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full min-w-0 bg-white/[0.02] border border-white/5 rounded-xl p-2"
                    >
                      {/* LABEL */}
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => {
                          setExtraFields((prev) =>
                            prev.map((f, i) =>
                              i === index ? { ...f, label: e.target.value } : f
                            )
                          );
                        }}
                        className="w-full sm:flex-1 min-w-0 h-10 bg-transparent border border-white/10 rounded-lg px-3 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 hover:border-white/20"
                        placeholder="Field name (optional)"
                      />

                      {/* VALUE */}
                      <input
                        ref={(el) => {
                          extraFieldRefs.current[index] = el;
                        }}

                        type="text"
                        value={field.value}
                        onChange={(e) => {
                          setExtraFields((prev) =>
                            prev.map((f, i) =>
                              i === index ? { ...f, value: e.target.value } : f
                            )
                          );
                        }}
                        className="w-full sm:flex-1 min-w-0 h-10 bg-transparent border border-white/10 rounded-lg px-3 text-sm text-white placeholder:text-slate-500 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                        placeholder="Value"
                      />

                      {/* DELETE */}
                      <button
                        type="button"
                        onClick={() => {
                          setExtraFields(extraFields.filter((_, i) => i !== index));
                        }}
                        className="h-9 w-9 shrink-0 self-end sm:self-auto flex items-center justify-center rounded-lg opacity-60 hover:opacity-100 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>

                {/* ADD FIELD BUTTON */}
                <button
                  type="button"
                  onClick={() => {
                    setExtraFields((prev) => {
                      // prevent duplicate empty fields
                      if (prev.some((f) => !f.label && !f.value)) return prev;

                      const usedKeys = prev.map((f) => f.key);

                      const preset = FIELD_PRESETS.find(
                        (p) => !usedKeys.includes(p.key)
                      );

                      const newField = preset
                        ? {
                          key: preset.key,
                          label: preset.label,
                          value: "",
                        }
                        : {
                          key: `field_${Date.now()}`,
                          label: `Custom Field ${prev.length + 1}`,
                          value: "",
                        };

                      const updated = [...prev, newField];

                      setTimeout(() => {
                        extraFieldRefs.current[updated.length - 1]?.focus();
                      }, 0);

                      return updated;
                    });
                  }}
                  className="mt-3 text-sm text-violet-400 hover:text-violet-300 transition"
                >
                  + Add another field
                </button>

              </div>
            )}

          </div>

        </SectionCard>


        <div className="relative my-10">
          <div className="h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="absolute inset-0 blur-[4px] bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
        </div>



        <div className={`mt-6 bg-transparent border border-white/5 rounded-2xl p-5 backdrop-blur-sm space-y-4 transition
        ${errors.lineItems || highlightSection === "lineItems"
            ? "border-rose-500/50 ring-1 ring-rose-500/30"
            : "border-white/5"}`}>


          {/* LINE ITEMS */}
          <div className="space-y-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/30 font-medium">
              Line Items <span className="text-red-400">*</span>
            </div>

            {errors.lineItems && (
              <div className="text-[11px] text-rose-400">
                All line items must have a description, quantity &gt; 0, and rate &gt; 0
              </div>
            )}
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-12 gap-2 px-2 text-xs text-white/50 font-medium mb-2">
            <div className="col-span-5">Description</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-2 text-right">Rate</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-1"></div>
          </div>

          <div className="space-y-3">
            {lineItems.length === 0 && (
              <div className="text-sm text-white/50 font-medium text-center py-8 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                No items yet. Add your first service or product.
              </div>
            )}

            {lineItems.map((li, idx) => {
              const rate = Number(li.rate || 0);
              const amount = li.qty * rate;

              return (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 items-center bg-transparent border border-white/10
                  hover:bg-white/[0.04]
                  hover:scale-[1.01]
                  hover:shadow-[0_8px_25px_rgba(0,0,0,0.35)]
                  rounded-xl px-3 py-2
                  transition-all duration-200
                  hover:border-white/20
                  focus-within:border-violet-500/40"
                >
                  {/* Description */}
                  <input
                    disabled={isIssued}
                    title={isIssued ? "Locked after issuing invoice" : ""}
                    ref={idx === 0 ? firstDescRef : undefined}
                    placeholder="Service description"
                    value={li.desc}
                    onKeyDown={focusNext}
                    onChange={(e) => {
                      updateLine(idx, { desc: e.target.value });
                      if (errors.lineItems) setErrors(prev => ({ ...prev, lineItems: false }));
                    }}
                    className="col-span-5 w-full px-3 py-2 rounded-lg bg-transparent border border-white/10
                    hover:bg-white/[0.04]
                    hover:scale-[1.015]
                    hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]
                    text-sm text-white
                    focus:outline-none
                    focus:ring-2 focus:ring-violet-500/30
                    "
                  />

                  {/* Quantity */}
                  <input
                    disabled={isIssued}
                    title={isIssued ? "Locked after issuing invoice" : ""}
                    type="number"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    min="1"
                    value={li.qty}
                    onKeyDown={focusNext}
                    onChange={(e) => {
                      updateLine(idx, { qty: Number(e.target.value) || 1 });
                      if (errors.lineItems) setErrors(prev => ({ ...prev, lineItems: false }));
                    }}
                    className="col-span-2 w-full px-3 py-2 rounded-lg bg-transparent border border-white/10
                  hover:bg-white/[0.04]
                  hover:scale-[1.015]
                  hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]
                  text-sm text-white
                  focus:outline-none
                  focus:ring-2 focus:ring-violet-500/30
                  "
                  />

                  {/* Rate */}
                  <input
                    disabled={isIssued}
                    title={isIssued ? "Locked after issuing invoice" : ""}
                    type="number"
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    inputMode="numeric"
                    value={li.rate}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.shiftKey) {
                        e.preventDefault();
                        addLine();
                        return;
                      }

                      if (e.key !== "Enter") return;

                      e.preventDefault();

                      const isLastRow = idx === lineItems.length - 1;

                      if (isLastRow) {
                        addLine();

                        setTimeout(() => {
                          const nextRow = document.querySelectorAll(
                            'input[placeholder="Service description"]'
                          )[idx + 1] as HTMLElement;

                          nextRow?.focus();
                        }, 0);
                      } else {
                        const nextRow = document.querySelectorAll(
                          'input[placeholder="Service description"]'
                        )[idx + 1] as HTMLElement;

                        nextRow?.focus();
                      }
                    }}
                    onChange={(e) => {
                      updateLine(idx, { rate: e.target.value });
                      if (errors.lineItems) setErrors(prev => ({ ...prev, lineItems: false }));
                    }}
                    className="col-span-2 w-full px-3 py-2 rounded-lg bg-transparent border border-white/10 hover:bg-white/[0.04]
                  hover:scale-[1.015]
                  hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
                  />

                  {/* Amount (READ ONLY) */}
                  <div className="col-span-2 text-right text-sm text-white/80 font-medium px-2">
                    {currency
                      ? `${currencySymbol}${amount.toLocaleString(getLocale(currency || "USD"))}`
                      : "--"}
                  </div>

                  {/* Remove */}
                  <button
                    disabled={isIssued}
                    title={isIssued ? "Locked after issuing invoice" : ""}
                    onClick={() => removeLine(idx)}
                    className="col-span-1 text-rose-400 hover:text-rose-300 transition text-sm no-print"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>

          <button
            disabled={isIssued}
            title={isIssued ? "Locked after issuing invoice" : ""}
            onClick={addLine}
            className="mt-4 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all duration-150 ease-out
          active:scale-[0.97]
          active:shadow-none
          hover:scale-[1.02] shadow-[0_0_25px_rgba(124,58,237,0.35)]
          hover:shadow-[0_0_45px_rgba(124,58,237,0.55)]"
          >
            + Add line item
          </button>
          <div className="mt-6 space-y-4">

            {/* TAX & DISCOUNT */}
            <div className="grid grid-cols-2 gap-4 mb-5">

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Tax (%)</label>

                <input
                  disabled={isIssued}
                  title={isIssued ? "Locked after issuing invoice" : ""}
                  type="number"
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  value={taxRate || ""}
                  placeholder="0"
                  onKeyDown={focusNext}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className={`w-full rounded-lg bg-white/5 border border-white/10 hover:bg-white/[0.03] hover:scale-[1.01] px-3 py-2 text-sm text-white focus:outline-none ${lockStyle} focus:ring-2 focus:ring-violet-500/30
                `} />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Discount</label>

                <input
                  disabled={isIssued}
                  title={isIssued ? "Locked after issuing invoice" : ""}
                  type="number"
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  value={discount || ""}
                  placeholder="0"
                  onKeyDown={focusNext}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className={`
                ${baseInput}
                ${normalState}
                ${focusState}
                ${lockStyle}
              `}
                />
              </div>

            </div>

            {/* NOTES */}
            <div className="mt-6 space-y-1">
              <label className="text-xs text-slate-400">Notes</label>
              <textarea
                value={notes}
                onKeyDown={focusNext}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full rounded-lg bg-white/5 border border-white/10 hover:bg-white/[0.03] hover:scale-[1.01] px-3 py-2 text-sm text-white focus:ring-2 focus:ring-violet-500/30
              focus:ring-offset-0 transition focus:outline-none"
              />
            </div>

            {/* TERMS & CONDITIONS */}
            <div className="mt-6 space-y-1">
              <label className="text-xs text-slate-400">
                Terms & Conditions
              </label>

              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={3}
                placeholder="Payment terms, legal notes, bank details..."
                className="w-full rounded-lg bg-white/5 border border-white/10 hover:bg-white/[0.03] hover:scale-[1.01] px-3 py-2 text-sm text-white focus:ring-2 focus:ring-violet-500/30 focus:outline-none transition"
              />
            </div>

            <div className="mt-8 space-y-6 no-print">

              {/* ===== TOTALS CARD ===== */}
              <div className="ml-auto w-full max-w-sm sticky bottom-6 backdrop-blur-md rounded-2xl border border-violet-500/20 bg-gradient-to-br from-[#0b0b12] to-[#111124] p-6 space-y-4 shadow-[0_0_40px_rgba(124,58,237,0.15)] animate-[pulseSoft_3s_ease-in-out_infinite]">

                {/* Subtotal */}
                <div className="flex justify-between text-sm text-white/70">
                  <span>Subtotal</span>
                  <span>{subtotalFormatted}</span>
                </div>

                {/* Tax */}
                {taxRate > 0 && (
                  <div className="flex justify-between text-sm text-white/70">
                    <span>Tax ({taxRate}%)</span>
                    <span>
                      {currencySymbol}
                      {Number(taxAmount || 0).toLocaleString(getLocale(currency || "USD"))}
                    </span>
                  </div>
                )}

                {/* Discount */}
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-rose-300">
                    <span>Discount</span>
                    <span>
                      -{currencySymbol}{discount.toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-white/10 my-2" />

                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/60">Total</span>
                  <span className="text-4xl font-semibold tracking-tight text-white drop-shadow-[0_0_20px_rgba(124,58,237,0.25)]">
                    {currencySymbol}
                    {total.toLocaleString(getLocale(currency || "USD"))}
                  </span>
                </div>

                {(taxRate > 0 || discount > 0) && (
                  <div className="text-[11px] text-white/50 font-medium mt-1 text-right">
                    {taxRate > 0 && `+${taxRate}% tax `}
                    {discount > 0 && `• -${currencySymbol}${discount}`}
                  </div>
                )}

              </div>

              {/* ===== ACTIONS ===== */}
              <div className="flex justify-end gap-2">

                {/* Save ALWAYS visible */}
                <button
                  onClick={() => {
                    if (saving) return;

                    if (
                      previousClientCurrency &&
                      currency &&
                      previousClientCurrency !== currency
                    ) {
                      setPendingAction("save");
                      setShowCurrencyModal(true);
                      return;
                    }

                    onSave();
                  }}
                  disabled={saving}
                  className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 ease-out
                  ${justSaved
                      ? "bg-emerald-500 text-black shadow-[0_0_25px_rgba(16,185,129,0.45)]"
                      : "bg-white/10 hover:bg-white/20 text-white"
                    }
                    hover:scale-[1.02]
                    active:scale-[0.97] active:shadow-none
                    disabled:opacity-50`}
                >
                  {saving ? "Saving…" : justSaved ? "Saved ✓" : "Save"}
                </button>

                {/* Draft only */}
                {!isIssued && (
                  <button
                    onClick={() => {
                      if (
                        previousClientCurrency &&
                        currency &&
                        previousClientCurrency !== currency
                      ) {
                        setPendingAction("issue");
                        setShowCurrencyModal(true);
                        return;
                      }

                      onIssue();
                    }}
                    className="px-4 py-2 rounded-xl font-semibold text-white
                    bg-gradient-to-r from-violet-600 to-indigo-600
                    hover:from-violet-500 hover:to-indigo-500
                    shadow-[0_0_25px_rgba(124,58,237,0.4)]
                    hover:scale-[1.02]
                    active:scale-[0.97] active:shadow-none
                    transition-all duration-150 ease-out"
                  >
                    Issue & Lock Invoice
                  </button>
                )}

                {/* Issued only */}
                {isIssued && (
                  <>
                    <button
                      onClick={onSendEmail}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                    >
                      Send
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold"
                    >
                      Print
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      Download PDF
                    </button>
                  </>
                )}

              </div>
            </div>

          </div>
        </div>
      </div >


      {/* Currency Mismatch Modal*/}
      {
        showCurrencyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">

            {/* BACKDROP */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setShowCurrencyModal(false);
                setPendingAction(null);
              }}
            />

            {/* MODAL */}
            <div className="relative w-full max-w-md rounded-2xl 
            border border-sky-500/20 
            bg-[#0b0b12] p-6 
            shadow-[0_0_60px_rgba(56,189,248,0.25)]">

              {/* TITLE */}
              <div className="text-lg font-semibold text-sky-300 mb-2">
                Currency Change Detected
              </div>

              {/* MESSAGE */}
              <div className="text-sm text-slate-300 mb-5 leading-relaxed">
                This client was previously invoiced in{" "}
                <span className="text-white font-medium">
                  {previousClientCurrency}
                </span>, but this invoice uses{" "}
                <span className="text-white font-medium">
                  {currency}
                </span>.
                <br /><br />
                Make sure this is intentional before continuing.
              </div>

              {/* ACTIONS */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCurrencyModal(false);
                    setPendingAction(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-white/10 
                text-slate-300 hover:bg-white/5 transition"
                >
                  Go Back
                </button>

                <button
                  onClick={() => {
                    setShowCurrencyModal(false);

                    if (pendingAction === "save") {
                      onSave();
                    }

                    if (pendingAction === "issue") {
                      onIssue();
                    }

                    setPendingAction(null);
                  }}
                  className="px-4 py-2 rounded-lg 
                bg-sky-500 hover:bg-sky-600 text-black font-semibold transition"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        )
      }


      {/* 🚀 PRO UPGRADE MODAL */}
      {
        showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">

            {/* BACKDROP */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowUpgradeModal(false)}
            />

            {/* MODAL */}
            <div className="relative w-full max-w-md rounded-2xl border border-white/10 hover:bg-white/[0.03] hover:scale-[1.01] bg-transparent p-6 shadow-2xl">

              <div className="text-lg font-semibold text-white mb-2">
                Save clients & auto-fill invoices
              </div>

              <div className="text-sm text-slate-400 mb-4">
                Stop typing client details every time.
              </div>

              <div className="space-y-2 text-sm text-slate-300 mb-6">
                <div>• Save clients once</div>
                <div>• Auto-fill details instantly</div>
                <div>• Create invoices faster</div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm text-white"
                >
                  Maybe later
                </button>

                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    // TODO: route to pricing later
                  }}
                  className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-black font-semibold text-sm"
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>
          </div>
        )
      }


    </>
  );
}
