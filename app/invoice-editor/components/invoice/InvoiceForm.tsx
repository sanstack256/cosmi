"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Invoice } from "@/app/providers/InvoiceProvider";
import { LineItem } from "@/app/invoice-editor/hooks/useInvoiceEditor";
import { useInvoices } from "@/app/providers/InvoiceProvider";
import { useRef, useEffect } from "react";
import { Calendar } from "lucide-react";
import { getCurrencySymbol, formatCurrency } from "@/app/utils/currency";


type Props = {
  loadingCompany: boolean;
  hasCompanyProfile: boolean;
  editingInvoice: Invoice | null;

  client: string;
  setClient: (v: string) => void;

  clientEmail: string;
  setClientEmail: (v: string) => void;

  status: Invoice["paymentStatus"];
  setStatus: (v: Invoice["paymentStatus"]) => void;

  date: string;
  setDate: (v: string) => void;


  dueDate: string;
  setDueDate: (v: string) => void;

  clientAddress: string;
  setClientAddress: (v: string) => void;

  taxRate: number;
  setTaxRate: (v: number) => void;

  currency: "INR" | "USD";
  setCurrency: (v: "INR" | "USD") => void;

  discount: number;
  setDiscount: (v: number) => void;

  notes: string;
  setNotes: (v: string) => void;

  lineItems: LineItem[];
  updateLine: (index: number, patch: Partial<LineItem>) => void;
  addLine: () => void;
  removeLine: (index: number) => void;

  subtotalFormatted: string;

  onSave: () => void;
  saving: boolean;

  idToUse: string;

  onSendEmail: () => void;

  onIssue: () => void;

  highlightSection: string | null;

  clientRef: React.RefObject<HTMLInputElement | null>;
  emailRef: React.RefObject<HTMLInputElement | null>;
  dateRef: React.RefObject<HTMLInputElement | null>;
  dueDateRef: React.RefObject<HTMLInputElement | null>;
  lineItemsRef: React.RefObject<HTMLDivElement | null>;


  errors: {
    client: boolean;
    clientEmail: boolean;
    date: boolean;
    dueDate: boolean;
    lineItems: boolean;
  };

  setErrors: React.Dispatch<React.SetStateAction<{
    client: boolean;
    clientEmail: boolean;
    date: boolean;
    dueDate: boolean;
    lineItems: boolean;
  }>>;

  isValidating: React.RefObject<boolean>;
};




export default function InvoiceForm({
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

  subtotalFormatted,
  onSave,
  saving,

  idToUse,
  onSendEmail,

  onIssue,
  highlightSection,

  errors,
  setErrors,
  isValidating,
}: Props) {
  const router = useRouter();
  const { clients, addClient } = useInvoices();

  const [search, setSearch] = useState("");
  const [showResults, setShowResults] = useState(false);



  const filteredClients = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );


  const handlePrint = () => {
    window.print();
  };

