"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useInvoices } from "@/app/providers/InvoiceProvider";
import { useRouter } from "next/navigation";
import { Filter } from "lucide-react";

function parseAmount(value: any): number {
    if (!value) return 0;
    if (typeof value === "number") return value;
    return Number(String(value).replace(/[^0-9.-]+/g, "")) || 0;
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function getAvatarColor(name: string) {
    const colors = [
        "from-violet-500/30 to-fuchsia-500/30",
        "from-blue-500/30 to-cyan-500/30",
        "from-emerald-500/30 to-green-500/30",
        "from-orange-500/30 to-amber-500/30",
        "from-pink-500/30 to-rose-500/30",
    ];

    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash += name.charCodeAt(i);
    }

    return colors[hash % colors.length];
}

export default function ClientsPage() {
    const filterRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const { clients, invoices } = useInvoices();

    const [search, setSearch] = useState("");
    const [sort, setSort] = useState("name");
    const [showFilters, setShowFilters] = useState(false);

    const clientStats = useMemo(() => {
        return clients.map((client) => {
            const clientInvoices = invoices.filter(
                (inv) => inv.client === client.name
            );

            const revenue = clientInvoices
                .filter((inv) => inv.lifecycle === "issued")
                .reduce((sum, inv) => sum + parseAmount(inv.amount), 0);

            const outstanding = clientInvoices
                .filter((inv) => inv.lifecycle === "issued")
                .reduce((sum, inv) => {
                    const totalPaid =
                        inv.payments?.reduce(
                            (p, pay) => p + pay.amount,
                            0
                        ) || 0;

                    const amount = parseAmount(inv.amount);

                    return sum + Math.max(amount - totalPaid, 0);
                }, 0);

            const lastInvoice =
                clientInvoices
                    .filter((inv) => inv.lifecycle === "issued")
                    .sort(
                        (a, b) =>
                            new Date(b.date).getTime() -
                            new Date(a.date).getTime()
                    )[0]?.date || null;

            let health = "good";

            const hasOverdue = clientInvoices.some(
                (inv) =>
                    inv.lifecycle === "issued" &&
                    inv.paymentStatus === "overdue"
            );

            if (hasOverdue) {
                health = "risk";
            } else if (outstanding > 0) {
                health = "attention";
            }

            return {
                ...client,
                invoiceCount: clientInvoices.length,
                revenue,
                health,
                outstanding,
                lastInvoice,
            };
        });
    }, [clients, invoices]);

    const maxRevenue = Math.max(...clientStats.map(c => c.revenue), 1);

    let filtered = clientStats.filter((c) =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    if (sort === "name") {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sort === "revenue") {
        filtered.sort((a, b) => b.revenue - a.revenue);
    }

    if (sort === "invoices") {
        filtered.sort((a, b) => b.invoiceCount - a.invoiceCount);
    }

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                filterRef.current &&
                !filterRef.current.contains(event.target as Node)
            ) {
                setShowFilters(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);


    const totalRevenue = clientStats.reduce((sum, c) => sum + c.revenue, 0);

    const avgClientValue =
        clients.length > 0 ? totalRevenue / clients.length : 0;

    return (
        <div className="text-white max-w-7xl mx-auto space-y-10">

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-semibold">Clients</h1>

                <div className="text-sm text-slate-400">
                    Total Clients: {clients.length}
                </div>
            </div>

            {/* Search + Filter */}
            <div className="flex items-center gap-3 mb-8">

                <input
                    placeholder="Search clients..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full max-w-sm bg-[#0f1020] border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500 transition"
                />

                <div ref={filterRef} className="relative">

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-[#0f1020] hover:bg-[#171833] text-sm transition"
                    >
                        <Filter className="h-4 w-4" />
                        Filters
                    </button>

                    <div
                        className={`absolute right-0 mt-3 w-[240px] bg-[#0f1020] border border-white/10 rounded-xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-md z-50 transition-all duration-200 ${showFilters
                            ? "opacity-100 translate-y-0"
                            : "opacity-0 pointer-events-none -translate-y-2"
                            }`}
                    >
                        <p className="text-xs uppercase text-slate-500 mb-3">
                            Sort Clients
                        </p>

                        <div className="space-y-2 text-sm">

                            <button
                                onClick={() => {
                                    setSort("name");
                                    setShowFilters(false);
                                }}
                                className="block w-full text-left hover:text-violet-400 transition"
                            >
                                Alphabetical
                            </button>

                            <button
                                onClick={() => {
                                    setSort("revenue");
                                    setShowFilters(false);
                                }}
                                className="block w-full text-left hover:text-violet-400 transition"
                            >
                                Highest Revenue
                            </button>

                            <button
                                onClick={() => {
                                    setSort("invoices");
                                    setShowFilters(false);
                                }}
                                className="block w-full text-left hover:text-violet-400 transition"
                            >
                                Most Invoices
                            </button>

                        </div>
                    </div>
                </div>

            </div>

            {/* Stats */}
            <div className="relative rounded-2xl border border-white/10 bg-gradient-to-br from-[#15162c] to-[#0b0c18] shadow-[0_20px_60px_rgba(0,0,0,0.5)] p-6 mb-10 hover:shadow-[0_25px_80px_rgba(124,58,237,0.18)] transition">

                <div className="grid grid-cols-3 gap-6">

                    {/* Total Clients */}
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-widest text-slate-400">
                            Total Clients
                        </p>
                        <p className="text-3xl font-semibold text-white">
                            {clients.length}
                        </p>
                    </div>

                    {/* Total Revenue */}
                    <div className="space-y-2 border-l border-white/5 pl-6">
                        <p className="text-xs uppercase tracking-widest text-slate-400">
                            Total Revenue
                        </p>
                        <p className="text-3xl font-semibold text-white">
                            ₹ {totalRevenue.toLocaleString("en-IN")}
                        </p>
                    </div>

                    {/* Avg Client Value */}
                    <div className="space-y-2 border-l border-white/5 pl-6">
                        <p className="text-xs uppercase tracking-widest text-slate-400">
                            Avg Client Value
                        </p>
                        <p className="text-3xl font-semibold text-white">
                            ₹ {Math.round(avgClientValue).toLocaleString("en-IN")}
                        </p>
                    </div>

                </div>

            </div>



            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-8"></div>
            {/* Table */}
            <div className="relative bg-gradient-to-b from-[#0f1020] to-[#0b0c18] border border-white/5 rounded-2xl overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.6)]">


                <table className="w-full text-left">

                    <thead className="bg-gradient-to-r from-[#1a1b34] to-[#131428] text-gray-400 text-xs uppercase tracking-wide">
                        <tr>
                            <th className="px-6 py-4">Client</th>
                            <th className="px-6 py-4">Invoices</th>
                            <th className="px-6 py-4">Revenue</th>
                            <th className="px-6 py-4">Outstanding</th>
                            <th className="px-6 py-4">Last Invoice</th>
                            <th className="px-6 py-4">Health</th>
                        </tr>
                    </thead>

                    <tbody>
                        {filtered.map((client) => (
                            <tr
                                key={client.id}
                                onClick={() =>
                                    router.push(`/dashboard/clients/${client.id}`)
                                }
                                className="border-b border-white/5 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer hover:bg-white/[0.05]"
                            >

                                {/* Client */}
                                <td className="px-6 py-4 flex items-center gap-3">

                                    <div
                                        className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(
                                            client.name
                                        )} text-white flex items-center justify-center text-xs font-semibold shadow-lg`}
                                    >
                                        {getInitials(client.name)}
                                    </div>

                                    <span className="font-medium">
                                        {client.name}
                                    </span>

                                </td>

                                {/* Invoice Count */}
                                <td className="px-6 py-4 text-slate-300">
                                    {client.invoiceCount}
                                </td>

                                {/* Revenue */}
                                <td className="px-6 py-4">

                                    <div className="flex items-center gap-3">

                                        <span className="text-emerald-400 font-semibold w-28">
                                            ₹ {client.revenue.toLocaleString("en-IN")}
                                        </span>

                                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-500"
                                                style={{
                                                    width: `${maxRevenue ? (client.revenue / maxRevenue) * 100 : 0}%`
                                                }}
                                            />
                                        </div>

                                    </div>

                                </td>

                                {/* Outstanding */}
                                <td className="px-6 py-4 text-amber-400 font-semibold">
                                    ₹ {client.outstanding.toLocaleString("en-IN")}
                                </td>

                                {/* Last Invoice */}
                                <td className="px-6 py-4 text-slate-400">
                                    {client.lastInvoice || "-"}
                                </td>


                                <td className="px-6 py-4">
                                    {client.health === "good" && (


                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                            Good
                                        </span>
                                    )}

                                    {client.health === "attention" && (


                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                            Attention
                                        </span>
                                    )}

                                    {client.health === "risk" && (
                                        <span className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                                            Risk
                                        </span>
                                    )}
                                </td>

                            </tr>
                        ))}

                        {!filtered.length && (
                            <tr>
                                <td
                                    colSpan={6}
                                    className="px-6 py-10 text-center text-slate-400"
                                >
                                    No clients found
                                </td>
                            </tr>
                        )}

                    </tbody>

                </table>

            </div>
        </div>
    );
}

function StatCard({ label, value, color }: any) {

    const colorMap: any = {
        violet: "from-violet-600/20 to-fuchsia-600/20 border-violet-500/30",
        emerald: "from-emerald-500/20 to-green-500/20 border-emerald-500/30",
        amber: "from-amber-500/20 to-orange-500/20 border-amber-500/30"
    };

    return (
        <div
            className={`relative rounded-2xl p-6 bg-gradient-to-br ${colorMap[color]} border backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.45)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(124,58,237,0.2)]`}
        >

            <p className="text-xs uppercase tracking-widest text-slate-400">
                {label}
            </p>

            <p className="mt-3 text-3xl font-semibold text-white">
                {value}
            </p>

            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5 pointer-events-none" />

        </div>
    );
}