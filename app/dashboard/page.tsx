"use client";

import UserMenu from "@/app/components/UserMenu";
import RequireAuth from "@/app/components/RequireAuth";
import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useInvoices, Invoice } from "../providers/InvoiceProvider";
import dynamic from "next/dynamic"; // <- added
import { useAuth } from "../providers/AuthProvider";
import { Building2 } from "lucide-react";


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

/* ----------------------------------------
   Helpers / small constants
----------------------------------------- */

type InvoiceStatus = "Paid" | "Pending" | "Overdue";

const statusColors: Record<InvoiceStatus, string> = {
  Paid:
    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_6px_18px_rgba(16,185,129,0.08)]",
  Pending:
    "bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-[0_6px_18px_rgba(251,191,36,0.07)]",
  Overdue:
    "bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-[0_6px_18px_rgba(244,63,94,0.08)]",
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

function formatCurrencyINR(value: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
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
  const pathname = usePathname();
  const router = useRouter();
  const { invoices } = useInvoices();
  const { plan } = useAuth();

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

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  /* Compute stats */
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let pendingCount = 0;
    let pendingAmount = 0;
    let paidCount = 0;
    const clientSet = new Set<string>();

    invoices.forEach((inv) => {
      const amt = parseAmountToNumber(inv.amount);
      totalRevenue += amt;
      clientSet.add(inv.client);

      if (inv.status === "Pending") {
        pendingCount++;
        pendingAmount += amt;
      } else if (inv.status === "Paid") {
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
        statusFilter === "All" ? true : inv.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [invoices, search, statusFilter]);

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
  return (
    <RequireAuth>
      <div className="relative min-h-screen bg-[#040407] text-slate-100 flex overflow-hidden">
        {/* global ambient glow */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-violet-600/10 blur-[200px] pointer-events-none" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-fuchsia-600/10 blur-[200px] pointer-events-none" />

        {/* SIDEBAR */}
        <aside
          className={`hidden md:flex flex-col relative backdrop-blur-xl
bg-gradient-to-b from-[#0b0b18] via-[#0d0d1f] to-black
border-r border-violet-500/10
transition-all duration-300 ${sidebarCollapsed ? "w-20" : "w-64"}`}

        >
          <div
            className="absolute right-0 top-0 h-full w-[2px]
          bg-gradient-to-b from-violet-500/40 via-violet-300/20 to-transparent
          shadow-[0_0_15px_rgba(139,92,246,0.45)] z-50"
          />

          <div className="px-4 pt-4 pb-3">
            {sidebarCollapsed ? (
              <div className="flex items-center justify-center">
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="h-10 w-10 rounded-full bg-black/40 border border-violet-500/18 flex items-center justify-center text-violet-300 hover:bg-black/60"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`${cardBase} p-6`}
                  >
                    C
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Cosmi</div>
                    <div className="text-xs text-slate-400">AI Invoice Dashboard</div>
                  </div>
                </div>

                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="h-10 w-10 rounded-full bg-black/40 border border-violet-500/18 
             flex items-center justify-center text-violet-300 hover:bg-black/60"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

              </div>
            )}

            <div className="mt-3 w-full h-[2px] bg-gradient-to-r from-violet-500/40 via-violet-300/20 to-transparent" />
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1">
            <SidebarItem
              href="/dashboard"
              icon={<LayoutDashboard className="h-4 w-4" />}
              active={pathname === "/dashboard"}
              collapsed={sidebarCollapsed}
            >
              Overview
            </SidebarItem>

            <SidebarItem
              href="/invoices"
              icon={<FileText className="h-4 w-4" />}
              active={pathname?.startsWith("/invoices")}
              collapsed={sidebarCollapsed}
            >
              Invoices
            </SidebarItem>

            <SidebarItem
              href="/clients"
              icon={<Users className="h-4 w-4" />}
              active={pathname?.startsWith("/clients")}
              collapsed={sidebarCollapsed}
            >
              Clients
            </SidebarItem>

            <SidebarItem
              href="/settings"
              icon={<Settings className="h-4 w-4" />}
              active={pathname?.startsWith("/settings")}
              collapsed={sidebarCollapsed}
            >
              Settings
            </SidebarItem>

            <SidebarItem
              href="/company"
              icon={<Building2 className="h-4 w-4" />}
              active={pathname?.startsWith("/company")}
              collapsed={sidebarCollapsed}
            >
              Company
            </SidebarItem>

          </nav>
        </aside>

        {/* MAIN */}
        <main className="flex-1 flex flex-col">
          {/* TOP BAR */}
          <header className="relative px-6 md:px-10 py-5 flex items-center gap-4
bg-gradient-to-r from-[#0b0b18] via-[#0d0d1f] to-black
border-b border-violet-500/10
backdrop-blur-xl relative z-50">
            <div
              className="absolute bottom-0 left-0 w-full h-[2px]
          bg-gradient-to-r from-violet-500/30 via-fuchsia-500/30 to-transparent"
            />

            <div>
              <h1 className="text-lg md:text-xl font-semibold">Dashboard</h1>
              <p className="text-xs md:text-sm text-slate-400">
                {plan === "free"
                  ? `${invoiceCountThisMonth}/5 invoices used this month`
                  : "Unlimited invoices"}
              </p>

            </div>

            <div className="flex-1" />

            <div className="hidden sm:flex items-center gap-3">
              <div className="relative">
                <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  placeholder="Search invoices..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-slate-950/80 border border-white/12 rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none"
                />
              </div>

              <button className="relative rounded-xl p-2 bg-slate-950/80 border border-white/12">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-[10px] flex items-center justify-center">
                  3
                </span>
              </button>

              <UserMenu />
            </div>
          </header>

          {/* CONTENT */}
          <section className="flex-1 px-6 md:px-10 py-8 space-y-8">

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
                    value={formatCurrencyINR(stats.totalRevenue)}
                    subLabel="From all invoices"
                    trend="+ Live"
                  />
                  <StatCard
                    label="Pending Invoices"
                    value={String(stats.pendingCount)}
                    subLabel={
                      stats.pendingAmount
                        ? `${formatCurrencyINR(stats.pendingAmount)} pending`
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
            <div className="grid gap-4 lg:grid-cols-[1.6fr,2fr]">
              {/* Chart */}
              <div className={`${cardBase} ${cardHover} p-6`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-slate-400">Revenue</p>
                    <h2 className="text-sm font-semibold">{revenueRange === "6m" ? "Last 6 months" : revenueRange === "12m" ? "Last 12 months" : "This month"}</h2>
                  </div>

                  <select value={revenueRange} onChange={(e) => setRevenueRange(e.target.value as any)} className="bg-black/50 border border-white/12 text-[11px] rounded-xl px-2 py-1">
                    <option value="6m">Last 6 months</option>
                    <option value="12m">Last 12 months</option>
                    <option value="1m">This month</option>
                  </select>
                </div>

                <div className="flex items-end gap-2 h-40 mt-3">
                  {revenueDataByRange[revenueRange].map((v, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div className="w-full rounded-t-xl bg-violet-500/80" style={{ height: `${v}%` }} />
                      <span className="text-[10px] text-slate-500">{revenueRange === "1m" ? `W${i + 1}` : `M${i + 1}`}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent invoices */}
              <div className={`${cardBase} ${cardHover} p-6`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-slate-400">Recent invoices</p>
                    <h2 className="text-sm font-semibold">Last activity</h2>
                  </div>
                  <Link href="/invoices" className="text-[11px] text-violet-300 hover:text-violet-200">View all</Link>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 mb-3">
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value === "All" ? "All" : (e.target.value as InvoiceStatus))} className="bg-black/50 border border-white/12 text-[11px] rounded-xl px-2 py-1">
                    <option value="All">All statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-white/12">
                        <th className="text-left py-2 pr-4">Invoice</th>
                        <th className="text-left py-2 pr-4">Client</th>
                        <th className="text-left py-2 pr-4">Amount</th>
                        <th className="text-left py-2 pr-4">Status</th>
                        <th className="text-left py-2 pr-4">Date</th>
                        <th className="text-left py-2">Actions</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredInvoices.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-500 text-[11px]">No invoices found.</td>
                        </tr>
                      )}

                      {filteredInvoices.map((inv) => (
                        <tr key={inv.id} className="border-b border-white/12 last:border-0 hover:bg-white/5">
                          <td className="py-2 pr-4 font-mono text-[11px]">{inv.id}</td>
                          <td className="py-2 pr-4">{inv.client}</td>
                          <td className="py-2 pr-4">{inv.amount}</td>
                          <td className="py-2 pr-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] ${statusColors[inv.status]}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-2 text-slate-400 text-[11px]">{inv.date}</td>

                          <td className="py-2 pr-4">
                            <div className="flex gap-2">
                              <Link href={`/invoice-editor?id=${inv.id}`} className="text-[11px] px-2 py-1 rounded-md border border-white/6 hover:bg-white/10">Edit</Link>

                              <button
                                onClick={() => exportInvoiceAsPDF(inv)}
                                className="text-[11px] px-2 py-1 rounded-md border border-white/6 hover:bg-white/10"
                                title="Open print dialog (choose 'Save as PDF')"
                              >
                                Download PDF
                              </button>

                              <button
                                onClick={() => shareInvoice(inv)}
                                className="text-[11px] px-2 py-1 rounded-md border border-white/6 hover:bg-white/10"
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
          </section>
        </main>
      </div>
    </RequireAuth>
  );
}

/* ----------------------------------------
   Subcomponents
----------------------------------------- */

function SidebarItem({
  children,
  icon,
  href,
  active,
  collapsed,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  href: string;
  active?: boolean;
  collapsed?: boolean;
}) {
  if (collapsed) {
    return (
      <Link href={href} title={typeof children === "string" ? children : undefined} className={`w-full flex items-center justify-center py-3 rounded-xl text-xs ${active ? "bg-violet-500/14 text-violet-100" : "text-slate-300 hover:bg-white/5"}`}>
        {icon}
      </Link>
    );
  }

  return (
    <Link href={href} className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs ${active
      ? "bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 text-white border border-violet-500/40 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
      : "text-slate-300 hover:bg-white/5"}`}>
      {icon}
      <span>{children}</span>
    </Link>
  );
}

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
}: {
  id: string;
  client: string;
  date: string;
  lineItems: Array<{ desc: string; qty: number; rate: number }>;
  subtotal: number;
  taxAmount: number;
  total: number;
  notes: string;
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
        <td class="rate">${escapeHtml(formatCurrencyINR(li.rate))}</td>
        <td class="amount">${escapeHtml(formatCurrencyINR(li.qty * li.rate))}</td>
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
      <div>Subtotal: <strong>${escapeHtml(formatCurrencyINR(subtotal))}</strong></div>
      <div>Tax: <strong>${escapeHtml(formatCurrencyINR(taxAmount))}</strong></div>
      <div class="grand-total">Total: ${escapeHtml(formatCurrencyINR(total))}</div>
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