const currencySymbol = getCurrencySymbol(currency);


  const isIssued = editingInvoice?.lifecycle === "issued";
  const lockStyle = isIssued

    ? "opacity-60 cursor-not-allowed bg-white/5"
    : "";
  const containerRef = useRef<HTMLDivElement>(null);

  const statusRef = useRef<HTMLSelectElement>(null);
  const firstDescRef = useRef<HTMLInputElement>(null);


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


  const subtotal = lineItems.reduce((sum, li) => {
    const rate = Number(li.rate || 0);
    return sum + li.qty * rate;
  }, 0);

  const taxAmount = Math.round((subtotal * taxRate) / 100);
  const total = subtotal + taxAmount - discount;


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

      <div className="space-y-6">


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
            <div className="text-xs text-white/40 uppercase tracking-widest">
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
          <div className="space-y-1">
            <label className="text-xs text-slate-400">Currency</label>
            <select
              disabled={isIssued}
              title={isIssued ? "Locked after issuing invoice" : ""}
              value={currency}
              onChange={(e) => setCurrency(e.target.value as "INR" | "USD")}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>



        </div>
        <div
          ref={lineItemsRef}
          className={`bg-[#0f0f18] border rounded-2xl p-5 space-y-4 transition
    ${highlightSection === "lineItems"
              ? "border-rose-500/50 ring-1 ring-rose-500/30"
              : "border-white/5"}
  `}
        >
          <h3 className="text-xs uppercase tracking-widest text-white/40 mb-4">
            Billing Details
          </h3>

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
                setClient(e.target.value);
                setSearch(e.target.value);
                setShowResults(true);

                if (errors.client) {
                  setErrors(prev => ({ ...prev, client: false }));
                }
              }}

              onFocus={() => setShowResults(true)}


              onBlur={() => {
                if (!isValidating.current) setShowResults(false);
              }}

              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();

                  const existing = clients.find(
                    c => c.name.toLowerCase() === search.toLowerCase()
                  );

                  if (existing) {
                    setClient(existing.name);
                  } else if (search.trim()) {
                    setClient(search);
                  }

                  setSearch("");
                  setShowResults(false);

                  focusNext(e);

                }
              }}

              className={`w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white transition focus:outline-none
  border
  ${errors.client
                  ? "border-rose-500 ring-2 ring-rose-500/40"
                  : "border-white/10 focus:ring-2 focus:ring-violet-500/40"}
  ${lockStyle}
`}
            />

            {errors.client && (
              <div className="text-[11px] text-rose-400 mt-1">
                Client is required
              </div>
            )}

            {showResults && search && (
              <div className="absolute z-20 mt-2 w-full bg-[#0f0f18] border border-white/10 rounded-xl shadow-lg max-h-48 overflow-y-auto">

                {filteredClients.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setClient(c.name);
                      setClientEmail(c.email || "");
                      setSearch("");
                      setShowResults(false);
                    }}
                    className="px-4 py-2 text-sm hover:bg-white/5 cursor-pointer"
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
                    className="px-4 py-2 text-sm text-violet-400 hover:bg-white/5 cursor-pointer border-t border-white/5"
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
                  setClientEmail(e.target.value);

                  if (errors.clientEmail) {
                    setErrors(prev => ({ ...prev, clientEmail: false }));
                  }
                }}
                onKeyDown={focusNext}
                placeholder="client@email.com"
                className={`w-full rounded-lg bg-white/5 px-3 py-2 text-sm text-white transition focus:outline-none
  ${errors.clientEmail
                    ? "border border-rose-500/60 ring-2 ring-rose-500/30"
                    : "border border-white/10 focus:ring-2 focus:ring-violet-500/40 focus:ring-offset-0"}
`}
              />

              {errors.clientEmail && (
                <div className="text-[11px] text-rose-400 mt-1">
                  Client email is required
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
                className={`w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:ring-2 focus:outline-none focus:ring-violet-500/50 transition ${lockStyle}`}
              />
            </div>

          </div>


          <h3 className="text-xs uppercase tracking-widest text-white/40 mt-6 mb-4">
            Invoice Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {/* DATE */}
            <div className="space-y-1 mb-5">
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
                  className={`w-full rounded-lg bg-white/5 px-3 py-2 pr-10 text-sm text-white appearance-none transition focus:outline-none
  ${errors.date
                      ? "border border-rose-500/60 ring-2 ring-rose-500/30"
                      : "border border-white/10 focus:ring-2 focus:ring-violet-500/40 focus:ring-offset-0"}
  ${lockStyle}
`}
                />

                {errors.date && (
                  <div className="text-[11px] text-rose-400 mt-1">
                    Invoice date is required
                  </div>
                )}

                <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              </div>
            </div>

            {/* DUE DATE */}
            <div className="space-y-1 mb-5">
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
                  className={`w-full rounded-lg bg-white/5 px-3 py-2 pr-10 text-sm text-white appearance-none transition focus:outline-none
  ${errors.dueDate
                      ? "border border-rose-500/60 ring-2 ring-rose-500/30"
                      : "border border-white/10 focus:ring-2 focus:ring-violet-500/40 focus:ring-offset-0"}
`}
                />

                {errors.dueDate && (
                  <div className="text-[11px] text-rose-400 mt-1">
                    Due date is required
                  </div>
                )}

                <Calendar className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
              </div>

              {dueContext && (
                <div className="text-[11px] text-white/40 mt-1">
                  {dueContext}
                </div>
              )}
            </div>

            {/* Status */}
            <div className="space-y-1 mt-1">
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Status</label>
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as Invoice["paymentStatus"])
                  }
                  className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="partial">Partial</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
            </div>


          </div>
        </div>
      </div>
      <div className={`bg-[#0f0f18] border rounded-2xl p-5 space-y-4 transition
        ${errors.lineItems || highlightSection === "lineItems"
          ? "border-rose-500/50 ring-1 ring-rose-500/30"
          : "border-white/5"}`}>

        {/* LINE ITEMS */}
        <div className="space-y-3">
          <div className="text-xs uppercase tracking-widest text-white/50">
            Line Items <span className="text-red-400">*</span>
          </div>

          {errors.lineItems && (
            <div className="text-[11px] text-rose-400">
              All line items must have a description, quantity &gt; 0, and rate &gt; 0
            </div>
          )}
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-12 gap-2 px-2 text-xs text-white/40 mb-2">
          <div className="col-span-5">Description</div>
          <div className="col-span-2 text-center">Qty</div>
          <div className="col-span-2 text-right">Rate</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-1"></div>
        </div>

        <div className="space-y-3">
          {lineItems.length === 0 && (
            <div className="text-sm text-white/40 text-center py-8 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
              No items yet. Add your first service or product.
            </div>
          )}

          {lineItems.map((li, idx) => {
            const rate = Number(li.rate || 0);
            const amount = li.qty * rate;

            return (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 items-center bg-white/5 border border-white/5 rounded-xl px-2 py-2 hover:border-white/10 focus-within:border-violet-500/30 transition-all duration-200 hover:scale-[1.01]"
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
                  className="col-span-5 w-full rounded-md bg-transparent px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                />

                {/* Quantity */}
                <input
                  disabled={isIssued}
                  title={isIssued ? "Locked after issuing invoice" : ""}
                  type="number"
                  min="1"
                  value={li.qty}
                  onKeyDown={focusNext}
                  onChange={(e) => {
                    updateLine(idx, { qty: Number(e.target.value) || 1 });
                    if (errors.lineItems) setErrors(prev => ({ ...prev, lineItems: false }));
                  }}
                  className="col-span-2 w-full text-center rounded-md bg-transparent px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                />

                {/* Rate */}
                <input
                  disabled={isIssued}
                  title={isIssued ? "Locked after issuing invoice" : ""}
                  type="number"
                  inputMode="numeric"
                  value={li.rate}
                  onKeyDown={(e) => {
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
                  className="col-span-2 w-full text-right rounded-md bg-transparent px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500 "
                />

                {/* Amount (READ ONLY) */}
                <div className="col-span-2 text-right text-sm text-white/80 font-medium px-2">
                  {currencySymbol}{amount.toLocaleString(currency === "USD" ? "en-US" : "en-IN")}
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
          className="mt-4 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-black text-sm font-semibold transition no-print"
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
                value={taxRate || ""}
                placeholder="0"
                onKeyDown={focusNext}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className={`w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none ${lockStyle}`} />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Discount</label>

              <input
                disabled={isIssued}
                title={isIssued ? "Locked after issuing invoice" : ""}
                type="number"
                value={discount || ""}
                placeholder="0"
                onKeyDown={focusNext}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className={`w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none ${lockStyle}`}
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
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-violet-500/40 focus:ring-offset-0 transition focus:outline-none"
            />
          </div>

          <div className="mt-8 space-y-6 no-print">

            {/* ===== TOTALS CARD ===== */}
            <div className="ml-auto w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-3">

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
                    {taxAmount.toLocaleString(currency === "USD" ? "en-US" : "en-IN")}
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
                <span className="text-3xl font-bold tracking-tight text-white">
                  {currencySymbol}
                  {total.toLocaleString(currency === "USD" ? "en-US" : "en-IN")}
                </span>
              </div>

              {(taxRate > 0 || discount > 0) && (
                <div className="text-[11px] text-white/40 mt-1 text-right">
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
                  onSave();
                }}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>

              {/* Draft only */}
              {!isIssued && (
                <button
                  onClick={onIssue}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold"
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


    </>
  );
}
