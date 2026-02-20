"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Invoice } from "@/app/providers/InvoiceProvider";
import { LineItem } from "@/app/invoice-editor/hooks/useInvoiceEditor";

type Props = {
  loadingCompany: boolean;
  hasCompanyProfile: boolean;
  editingInvoice: Invoice | null;

  client: string;
  setClient: (v: string) => void;

  status: Invoice["status"];
  setStatus: (v: Invoice["status"]) => void;

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

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <>
      {!loadingCompany && !hasCompanyProfile && (
        <div className="mb-4 rounded-2xl p-4 bg-violet-500/10 border border-violet-500/30 text-sm text-violet-200 no-print
">
          <div className="font-semibold mb-1">
            Set up your company profile
          </div>
          <p className="text-xs text-slate-300">
            Add your business details once and Cosmi will auto-fill them on every
            invoice.
          </p>

          <button
            onClick={() => router.push("/company")}
            className="mt-3 inline-flex items-center px-4 py-1.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-black text-xs font-semibold"
          >
            Go to Company Profile
          </button>
        </div>
      )}

      <div className="print-container rounded-2xl bg-gradient-to-br from-[#0e0e14] to-[#06060a] p-4 ring-1 ring-violet-600/10 print:bg-white print:ring-0">

        {/* Top Bar */}
        <div className="flex justify-between mb-3 no-print">
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/40 text-slate-300"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          <div className="text-xs text-slate-400 font-mono">
            ID: {idToUse}
          </div>
        </div>

        <h2 className="text-sm font-semibold mb-2">
          {editingInvoice ? "Edit Invoice" : "Create Invoice"}
        </h2>

        {/* Client */}
        <label className="text-xs text-slate-400">Client</label>
        <input
          value={client}
          onChange={(e) => setClient(e.target.value)}
          className="w-full rounded-xl bg-black/60 border border-white/10 px-3 py-2 mt-1 mb-3 print:bg-transparent print:border-none print:px-0"
        />

        {/* Date */}
        <label className="text-xs text-slate-400">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-xl bg-black/60 border border-white/10 px-3 py-2 mt-1 mb-3 print:bg-transparent print:border-none print:px-0"
        />

        {/* Status */}
        <label className="text-xs text-slate-400">Status</label>
        <select
          value={status}
          onChange={(e) =>
            setStatus(e.target.value as Invoice["status"])
          }
          className="w-full rounded-xl bg-black/60 border border-white/10 px-3 py-2 mt-1 mb-3 print:bg-transparent print:border-none print:px-0"
        >
          <option value="Pending">Pending</option>
          <option value="Paid">Paid</option>
          <option value="Overdue">Overdue</option>
        </select>

        {/* Line items */}
        <h3 className="mt-3 text-xs font-medium text-slate-400">
          Line items
        </h3>

        <div className="space-y-2 mt-2">
          {lineItems.map((li, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-center">
              <input
                value={li.desc}
                onChange={(e) =>
                  updateLine(idx, { desc: e.target.value })
                }
                className="col-span-6 rounded-xl bg-black/60 border border-white/10 px-2 py-1 print:bg-transparent print:border-none print:px-0"
              />
              <input
                type="number"
                value={li.qty}
                onChange={(e) =>
                  updateLine(idx, { qty: Number(e.target.value) })
                }
                className="col-span-2 rounded-xl bg-black/60 border border-white/10 px-2 py-1 print:bg-transparent print:border-none print:px-0"
              />
              <input
                type="number"
                value={li.rate}
                onChange={(e) =>
                  updateLine(idx, { rate: Number(e.target.value) })
                }
                className="col-span-3 rounded-xl bg-black/60 border border-white/10 px-2 py-1 print:bg-transparent print:border-none print:px-0"
              />
              <button
                onClick={() => removeLine(idx)}
                className="col-span-1 text-rose-400 text-sm no-print"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addLine}
          className="mt-3 px-3 py-1.5 rounded-xl bg-violet-500 text-black no-print
"
        >
          + Add line
        </button>

        {/* Notes */}
        <label className="text-xs text-slate-400 mt-4 block">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full rounded-xl bg-black/60 border border-white/10 px-3 py-2 mt-1 print:bg-transparent print:border-none print:px-0"
        />

        {/* Footer */}
        <div className="mt-4 flex justify-between items-center no-print
">
          <div>
            <div className="text-xs text-slate-400">Subtotal</div>
            <div className="font-semibold">{subtotalFormatted}</div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-semibold"
            >
              Print
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
