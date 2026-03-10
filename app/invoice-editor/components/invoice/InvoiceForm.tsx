"use client";

import { useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Invoice } from "@/app/providers/InvoiceProvider";
import { LineItem } from "@/app/invoice-editor/hooks/useInvoiceEditor";
import { useInvoices } from "@/app/providers/InvoiceProvider";
import { useRef, useEffect } from "react";


type Props = {
  loadingCompany: boolean;
  hasCompanyProfile: boolean;
  editingInvoice: Invoice | null;

  client: string;
  setClient: (v: string) => void;

  status: Invoice["paymentStatus"];
  setStatus: (v: Invoice["paymentStatus"]) => void;

  date: string;
  setDate: (v: string) => void;

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
};

export default function InvoiceForm({
  loadingCompany,
  hasCompanyProfile,
  editingInvoice,

  client,
  setClient,
  status,
  setStatus,
  date,
  setDate,
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

  const containerRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
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

        <h2 className="text-lg font-semibold mb-6 text-white">
          {editingInvoice ? "Edit Invoice" : "Create Invoice"}
        </h2>
        <div className="bg-[#0f0f18] border border-white/5 rounded-2xl p-5 space-y-4">

          {/* CLIENT */}
          <div ref={containerRef} className="space-y-1 mb-5 relative">
            <label className="text-xs text-slate-400">Client</label>

            <input
              value={client}
              placeholder="Search or type client name..."
              onChange={(e) => {
                setClient(e.target.value);
                setSearch(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}

              onBlur={async () => {
                if (!client.trim()) return;

                const exists = clients.some(
                  c => c.name.toLowerCase() === client.toLowerCase()
                );

                if (!exists) {
                  await addClient({ name: client });
                }

                setShowResults(false);
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
                    await addClient({ name: search });
                    setClient(search);
                  }

                  setSearch("");
                  setShowResults(false);

                  setTimeout(() => {
                    dateRef.current?.focus();
                  }, 0);
                }
              }}

              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition"
            />

            {showResults && search && (
              <div className="absolute z-20 mt-2 w-full bg-[#0f0f18] border border-white/10 rounded-xl shadow-lg max-h-48 overflow-y-auto">

                {filteredClients.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setClient(c.name);
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
                      await addClient({ name: search });
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

          {/* DATE */}
          <div className="space-y-1 mb-5">
            <label className="text-xs text-slate-400">Date</label>
            <input
              ref={dateRef}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  statusRef.current?.focus();
                }
              }}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition"
            />
          </div>

          {/* STATUS */}
          <div className="space-y-1 mb-6">
            <label className="text-xs text-slate-400">Status</label>
            <select
              ref={statusRef}
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as Invoice["paymentStatus"])
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  firstDescRef.current?.focus();
                }
              }}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition"
            >
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>
      <div className="bg-[#0f0f18] border border-white/5 rounded-2xl p-5 space-y-4">

        {/* LINE ITEMS */}
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
          Line Items
        </h3>


        <div className="space-y-3">
          {lineItems.map((li, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">

              {/* Description */}
              <input
                ref={idx === 0 ? firstDescRef : undefined}
                placeholder="Service description"
                value={li.desc}
                onChange={(e) =>
                  updateLine(idx, { desc: e.target.value })

                }
                className="col-span-6 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-violet-500/50 transition"
              />

              {/* Quantity */}
              <input placeholder="1"
                type="number"
                min="1"
                value={li.qty}
                onChange={(e) =>
                  updateLine(idx, { qty: Number(e.target.value) || 1 })
                }
                className="col-span-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white text-center focus:ring-2 focus:ring-violet-500/50 transition"
              />

              {/* Rate (STRING SAFE) */}
              <input placeholder="0"
                type="number"
                inputMode="numeric"
                value={li.rate}
                onChange={(e) =>
                  updateLine(idx, { rate: e.target.value })
                }
                className="col-span-3 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white text-right placeholder:text-slate-500 focus:ring-2 focus:ring-violet-500/50 transition"
              />

              {/* Remove */}
              <button
                onClick={() => removeLine(idx)}
                className="col-span-1 text-rose-400 hover:text-rose-300 transition text-sm no-print"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={addLine}
        className="mt-4 px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-black text-sm font-semibold transition no-print"
      >
        + Add Line
      </button>
      <div className="bg-[#0f0f18] border border-white/5 rounded-2xl p-5 space-y-4">

        {/* NOTES */}
        <div className="mt-6 space-y-1">
          <label className="text-xs text-slate-400">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white focus:ring-2 focus:ring-violet-500/50 transition"
          />
        </div>

        {/* FOOTER */}
        <div className="mt-8 flex justify-between items-center no-print">
          <div>
            <div className="text-xs text-slate-400">Subtotal</div>
            <div className="text-lg font-semibold text-white">
              {subtotalFormatted}
            </div>
          </div>

          <div className="flex gap-2">

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

            <button
              onClick={onSave}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-black font-semibold disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Invoice"}
            </button>

          </div>

        </div>
      </div>

    </>
  );
}
