import Razorpay from "razorpay";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { amount, invoiceId } = await req.json();

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // convert ₹ to paise
      currency: "INR",
      receipt: invoiceId,
    });

    return NextResponse.json({
      orderId: order.id,
      key: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error) {
    console.error("Razorpay order error:", error);

    return NextResponse.json(
      { error: "Failed to create Razorpay order" },
      { status: 500 }
    );
  }
}