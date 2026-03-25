"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Invoice, useInvoices } from "@/app/providers/InvoiceProvider";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { Crown } from "lucide-react";

type PaymentStatus = "unpaid" | "paid" | "overdue";


function parseAmount(value: any): number {
  if (!value) return 0;
  if (typeof value === "number") return value;
  return Number(String(value).replace(/[^0-9.-]+/g, "")) || 0;
}

export default function InvoicesPage() {
  const router = useRouter();
  const { invoices, cancelInvoice, updateInvoice, removeInvoice } = useInvoices();
  const searchParams = useSearchParams();
  const { plan } = useAuth();

  const isPro = plan === "pro";

  const [showProModal, setShowProModal] = useState(false);

  const statusParam = searchParams.get("status");
  const sortParam = searchParams.get("sort");
  const orderParam = searchParams.get("order");

  const initialStatus =
    statusParam === "unpaid" ||
      statusParam === "paid" ||
      statusParam === "overdue"
      ? statusParam
      : "All";

  const initialSort =
    sortParam === "date" || sortParam === "amount"
      ? sortParam
      : "date";

  const initialOrder =
    orderParam === "asc" || orderParam === "desc"
      ? orderParam
      : "desc";

  const [statusFilter, setStatusFilter] =
    useState<string>(initialStatus);

  const [sortKey, setSortKey] =
    useState<"date" | "amount">(initialSort);

  const [sortOrder, setSortOrder] =
    useState<"asc" | "desc">(initialOrder);

  const [selected, setSelected] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);


  const handleDuplicate = (invoice: Invoice) => {
    if (plan !== "pro") {
      setShowProModal(true);
      return;
    }

    router.push(`/invoice-editor?duplicateId=${invoice.id}`);
  };

  function updateQuery(params: {
    status?: string;
    sort?: string;
    order?: string;
  }) {
    const newParams = new URLSearchParams(searchParams.toString());

    if (params.status !== undefined)
      newParams.set("status", params.status);

    if (params.sort !== undefined)
      newParams.set("sort", params.sort);

    if (params.order !== undefined)
      newParams.set("order", params.order);

    router.push(`?${newParams.toString()}`);
  }

  /* 🔥 Auto-overdue (only issued invoices) */
  useEffect(() => {
    invoices.forEach((inv) => {

      if (
        inv.lifecycle === "issued" &&
        inv.paymentStatus !== "paid" &&
        inv.paymentStatus !== "partial" &&
        inv.paymentStatus !== "overdue" &&
        inv.dueDate &&
        new Date(inv.dueDate) < new Date()
      ) {
        updateInvoice(inv.id, { paymentStatus: "overdue" });
      }

    });
  }, [invoices]);


  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCancelTarget(null);
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, []);

  /* ---------- Stats ---------- */

  const stats = invoices.reduce(
    (acc, inv) => {
      const amount = parseAmount(inv.amount);
      acc.totalRevenue += amount;

      if (inv.paymentStatus === "unpaid") {
        acc.pendingAmount += amount;
        acc.pendingCount += 1;
      }

      if (inv.paymentStatus === "paid") acc.paidCount += 1;
      if (inv.paymentStatus === "overdue") acc.overdueCount += 1;

      return acc;
    },
    {
      totalRevenue: 0,
      pendingAmount: 0,
      pendingCount: 0,
      paidCount: 0,
      overdueCount: 0,
    }
  );

  const statusCounts = invoices.reduce(
    (acc: Record<string, number>, inv) => {
      if (inv.paymentStatus) {
        acc[inv.paymentStatus] =
          (acc[inv.paymentStatus] || 0) + 1;
      }
      return acc;
    },
    {}
  );

  let filteredInvoices =
    statusFilter === "All"
      ? [...invoices]
      : invoices.filter(
        (inv) => inv.paymentStatus === statusFilter
      );

  /* 🔎 Search Filter */

  if (searchQuery.trim() !== "") {
    const q = searchQuery.toLowerCase();

    filteredInvoices = filteredInvoices.filter((inv) => {

      const client = inv.client?.toLowerCase() || "";
      const number = inv.invoiceNumber?.toLowerCase() || "";
      const amount = String(inv.amount);

      return (
        client.includes(q) ||
        number.includes(q) ||
        amount.includes(q)
      );
    });
  }

  filteredInvoices.sort((a, b) => {
    let valA: any = a[sortKey];
    let valB: any = b[sortKey];

    if (sortKey === "amount") {
      valA = parseAmount(valA);
      valB = parseAmount(valB);
    } else {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    }

    return sortOrder === "asc" ? valA - valB : valB - valA;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]";
      case "unpaid":
        return "bg-amber-500/10 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]";
      case "overdue":
        return "bg-rose-500/10 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.15)]";
      default:
        return "";
    }
  };

  return (
    <div className="text-white">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">

        <h1 className="text-3xl font-semibold">Invoices</h1>

        <div className="flex items-center gap-3">

          {/* Search */}
          <input
            type="text"
            placeholder="Search invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#0f1020] border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />

          <button
            onClick={() => router.push("/invoice-editor")}
            className="bg-[#7c3aed] hover:bg-[#6d28d9] px-5 py-2 rounded-xl font-medium transition"
          >
            + Create Invoice
          </button>

        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <PremiumCard
          label="Total Revenue"
          value={`₹ ${stats.totalRevenue.toLocaleString("en-IN")}`}
          accent="violet"
        />
        <PremiumCard
          label="Pending"
          value={`${stats.pendingCount}`}
          sub={`₹ ${stats.pendingAmount.toLocaleString("en-IN")} pending`}
          accent="amber"
        />
        <PremiumCard
          label="Paid"
          value={`${stats.paidCount}`}
          accent="emerald"
        />
        <PremiumCard
          label="Overdue"
          value={`${stats.overdueCount}`}
          accent="rose"
        />
      </div>

      {/* Table */}
      <div className="bg-[#0f1020] border border-white/5 rounded-xl">
        <table className="w-full text-left">
          <thead className="bg-[#181833] text-gray-500 text-[11px] uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Invoice</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="group border-b border-white/5 hover:bg-white/[0.03] cursor-pointer"
                onClick={() =>
                  router.push(`/dashboard/invoices/${invoice.id}`)
                }
              >
                <td className="px-6 py-4">
                  <span className="px-3 py-1 rounded-md bg-violet-500/10 text-violet-300 text-xs font-semibold">
                    {invoice.lifecycle === "draft"
                      ? "Draft"
                      : invoice.lifecycle === "cancelled"
                        ? `${invoice.invoiceNumber} (Cancelled)`
                        : invoice.invoiceNumber}
                  </span>
                </td>


                <td className="px-6 py-4">{invoice.client}</td>
                <td className="px-6 py-4">{invoice.date}</td>
                <td className="px-6 py-4">
                  ₹{" "}
                  {parseAmount(invoice.amount).toLocaleString(
                    "en-IN"
                  )}
                </td>

                <td
                  className="px-6 py-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  {invoice.lifecycle === "draft" ? (
                    <span className="text-gray-400 text-xs">
                      Draft
                    </span>
                  ) : invoice.lifecycle === "cancelled" ? (
                    <span className="text-rose-400 text-xs">
                      Cancelled
                    </span>
                  ) : (
                    <select
                      value={invoice.paymentStatus}
                      onChange={(e) =>
                        updateInvoice(invoice.id, {
                          paymentStatus: e.target.value as PaymentStatus,
                        })
                      }
                      className={`px-3 py-1 rounded-full text-xs font-semibold bg-black/30 border border-white/10 ${getStatusStyle(
                        invoice.paymentStatus
                      )}`}
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="partial">Partial</option>
                      <option value="paid">Paid</option>
                      <option value="overdue">Overdue</option>
                    </select>
                  )}
                </td>

                <td
                  className="px-6 py-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-2">



                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(invoice);
                      }}
                      className={`
                          text-xs px-3 py-1 rounded-md border flex items-center gap-1
                          transition-all duration-200 ease-out
                          ${isPro
                          ? "border-white/10 text-slate-300 hover:bg-white/5 hover:scale-[1.03]"
                          : "border-violet-500/20 text-violet-400/80 hover:bg-violet-500/10 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 delay-50"
                        }
                      `}
                    >
                      {!isPro && <Crown size={12} className="opacity-80" />}
                      Duplicate
                    </button>


                    {invoice.lifecycle === "issued" && invoice.paymentStatus !== "paid" && (
                      <button
                        onClick={() => setCancelTarget(invoice.id)}
                        className="text-xs px-3 py-1 rounded-md border border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
                      >
                        Cancel
                      </button>

                    )}
                    {invoice.lifecycle === "draft" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget(invoice)
                        }}
                        className="px-3 py-1 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition text-sm"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>


              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cancelTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setCancelTarget(null)}
        >

          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[420px] rounded-2xl border border-rose-500/30 bg-[#0f1020] p-6 shadow-[0_0_40px_rgba(244,63,94,0.25)]"
          >
            <h3 className="text-lg font-semibold text-rose-400 mb-2">
              Cancel Invoice
            </h3>

            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to cancel this invoice?
              This action cannot be undone and the invoice number will remain recorded.
            </p>

            <div className="flex items-center justify-end gap-3 mt-2">

              <button
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5"
              >
                Go Back
              </button>

              <button
                onClick={() => {
                  cancelInvoice(cancelTarget);
                  setCancelTarget(null);

                }}
                className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-medium transition-all duration-200 hover:scale-[1.03]"

              >
                Cancel this invoice?
              </button>




            </div>

          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">

          <div className="w-[420px] rounded-2xl border border-rose-500/30 bg-[#0f1020] p-6 shadow-[0_0_40px_rgba(244,63,94,0.25)]">

            <h2 className="text-lg font-semibold text-rose-400 mb-2">
              Delete Draft
            </h2>

            <p className="text-sm text-slate-300 mb-6">
              Are you sure you want to delete this draft invoice?
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">

              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-white/10 text-sm hover:bg-white/5"
              >
                Go Back
              </button>

              <button
                onClick={() => {
                  removeInvoice(deleteTarget.id)
                  setDeleteTarget(null)
                }}
                className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-black text-sm font-semibold"
              >
                Delete Draft
              </button>

            </div>

          </div>

        </div>
      )}


      {showProModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowProModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-[420px] rounded-2xl border border-violet-500/30 bg-[#0f1020] p-6 
                 shadow-[0_0_40px_rgba(124,58,237,0.25)]"
          >
            <h3 className="text-lg font-semibold text-violet-400 mb-2">
              Pro Feature
            </h3>

            <p className="text-sm text-slate-400 mb-6">
              Duplicate invoices instantly and save time on recurring work.
              Upgrade to Pro to unlock this feature.
            </p>

            <div className="flex items-center justify-end gap-3 mt-2">

              <button
                onClick={() => setShowProModal(false)}
                className="px-4 py-2 rounded-lg border border-white/10 text-slate-300 hover:bg-white/5"
              >
                Maybe later
              </button>

              <button
                onClick={() => {
                  setShowProModal(false);
                  router.push("/pricing");
                }}
                className="px-4 py-2 rounded-lg bg-violet-500 hover:bg-violet-600 text-white font-medium transition-all duration-200 hover:scale-[1.03]"
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

function PremiumCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: "violet" | "amber" | "emerald" | "rose";
}) {
  const accentMap = {
    violet: "from-violet-600/20 to-fuchsia-600/20 border-violet-500/30",
    amber: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
    emerald: "from-emerald-500/20 to-green-500/20 border-emerald-500/30",
    rose: "from-rose-500/20 to-pink-500/20 border-rose-500/30",
  };

  return (
    <div
      className={`relative rounded-2xl p-5 bg-gradient-to-br ${accentMap[accent]} border shadow-[0_0_30px_rgba(124,58,237,0.15)] backdrop-blur-md`}
    >
      <p className="text-xs uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-3 text-2xl font-bold">{value}</p>
      {sub && (
        <p className="mt-1 text-xs text-slate-400">{sub}</p>
      )}



    </div>
  );
}