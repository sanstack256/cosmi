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
  rate: number;
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
}: Props) {
  return (
    <div className="col-span-12 lg:col-span-8">
      <div className="rounded-2xl bg-white/3 p-6 text-slate-200">
        <div className="max-w-3xl mx-auto bg-white rounded-lg p-6 text-black shadow">
          {/* HEADER */}
          <header className="flex justify-between">
            <div>
              <h3 className="text-lg font-semibold">Invoice</h3>

              {company?.name && (
                <div className="text-xs text-slate-500 mt-1">
                  <div className="font-semibold text-slate-700">
                    {company.name}
                  </div>
                  {company.address && <div>{company.address}</div>}
                  {company.gstin && <div>GSTIN: {company.gstin}</div>}
                </div>
              )}

              <div className="text-slate-600 text-sm mt-2">
                {client || "Client name"}
              </div>
            </div>

            <div className="text-right text-sm">
              <div>
                <span className="text-slate-600">Invoice #</span>{" "}
                <strong>{id}</strong>
              </div>

              <div className="text-slate-600">
                {formatDateFns(new Date(date), "dd MMM yyyy")}
              </div>
            </div>
          </header>

          {/* TABLE */}
          <table className="w-full mt-6 text-sm">
            <thead>
              <tr className="text-slate-600 border-b border-slate-300">
                <th className="text-left pb-2">Description</th>
                <th className="text-left pb-2">Qty</th>
                <th className="text-left pb-2">Rate</th>
                <th className="text-right pb-2">Amount</th>
              </tr>
            </thead>

            <tbody>
              {lineItems.map((li, i) => (
                <tr key={i} className="border-t border-slate-200">
                  <td className="py-3">{li.desc}</td>
                  <td>{li.qty}</td>
                  <td>{formatCurrencyINR(li.rate)}</td>
                  <td className="text-right">
                    {formatCurrencyINR(li.qty * li.rate)}
                  </td>
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr>
                <td />
                <td />
                <td className="pt-3 text-slate-600">Subtotal</td>
                <td className="pt-3 text-right font-semibold">
                  {formatCurrencyINR(subtotal)}
                </td>
              </tr>

              <tr>
                <td />
                <td />
                <td className="pt-3 text-slate-600">Tax</td>
                <td className="pt-3 text-right">
                  {formatCurrencyINR(taxAmount)}
                </td>
              </tr>

              <tr>
                <td />
                <td />
                <td className="pt-3 text-slate-600">Total</td>
                <td className="pt-3 text-right text-lg font-bold">
                  {formatCurrencyINR(total)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* NOTES */}
          {notes && (
            <div className="mt-6 bg-slate-100 p-3 rounded text-sm">
              {notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
