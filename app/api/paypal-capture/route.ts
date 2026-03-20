import { NextResponse } from "next/server";
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
    const body = await req.json();

    const orderId = body.orderID;
    const invoiceId = body.invoiceId;

    if (!orderId || !invoiceId) {
      return NextResponse.json(
        { error: "Missing orderID or invoiceId" },
        { status: 400 }
      );
    }

    const CLIENT_ID = process.env.PAYPAL_CLIENT_ID!;
    const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET!;

    /* 1️⃣ Get PayPal access token */

    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

    const tokenRes = await fetch(
      "https://api-m.sandbox.paypal.com/v1/oauth2/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "grant_type=client_credentials"
      }
    );

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.json(
        { error: "Failed to get PayPal access token" },
        { status: 500 }
      );
    }

    /* 2️⃣ Capture payment */

    const captureRes = await fetch(
      `https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    const captureData = await captureRes.json();

    console.log("PAYPAL CAPTURE:", captureData);

    /* 3️⃣ Extract payment safely */

    const capture =
      captureData.purchase_units?.[0]?.payments?.captures?.[0];

    if (!capture) {
      return NextResponse.json(
        { error: "Invalid PayPal capture response" },
        { status: 400 }
      );
    }

    const currency = capture.amount?.currency_code;
    const value = capture.amount?.value;

    const paymentAmount = Number(value);

    /* 🔥 STRONG SAFETY CHECK */

    if (currency !== "INR") {
      console.error("Currency mismatch:", currency);

      return NextResponse.json(
        { error: "Currency mismatch. Expected INR." },
        { status: 400 }
      );
    }

    if (!paymentAmount || paymentAmount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment amount" },
        { status: 400 }
      );
    }

    /* 4️⃣ Find invoice */

    const q = query(
      collectionGroup(db, "invoices"),
      where("invoiceNumber", "==", invoiceId.toUpperCase())
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

    /* 5️⃣ Build payment history */

    const existingPayments = invoiceData.payments || [];

    const newPayments = [
      ...existingPayments,
      {
        amount: paymentAmount, // ✅ REAL INR VALUE
        method: "paypal",
        date: new Date(),
      },
    ];

    /* 6️⃣ Calculate totals */

    const totalPaid = newPayments.reduce(
      (sum: number, p: any) => sum + Number(p.amount || 0),
      0
    );

    const totalAmount =
      invoiceData.meta?.lineItems?.reduce(
        (sum: number, item: any) =>
          sum + item.qty * Number(item.rate || 0),
        0
      ) || 0;

    /* 7️⃣ Determine status */

    let status = "unpaid";

    if (totalPaid >= totalAmount) {
      status = "paid";
    } else if (totalPaid > 0) {
      status = "partial";
    }

    /* 8️⃣ Update Firestore */

    await updateDoc(docRef, {
      payments: newPayments,
      paymentStatus: status,
      paidAt: new Date(),
    });

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error("PAYPAL CAPTURE ERROR:", error);

    return NextResponse.json(
      { error: "Capture failed" },
      { status: 500 }
    );
  }
}