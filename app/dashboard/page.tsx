"use client";

import RequireAuth from "@/app/components/RequireAuth";
import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useInvoices, Invoice } from "../providers/InvoiceProvider";
import dynamic from "next/dynamic";
import { useAuth } from "../providers/AuthProvider";
import { formatCurrency } from "@/app/utils/currency";

import {
  Bell,
  Plus,
  Settings,
  FileText,
  Users,
  LayoutDashboard,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";



type InvoiceStatus = "Paid" | "Pending" | "Overdue" | "Draft";



const cardBase =
  "rounded-3xl bg-[#0B0F17] border border-white/[0.05] transition-all duration-300";

const cardHover =
  "hover:-translate-y-[2px] hover:border-white/[0.07]";


const SignOutButton = dynamic(() => import("../components/SignOutButton"), { ssr: false }); // <- added  





/* ----------------------------------------
   Helpers / small constants
----------------------------------------- */


function parseAmount(value: any): number {
  if (!value) return 0;
  if (typeof value === "number") return value;
  return Number(String(value).replace(/[^0-9.-]+/g, "")) || 0;
}



function isValidRevenueInvoice(inv: Invoice) {
  if (!inv) return false;

  if (inv.lifecycle === "draft") return false;
  if (inv.lifecycle === "cancelled") return false;
  if ((inv as any).deleted === true) return false;

  // allow legacy invoices for now
  return true;
}


function computeInvoiceStatus(inv: Invoice): InvoiceStatus {
  if (inv.lifecycle === "draft") return "Draft";

  const total = parseAmount(inv.amount);

  const totalPaid = (inv.payments || []).reduce(
    (sum: number, p: any) => sum + Number(p.amount || 0),
    0
  ) / 100;



  const remaining = Math.max(total - totalPaid, 0);

  const now = new Date();
  const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
  const isOverdue =
    dueDate && !isNaN(dueDate.getTime()) && dueDate < now;

  if (remaining === 0 && total > 0) return "Paid";

  if (isOverdue) return "Overdue";

  if (totalPaid > 0) return "Pending"; // or "Partial" if you want later

  return "Pending";
}

const statusColors: Record<InvoiceStatus, string> = {
  Paid: "bg-green-500/10 text-green-400",
  Pending: "bg-yellow-500/10 text-yellow-400",
  Overdue: "bg-red-500/10 text-red-400",
  Draft: "bg-gray-500/10 text-gray-400",
};




function isThisMonth(date?: any) {
  if (!date) return false;
  const d = date.toDate ? date.toDate() : new Date(date);
  const now = new Date();
  return (
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}



/* ----------------------------------------
   Dashboard Component
----------------------------------------- */

export default function DashboardPage() {
  const router = useRouter();
  const { invoices, issueInvoice } = useInvoices();

  const { user, loading, plan, userData, accountCurrency } = useAuth();


  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace("/signin");
      return;
    }

    // 🆕 NEW USER → onboarding
    if (user.isNewUser) {
      router.replace("/onboarding");
      return;
    }

  }, [user, loading, router]);



  const invoiceCountThisMonth = useMemo(() => {
    const now = new Date();
    return invoices.filter((inv: any) => {
      if (!inv.createdAt) return false;
      const d = inv.createdAt.toDate
        ? inv.createdAt.toDate()
        : new Date(inv.createdAt);
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    }).length;
  }, [invoices]);




  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "All">(
    "All"
  );
  const [revenueRange, setRevenueRange] = useState<"6m" | "12m" | "1m">(
    "6m"
  );



  /* Compute stats */
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let pendingCount = 0;
    let pendingAmount = 0;
    let paidCount = 0;
    let overdueCount = 0;
    const clientSet = new Set<string>();

    invoices.forEach((inv) => {
      if (!isValidRevenueInvoice(inv)) return;

      const amt = parseAmount(inv.amount);

      clientSet.add(inv.client);

      const status = computeInvoiceStatus(inv);

      if (status === "Paid") {
        totalRevenue += amt;
        paidCount++;
      } else if (status === "Overdue") {
        overdueCount++;
      } else {
        pendingCount++;
        pendingAmount += amt;
      }
    });

    return {
      totalRevenue,
      pendingCount,
      pendingAmount,
      paidCount,
      activeClients: clientSet.size,
      overdueCount,
    };
  }, [invoices]);



  /* Filtered invoices */
  const filteredInvoices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchesSearch =
        q.length === 0 ||
        inv.id.toLowerCase().includes(q) ||
        inv.client.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "All"
          ? true
          : computeInvoiceStatus(inv) === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const recentInvoices = useMemo(() => {
    return filteredInvoices.slice(0, 5);
  }, [filteredInvoices]);




  /* ---- NEW: safer PDF export using hidden iframe (improved) ---- */
  function exportInvoiceAsPDF(inv: Invoice) {
    const numericAmount = parseAmount(inv.amount);

    const printable = buildPrintableHTML({
      id: inv.id,
      client: inv.client,
      date: inv.date,
      lineItems: (inv as any).meta?.lineItems ?? [],
      subtotal: numericAmount,
      taxAmount: 0,
      total: numericAmount,
      notes: (inv as any).meta?.notes ?? "",
      currency: accountCurrency,
    });

    exportToPDFUsingIframe(printable);
  }

  /* ---- Helper for hidden-iframe printing ---- */
  function exportToPDFUsingIframe(htmlString: string, timeoutMs = 600) {
    try {
      const iframe = document.createElement("iframe");
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      iframe.style.visibility = "hidden";

      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (!doc) throw new Error("iframe not available");

      doc.open();
      doc.write(htmlString);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (err) {
          console.error("print failed", err);
          alert("Print failed. You can copy the invoice and print manually.");
        } finally {
          setTimeout(() => {
            try {
              document.body.removeChild(iframe);
            } catch { }
          }, timeoutMs);
        }
      }, 350);
    } catch (e) {
      console.error(e);
      alert("PDF export failed. Popup or print might be blocked by the browser.");
    }
  }

  /* ---- Simple Share (mailto) fallback ---- */
  function shareInvoice(inv: Invoice) {
    const meta = (inv as any).meta ?? {};
    const lines = (meta.lineItems ?? [])
      .map((li: any) => `${li.desc} — ${li.qty} × ${li.rate}`)
      .join("\n");
    const body = [
      `Invoice: ${inv.id}`,
      `Client: ${inv.client}`,
      `Amount: ${inv.amount}`,
      `Date: ${inv.date}`,
      ``,
      `Line items:`,
      lines || "(no items)",
      ``,
      `Notes:`,
      meta.notes || "(none)",
      ``,
      `Download or print this invoice from Cosmi.`,
    ].join("\n");

    const subject = encodeURIComponent(`Invoice ${inv.id} — ${inv.client}`);
    const mailto = `mailto:?subject=${subject}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  }


  /* UI */



  const revenueChartData = React.useMemo(() => {


    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();


    let monthsToShow = 6;

    if (revenueRange === "12m") monthsToShow = 12;
    if (revenueRange === "1m") monthsToShow = 1;

    const buckets: {
      month: number;
      year: number;
      value: number;
    }[] = [];



    // Generate months first
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        value: 0,
      });
    }

    // Add invoice values
    invoices.forEach((inv) => {

      if (!isValidRevenueInvoice(inv)) return;

      const date = inv.createdAt?.toDate
        ? inv.createdAt.toDate()
        : new Date(inv.createdAt || inv.date);

      if (isNaN(date.getTime())) return;

      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const bucket = buckets.find(
        (b) => b.month === month && b.year === year
      );

      if (bucket) {
        const numericAmount = parseAmount(inv.amount);

        bucket.value += numericAmount;
      }
    });


    // ✅ Trim empty months (Stripe-style)
    // STEP 1: Remove future / empty current month
    const cleanedBuckets = buckets.filter((b) => {
      const isCurrent =
        b.month === currentMonth && b.year === currentYear;

      // ❌ Remove current month if no data
      if (isCurrent && b.value === 0) return false;

      return true;
    });

    // STEP 2: Trim leading empty months (optional but good UX)
    const firstNonZeroIndex = cleanedBuckets.findIndex((b) => b.value > 0);

    const trimmedBuckets =
      firstNonZeroIndex === -1
        ? buckets //  fallback to original data
        : cleanedBuckets.slice(Math.max(0, firstNonZeroIndex - 1));


    // Format labels
    return trimmedBuckets.map((b, index) => {
      const isCurrent =
        b.month === currentMonth && b.year === currentYear;

      let displayValue = b.value;

      // ✅ Stripe logic (NO DIP)
      if (isCurrent && index > 0) {
        const prev = trimmedBuckets[index - 1];
        displayValue = Math.max(b.value, prev.value * 0.985);
      }

      return {
        label: new Date(b.year, b.month - 1).toLocaleString("en-IN", {
          month: "short",
        }),
        value: displayValue,
        isCurrent,
        realValue: b.value, //  important for tooltip
      };
    });
  }, [invoices, revenueRange, accountCurrency]);



  const calculateGrowthPercentage = (data: any[]) => {
    if (data.length < 2) return null;

    const last = Number(data[data.length - 1].value || 0);
    const prev = Number(data[data.length - 2].value || 0);

    // No previous revenue
    if (prev === 0 && last > 0) return "new";

    // Too small baseline
    if (prev < 10) return "new";

    const growth = ((last - prev) / prev) * 100;

    // EXTREME spike → treat as new (Stripe behavior)
    if (growth > 300) return "new";

    return Number(growth.toFixed(1));
  };

  const currentRevenue = revenueChartData.at(-1)?.value ?? 0;


  const completedData = revenueChartData.filter((d) => !d.isCurrent);
  const growth = calculateGrowthPercentage(completedData);

  const CustomCursor = ({ points }: any) => {
    if (!points || !points.length) return null;

    const { x, y } = points[0];

    return (
      <line
        x1={x}
        x2={x}
        y1={0}
        y2="100%"
        stroke="#a78bfa"
        strokeWidth={1}
        strokeOpacity={0.25}
        strokeDasharray="4 6"
        style={{
          transition: "transform 0.15s cubic-bezier(0.22, 1, 0.36, 1)",
          pointerEvents: "none",
        }}
      />
    );
  };


  if (loading || !user) return <div>Loading...</div>;
  if (loading) return <div>Loading...</div>;

  //  block dashboard render for new users
  if (user?.isNewUser) return null;

  if (!userData) return <div>Loading...</div>;


  return (

    <RequireAuth>
      <div className="relative min-h-screen bg-[#040407] text-slate-100 flex overflow-hidden">
        {/* global ambient glow */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-violet-600/10 blur-[200px] pointer-events-none" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-fuchsia-600/10 blur-[200px] pointer-events-none" />



        {/* MAIN */}
        <main className="flex-1 flex flex-col">


          {/* CONTENT */}
          <div className="space-y-8">

            {/* Top row */}
            <div className="grid gap-4 lg:grid-cols-12 items-stretch">

              {/* Quick Actions Card */}
              <div className="lg:col-span-4 flex">
                <div className="flex-1 relative overflow-hidden rounded-3xl p-4 bg-[#0B0B12] border border-white/[0.05] transition-all duration-300">

                  {/* Subtle background glow */}
                  <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" />
                  <div className="relative z-10 flex flex-col gap-3">

                    {/* LEFT CONTENT */}
                    <div>
                      <p className="text-[11px] font-medium tracking-[0.18em] text-slate-500 uppercase">
                        Quick Actions
                      </p>

                      <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
                        Create and send invoices in seconds
                      </h2>

                      <p className="mt-2 text-sm text-slate-400">
                        Generate professional invoices instantly using AI or import an existing template.
                      </p>
                    </div>

                    {/* BUTTONS */}
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={() => router.push("/invoice-editor")}
                        className="
                          flex items-center gap-2
                          px-6 py-3
                          rounded-xl
                          bg-gradient-to-b from-violet-500 to-violet-600
                          text-sm font-semibold text-white
                          shadow-[0_8px_30px_rgba(139,92,246,0.22)]
                          transition-all duration-200
                          hover:translate-y-[-1px]
                          hover:shadow-[0_12px_40px_rgba(139,92,246,0.28)]
                          "
                        >
                        <Plus className="h-4 w-4" />
                        New AI Invoice
                      </button>

                      <button
                        type="button"
                        onClick={() => alert("Template coming soon")}
                        className="
                        px-6 py-3
                        rounded-xl
                        border border-white/[0.06]
                        bg-white/[0.02]
                        text-sm font-medium text-slate-200
                        transition-all duration-200
                        hover:bg-white/[0.04]
                        hover:border-white/[0.08]
                        "
                      >
                        Import Template
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Pulse */}
              <div className="lg:col-span-8">
                <div
                  className="
      relative overflow-hidden
      rounded-[32px]
      border border-white/[0.05]
      bg-[#0A1019]
      px-8 py-8 md:px-10 md:py-10
    "
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">

                    {/* LEFT CONTENT */}
                    <div className="max-w-xl">

                      <div className="text-sm text-slate-500 mb-3">
                        Outstanding Revenue
                      </div>

                      <div className="text-5xl md:text-6xl font-semibold tracking-[-0.06em] text-white">
                        {formatCurrency(stats.pendingAmount, accountCurrency)}
                      </div>

                      <div className="mt-8 space-y-3">

                        <div className="flex items-center gap-3 text-sm">
                          <div className="h-2 w-2 rounded-full bg-violet-400/80" />

                          <span className="text-slate-400">
                            {stats.pendingCount} awaiting payment
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                          <div className="h-2 w-2 rounded-full bg-rose-400/80" />

                          <span className="text-slate-400">
                            {stats.overdueCount} overdue
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-sm">
                          <div className="h-2 w-2 rounded-full bg-emerald-400/80" />

                          <span className="text-slate-400">
                            {stats.paidCount} paid this month
                          </span>
                        </div>

                      </div>
                    </div>

                    {/* RIGHT VISUAL */}
                    <div className="flex items-center justify-center">

                      {(() => {

                        const total =
                          stats.paidCount +
                          stats.pendingCount +
                          stats.overdueCount;

                        const radius = 48;
                        const circumference = 2 * Math.PI * radius;

                        const paid =
                          total > 0
                            ? (stats.paidCount / total) * circumference
                            : 0;

                        const pending =
                          total > 0
                            ? (stats.pendingCount / total) * circumference
                            : 0;

                        const overdue =
                          total > 0
                            ? (stats.overdueCount / total) * circumference
                            : 0;

                        return (
                          <div className="relative h-[140px] w-[140px] flex items-center justify-center">

                            <svg
                              width="140"
                              height="140"
                              viewBox="0 0 140 140"
                              className="-rotate-90"
                            >

                              {/* Base Track */}
                              <circle
                                cx="70"
                                cy="70"
                                r={radius}
                                fill="none"
                                stroke="rgba(255,255,255,0.05)"
                                strokeWidth="6"
                              />

                              {/* Paid */}
                              <circle
                                cx="70"
                                cy="70"
                                r={radius}
                                fill="none"
                                stroke="rgba(52,211,153,0.72)"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={`${paid} ${circumference}`}
                                strokeDashoffset="0"
                              />

                              {/* Pending */}
                              <circle
                                cx="70"
                                cy="70"
                                r={radius}
                                fill="none"
                                stroke="rgba(167,139,250,0.72)"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={`${pending} ${circumference}`}
                                strokeDashoffset={-paid - 8}
                              />

                              {/* Overdue */}
                              <circle
                                cx="70"
                                cy="70"
                                r={radius}
                                fill="none"
                                stroke="rgba(251,113,133,0.72)"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeDasharray={`${overdue} ${circumference}`}
                                strokeDashoffset={-paid - pending - 16}
                              />

                            </svg>

                            {/* Center Content */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">

                              <div className="text-3xl font-semibold tracking-[-0.05em] text-white">
                                {stats.pendingCount}
                              </div>

                              <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                                Pending
                              </div>

                            </div>

                          </div>
                        );
                      })()}

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>




          {/* Bottom row */}
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.35fr] items-stretch min-w-0">

            {/* LEFT — Revenue Chart */}
            <div className="relative overflow-hidden rounded-[28px] border border-white/[0.035] bg-[#0b1020]/72 p-6 min-w-0">

              {/* Chart header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-500">
                    Revenue
                  </p>

                  <h2 className="text-xl font-semibold tracking-tight text-white mt-1">
                    Last 6 months
                  </h2>

                  <div className="mt-3">
                    <span className="text-2xl font-semibold text-white">
                      {formatCurrency(currentRevenue, accountCurrency)}
                    </span>
                  </div>
                </div>

                <select
                  value={revenueRange}
                  onChange={(e) => setRevenueRange(e.target.value as any)}
                  className="bg-black/50 border border-white/12 text-[11px] rounded-xl px-2 py-1"
                >
                  <option value="6m">Last 6 months</option>
                  <option value="12m">Last 12 months</option>
                  <option value="1m">This month</option>
                </select>
              </div>

              {/* Chart */}
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      stroke="rgba(255,255,255,0.04)"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="label"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />

                    <Tooltip
                      contentStyle={{
                        background: "rgba(10, 10, 18, 0.92)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "16px",
                        backdropFilter: "blur(18px)",
                        boxShadow: "0 10px 40px rgba(0,0,0,0.45)",
                      }}
                      labelStyle={{
                        color: "#a1a1aa",
                        fontSize: 12,
                        fontWeight: 500,
                      }}
                      itemStyle={{
                        color: "#a78bfa",
                        fontWeight: 600,
                        fontSize: 14,
                      }}
                      cursor={{
                        stroke: "rgba(167,139,250,0.35)",
                        strokeWidth: 1,
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#a78bfa"
                      strokeWidth={3}
                      fill="url(#areaGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* RIGHT — Recent invoices */}
            <div className={`${cardBase} ${cardHover} p-6 min-w-0`}>

              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-slate-400">
                    Recent invoices
                  </p>

                  <h2 className="text-sm font-semibold">
                    Last activity
                  </h2>
                </div>

                <Link
                  href="/dashboard/invoices"
                  className="text-[11px] text-violet-300 hover:text-violet-200"
                >
                  View all
                </Link>
              </div>

              <div className="relative overflow-hidden rounded-[28px] border border-white/[0.025] bg-[#0b1020]/72 p-5 min-w-0">

                <div className="w-full overflow-x-auto min-w-0">

                  <div className="flex flex-col gap-3">

                    {recentInvoices.length === 0 && (
                      <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] px-5 py-8 text-center text-sm text-slate-500">
                        No invoices yet.
                      </div>
                    )}

                    {recentInvoices.map((inv) => {
                      const status = computeInvoiceStatus(inv);

                      return (
                        <div
                          key={inv.id}
                          className="
                            group
                            relative
                            overflow-hidden
                            rounded-2xl
                            border border-white/[0.04]
                            bg-white/[0.02]
                            px-5 py-4
                            transition-all duration-300
                            hover:border-violet-500/20
                            hover:bg-white/[0.035]
                            hover:shadow-[0_0_30px_rgba(124,58,237,0.08)]
                          "
                        >

                          {/* Ambient Glow */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                            <div className="absolute -left-10 top-0 h-full w-32 bg-violet-500/10 blur-3xl" />
                          </div>

                          <div className="relative z-10 flex items-center justify-between gap-6">

                            {/* LEFT */}
                            <div className="flex items-center gap-5 min-w-0">

                              {/* Invoice Pill */}
                              <div className="shrink-0">
                                <div className="
                                  rounded-xl
                                  border border-violet-500/20
                                  bg-violet-500/10
                                  px-3 py-2
                                  text-[11px]
                                  font-medium
                                  tracking-wide
                                  text-violet-300
                                ">
                                  {inv.invoiceNumber || inv.id.slice(0, 6)}
                                </div>
                              </div>

                              {/* Client + Date */}
                              <div className="min-w-0">

                                <div className="flex items-center gap-3">

                                  <h3 className="truncate text-sm font-medium text-white">
                                    {inv.client}
                                  </h3>

                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${status === "Paid"
                                      ? "bg-emerald-500/10 text-emerald-300"
                                      : status === "Overdue"
                                        ? "bg-rose-500/10 text-rose-300"
                                        : "bg-amber-500/10 text-amber-300"
                                      }`}
                                  >
                                    {status}
                                  </span>

                                </div>

                                <p className="mt-1 text-xs text-slate-500">
                                  {inv.date}
                                </p>

                              </div>
                            </div>

                            {/* CENTER */}
                            <div className="hidden md:flex flex-col items-end">
                              <span className="text-sm font-semibold text-white">
                                {formatCurrency(
                                  parseAmount(inv.amount),
                                  accountCurrency
                                )}
                              </span>

                              <span className="text-[11px] text-slate-500">
                                Invoice amount
                              </span>
                            </div>

                            {/* RIGHT ACTIONS */}
                            <div className="flex items-center gap-2 shrink-0">

                              <Link
                                href={`/invoice-editor?id=${inv.id}`}
                                className="
                rounded-xl
                border border-white/[0.06]
                bg-white/[0.03]
                px-3 py-2
                text-[11px]
                text-slate-300
                transition-all
                hover:bg-white/[0.06]
                hover:text-white
              "
                              >
                                Edit
                              </Link>

                              <button
                                onClick={() => exportInvoiceAsPDF(inv)}
                                className="
                rounded-xl
                border border-white/[0.06]
                bg-white/[0.03]
                px-3 py-2
                text-[11px]
                text-slate-300
                transition-all
                hover:bg-white/[0.06]
                hover:text-white
              "
                              >
                                PDF
                              </button>

                              <button
                                onClick={() => shareInvoice(inv)}
                                className="
                rounded-xl
                bg-violet-500/12
                px-3 py-2
                text-[11px]
                text-violet-200
                transition-all
                hover:bg-violet-500/20
                hover:text-white
              "
                              >
                                Share
                              </button>

                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main >
      </div>
    </RequireAuth >
  );
}

