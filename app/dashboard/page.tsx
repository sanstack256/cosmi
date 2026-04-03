"use client";

import RequireAuth from "@/app/components/RequireAuth";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useInvoices, Invoice } from "../providers/InvoiceProvider";
import dynamic from "next/dynamic";
import { useAuth } from "../providers/AuthProvider";
import { formatCurrency } from "@/app/utils/currency";


type InvoiceStatus = "Paid" | "Pending" | "Overdue" | "Draft";



const cardBase =
  "rounded-3xl bg-[#0b0b18]/80 backdrop-blur-xl border border-white/5 shadow-[0_0_40px_rgba(124,58,237,0.08)] transition-all duration-300";

const cardHover =
  "hover:-translate-y-1 hover:shadow-[0_0_60px_rgba(124,58,237,0.15)]";



const SignOutButton = dynamic(() => import("../components/SignOutButton"), { ssr: false }); // <- added




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



/* ----------------------------------------
   Helpers / small constants
----------------------------------------- */

function getInvoiceStatus(inv: Invoice): InvoiceStatus {
  if (inv.lifecycle === "draft") return "Draft";

  if (inv.paymentStatus === "paid") return "Paid";

  if (inv.paymentStatus === "overdue") return "Overdue";

  return "Pending";
}

const statusColors: Record<InvoiceStatus, string> = {
  Paid: "bg-green-500/10 text-green-400",
  Pending: "bg-yellow-500/10 text-yellow-400",
  Overdue: "bg-red-500/10 text-red-400",
  Draft: "bg-gray-500/10 text-gray-400",
};

const revenueDataByRange: Record<"6m" | "12m" | "1m", number[]> = {
  "6m": [30, 55, 45, 80, 65, 95],
  "12m": [20, 35, 40, 55, 50, 60, 65, 70, 80, 75, 90, 95],
  "1m": [40, 55, 60, 70],
};

