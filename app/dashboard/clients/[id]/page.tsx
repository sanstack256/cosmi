"use client";

import { useParams } from "next/navigation";
import { useInvoices } from "@/app/providers/InvoiceProvider";

export default function ClientProfile() {
  const { id } = useParams();
  const { clients, invoices } = useInvoices();

  const client = clients.find((c) => c.id === id);

  const clientInvoices = invoices.filter(
    (inv) => inv.client === client?.name
  );

  if (!client) {
    return <div className="text-slate-400">Client not found</div>;
  }

  return (
    <div className="text-white">

      <h1 className="text-3xl font-semibold mb-6">
        {client.name}
      </h1>

      <div className="space-y-3">

        {clientInvoices.map((inv) => (
          <div
            key={inv.id}
            className="bg-[#0f1020] border border-white/5 rounded-xl p-4"
          >
            {inv.invoiceNumber} — ₹ {inv.amount}
          </div>
        ))}

      </div>

    </div>
  );
}