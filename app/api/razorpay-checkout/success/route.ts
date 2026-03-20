import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase";
import {
  collectionGroup,
  query,
  where,
  getDocs,
  updateDoc
} from "firebase/firestore";

export async function POST(req: Request) {
  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      invoiceId,
      amount
    } = await req.json();

    const paymentAmount = Number(amount || 0);

    /* 1️⃣ Verify signature */

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    console.log("Razorpay payment verified for invoice:", invoiceId);

    /* 2️⃣ Find invoice */

    const q = query(
      collectionGroup(db, "invoices"),
      where("invoiceNumber", "==", invoiceId)
    );

    const snap = await getDocs(q);

    if (snap.empty) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const docSnap = snap.docs[0];
    const docRef = docSnap.ref;
    const invoiceData = docSnap.data();

    /* 3️⃣ Existing payments */

    const existingPayments = invoiceData.payments || [];

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
      (sum: number, p: any) => sum + p.amount,
      0
    );

    const totalAmount = invoiceData.meta?.lineItems?.reduce(
      (sum: number, item: any) =>
        sum + item.qty * Number(item.rate || 0),
      0
    ) || 0;

    /* 6️⃣ Determine status */

    let status = "unpaid";

    if (totalPaid >= totalAmount) {
      status = "paid";
    } else if (totalPaid > 0) {
      status = "partial";
    }

    /* 7️⃣ Update Firestore */

    await updateDoc(docRef, {
      payments: newPayments,
      paymentStatus: status,
      paidAt: new Date(),
    });

    return NextResponse.json({
      success: true
    });

  } catch (error) {

    console.error("Razorpay verification error:", error);

    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}