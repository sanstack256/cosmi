import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collectionGroup, query, where, getDocs } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const invoiceId = body.invoiceId;

    // ✅ validate invoiceId early
    if (!invoiceId) {
      return NextResponse.json(
        { error: "Missing invoiceId" },
        { status: 400 }
      );
    }

    // ✅ fetch invoice
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

    const invoiceData = snap.docs[0].data();

    // ✅ get currency + amount from DB
    const currency = invoiceData.currency || "INR";

    const totalAmount =
      invoiceData.meta?.lineItems?.reduce(
        (sum: number, item: any) =>
          sum + item.qty * Number(item.rate || 0),
        0
      ) || 0;

    const clientId = process.env.PAYPAL_CLIENT_ID!;
    const secret = process.env.PAYPAL_CLIENT_SECRET!;
    const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");

    /* 1️⃣ Get PayPal access token */

    const tokenRes = await fetch(
      "https://api-m.sandbox.paypal.com/v1/oauth2/token",
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      }
    );

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    /* 2️⃣ Create PayPal order */

    const orderRes = await fetch(
      "https://api-m.sandbox.paypal.com/v2/checkout/orders",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: currency,
                value: totalAmount.toFixed(2),
              },
              reference_id: invoiceId,
            },
          ],
        }),
      }
    );

    const orderData = await orderRes.json();

    if (!orderData.id) {
      return NextResponse.json(
        { error: "PayPal order creation failed" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderID: orderData.id,
    });

  } catch (err) {
    console.error("PAYPAL ERROR:", err);

    return NextResponse.json(
      { error: "PayPal checkout failed" },
      { status: 500 }
    );
  }
}