import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {

    const body = await req.json();
    const currency = body.currency;

    const amount = Number(body.amount || 10);
    const invoiceId = body.invoiceId;

    if (!amount) {
      return NextResponse.json(
        { error: "Invalid invoice amount" },
        { status: 400 }
      );
    }

    if (!invoiceId) {
      return NextResponse.json(
        { error: "Missing invoiceId" },
        { status: 400 }
      );
    }

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
                currency_code: currency || "INR",
                value: amount.toFixed(2),
              },
              reference_id: invoiceId
            },
          ],
        }),
      }
    );

    const orderData = await orderRes.json();
        console.log("ORDER RESPONSE:", orderData);

    console.log("PAYPAL ORDER:", orderData);

    if (!orderData.id) {
      return NextResponse.json(
        { error: "PayPal order creation failed" },
        { status: 500 }
      );
    }

    /* Return orderID instead of redirect URL */

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