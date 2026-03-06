"use client";

import { useParams, useRouter } from "next/navigation";
import { useInvoices } from "@/app/providers/InvoiceProvider";
import { ArrowLeft } from "lucide-react";
import { Invoice } from "@/app/providers/InvoiceProvider";

export default function InvoicePreviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const { invoices } = useInvoices();

  const invoice = invoices.find((i) => i.id === id) as Invoice | undefined;

  if (!invoice) {
    return (
      <div className="text-center text-slate-400 py-20">
        Invoice not found.
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col items-center">

      {/* Back + Actions */}
      <div className="w-full max-w-5xl flex justify-between items-center mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex gap-3">
          <button
            onClick={() => router.push(`/invoice-editor?id=${invoice.id}`)}
            className="px-4 py-2 rounded-xl border border-white/10 text-sm hover:bg-white/5"
          >
            Edit
          </button>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-sm font-medium"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* A4 Sheet */}
      <div className="w-full max-w-4xl bg-white text-black rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.6)] p-12">

        {/* Header */}
        <div className="flex justify-between mb-12">
          <div>
            <h1 className="text-3xl font-bold mb-2">Invoice</h1>
            <p className="text-sm text-gray-500">{invoice.client}</p>
          </div>

          <div className="text-right">
            <p className="font-semibold">{invoice.id}</p>
            <p className="text-sm text-gray-500">{invoice.date}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-10 mb-10">
          <div>
            <p className="text-xs uppercase text-gray-400 mb-2">Bill To</p>
            <p className="font-medium">{invoice.client}</p>
          </div>

          <div>
            <p className="text-xs uppercase text-gray-400 mb-2">Due Date</p>
            <p>{invoice.dueDate}</p>
          </div>
        </div>

        {/* Table */}
        <table className="w-full text-sm mb-10">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">Description</th>
              <th className="text-right py-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-4">Services Rendered</td>
              <td className="text-right py-4">{invoice.amount}</td>
            </tr>
          </tbody>
        </table>

        {/* Total */}
        <div className="flex justify-end">
          <div className="w-60 space-y-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{invoice.amount}</span>
            </div>
            <div className="flex justify-between font-semibold text-lg pt-2 border-t">
              <span>Total</span>
              <span>{invoice.amount}</span>
            </div>
          </div>
        </div>

      </div>

      {/* Activity Timeline */}
      <div className="mt-8 bg-[#0f1020] border border-white/5 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">
          Activity
        </h3>

        <div className="space-y-4">
          {(invoice?.activity ?? []).map((event: any, index: number) => {

            const label =
              event.type === "created"
                ? "Invoice created"
                : event.type === "issued"
                  ? "Invoice issued"
                  : event.type === "cancelled"
                    ? "Invoice cancelled"
                    : event.type;

            const date = event.timestamp?.toDate
              ? event.timestamp.toDate()
              : new Date(event.timestamp);

            return (
              <div key={index} className="flex items-center gap-3 text-sm">

                {/* timeline dot */}
                <div className="w-2.5 h-2.5 rounded-full bg-violet-500"></div>

                {/* text */}
                <div className="flex-1">
                  <span className="text-white">{label}</span>
                </div>

                {/* time */}
                <div className="text-xs text-slate-400">
                  {date.toLocaleString()}
                </div>

              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

