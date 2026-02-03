// app/pricing/page.tsx
"use client";

import Link from "next/link";

export default function PricingPage() {
  async function razorpayCheckout(plan: "pro" | "business") {
    const amount = plan === "pro" ? 1200 * 100 : 2900 * 100;

    const res = await fetch("/api/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        plan,
        userId: "temp-user", // replace with real user later
      }),
    });

    const order = await res.json();

    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      amount: order.amount,
      currency: order.currency,
      name: "Cosmi",
      description: plan === "pro" ? "Cosmi Pro Plan" : "Cosmi Business Plan",
      order_id: order.id,
      handler: async function (response: any) {
  await fetch("/api/razorpay/success", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: "temp-user", // replace with real user
      plan,
      paymentId: response.razorpay_payment_id,
      orderId: response.razorpay_order_id,
    }),
  });

  window.location.href = "/dashboard?payment=success";
},

      theme: { color: "#6366f1" },
    };

    // @ts-ignore
    const rzp = new window.Razorpay(options);
    rzp.open();
  }

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-5xl text-white">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent <span className="text-indigo-400">Pricing</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Start for free. Upgrade only when you’re ready to scale your invoicing.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Free */}
          <div className="group flex flex-col bg-white/5 border border-white/10 rounded-2xl p-8 text-center transition-all duration-300 hover:border-indigo-400/40 hover:shadow-[0_0_25px_rgba(99,102,241,0.35)] hover:-translate-y-1">
            <h2 className="text-xl font-semibold mb-2">Free</h2>
            <p className="text-gray-400 mb-6">For getting started</p>

            <div className="text-4xl font-bold mb-6">
              ₹0<span className="text-lg font-normal text-gray-400">/mo</span>
            </div>

            <ul className="space-y-3 text-gray-300 mb-8">
              <li>✔ Create invoices</li>
              <li>✔ Basic templates</li>
              <li>✔ PDF download</li>
            </ul>

            <Link
              href="/signin"
              className="mt-auto px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              Get Started
            </Link>
          </div>

          {/* Pro */}
          <div className="group flex flex-col bg-indigo-600/10 border border-indigo-500/40 rounded-2xl p-8 text-center transition-all duration-300 hover:shadow-[0_0_35px_rgba(99,102,241,0.55)] hover:-translate-y-1">
            <h2 className="text-xl font-semibold mb-2">Pro</h2>
            <p className="text-gray-300 mb-6">For freelancers & creators</p>

            <div className="text-4xl font-bold mb-6">
              ₹1200<span className="text-lg font-normal text-gray-300">/mo</span>
            </div>

            <ul className="space-y-3 text-gray-200 mb-8">
              <li>✔ Everything in Free</li>
              <li>✔ Unlimited invoices</li>
              <li>✔ Custom branding</li>
              <li>✔ AI assistance (soon)</li>
            </ul>

            <button
              onClick={() => razorpayCheckout("pro")}
              className="mt-auto px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition font-semibold"
            >
              Upgrade to Pro
            </button>
          </div>

          {/* Business */}
          <div className="group flex flex-col bg-white/5 border border-white/10 rounded-2xl p-8 text-center transition-all duration-300 hover:border-indigo-400/40 hover:shadow-[0_0_25px_rgba(99,102,241,0.35)] hover:-translate-y-1">
            <h2 className="text-xl font-semibold mb-2">Business</h2>
            <p className="text-gray-400 mb-6">For small teams</p>

            <div className="text-4xl font-bold mb-6">
              ₹2900<span className="text-lg font-normal text-gray-400">/mo</span>
            </div>

            <ul className="space-y-3 text-gray-300 mb-8">
              <li>✔ Everything in Pro</li>
              <li>✔ Multiple companies</li>
              <li>✔ Team access</li>
              <li>✔ Priority support</li>
            </ul>

            <button
              onClick={() => razorpayCheckout("business")}
              className="mt-auto px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 transition"
            >
              Upgrade to Business
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-400 text-sm">
          <Link href="/" className="hover:text-white transition">
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
