"use client";

import { useParams, useRouter } from "next/navigation";
import { useInvoices } from "@/app/providers/InvoiceProvider";
import { ArrowLeft } from "lucide-react";
import { Invoice } from "@/app/providers/InvoiceProvider";
import { useState } from "react";
import { useToast } from "@/app/providers/ToastProvider";


/* ----------------------------------
Activity Label Formatter
---------------------------------- */

function formatActivity(type: string) {
  switch (type) {
    case "draft_created":
      return "Draft created";

    case "issued":
      return "Invoice issued";

    case "cancelled":
      return "Invoice cancelled";

    case "payment_received":
      return "Payment received";

    default:
      return type;
  }
}

/* ----------------------------------
Activity Dot Color
---------------------------------- */

function getDotColor(type: string) {
  switch (type) {
    case "draft_created":
      return "bg-slate-400";

    case "issued":
      return "bg-violet-500";

    case "payment_received":
      return "bg-emerald-500";

    case "cancelled":
      return "bg-rose-500";

    default:
      return "bg-slate-500";
  }
}

function getStatusBadge(invoice: Invoice) {

  const isOverdue =
    invoice &&
    invoice.lifecycle !== "cancelled" &&
    invoice.paymentStatus !== "paid" &&
    new Date(invoice.dueDate) < new Date();

  if (isOverdue) {
    return {
      label: "OVERDUE",
      style: "bg-rose-500/10 text-rose-400 border border-rose-500/30",
    };
  }

  if (invoice.lifecycle === "draft") {
    return {
      label: "DRAFT",
      style: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
    };
  }

  if (invoice.lifecycle === "cancelled") {
    return {
      label: "CANCELLED",
      style: "bg-rose-500/10 text-rose-400 border border-rose-500/30",
    };
  }

  if (invoice.paymentStatus === "partial") {
    return {
      label: "PARTIAL",
      style: "bg-blue-500/10 text-blue-400 border border-blue-500/30",
    };
  }

  if (invoice.paymentStatus === "paid") {
    return {
      label: "PAID",
      style: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30",
    };
  }

  if (invoice.paymentStatus === "overdue") {
    return {
      label: "OVERDUE",
      style: "bg-rose-500/10 text-rose-400 border border-rose-500/30",
    };
  }

  return {
    label: "UNPAID",
    style: "bg-amber-500/10 text-amber-400 border border-amber-500/30",
  };
}

