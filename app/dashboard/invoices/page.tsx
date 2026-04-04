"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Invoice, useInvoices } from "@/app/providers/InvoiceProvider";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { Crown } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { Repeat } from "lucide-react";
import { formatCurrency } from "@/app/utils/currency";


type PaymentStatus = "unpaid" | "paid";

function getDerivedStatus(
  inv: Invoice
): "paid" | "pending" | "overdue" | "draft" {
  if (inv.lifecycle === "draft") return "draft";

  if (inv.paymentStatus === "paid") return "paid";

  const dueDate = new Date(inv.dueDate);
  const now = new Date();

  if (!isNaN(dueDate.getTime()) && dueDate < now) {
    return "overdue";
  }

  return "pending";
}


export default function InvoicesPage() {
  const router = useRouter();
  const { invoices, cancelInvoice, updateInvoice, removeInvoice } = useInvoices();
  const searchParams = useSearchParams();
  const { plan, user, userData } = useAuth();

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

  const [recurringMap, setRecurringMap] = useState<Record<string, boolean>>({});


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



  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "recurringInvoices"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, boolean> = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.invoiceId) {
          map[data.invoiceId] = true;
        }
      });

      setRecurringMap(map);
    });

    return () => unsubscribe();
  }, [user]);



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

  const baseCurrency = userData?.currency || "INR";

  const stats = invoices.reduce(
    (acc, inv) => {
      const currency = (inv.currency || "INR") as "INR" | "USD";
      const normalized = inv.normalizedAmount || 0;
      const rate = inv.exchangeRate || 1;

      const amount =
        currency === baseCurrency
          ? normalized / 100
          : normalized / rate / 100;

      if (inv.paymentStatus === "paid") {
        acc.totalRevenue += amount;
        acc.paidCount += 1;
      } else if (inv.paymentStatus === "unpaid") {
        const dueDate = new Date(inv.dueDate);
        const now = new Date();

        if (!isNaN(dueDate.getTime()) && dueDate < now) {
          acc.overdueCount += 1;
        } else {
          acc.pendingAmount += amount;
          acc.pendingCount += 1;
        }
      }

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

  let filteredInvoices = [...invoices];

  if (statusFilter === "unpaid") {
    filteredInvoices = invoices.filter(
      (inv) =>
        inv.paymentStatus === "unpaid"
    );
  }
  if (statusFilter === "overdue") {
    filteredInvoices = invoices.filter((inv) => {
      if (inv.paymentStatus !== "unpaid") return false;

      const dueDate = new Date(inv.dueDate);
      const now = new Date();

      return !isNaN(dueDate.getTime()) && dueDate < now;
    });
  }

  if (statusFilter === "paid") {
    filteredInvoices = invoices.filter(
      (inv) => inv.paymentStatus === "paid"
    );
  }

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
    let valA: number = 0;
    let valB: number = 0;

    if (sortKey === "date") {
      valA = a.createdAt?.toDate?.().getTime?.() || 0;
      valB = b.createdAt?.toDate?.().getTime?.() || 0;
    }

    if (sortKey === "amount") {
      valA = a.normalizedAmount || 0;
      valB = b.normalizedAmount || 0;
    }

    return sortOrder === "asc" ? valA - valB : valB - valA;
  });


  const getStatusStyle = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-500/10 text-emerald-400";
      case "pending":
        return "bg-amber-500/10 text-amber-400";
      case "overdue":
        return "bg-rose-500/10 text-rose-400";
      case "draft":
        return "bg-gray-500/10 text-gray-400";
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
          value={formatCurrency(stats.totalRevenue, userData?.currency || "INR")}
          accent="violet"
        />
        <PremiumCard
          label="Pending"
          value={`${stats.pendingCount}`}
          sub={`${formatCurrency(
            stats.pendingAmount,
            userData?.currency || "INR"
          )} pending`}
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

      <div className="flex items-center justify-between mb-4">

        {/* STATUS FILTER */}
        <div className="flex items-center gap-2">
          {["All", "unpaid", "overdue", "paid"].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                updateQuery({ status });
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition
        ${statusFilter === status
                  ? "bg-violet-500/20 text-violet-300 border-violet-500/40"
                  : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10"
                }`}
            >
              {status === "All"
                ? "All"
                : status === "unpaid"
                  ? "Needs Attention"
                  : status.charAt(0).toUpperCase() + status.slice(1)}

            </button>
          ))}
        </div>

        {/* SORT DROPDOWN */}
        <div className="flex items-center gap-2">
          <select
            value={sortKey}
            onChange={(e) => {
              const val = e.target.value as "date" | "amount";
              setSortKey(val);
              updateQuery({ sort: val });
            }}
            className="bg-[#0f1020] border border-white/10 rounded-lg px-3 py-1.5 text-xs"
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => {
              const val = e.target.value as "asc" | "desc";
              setSortOrder(val);
              updateQuery({ order: val });
            }}
            className="bg-[#0f1020] border border-white/10 rounded-lg px-3 py-1.5 text-xs"
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>

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
                <td className="px-6 py-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-md bg-violet-500/10 text-violet-300 text-xs font-semibold">
                    {invoice.lifecycle === "draft"
                      ? "Draft"
                      : invoice.lifecycle === "cancelled"
                        ? `${invoice.invoiceNumber} (Cancelled)`
                        : invoice.invoiceNumber}
                  </span>

                  {/* ✅ RECURRING BADGE */}
                  {recurringMap[invoice.id] && (
                    <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full 
bg-violet-500/10 text-violet-300 border border-violet-500/20 shadow-[0_0_10px_rgba(124,58,237,0.15)]">
                      <Repeat size={10} />
                      Recurring
                    </span>
                  )}
                </td>


                <td className="px-6 py-4">{invoice.client}</td>
                <td className="px-6 py-4">{invoice.date}</td>
                <td className="px-6 py-4">
                  {(() => {

                    const currency = (invoice.currency || "INR") as "INR" | "USD";
                    const baseCurrency = userData?.currency || "INR";

                    const normalized = invoice.normalizedAmount || 0;
                    const rate = invoice.exchangeRate || 1;

                    
                    if (!invoice.exchangeRate && currency !== baseCurrency) {
                      console.warn("Missing exchange rate for invoice:", invoice.id);
                    }

                    const value =
                      currency === baseCurrency
                        ? normalized / 100
                        : normalized / rate / 100;

                    return formatCurrency(value, baseCurrency);
                  })()}
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


                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(getDerivedStatus(invoice))}`}>
                      {getDerivedStatus(invoice)}
                    </span>
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