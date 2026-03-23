import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      invoiceId,
      userId,
      amount,
    } = body || {};

    console.log("ORDER ID:", razorpay_order_id);
    console.log("PAYMENT ID:", razorpay_payment_id);
    console.log("SIGNATURE:", razorpay_signature);


    // 🛑 Validate input early
    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !invoiceId ||
      !userId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const paymentAmount = Number(amount || 0);

    /* 1️⃣ Verify signature */

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.error("❌ Signature mismatch");
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    console.log("✅ Razorpay payment verified:", invoiceId);

    /* 2️⃣ Fetch invoice (direct path, no queries) */

    const invoiceRef = db.doc(`users/${userId}/invoices/${invoiceId}`);
    const invoiceSnap = await invoiceRef.get();

    if (!invoiceSnap.exists) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const invoiceData = invoiceSnap.data();

    /* 3️⃣ Existing payments */

    const existingPayments = invoiceData?.payments || [];

    /* 4️⃣ Add new payment */

    const newPayments = [
      ...existingPayments,
      {
        amount: paymentAmount,
        method: "razorpay",
        date: new Date(),
      },
    ];

    /* 5️⃣ Calculate totals */

    const totalPaid = newPayments.reduce(
      (sum: number, p: any) => sum + Number(p.amount || 0),
      0
    );

    const totalAmount =
      invoiceData?.meta?.lineItems?.reduce(
        (sum: number, item: any) =>
          sum + item.qty * Number(item.rate || 0),
        0
      ) || 0;

    /* 6️⃣ Determine status */

    let status: "unpaid" | "partial" | "paid" = "unpaid";

    if (totalPaid >= totalAmount) {
      status = "paid";
    } else if (totalPaid > 0) {
      status = "partial";
    }

    /* 7️⃣ Update Firestore */

    await invoiceRef.update({
      payments: newPayments,
      paymentStatus: status,
      paidAt: new Date(),
    });

    /* 8️⃣ (Optional but recommended) Auto-close public link */

    try {
      const publicQuery = await db
        .collection("publicInvoices")
        .where("invoicePath", "==", `users/${userId}/invoices/${invoiceId}`)
        .limit(1)
        .get();

      if (!publicQuery.empty) {
        const pubDoc = publicQuery.docs[0].ref;

        await pubDoc.update({
          isActive: false,
          closedAt: new Date(),
        });

        console.log("🔒 Public link auto-closed");
      }
    } catch (err) {
      console.error("⚠️ Failed to auto-close link:", err);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("🔥 Razorpay verification error:", error);

    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}