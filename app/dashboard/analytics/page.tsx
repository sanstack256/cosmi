"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { getCurrencySymbol, formatCurrency } from "@/app/utils/currency";

import {
  XAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";

export default function AnalyticsPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // ================= FETCH =================
  useEffect(() => {
    async function fetchInvoices() {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          return;
        }

        const snap = await getDocs(
          collection(db, "users", user.uid, "invoices")
        );

        const raw = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const normalized = raw
          .filter((inv: any) => {
            if (inv.lifecycle === "draft") return false;
            if (!inv.issuedAt) return false;
            return true;
          })
          .map((inv: any) => {
            let total = 0;

            if (inv.total) {
              total = Number(inv.total);
            } else if (inv.amount) {
              total = Number(
                String(inv.amount).replace(/[^\d.-]/g, "")
              );
            } else if (inv.subtotal || inv.taxAmount) {
              total =
                Number(inv.subtotal ?? 0) +
                Number(inv.taxAmount ?? 0) -
                Number(inv.discount ?? 0);
            } else if (Array.isArray(inv.lineItems)) {
              total = inv.lineItems.reduce(
                (sum: number, li: any) =>
                  sum +
                  Number(li.qty ?? 0) *
                    Number(li.rate ?? 0),
                0
              );
            }

            const totalPaid =
              inv.payments?.reduce(
                (sum: number, p: any) =>
                  sum +
                  Number(
                    String(p.amount).replace(/[^\d.-]/g, "") || 0
                  ),
                0
              ) || 0;

            return {
              id: inv.id,
              client: inv.client || "Unknown",
              total,
              totalPaid,
              status: inv.paymentStatus || "unpaid",
              issuedAt: inv.issuedAt.toDate(),
              currency: inv.currency || "INR",
            };
          });

        setInvoices(normalized);
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchInvoices();
  }, []);

  // ================= REVENUE =================
  const revenueData = React.useMemo(() => {
    const map: Record<string, number> = {};

    invoices.forEach((inv) => {
      const d = new Date(inv.issuedAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;

      if (!map[key]) map[key] = 0;
      map[key] += inv.total;
    });

    return Object.entries(map)
      .sort(([a], [b]) => {
        const [ay, am] = a.split("-").map(Number);
        const [by, bm] = b.split("-").map(Number);
        return ay !== by ? ay - by : am - bm;
      })
      .map(([key, value]) => {
        const [year, month] = key.split("-");
        const date = new Date(Number(year), Number(month));

        return {
          month: date.toLocaleString("default", {
            month: "short",
          }),
          revenue: value,
          rawDate: date,
        };
      });
  }, [invoices]);

  // ================= FILL 6 MONTHS =================
  const filledRevenueData = React.useMemo(() => {
    if (revenueData.length === 0) return [];

    const result = [];

    const now = new Date();
    const start = new Date();
    start.setMonth(now.getMonth() - 5);

    for (let i = 0; i < 6; i++) {
      const d = new Date(start);
      d.setMonth(start.getMonth() + i);

      const match = revenueData.find(
        (r: any) =>
          r.rawDate.getMonth() === d.getMonth() &&
          r.rawDate.getFullYear() === d.getFullYear()
      );

      result.push({
        month: d.toLocaleString("default", {
          month: "short",
        }),
        revenue: match?.revenue || 0,
      });
    }

    return result;
  }, [revenueData]);

  const currency =
    invoices[0]?.currency === "USD" ? "USD" : "INR";

  // ================= LOADING =================
  if (loading) {
    return (
      <div className="p-6 text-slate-400">
        Loading analytics...
      </div>
    );
  }

  // ================= TOTAL =================
  const totalRevenue = filledRevenueData.reduce(
    (sum, d) => sum + d.revenue,
    0
  );

  // ================= UI =================
  return (
    <div className="p-6 space-y-6 text-white">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Analytics
        </h1>

        <button className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium transition">
          AI Review
        </button>
      </div>

      <div className="text-xs text-slate-500">
        {invoices.length} invoices (filtered)
      </div>

      {/* ================= ROW 1 ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* REVENUE CARD */}
        <div className="lg:col-span-2 rounded-xl border border-white/10 bg-[#0a0a0f] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_10px_40px_rgba(0,0,0,0.6)] p-5">
          <div className="text-sm text-slate-400 mb-4">
            Revenue Trend
          </div>

          {/* HEADER ABOVE CHART */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-2xl font-semibold">
                {getCurrencySymbol(currency)}
                {formatCurrency(totalRevenue, currency)}
              </div>
              <div className="text-xs text-slate-400">
                Total revenue (last 6 months)
              </div>
            </div>

            <div className="text-xs text-emerald-400 font-medium">
              +0%
            </div>
          </div>

          {/* CHART */}
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filledRevenueData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -10,
                  bottom: 0,
                }}
              >
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#8b5cf6"
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="40%"
                      stopColor="#8b5cf6"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="100%"
                      stopColor="#8b5cf6"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />

                <XAxis
                  dataKey="month"
                  stroke="#64748b"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />

                <Tooltip
                  formatter={(value: any) => [
                    `${getCurrencySymbol(
                      currency
                    )}${formatCurrency(
                      Number(value),
                      currency
                    )}`,
                    "",
                  ]}
                  contentStyle={{
                    background: "#0a0a0f",
                    border:
                      "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                  }}
                  labelStyle={{
                    color: "#a78bfa",
                  }}
                  cursor={{
                    stroke: "#8b5cf6",
                    strokeWidth: 1,
                  }}
                />

                {/* GLOW */}
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#a78bfa"
                  strokeWidth={6}
                  opacity={0.15}
                  dot={false}
                />

                {/* MAIN */}
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#a78bfa"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  dot={false}
                  activeDot={{
                    r: 6,
                    stroke: "#a78bfa",
                    strokeWidth: 2,
                    fill: "#0a0a0f",
                  }}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* STATUS */}
        <div className="rounded-xl border border-white/10 bg-[#0a0a0f] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_10px_40px_rgba(0,0,0,0.6)] p-5">
          <div className="text-sm text-slate-400 mb-2">
            Status Breakdown
          </div>
          <div className="h-[220px] flex items-center justify-center text-slate-500">
            Coming next
          </div>
        </div>
      </div>

      {/* ================= ROW 2 ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-[#0a0a0f] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_10px_40px_rgba(0,0,0,0.6)] p-5">
          <div className="text-sm text-slate-400 mb-2">
            Top Clients
          </div>
          <div className="h-[200px] flex items-center justify-center text-slate-500">
            Coming next
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#0a0a0f] shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_10px_40px_rgba(0,0,0,0.6)] p-5">
          <div className="text-sm text-slate-400 mb-2">
            Payment Delay Distribution
          </div>
          <div className="h-[200px] flex items-center justify-center text-slate-500">
            Coming next
          </div>
        </div>
      </div>
    </div>
  );
}