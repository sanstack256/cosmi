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



function safeFormatDate(date: string) {
  if (!date) return "";
  try {
    return formatDateFns(new Date(date), "dd MMM yyyy");
  } catch {
    return date;
  }
}


function formatCurrency(value: number, currency?: string) {
  return new Intl.NumberFormat(
    currency === "USD" ? "en-US" : "en-IN",
    {
      style: "currency",
      currency: currency || "INR",
      maximumFractionDigits: 2,
    }
  ).format(value);
}

/* ------------------------------------------
   Component
------------------------------------------- */

type Props = {
  id: string;
  client: string;
  date: string;
  dueDate?: string
  clientAddress?: string
  lineItems: LineItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  notes: string;
  company?: Company;
  plan?: string;
  payments?: any[];
  discount?: number;
  currency?: string;
  status?: string;
};

export default function InvoicePreview({
  id,
  client,
  date,
  dueDate,
  clientAddress,
  lineItems,
  subtotal,
  taxAmount,
  total,
  notes,
  company,
  plan,
  discount,
  status,
  currency,
  payments,
}: Props) {


  const safeSubtotal = Number(subtotal || 0);
  const safeTaxAmount = Number(taxAmount || 0);
  const safeTotal = Number(total || 0);
  const safeDiscount = Number(discount || 0);


  return (
    <div className="w-full flex items-center justify-center">

      {/* SCALE WRAPPER */}
      <div className="scale-container origin-center scale-[0.78] xl:scale-[0.85] 2xl:scale-[0.9]">


        {/* A4 PAPER */}
        <div className="invoice-paper bg-white w-[794px] min-h-[1123px] p-12 flex flex-col">

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

                <div className="mt-1">
                  {client || "Client Name"}
                </div>

                {clientAddress && (
                  <div className="text-slate-600 mt-1 whitespace-pre-line">
                    {clientAddress}
                  </div>
                )}
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

              <div className="space-y-1 text-right text-sm text-slate-700">

                <div>
                  <span className="text-slate-500">Invoice # </span>
                  <strong>{id}</strong>
                </div>



                <div>
                  <span className="text-slate-500">Issue Date: </span>
                  {safeFormatDate(date)}
                </div>

                {dueDate && (
                  <div>
                    <span className="text-slate-500">Due Date: </span>
                    {safeFormatDate(dueDate)}
                  </div>
                )}

              </div>
            </div>
          </header>

          {/* ===== TABLE ===== */}
          <table className="w-full mt-12 text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-300 text-xs uppercase tracking-wide text-slate-500">
                <th className="text-left pb-4 w-[50%]">Description</th>
                <th className="text-center pb-4 w-[10%]">Qty</th>
                <th className="text-right pb-4 w-[20%]">Rate</th>
                <th className="text-right pb-4 w-[20%]">Amount</th>
              </tr>
            </thead>

            <tbody>

              {lineItems.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    No line items yet
                  </td>
                </tr>
              )}

              {lineItems.map((li, i) => {
                const rateNumber = Number(li.rate || 0);
                const amount = li.qty * rateNumber;

                return (
                  <tr key={i} className="border-b border-slate-200 last:border-none">
                    <td className="py-4 pr-4 text-slate-900">
                      {li.desc || "—"}
                    </td>

                    <td className="text-center text-slate-900">
                      {li.qty}
                    </td>

                    <td className="text-right text-slate-900">
                      {formatCurrency(rateNumber, currency)}
                    </td>

                    <td className="text-right text-slate-900">
                      {formatCurrency(amount, currency)}
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
              <div className="w-80 text-sm border border-slate-300 rounded-lg p-4">
                <div className="flex justify-between py-2 text-slate-800">
                  <span>Subtotal</span>
                  <span>{formatCurrency(safeSubtotal, currency)}</span>
                </div>

                <div className="flex justify-between py-2 text-slate-800">
                  <span>Tax</span>
                  <span>{formatCurrency(safeTaxAmount, currency)}</span>
                </div>

                {discount ? (
                  <div className="flex justify-between py-2 text-slate-800">
                    <span>Discount</span>
                    <span>-{formatCurrency(safeDiscount, currency)}</span>
                  </div>
                ) : null}

                <div className="flex justify-between pt-4 mt-3 border-t border-slate-400 text-xl font-semibold text-slate-900">
                  <span>Total</span>
                  <span>{formatCurrency(safeTotal, currency)}</span>
                </div>


              </div>
            </div>

            {/* ===== NOTES ===== */}
            {notes && (
              <div className="mt-12 text-sm">
                <div className="font-semibold mb-2 text-slate-800">Notes</div>
                <div className="border border-slate-300 rounded-md p-4 text-slate-800 leading-relaxed">
                  {notes}
                </div>
              </div>
            )}

            {/* ===== PAYMENT TERMS ===== */}
            <div className="mt-12 text-sm text-slate-700">
              <div className="font-semibold mb-2">Payment Terms</div>

              <div className="border border-slate-300 rounded-md p-4">
                Payment is due within 15 days unless otherwise agreed.
              </div>
            </div>

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