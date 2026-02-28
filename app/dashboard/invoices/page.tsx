"use client";

import { useState } from "react";

type InvoiceStatus = "Paid" | "Pending" | "Overdue" | "Draft";

interface Invoice {
  id: string;
  client: string;
  date: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: "INV-001",
      client: "Acme Corp",
      date: "2026-02-01",
      dueDate: "2026-02-15",
      amount: 12500,
      status: "Pending",
    },
    {
      id: "INV-002",
      client: "Nova Studio",
      date: "2026-02-05",
      dueDate: "2026-02-20",
      amount: 8000,
      status: "Paid",
    },
  ]);

  const getStatusStyle = (status: InvoiceStatus) => {
    switch (status) {
      case "Paid":
        return "bg-green-500/10 text-green-400";
      case "Pending":
        return "bg-yellow-500/10 text-yellow-400";
      case "Overdue":
        return "bg-red-500/10 text-red-400";
      case "Draft":
        return "bg-gray-500/10 text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-[#050509] text-white p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold">Invoices</h1>
        <button className="bg-[#7c3aed] hover:bg-[#6d28d9] px-5 py-2 rounded-xl font-medium transition">
          + Create Invoice
        </button>
      </div>

      {/* Search + Filters (Skeleton) */}
      <div className="flex gap-4 mb-6">
        <input
          placeholder="Search invoices..."
          className="bg-[#0c0c14] border border-[#1a1a2e] rounded-xl px-4 py-2 w-72 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
        />
        <select className="bg-[#0c0c14] border border-[#1a1a2e] rounded-xl px-4 py-2">
          <option>All Status</option>
          <option>Paid</option>
          <option>Pending</option>
          <option>Overdue</option>
          <option>Draft</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#0c0c14] rounded-2xl overflow-hidden border border-[#1a1a2e]">
        <table className="w-full text-left">
          <thead className="bg-[#11111b] text-gray-400 text-sm uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Invoice ID</th>
              <th className="px-6 py-4">Client</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Due Date</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>

          <tbody>
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="border-t border-[#1a1a2e] hover:bg-[#11111b] cursor-pointer transition"
                onClick={() => {
                  console.log("Open preview:", invoice.id);
                }}
              >
                <td className="px-6 py-4 font-medium">{invoice.id}</td>
                <td className="px-6 py-4">{invoice.client}</td>
                <td className="px-6 py-4">{invoice.date}</td>
                <td className="px-6 py-4">{invoice.dueDate}</td>
                <td className="px-6 py-4 font-medium">
                  ₹ {invoice.amount.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-3 py-1 text-sm rounded-full ${getStatusStyle(
                      invoice.status
                    )}`}
                  >
                    {invoice.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {invoices.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="mb-4">You haven’t created any invoices yet.</p>
            <button className="bg-[#7c3aed] px-5 py-2 rounded-xl">
              Create Your First Invoice
            </button>
          </div>
        )}
      </div>
    </div>
  );
}