"use client";

import React from "react";
import InvoicePreview from "@/app/invoice-editor/components/invoice/InvoicePreview";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "sonner";
import { getCurrencySymbol, formatCurrency } from "@/app/utils/currency";
import { useParams, useSearchParams } from "next/navigation";




export default function PublicInvoicePage() {
    const params = useParams();
    const searchParams = useSearchParams();

    const publicId = params?.id as string;
    const token = searchParams.get("t");

    const rawId = params?.id;

    const id =
        typeof rawId === "string"
            ? rawId
            : Array.isArray(rawId)
                ? rawId[0]
                : "";

    const [showAllPayments, setShowAllPayments] = React.useState(false);
    const [invoice, setInvoice] = React.useState<any>(undefined);
    const [method, setMethod] = React.useState<"razorpay" | "paypal">("razorpay");
    const [processing, setProcessing] = React.useState(false);
    const [payAmount, setPayAmount] = React.useState("");

    const [authorized, setAuthorized] = React.useState(false);
    const [emailInput, setEmailInput] = React.useState("");
    const [authError, setAuthError] = React.useState("");

    React.useEffect(() => {
        if (!invoice) return;

        if (invoice.currency === "USD") {
            setMethod("paypal");
        } else {
            setMethod("razorpay");
        }
    }, [invoice]);

    // LOAD INVOICE
    React.useEffect(() => {
        if (!id) return;

        async function loadInvoice() {
            try {
                console.log("ID:", id);

                const pubSnap = await getDoc(doc(db, "publicInvoices", id));
                console.log("PUB EXISTS:", pubSnap.exists(), "ID:", id);

                if (!pubSnap.exists()) {
                    console.error("❌ Public link not found:", id);
                    setInvoice(null);
                    return;
                }

                const publicData = pubSnap.data();
                console.log("PUBLIC DATA:", publicData);

                // 🔐 TOKEN VALIDATION (CRITICAL)
                if (!token || publicData.token !== token) {
                    console.error("❌ Invalid token");

                    setInvoice(null); // triggers "Invoice not found"
                    return;
                }

                if (!publicData?.invoicePath) {
                    console.error("❌ invoicePath missing");
                    setInvoice(null);
                    return;
                }

                console.log("PATH:", publicData.invoicePath);

                const path = publicData.invoicePath.split("/") as [string, ...string[]];
                const invoiceRef = doc(db, ...path);
                const invoiceSnap = await getDoc(invoiceRef);

                console.log("INVOICE EXISTS:", invoiceSnap.exists());

                if (!invoiceSnap.exists()) {
                    setInvoice(null);
                    return;
                }

                setInvoice(invoiceSnap.data());

            } catch (err) {
                console.error("🔥 Firestore error:", err);
                setInvoice(null);
            }
        }

        loadInvoice();
    }, [id, token]);

    // LOAD RAZORPAY
    React.useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.async = true;
        document.body.appendChild(script);
    }, []);

    // 🔑 SAFE SYNC EFFECT
    React.useEffect(() => {
        if (!invoice) return;

        const lineItems = invoice.meta?.lineItems || [];

        const subtotal = lineItems.reduce(
            (sum: number, item: any) => sum + item.qty * Number(item.rate || 0),
            0
        );

        const payments = invoice.payments || [];

        const totalPaid = payments.reduce(
            (sum: number, p: any) => sum + p.amount,
            0
        );

        const remaining = Math.max(subtotal - totalPaid, 0);

        setPayAmount(remaining.toString());
    }, [invoice]);



    function verifyAccess() {
        const email = emailInput.trim().toLowerCase();

        const clientEmail = (invoice?.clientEmail || "").toLowerCase();
        const ownerEmail = (invoice?.company?.email || "").toLowerCase();

        if (email === clientEmail || email === ownerEmail) {
            setAuthorized(true);
            setAuthError("");
        } else {
            setAuthError("You are not authorized to view this invoice");
        }
    }



    // LOADING STATE
    if (invoice === undefined) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-[#050509] via-[#070712] to-[#050509] flex items-center justify-center">
                <div className="animate-pulse space-y-4 w-[300px]">
                    <div className="h-6 bg-white/10 rounded w-1/2 mx-auto" />
                    <div className="h-4 bg-white/10 rounded w-full" />
                    <div className="h-4 bg-white/10 rounded w-5/6" />
                </div>
            </div>
        );
    }

    if (invoice === null) {
        return (
            <div className="min-h-screen flex items-center justify-center text-white">
                Invoice not found
            </div>
        );
    }