export default function InvoicePreviewPage() {
  const { showToast } = useToast();
  const { id } = useParams();
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("bank")
  const [paymentNote, setPaymentNote] = useState("")
  const [error, setError] = useState("")
  const router = useRouter();
  const { invoices, recordPayment } = useInvoices();

  const invoice = invoices.find((i) => i.id === id) as Invoice | undefined;
  const totalPaid =
    invoice?.payments?.reduce(
      (sum, p) => sum + p.amount,
      0
    ) || 0;

  const totalAmount = Number(
    String(invoice?.amount || "0").replace(/[^0-9.-]+/g, "")
  );

  const outstanding = Math.max(totalAmount - totalPaid, 0);
  const percentPaid = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

  let runningTotal = 0;

  const paymentMarkers =
    invoice?.payments?.map((p) => {
      runningTotal += p.amount
      return (runningTotal / totalAmount) * 100
    }) || []


  async function handleRecordPayment() {

    if (!invoice) return;
    const amount = Number(paymentAmount);

    if (amount > outstanding) {
      setError("Payment exceeds outstanding balance");
      return;
    }

    if (!amount || amount <= 0) return;

    await recordPayment(
      invoice.id,
      amount,
      paymentMethod,
      paymentNote
    );

    setPaymentAmount("");
    setShowPaymentModal(false);
    setPaymentNote("");
    setPaymentMethod("bank");

    showToast("Payment recorded successfully", "success");
  }

  if (!invoice) {
    return (
      <div className="text-center text-slate-400 py-20">
        Invoice not found.
      </div>
    );
  }

  const isOverdue =
    invoice.lifecycle !== "cancelled" &&
    invoice.paymentStatus !== "paid" &&
    new Date(invoice.dueDate) < new Date();

  const daysOverdue = isOverdue
    ? Math.floor(
      (Date.now() - new Date(invoice.dueDate).getTime()) /
      (1000 * 60 * 60 * 24)
    )
    : 0;

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
          <div className="relative group">
            <button
              disabled={outstanding === 0 || invoice.lifecycle === "cancelled"}
              onClick={() => {
                setError("")
                setShowPaymentModal(true)
              }}
              className={`px-4 py-2 rounded-xl text-sm font-medium
              ${outstanding === 0 || invoice.lifecycle === "cancelled"
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                  : "bg-emerald-500 hover:bg-emerald-600 text-black"
                }`}          >
              Record Payment
            </button>
            {invoice.lifecycle === "cancelled" && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition pointer-events-none">
                <div className="bg-[#0f1020] text-xs text-slate-300 px-3 py-2 rounded-lg shadow-lg whitespace-nowrap border border-white/10">
                  Payments disabled for cancelled invoices
                </div>
              </div>
            )}


          </div>

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
        <div>
          <div className="flex items-center gap-3 mb-2">

            <h1 className="text-3xl font-bold">Invoice</h1>

            {invoice.invoiceNumber && (
              <p className="text-sm text-gray-500 mt-1">
                #{invoice.invoiceNumber}
              </p>
            )}

            {/* Status Badge */}
            {(() => {
              const status = getStatusBadge(invoice);

              return (
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${status.style}`}
                >
                  {status.label}
                </span>
              );
            })()}

          </div>

          <p className="text-sm text-gray-500">{invoice.client}</p>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-10 mb-10">
          <div>
            <p className="text-xs uppercase text-gray-400 mb-2">Bill To</p>
            <p className="font-medium">{invoice.client}</p>
          </div>

          <div>
            <p className={`${isOverdue ? "text-rose-500 font-semibold" : ""}`}>
              {invoice.dueDate}
            </p>

            {isOverdue && (
              <p className="text-xs text-rose-500 mt-1">
                ⚠ {daysOverdue} day{daysOverdue > 1 ? "s" : ""} overdue
              </p>
            )}
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

        {/* Totals */}
        <div className="flex justify-end">

          <div className="w-60 space-y-3 text-sm">

            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹ {totalAmount.toLocaleString("en-IN")}</span>
            </div>

            <div className="flex justify-between">
              <span>Paid</span>
              <span className="text-emerald-600">
                ₹ {totalPaid.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Outstanding</span>
              <span className="text-amber-600">
                ₹ {outstanding.toLocaleString("en-IN")}
              </span>
            </div>


            <div className="flex justify-between font-semibold text-lg pt-2 border-t">
              <span>Total</span>
              <span>₹ {totalAmount.toLocaleString("en-IN")}</span>
            </div>

          </div>
        </div>

      </div>

      {/* Payment Progress */}
      <div className="mt-8 w-full max-w-4xl">

        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>Payment Progress</span>
          <span>{percentPaid}%</span>
        </div>

        <div className="relative w-full h-[6px] bg-white/10 rounded-full">

          {/* Paid portion */}
          <div
            className={`absolute left-0 top-0 h-[6px] rounded-full transition-all duration-700 ${percentPaid === 100
              ? "bg-emerald-400 animate-pulse"
              : "bg-emerald-500"
              }`}
            style={{ width: `${percentPaid}%` }}
          />

          {/* Payment markers */}
          {paymentMarkers.map((pos, i) => {

            const payment = invoice?.payments?.[i]
            const amount = payment?.amount || 0

            return (
              <div
                key={i}
                className="group absolute top-1/2"
                style={{
                  left: `${pos}%`,
                  transform: "translate(-50%, -50%)"
                }}
              >

                {/* marker */}
                <div className="w-3 h-3 bg-emerald-500 border-2 border-[#050509] rounded-full" />

                {/* tooltip */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition bg-[#0f1020] text-xs text-white px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">

                  ₹ {amount.toLocaleString("en-IN")}

                </div>

              </div>
            )
          })}

        </div>

      </div>

      {/* Payment History */}
      {invoice.payments && invoice.payments.length > 0 && (

        <div className="mt-8 bg-[#0f1020] border border-white/5 rounded-2xl p-6 w-full max-w-4xl">

          <h3 className="text-sm font-semibold text-slate-300 mb-4">
            Payments
          </h3>

          <div className="space-y-3">

            {invoice.payments.map((p: any, i: number) => {

              const date =
                p.date?.toDate
                  ? p.date.toDate()
                  : new Date(p.date);

              const methodLabel: Record<string, string> = {
                bank: "Bank Transfer",
                card: "Card Payment",
                upi: "UPI",
                cash: "Cash",
              };

              return (
                <div
                  key={i}
                  className="flex justify-between items-center text-sm"
                >

                  <div>
                    <div className="text-slate-300">
                      {methodLabel[p.method] || "Payment"}
                    </div>

                    {p.note && (
                      <div className="text-xs text-slate-500">
                        {p.note}
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <div className="text-emerald-400">
                      ₹ {p.amount.toLocaleString("en-IN")}
                    </div>

                    <div className="text-xs text-slate-500">
                      {date.toLocaleDateString()}
                    </div>
                  </div>

                </div>
              );
            })}

          </div>

        </div>

      )}

      {/* Activity Timeline */}
      <div className="mt-8 bg-[#0f1020] border border-white/5 rounded-2xl p-6 w-full max-w-4xl">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">
          Activity
        </h3>

        <div className="space-y-4">
          {(invoice?.activity ?? []).map((event: any, index: number) => {

            const label = formatActivity(event.type);

            const date = event.timestamp?.toDate
              ? event.timestamp.toDate()
              : new Date(event.timestamp);

            return (
              <div key={index} className="flex items-center gap-3 text-sm">

                {/* timeline dot */}
                <div
                  className={`w-2.5 h-2.5 rounded-full ${getDotColor(event.type)}`}
                />

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


      {
        showPaymentModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowPaymentModal(false)}
          >

            <div
              onClick={(e) => e.stopPropagation()}
              className="w-[420px] bg-[#0f1020] border border-white/10 rounded-2xl p-6 shadow-[0_0_40px_rgba(0,0,0,0.6)]"
            >

              <h2 className="text-lg font-semibold mb-4">
                Record Payment
              </h2>

              <p className="text-sm text-slate-400 mb-4">
                Enter the payment received for this invoice.
              </p>

              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-sm">
                  ₹
                </span>

                <input
                  type="number"
                  placeholder="Amount"
                  value={paymentAmount}
                  onChange={(e) => {
                    setPaymentAmount(e.target.value)
                    setError("")
                  }}
                  className="w-full pl-7 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {error && (
                <p className="text-xs text-rose-400 mt-2">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 mt-6">

                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 text-sm border border-white/10 rounded-lg hover:bg-white/5"
                >
                  Cancel
                </button>

                <button
                  onClick={handleRecordPayment}
                  className="px-4 py-2 text-sm bg-emerald-500 hover:bg-emerald-600 text-black rounded-lg font-semibold"
                >
                  Record Payment
                </button>

              </div>

            </div>
          </div>
        )
      }

    </div>
  );
}