/* ----------------------------------------
   Subcomponents
----------------------------------------- */



function StatCard({
  label,
  value,
  subLabel,
  trend,
}: {
  label: string;
  value: string;
  subLabel: string;
  trend: string;
}) {
  return (
    <div
      className="
      relative overflow-hidden rounded-2xl py-8 px-6
      bg-gradient-to-br from-[#0c0c18] to-[#151530]
      border border-violet-500/20
      shadow-[0_0_40px_rgba(124,58,237,0.15)]
      hover:shadow-[0_0_60px_rgba(124,58,237,0.25)]
      transition-all duration-300 hover:-translate-y-1
    "
    >
      {/* subtle glow */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-violet-500/10 blur-[90px]" />

      <div className="relative z-10">
        <p className="text-[11px] uppercase tracking-wide text-slate-400 whitespace-nowrap">
          {label}
        </p>

        <p className="mt-3 text-2xl font-bold tracking-tight text-white">
          {value}
        </p>

        <p className="mt-1 text-[11px] text-slate-500">
          {subLabel}
        </p>

        <div className="mt-4 inline-flex items-center text-[11px] font-medium text-emerald-400">
          {trend}
        </div>
      </div>
    </div>





  );
}


/* ----------------------------------------
   Printable HTML builder for PDF export
----------------------------------------- */

function buildPrintableHTML({
  id,
  client,
  date,
  lineItems,
  subtotal,
  taxAmount,
  total,
  notes,
  currency,
}: {
  id: string;
  client: string;
  date: string;
  lineItems: Array<{ desc: string; qty: number; rate: number }>;
  subtotal: number;
  taxAmount: number;
  total: number;
  notes: string;
  currency: "INR" | "USD";
}) {
  let formattedDate = date;
  try {
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  } catch { }

  const rowsHtml = lineItems
    .map(
      (li) => `
      <tr>
        <td class="desc">${escapeHtml(li.desc)}</td>
        <td class="qty">${li.qty}</td>
        <td class="rate">${formatCurrency(li.rate, currency)}</td>
        <td class="amount">${formatCurrency(li.qty * li.rate, currency)}</td>
      </tr>`
    )
    .join("");

  const notesHtml = notes ? `<div class="notes-box">${escapeHtml(notes)}</div>` : "";





  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Invoice ${escapeHtml(id)}</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  body { font-family: Inter, system-ui, sans-serif; color:#222; background:#f7f7f9; margin:0; padding:0; }
  .page { max-width:820px; margin:32px auto; background:white; border-radius:16px; padding:40px 48px; border:1px solid #ececec; box-shadow:0 8px 28px rgba(0,0,0,0.08); }
  .branded-bar { width:100%; height:6px; background:linear-gradient(to right,#7c3aed,#c084fc); border-radius:4px; margin-bottom:28px; }
  header { display:flex; justify-content:space-between; margin-bottom:32px; }
  .title { font-size:32px; font-weight:700; margin-bottom:6px; letter-spacing:-0.5px; }
  .subtitle { color:#6b7280; font-size:14px; }
  .invoice-meta { text-align:right; }
  .invoice-id { font-size:18px; font-weight:600; margin-bottom:4px; }
  table { width:100%; border-collapse:collapse; margin-top:24px; }
  thead th { text-align:left; color:#6b7280; font-size:13px; border-bottom:1px solid #e5e7eb; padding-bottom:8px; }
  tbody td { padding:12px 4px; border-bottom:1px solid #f1f1f3; }
  .desc { width:48%; } .qty { width:12%; text-align:center; } .rate{ width:20%; text-align:right; } .amount{ width:20%; text-align:right; }
  .totals { margin-top:28px; text-align:right; }
  .totals div { margin-bottom:6px; color:#374151; }
  .grand-total { font-size:20px; font-weight:700; margin-top:12px; }
  .notes-box { margin-top:28px; background:#f8f8fc; padding:16px 20px; border-radius:12px; font-size:14px; color:#444; }
</style>
</head>
<body>
  <div class="page">
    <div class="branded-bar"></div>
    <header>
      <div>
        <div class="title">Invoice</div>
        <div class="subtitle">${escapeHtml(client)}</div>
      </div>
      <div class="invoice-meta">
        <div class="invoice-id">#${escapeHtml(id)}</div>
        <div>${escapeHtml(formattedDate)}</div>
      </div>
    </header>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align:center;">Qty</th>
          <th style="text-align:right;">Rate</th>
          <th style="text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <div class="totals">
      <div>Subtotal: <strong>${formatCurrency(subtotal, currency)}</strong></div>
      <div>Tax: <strong>${formatCurrency(taxAmount, currency)}</strong></div>
      <div class="grand-total">Total: ${formatCurrency(total, currency)}</div>
    </div>

    ${notesHtml}
  </div>
</body>
</html>`;
}

function escapeHtml(str: unknown) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

