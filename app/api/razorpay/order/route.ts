import { NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";

export async function POST(req: Request) {
  try {
    const { amount, plan, userId } = await req.json();

    const order = await razorpay.orders.create({
      amount, // in paise
      currency: "INR",
      receipt: `cosmi_${userId}_${Date.now()}`,
      notes: { plan, userId },
    });

    return NextResponse.json(order);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