function parseAmountToNumber(amount: string): number {
  const cleaned = amount.replace(/[^\d.-]/g, "");
  const num = Number(cleaned);
  return Number.isNaN(num) ? 0 : num;
}


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

  const { plan, userData, displayCurrency, setDisplayCurrency } = useAuth();


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
    const clientSet = new Set<string>();

    invoices
      .filter((inv) => inv.currency === displayCurrency)
      .forEach((inv) => {

        const amt = inv.normalizedAmount ?? parseAmountToNumber(inv.amount);



        totalRevenue += amt;
        clientSet.add(inv.client);

        if (getInvoiceStatus(inv) === "Pending") {
          pendingCount++;
          pendingAmount += amt;
        }
        else if (getInvoiceStatus(inv) === "Paid") {
          paidCount++;
        }
      });

    return {
      totalRevenue,
      pendingCount,
      pendingAmount,
      paidCount,
      activeClients: clientSet.size,
    };
  }, [invoices, displayCurrency]);



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
          : getInvoiceStatus(inv) === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

  const recentInvoices = useMemo(() => {
    return filteredInvoices.slice(0, 5);
  }, [filteredInvoices]);




  /* ---- NEW: safer PDF export using hidden iframe (improved) ---- */
  function exportInvoiceAsPDF(inv: Invoice) {
    const printable = buildPrintableHTML({
      id: inv.id,
      client: inv.client,
      date: inv.date,
      lineItems: (inv as any).meta?.lineItems ?? [],
      subtotal: parseAmountToNumber(inv.amount),
      taxAmount: 0,
      total: parseAmountToNumber(inv.amount),
      notes: (inv as any).meta?.notes ?? "",
      currency: inv.currency || displayCurrency, // IMPORTANT
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
    invoices
      .filter((inv) => inv.currency === displayCurrency)
      .forEach((inv) => {

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
          const numericAmount = inv.normalizedAmount ?? parseAmountToNumber(inv.amount);
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
        ? cleanedBuckets
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
  }, [invoices, revenueRange, displayCurrency]);



  const calculateGrowthPercentage = (data: any[]) => {
    if (data.length < 2) return null;

    const last = Number(data[data.length - 1].value || 0);
    const prev = Number(data[data.length - 2].value || 0);

    // 🚀 No previous revenue
    if (prev === 0 && last > 0) return "new";

    // 🚀 Too small baseline
    if (prev < 1000) return "new";

    const growth = ((last - prev) / prev) * 100;

    // 🚀 EXTREME spike → treat as new (Stripe behavior)
    if (growth > 300) return "new";

    return Number(growth.toFixed(1));
  };

  const currentRevenue = revenueChartData.at(-1)?.realValue ?? 0;


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



  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen text-slate-500 text-sm">
        Loading dashboard...
      </div>
    );
  }




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
              <div className="lg:col-span-5 flex">
                <div className="flex-1 relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-[#0f0f25] via-[#141432] to-[#1b1b40] border border-violet-500/25 transition-all duration-300">

                  {/* Subtle background glow */}
                  <div className="absolute -top-20 -right-20 w-72 h-72 bg-violet-500/20 blur-[120px] pointer-events-none" />

                  <div className="relative z-10 flex flex-col gap-4">

                    {/* LEFT CONTENT */}
                    <div>
                      <p className="text-xs font-medium tracking-wide text-violet-300 uppercase min-h-[32px]">
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
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-semibold shadow-[0_0_30px_rgba(124,58,237,0.6)] transition-all duration-200 hover:scale-105"
                      >
                        <Plus className="h-4 w-4" />
                        New AI Invoice
                      </button>

                      <button
                        type="button"
                        onClick={() => alert("Template coming soon")}
                        className="px-6 py-3 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5 transition-all duration-200"
                      >
                        Import Template
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="lg:col-span-7 flex">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 flex-1">

                  <StatCard
                    label="Total Revenue"
                    value={formatCurrency(stats.totalRevenue, displayCurrency)}
                    subLabel="From all invoices"
                    trend="+ Live"
                  />
                  <StatCard
                    label="Pending Invoices"
                    value={String(stats.pendingCount)}
                    subLabel={
                      stats.pendingAmount
                        ? `${formatCurrency(stats.pendingAmount, displayCurrency)} pending`
                        : "No pending amount"
                    }
                    trend="Updated"
                  />
                  <StatCard
                    label="Paid Invoices"
                    value={String(stats.paidCount)}
                    subLabel="Marked as paid"
                    trend="Accurate"
                  />
                  <StatCard
                    label="Active Clients"
                    value={String(stats.activeClients)}
                    subLabel="Unique billed"
                    trend="Growing"
                  />
                </div>
              </div>

            </div>


            {/* Bottom row */}
            <div className="grid gap-6 lg:grid-cols-2 items-stretch">

              {/* Chart */}
              <div className="relative rounded-3xl px-8 pt-6 pb-6 bg-gradient-to-br from-[#0b0b18] to-[#14142f] border border-violet-500/20 shadow-[0_0_50px_rgba(124,58,237,0.15)] overflow-hidden">

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-slate-500">
                      Revenue
                    </p>

                    <h2 className="text-xl font-semibold tracking-tight text-white mt-1">
                      {revenueRange === "6m"
                        ? "Last 6 months"
                        : revenueRange === "12m"
                          ? "Last 12 months"
                          : "This month"}
                    </h2>

                    {/* 🔥 HERO METRIC */}
                    <div className="mt-3 flex items-baseline gap-3">
                      <span className="text-2xl font-semibold text-white">
                        {formatCurrency(currentRevenue, displayCurrency)}
                      </span>

                      {typeof growth === "number" && growth > 0 && (
                        <span className="text-emerald-400 text-sm">
                          ↑ {growth}%
                        </span>
                      )}

                      {typeof growth === "number" && growth < 0 && (
                        <span className="text-rose-400 text-sm">
                          ↓ {Math.abs(growth)}%
                        </span>
                      )}
                    </div>

                    {/* SUBTEXT */}
                    <p className="text-xs text-slate-500 mt-1">
                      {revenueRange === "1m"
                        ? "Revenue this month"
                        : "Total revenue in selected period"}
                    </p>

                  </div>



                  <div className="flex gap-2 mr-3">
                    <button
                      onClick={() => setDisplayCurrency("INR")}
                      className={`px-3 py-1 rounded-lg text-xs border ${displayCurrency === "INR"
                        ? "bg-violet-600 text-white border-violet-500"
                        : "border-white/10 text-slate-400 hover:bg-white/5"
                        }`}
                    >
                      INR
                    </button>

                    <button
                      onClick={() => setDisplayCurrency("USD")}
                      className={`px-3 py-1 rounded-lg text-xs border ${displayCurrency === "USD"
                        ? "bg-violet-600 text-white border-violet-500"
                        : "border-white/10 text-slate-400 hover:bg-white/5"
                        }`}
                    >
                      USD
                    </button>
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

                <div className="h-[260px] w-full">

                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute left-1/3 top-0 h-full w-[200px] bg-violet-500/10 blur-[120px]" />
                    <div className="absolute right-1/4 top-0 h-full w-[150px] bg-indigo-500/10 blur-[100px]" />
                  </div>


                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={revenueChartData}
                      margin={{ top: 10, right: 20, left: 20, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                          <stop offset="30%" stopColor="#8b5cf6" stopOpacity={0.45} />
                          <stop offset="65%" stopColor="#6366f1" stopOpacity={0.18} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        stroke="rgba(255,255,255,0.04)"
                        strokeDasharray="3 6"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="label"
                        stroke="#94a3b8"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                        interval={0}
                        padding={{ left: 10, right: 10 }}
                        tick={{ fill: "#94a3b8", opacity: 0.8 }}
                        minTickGap={20}
                      />



                      <Tooltip
                        cursor={<CustomCursor />}
                        contentStyle={{
                          backgroundColor: "rgba(15,15,26,0.85)",
                          backdropFilter: "blur(12px)",
                          border: "1px solid rgba(124,58,237,0.25)",
                          borderRadius: "12px",
                          fontSize: "12px",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
                        }}
                        formatter={(value: any, name, props: any) => {
                          const isCurrent = props.payload?.isCurrent;
                          const real = props.payload?.realValue ?? value;

                          return `${isCurrent ? "So far: " : ""}${formatCurrency(Number(real), displayCurrency)}`
                        }}
                      />


                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#8b5cf6"
                        strokeWidth={6}
                        fill="none"
                        opacity={0.08}
                        dot={false}
                        tooltipType="none"
                      />


                      <Area
                        type="monotone"
                        animationDuration={700}
                        animationEasing="ease-out"
                        dataKey="value"
                        stroke="#a78bfa"
                        strokeWidth={3.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="url(#areaGradient)"
                        dot={false}
                        activeDot={(props: any) => {
                          if (props.payload?.isCurrent) {
                            return (
                              <circle
                                cx={props.cx}
                                cy={props.cy}
                                r={7}
                                fill="#a78bfa"
                                stroke="#0b0b18"
                                strokeWidth={3}

                              />


                            );
                          }
                          return null;
                        }}
                      />



                    </AreaChart>

                  </ResponsiveContainer>
                </div>

                <div className="mt-5 flex flex-col gap-1">
                  <span className="text-[11px] text-slate-500">
                    Current period is still in progress
                  </span>

                  <div className="text-xs">
                    {growth === "new" && (
                      <span className="text-emerald-400">
                        First revenue recorded
                      </span>
                    )}

                    {typeof growth === "number" && growth > 0 && (
                      <span className="text-emerald-400">
                        ↑ {growth}% growth
                      </span>
                    )}

                    {typeof growth === "number" && growth < 0 && (
                      <span className="text-rose-400">
                        ↓ {Math.abs(growth)}% decline
                      </span>
                    )}
                  </div>
                </div>
              </div>


              {/* Recent invoices */}
              <div className={`${cardBase} ${cardHover} p-6`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-slate-400">Recent invoices</p>
                    <h2 className="text-sm font-semibold">Last activity</h2>
                  </div>
                  <Link href="/dashboard/invoices" className="text-[11px] text-violet-300 hover:text-violet-200">View all</Link>
                </div>


                {/* TABLE */}
                <div className="w-full">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-white/12">
                        <th className="py-2 pr-4 w-[110px]">Invoice</th>
                        <th className="py-2 pr-4 w-[180px]">Client</th>
                        <th className="py-2 pr-4 w-[100px]">Amount</th>
                        <th className="py-2 pr-4 w-[110px]">Status</th>
                        <th className="py-2 pr-4 w-[110px]">Date</th>
                        <th className="py-2 pr-4 text-right w-[170px]">Actions</th>

                      </tr>
                    </thead>

                    <tbody>
                      {recentInvoices.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-500 text-[11px]">No invoices found.</td>
                        </tr>
                      )}

                      {recentInvoices.map((inv) => (
                        <tr key={inv.id} className="border-b border-white/12 last:border-0 hover:bg-white/5">
                          <td className="py-2 pr-4 w-[120px]">

                            <span className="inline-block max-w-[110px] truncate px-2 py-1 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] font-medium">
                              {inv.invoiceNumber
                                ? inv.invoiceNumber

                                : inv.id.slice(0, 6)}

                            </span>

                          </td>


                          <td className="py-2 pr-4 truncate max-w-[180px]">
                            {inv.client}
                          </td>

                          <td className="py-2 pr-4">
                            {formatCurrency(
                              inv.normalizedAmount ?? parseAmountToNumber(inv.amount),
                              inv.currency || displayCurrency
                            )}
                          </td>
                          <td className="py-2 pr-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] ${statusColors[getInvoiceStatus(inv)]}`}>
                              {getInvoiceStatus(inv)}
                            </span>
                          </td>
                          <td className="py-2 text-slate-400 text-[11px]">{inv.date}</td>

                          <td className="py-2 pr-4 text-right">
                            <div className="flex gap-2 items-center justify-end">

                              {inv.lifecycle === "draft" && (
                                <button
                                  onClick={() => issueInvoice(inv.id)}
                                  className="text-[10px] px-2 py-1 rounded-md border border-violet-500/30 text-violet-300 hover:bg-violet-500/10 whitespace-nowrap"
                                >
                                  Issue
                                </button>
                              )}

                              <Link href={`/invoice-editor?id=${inv.id}`} className="text-[10px] px-2 py-1 rounded-md border border-white/10 hover:bg-white/10 whitespace-nowrap"
                              >Edit</Link>

                              <button
                                onClick={() => exportInvoiceAsPDF(inv)}
                                className="text-[10px] px-2 py-1 rounded-md border border-white/10 hover:bg-white/10 whitespace-nowrap"
                                title="Open print dialog (choose 'Save as PDF')"
                              >
                                PDF
                              </button>

                              <button
                                onClick={() => shareInvoice(inv)}
                                className="text-[10px] px-2 py-1 rounded-md border border-white/10 hover:bg-white/10 whitespace-nowrap"
                              >
                                Share
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
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
      <div>Tax: <strong>${formatCurrency(taxAmount, currency)}
}</strong></div>
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

