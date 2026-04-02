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

    const [selectedCurrency, setSelectedCurrency] = useState<"INR" | "USD">("INR");

    const filteredInvoices = invoices.filter(
        (inv) => inv.currency === selectedCurrency
    );

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

        filteredInvoices.forEach((inv) => {
            const d = new Date(inv.issuedAt);
            const key = `${d.getFullYear()}-${d.getMonth()}`;

            if (!map[key]) map[key] = 0;
            map[key] += inv.totalPaid > 0 ? inv.totalPaid : inv.total;
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
    }, [filteredInvoices]);

    // ================= FILL 6 MONTHS =================
    const filledRevenueData = React.useMemo(() => {
        if (revenueData.length === 0) return [];

        const result = [];

        const first = revenueData[0].rawDate;
        const start = new Date(first);
        start.setMonth(start.getMonth() - 1); // 👈 one month before start

        const last = revenueData[revenueData.length - 1].rawDate;
        const end = new Date(last);

        let current = new Date(start);

        while (
            current.getFullYear() < end.getFullYear() ||
            (current.getFullYear() === end.getFullYear() &&
                current.getMonth() <= end.getMonth())
        ) {
            const match = revenueData.find(
                (r: any) =>
                    r.rawDate.getMonth() === current.getMonth() &&
                    r.rawDate.getFullYear() === current.getFullYear()
            );

            result.push({
                month: current.toLocaleString("default", { month: "short" }),
                revenue: match ? match.revenue : 0, //  flat is OK for one month prior to the starting month
            });

            current.setMonth(current.getMonth() + 1);
        }

        return result;
    }, [revenueData]);


    const last = filledRevenueData[filledRevenueData.length - 1];
    const prev = filledRevenueData[filledRevenueData.length - 2];

    let growth = 0;
    let growthLabel = "—";

    if (last && prev && prev.revenue > 0) {
        growth = ((last.revenue - prev.revenue) / prev.revenue) * 100;

        if (growth > 0) {
            growthLabel = `+${Math.round(growth)}%`;
        } else if (growth < 0) {
            growthLabel = `${Math.round(growth)}%`;
        } else {
            growthLabel = "0%";
        }
    } else if (last && prev && prev.revenue === 0 && last.revenue > 0) {
        growthLabel = "+100%"; // starting growth
    }



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
        (sum, d) => sum + (d.revenue ?? 0),
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
                    <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                        Revenue Trend

                        <div className="group relative cursor-pointer">
                            <div className="
                            w-6 h-6 
                            flex items-center justify-center 
                            rounded-full 
                            bg-white/5 
                            text-sm text-slate-300

                            shadow-[0_0_0_1px_rgba(255,255,255,0.04)]
                            
                            hover:bg-white/10 
                            hover:text-white 
                            hover:border-white/20
                            hover:shadow-[0_0_12px_rgba(74,222,128,0.25)]
                            
                            transition
                        ">
                                ⓘ
                            </div>
                            {/* Tooltip */}
                            <div className="absolute left-1/2 -translate-x-1/2 top-8 w-64 
                                  opacity-0 translate-y-2 scale-95 
                                  group-hover:opacity-100 group-hover:translate-y-0 group-hover:scale-100
                                  transition-all duration-200 ease-out pointer-events-none z-50
                                ">
                                <div className="
                                    relative
                                    rounded-xl
                                    bg-[#0a0a0f]/95
                                    backdrop-blur-xl
                                    border border-white/10
                                    p-4
                                    text-sm text-slate-300
                                    shadow-[0_20px_60px_rgba(0,0,0,0.6)]
                                  ">

                                    {/* subtle top glow line */}
                                    <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

                                    {/* content */}
                                    <div className="space-y-2">
                                        <p className="text-slate-200 font-medium">
                                            Revenue over time
                                        </p>

                                        <p className="text-slate-400 text-xs leading-relaxed">
                                            Based on your issued invoices. Higher points indicate increased earnings.
                                        </p>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>

                    {/* HEADER ABOVE CHART */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="text-2xl font-semibold">
                                    {getCurrencySymbol(selectedCurrency)}
                                    {formatCurrency(totalRevenue, selectedCurrency)}
                                </div>

                                <div
                                    className={`
      text-xs font-medium px-2 py-1 rounded-md
      ${growth > 0
                                            ? "bg-emerald-500/10 text-emerald-400"
                                            : growth < 0
                                                ? "bg-red-500/10 text-red-400"
                                                : "bg-slate-500/10 text-slate-400"
                                        }
    `}
                                >
                                    {growthLabel}
                                </div>
                            </div>
                            <div className="text-xs text-slate-400">
                                Total revenue (last 6 months)
                            </div>
                        </div>

                        {Array.from(new Set(invoices.map(i => i.currency))).length > 1 && (
                            <div className="flex gap-2">
                                {Array.from(new Set(invoices.map(i => i.currency))).map((cur) => (
                                    <button
                                        key={cur}
                                        onClick={() => setSelectedCurrency(cur as "INR" | "USD")}
                                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${selectedCurrency === cur
                                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                            : "text-slate-400 hover:text-white"
                                            }`}
                                    >
                                        {cur}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* CHART */}
<div className="h-[220px] focus:outline-none [&_*]:focus:outline-none select-none">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                tabIndex={-1}
                                style={{ outline: "none" }}
                                data={filledRevenueData}
                                margin={{
                                    top: 20,
                                    right: 20,
                                    left: 10,
                                    bottom: 10,
                                }}
                            >
                                <defs>
                                    <linearGradient id="leftFade" x1="0" y1="0" x2="1" y2="0">
                                        <stop offset="0%" stopColor="#0a0a0f" stopOpacity={1} />
                                        <stop offset="100%" stopColor="#0a0a0f" stopOpacity={0} />
                                    </linearGradient>
                                </defs>


                                <defs>
                                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#4ade80" stopOpacity={0.95} />
                                        <stop offset="30%" stopColor="#22c55e" stopOpacity={0.4} />
                                        <stop offset="70%" stopColor="#16a34a" stopOpacity={0.15} />
                                        <stop offset="100%" stopColor="#14532d" stopOpacity={0} />
                                    </linearGradient>
                                </defs>

                                <CartesianGrid
                                    stroke="rgba(255,255,255,0.08)"
                                    strokeDasharray="3 6"
                                    vertical={false}
                                />

                                <XAxis
                                    dataKey="month"
                                    height={40}
                                    stroke="#64748b"
                                    tickLine={false}
                                    axisLine={false}
                                    interval={0}
                                    minTickGap={0}
                                    padding={{ left: 20, right: 16 }}
                                    tick={(props) => {
                                        const { x, y, payload, index } = props;

                                        const yPos = (typeof y === "number" ? y : 0) + 14;

                                        return (
                                            <text
                                                x={x}
                                                y={yPos}
                                                textAnchor={
                                                    index === 0
                                                        ? "start"
                                                        : index === filledRevenueData.length - 1
                                                            ? "end"
                                                            : "middle"
                                                }
                                                fontSize={12}
                                                fill={index === 0 ? "#475569" : "#94a3b8"}
                                            >
                                                {payload.value}
                                            </text>
                                        );
                                    }}
                                />
                                <Tooltip
                                    labelFormatter={(label) => label}

                                    formatter={(value: any) =>
                                        `${getCurrencySymbol(selectedCurrency)}${formatCurrency(value, selectedCurrency)}`
                                    }
                                    contentStyle={{
                                        background: "rgba(10,10,15,0.95)",
                                        border: "1px solid rgba(255,255,255,0.08)",
                                        borderRadius: "14px",
                                        backdropFilter: "blur(12px)",
                                        boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                                    }}
                                    labelStyle={{
                                        color: "#4ade80",
                                        fontWeight: 500,
                                    }}
                                    cursor={false}
                                />

                                {/* GLOW */}
                                <Area
                                    type="linear"
                                    dataKey="revenue"
                                    stroke="#22c55e"
                                    strokeWidth={6}
                                    opacity={0.12}
                                    dot={false}
                                    connectNulls
                                    tooltipType="none"
                                />

                                {/* MAIN */}
                                <Area
                                    type="linear"
                                    name="revenue"
                                    dataKey="revenue"
                                    stroke="#22c55e"
                                    strokeWidth={2.5}
                                    strokeLinecap="round"
                                    dot={{
                                        r: 3,
                                        fill: "#22c55e",
                                        strokeWidth: 0
                                    }}
                                    activeDot={{
                                        r: 6,
                                        stroke: "#4ade80",
                                        strokeWidth: 2,
                                        fill: "#0a0a0f",
                                    }}
                                    fill="url(#revenueGradient)"
                                    connectNulls
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