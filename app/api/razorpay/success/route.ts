import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const { userId, plan, paymentId, orderId } = await req.json();

    const ref = doc(db, "users", userId);

    await updateDoc(ref, {
      plan,
      provider: "razorpay",
      paymentId,
      orderId,
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Payment save error:", err);
    return NextResponse.json({ error: "Failed to save payment" }, { status: 500 });
  }
}
