import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin"; // ⚠️ must be admin SDK
import { randomUUID } from "crypto";


export async function POST(req: Request) {
    try {
        const { invoiceId, userId } = await req.json();

        if (!invoiceId || !userId) {
            return NextResponse.json({ error: "Missing data" }, { status: 400 });
        }

        const publicId = randomUUID().replace(/-/g, "").slice(0, 16);

        const token = randomUUID().replace(/-/g, "");

        await db.collection("publicInvoices").doc(publicId).set({
            invoicePath: `users/${userId}/invoices/${invoiceId}`,
            token,
            createdAt: new Date(),
        });

        return NextResponse.json({
            url: `https://cosmi-ten.vercel.app/invoice/${publicId}?t=${token}`,
        });

    } catch (err) {
        console.error("PUBLIC LINK ERROR:", err);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}