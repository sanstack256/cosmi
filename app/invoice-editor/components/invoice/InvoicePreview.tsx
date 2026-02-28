"use client";

import React from "react";
import { format as formatDateFns } from "date-fns";

/* ------------------------------------------
   Types
------------------------------------------- */

type Company = {
  name?: string;
  address?: string;
  gstin?: string;
  logoURL?: string;
};

type LineItem = {
  desc: string;
  qty: number;
  rate: string | number; // ✅ support string from editor
};

/* ------------------------------------------
   Helpers
------------------------------------------- */

function formatCurrencyINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function safeFormatDate(date: string) {
  if (!date) return "";
  try {
    return formatDateFns(new Date(date), "dd MMM yyyy");
  } catch {
    return date;
  }
}

/* ------------------------------------------
   Component
------------------------------------------- */

type Props = {
  id: string;
  client: string;
  date: string;
  lineItems: LineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  notes: string;
  company?: Company;
  plan?: string;
};

export default function InvoicePreview({
  id,
  client,
  date,
  lineItems,
  subtotal,
  taxAmount,
  total,
  notes,
  company,
  plan,
}: Props) {


  return (
  <div className="w-full  flex items-center justify-center py-10">

    {/* SCALE WRAPPER */}
<div className="origin-top scale-[0.78] xl:scale-[0.85] 2xl:scale-[0.9]">


      {/* A4 PAPER */}
<div className="bg-white w-[794px] min-h-[1123px] rounded-xl shadow-[0_30px_80px_rgba(0,0,0,0.4)] p-12 flex flex-col">

        {/* ===== HEADER ===== */}
        <header className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
              INVOICE
            </h1>

            {company?.name && (
              <div className="mt-4 text-sm text-slate-800">
                <div className="font-semibold text-slate-900">
                  {company.name}
                </div>
                {company.address && <div>{company.address}</div>}
                {company.gstin && <div>GSTIN: {company.gstin}</div>}
              </div>
            )}

            <div className="mt-8 text-sm text-slate-900">
              <div className="font-semibold">Bill To</div>
              <div className="mt-1">{client || "Client Name"}</div>
            </div>
          </div>

          <div className="text-right text-sm text-slate-700">
            {company?.logoURL && (
              <img
                src={company.logoURL}
                alt="Company Logo"
                className="h-16 mb-4 ml-auto object-contain"
              />
            )}

            <div>
              <span className="text-slate-500">Invoice # </span>
              <strong>{id}</strong>
            </div>

            <div className="mt-1 text-slate-500">
              {safeFormatDate(date)}
            </div>
          </div>
        </header>

        {/* ===== TABLE ===== */}
        <table className="w-full mt-12 text-sm border-collapse">
          <thead>
            <tr className="border-b border-slate-300 text-xs uppercase tracking-wide text-slate-500">
              <th className="text-left pb-4">Description</th>
              <th className="text-left pb-4">Qty</th>
              <th className="text-left pb-4">Rate</th>
              <th className="text-right pb-4">Amount</th>
            </tr>
          </thead>

          <tbody>
            {lineItems.map((li, i) => {
              const rateNumber = Number(li.rate || 0);
              const amount = li.qty * rateNumber;

              return (
                <tr key={i} className="border-b border-slate-200">
  <td className="py-4 text-slate-900">
    {li.desc || "—"}
  </td>

  <td className="text-slate-900">
    {li.qty}
  </td>

  <td className="text-slate-900">
    {formatCurrencyINR(rateNumber)}
  </td>

  <td className="text-right font-medium text-slate-900">
    {formatCurrencyINR(amount)}
  </td>
</tr>

              );
            })}
          </tbody>
        </table>

        {/* Push totals to bottom */}
        <div className="mt-auto">

          {/* ===== TOTALS ===== */}
          <div className="flex justify-end mt-12">
            <div className="w-80 text-sm">
              <div className="flex justify-between py-2 text-slate-800">
                <span>Subtotal</span>
                <span>{formatCurrencyINR(subtotal)}</span>
              </div>

              <div className="flex justify-between py-2 text-slate-800">
                <span>Tax</span>
                <span>{formatCurrencyINR(taxAmount)}</span>
              </div>

              <div className="flex justify-between py-4 border-t border-slate-400 text-xl font-semibold text-slate-900">
                <span>Total</span>
                <span>{formatCurrencyINR(total)}</span>
              </div>
            </div>
          </div>

          {/* ===== NOTES ===== */}
          {notes && (
            <div className="mt-12 text-sm">
              <div className="font-semibold mb-2">Notes</div>
              <div className="border border-slate-300 rounded-md p-4">
                {notes}
              </div>
            </div>
          )}

          {/* ===== FOOTER ===== */}
          {plan === "free" && (
            <footer className="mt-16 text-xs text-slate-400 text-center">
              Generated by Cosmi
            </footer>
          )}

        </div>

      </div>
    </div>
  </div>
);

}