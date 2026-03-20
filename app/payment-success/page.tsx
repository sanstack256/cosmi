"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PaymentSuccess() {

  const params = useSearchParams();
  const router = useRouter();

  const orderId = params.get("token");
  const invoiceId = params.get("invoiceId");

  useEffect(() => {

    async function capturePayment() {

      const res = await fetch("/api/paypal-capture", {
        method: "POST",
        body: JSON.stringify({
          orderId,
          invoiceId
        })
      });

      const data = await res.json();

      if (data.success) {
        router.push(`/invoice/${invoiceId}`);
      }

    }

    capturePayment();

  }, [orderId, invoiceId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-white bg-[#050509]">
      Processing payment...
    </div>
  );
}