if (!authorized && invoice) {
    return (
        <div className="min-h-screen bg-[#050509] flex items-center justify-center relative text-white">

            {/* BACKGROUND GLOW */}
            <div className="absolute w-[700px] h-[700px] bg-indigo-600/20 blur-[120px] rounded-full" />

            {/* MODAL */}
            <div className="relative z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_30px_100px_rgba(0,0,0,0.9)]">

                {/* TITLE */}
                <div className="text-xl font-semibold mb-2">
                    Secure Invoice Access
                </div>

                <div className="text-sm text-white/50 mb-6">
                    Enter your email to view this invoice
                </div>

                {/* INPUT */}
                <input
                    type="email"
                    placeholder="you@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />

                {/* ERROR */}
                {authError && (
                    <div className="text-red-400 text-sm mt-3">
                        {authError}
                    </div>
                )}

                {/* BUTTON */}
                <button
                    onClick={verifyAccess}
                    className="w-full mt-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-all font-medium"
                >
                    Continue
                </button>

            </div>
        </div>
    );
}


    const currency = invoice.currency || "INR";

    const formatNumber = (value: number) =>
        formatCurrency(value, currency);

    const currencySymbol = getCurrencySymbol(currency);

    // CALCULATIONS
    const lineItems = invoice.meta?.lineItems || [];

    const subtotal = lineItems.reduce(
        (sum: number, item: any) => sum + item.qty * Number(item.rate || 0),
        0
    );

    const taxAmount = 0;
    const total = subtotal + taxAmount;

    const payments = invoice.payments || [];

    const totalPaid = payments.reduce(
        (sum: number, p: any) => sum + p.amount,
        0
    );


    const remaining = Math.max(total - totalPaid, 0);
    const isFullyPaid = remaining === 0;
    const progress = total > 0 ? (totalPaid / total) * 100 : 0;

    const numericAmount = Math.floor(Number(payAmount || 0));

    const isValidAmount =
        numericAmount > 0 && numericAmount <= remaining;


    // RAZORPAY
    async function startRazorpayPayment() {

        if (processing || !isValidAmount || isFullyPaid) return;

        try {
            setProcessing(true);

            const res = await fetch("/api/razorpay-checkout/order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: numericAmount, invoiceId: id }),
            });

            const data = await res.json();

            if (!data.orderId) {
                toast.error("Failed to start payment");
                setProcessing(false);
                return;
            }

            const options = {
                key: data.key,
                amount: numericAmount * 100,
                currency,
                name: "Cosmi",
                description: `Invoice ${id}`,
                order_id: data.orderId,
                modal: {
                    ondismiss: function () {
                        setProcessing(false);
                    }
                },
                handler: async function (response: any) {
                    const verify = await fetch("/api/razorpay-checkout/success", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            invoiceId: id,
                            amount: numericAmount,
                        }),
                    });

                    if (!verify.ok) {
                        toast.error("Payment verification failed");
                        setProcessing(false);
                        return;
                    }

                    toast.success("Payment successful 🎉", {
                        description: `₹${numericAmount.toLocaleString("en-IN")} received`,
                    });


                    setProcessing(false);

                    setTimeout(() => window.location.reload(), 2000);
                },
                theme: { color: "#6366f1" },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
        } catch (err) {
            toast.error("Payment failed");
            setProcessing(false);
        }
    }

    return (
        <div className="min-h-screen bg-[#050509] relative text-white">
            {/* BACKGROUND */}
            <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-indigo-600/20 blur-[140px] rounded-full" />

            <div className="relative z-10 px-6 py-16">
                <div className="max-w-7xl mx-auto grid lg:grid-cols-[1fr_420px] gap-12 items-start">

                    {/* LEFT */}
                    <div className="relative flex justify-center">
                        <div className="absolute inset-0 bg-white/5 blur-xl rounded-3xl opacity-60" />

                        <div className="relative w-full max-w-[720px]">
                            <InvoicePreview
                                id={id}
                                client={invoice.client}
                                date={invoice.date}
                                dueDate={invoice.dueDate}
                                clientAddress={invoice.clientAddress}
                                status={invoice.paymentStatus}
                                lineItems={lineItems}
                                subtotal={subtotal}
                                taxAmount={taxAmount}
                                total={total}
                                currency={invoice.currency}
                                notes={invoice.meta?.notes || ""}
                                company={invoice.company}
                            />
                        </div>
                    </div>


                    {/* RIGHT */}
                    <div className="lg:sticky lg:top-16 self-start flex justify-center">
                        <div className="w-full max-w-[420px] bg-white/5 backdrop-blur-xl text-white rounded-3xl border border-white/10 shadow-[0_30px_100px_rgba(0,0,0,0.9)] p-8 transition-all duration-300 ease-out">

                            {!isFullyPaid ? (
                                <>
                                    {/* HEADER */}
                                    <div className="mb-8">
                                        <div className="text-xs uppercase tracking-widest text-white/40">
                                            Amount due
                                        </div>

                                        <div className="text-5xl lg:text-6xl font-bold mt-3 tracking-tight transition-all duration-300 ease-out">
                                            {currencySymbol}{formatNumber(remaining)}
                                        </div>

                                        <div className="text-sm text-white/60 mt-3">
                                            Invoice #{id}
                                        </div>
                                    </div>

                                    {/* INPUT */}
                                    <div className="mb-6">
                                        <label className="text-xs text-white/40 block mb-2">
                                            Amount to pay
                                        </label>

                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                                                {currencySymbol}
                                            </span>

                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                placeholder="Enter amount"
                                                value={payAmount}
                                                disabled={processing}
                                                onFocus={() => {
                                                    if (payAmount === "0") setPayAmount("");
                                                }}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, "");
                                                    setPayAmount(val === "" ? "" : String(Number(val)));
                                                }}
                                                className="w-full pl-7 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all duration-200"
                                            />
                                        </div>

                                        {/* ERROR */}
                                        {!isValidAmount && payAmount !== "" && (
                                            <div className="text-xs text-red-400 mt-2">
                                                Enter a valid amount
                                            </div>
                                        )}

                                        <div className="text-xs text-white/40 mt-2">
                                            Remaining: {currencySymbol}{formatNumber(remaining)}
                                        </div>

                                        <div className="text-xs text-white/40 mt-1">
                                            After payment: {currencySymbol}{formatNumber(Math.max(remaining - numericAmount, 0))}
                                        </div>
                                    </div>

                                    {/* METHODS */}
                                    <div className="mb-6">
                                        <div className="flex bg-white/5 rounded-xl p-1 relative">

                                            {/* Sliding background */}
                                            <div
                                                className={`absolute top-1 bottom-1 rounded-lg bg-white transition-all duration-300 ease-out
        ${invoice.currency === "USD"
                                                        ? "w-1/2"
                                                        : "w-full"
                                                    }
        ${invoice.currency === "USD"
                                                        ? method === "razorpay"
                                                            ? "left-1"
                                                            : "left-1/2"
                                                        : "left-1"
                                                    }
      `}
                                            />

                                            {/* Razorpay */}
                                            <button
                                                onClick={() => !processing && setMethod("razorpay")}
                                                className={`relative z-10 flex-1 py-2 text-sm font-medium transition-colors duration-300
        ${method === "razorpay" ? "text-black" : "text-white/60"}
      `}
                                            >
                                                Card / UPI
                                            </button>

                                            {/* PayPal (ONLY USD) */}
                                            {invoice.currency === "USD" && (
                                                <button
                                                    onClick={() => !processing && setMethod("paypal")}
                                                    className={`relative z-10 flex-1 py-2 text-sm font-medium transition-colors duration-300
          ${method === "paypal" ? "text-black" : "text-white/60"}
        `}
                                                >
                                                    PayPal
                                                </button>
                                            )}

                                        </div>
                                    </div>

                                    {/* CTA */}

                                    {/* Razorpay */}
                                    {method === "razorpay" && currency === "INR" && (
                                        <button
                                            disabled={processing || !isValidAmount}
                                            onClick={startRazorpayPayment}
                                            className={`w-full py-4 mt-6 rounded-2xl text-lg font-semibold text-white transition-all duration-200
${processing || !isValidAmount
                                                    ? "bg-indigo-400 cursor-not-allowed"
                                                    : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-xl active:scale-[0.97]"
                                                }`}
                                        >
                                            {processing
                                                ? "Processing..."
                                                : `Pay ${currencySymbol}${numericAmount ? formatNumber(numericAmount) : "0"}`
                                            }
                                        </button>
                                    )}

                                    {/* PayPal */}
                                    {method === "paypal" && invoice.currency === "USD" && !processing && isValidAmount && (
                                        <div className="mt-6 animate-fade-in">
                                            <PayPalButtons
                                                style={{ layout: "vertical" }}

                                                createOrder={async () => {
                                                    if (!isValidAmount) {
                                                        toast.error("Invalid payment amount");
                                                        throw new Error("Invalid amount");
                                                    }

                                                    const res = await fetch("/api/paypal-checkout", {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({
                                                            amount: numericAmount,
                                                            invoiceId: id,
                                                            currency: invoice.currency,
                                                        }),
                                                    });

                                                    const data = await res.json();

                                                    if (!data.orderID) {
                                                        toast.error("Failed to initialize PayPal");
                                                        throw new Error("No orderID");
                                                    }

                                                    return data.orderID;
                                                }}

                                                onApprove={async (data) => {
                                                    if (processing) return;
                                                    setProcessing(true);

                                                    const capture = await fetch("/api/paypal-capture", {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({
                                                            orderID: data.orderID,
                                                            invoiceId: id,
                                                        }),
                                                    });

                                                    if (!capture.ok) {
                                                        toast.error("Payment verification failed");
                                                        setProcessing(false);
                                                        return;
                                                    }

                                                    toast.success("Payment successful 🎉", {
                                                        description: `${currencySymbol}${formatNumber(numericAmount)} received`,
                                                    });

                                                    setProcessing(false);

                                                    setTimeout(() => {
                                                        window.location.reload();
                                                    }, 2000);
                                                }}

                                                onError={() => {
                                                    toast.error("PayPal payment failed");
                                                    setProcessing(false);
                                                }}
                                            />
                                        </div>
                                    )}

                                    {/* PAYMENT HISTORY */}
                                    {payments.length > 0 && (
                                        <div className="mt-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="text-xs uppercase tracking-widest text-white/40">
                                                    Payment history
                                                </div>

                                                {payments.length > 2 && (
                                                    <button
                                                        onClick={() => setShowAllPayments(!showAllPayments)}
                                                        className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                                                    >
                                                        {showAllPayments ? "Show less" : "View all"}
                                                    </button>
                                                )}
                                            </div>

                                            <div
                                                className={`space-y-3 ${showAllPayments
                                                    ? "max-h-[220px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10"
                                                    : ""
                                                    }`}
                                            >
                                                {[...payments]
                                                    .sort((a: any, b: any) => {
                                                        const da = new Date(
                                                            a.date?.toDate?.() || a.date || a.createdAt?.toDate?.() || a.createdAt || 0
                                                        ).getTime();

                                                        const db = new Date(
                                                            b.date?.toDate?.() || b.date || b.createdAt?.toDate?.() || b.createdAt || 0
                                                        ).getTime();

                                                        return db - da;
                                                    })
                                                    .slice(0, showAllPayments ? payments.length : 2)
                                                    .map((p: any, i: number) => {
                                                        const d =
                                                            p.date?.toDate?.() ||
                                                            p.date ||
                                                            p.createdAt?.toDate?.() ||
                                                            p.createdAt;

                                                        return (
                                                            <div
                                                                key={i}
                                                                className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3"
                                                            >
                                                                <div>
                                                                    <div className="text-sm font-medium">
                                                                        {currencySymbol}{formatNumber(Number(p.amount || 0))}
                                                                    </div>

                                                                    <div className="text-xs text-white/40">
                                                                        {d
                                                                            ? new Date(d).toLocaleDateString("en-IN", {
                                                                                day: "2-digit",
                                                                                month: "short",
                                                                                year: "numeric",
                                                                            })
                                                                            : "—"}
                                                                    </div>
                                                                </div>

                                                                <div className="text-xs text-white/40 capitalize">
                                                                    {p.method || "online"}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                            </div>
                                        </div>
                                    )}

                                    {/* TRUST */}
                                    <div className="mt-6 text-center text-xs text-white/40 space-y-1">
                                        <div>🔒 Secure payment powered by Razorpay & PayPal</div>
                                        <div>No data is stored on Cosmi</div>
                                    </div>

                                </>
                            ) : (
                                <div className="text-center py-10">

                                    <div className="text-sm text-green-400 mb-2">
                                        Payment complete
                                    </div>

                                    <div className="text-3xl font-semibold text-white animate-pulse">
                                        {currencySymbol}{formatNumber(total)}
                                    </div>

                                    <div className="text-sm text-white/50 mt-2">
                                        This invoice has been fully settled
                                    </div>

                                </div>
                            )}

                        </div>
                    </div>
                </div>

            </div>
        </div>


    )
}
