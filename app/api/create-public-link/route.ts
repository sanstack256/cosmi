import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { randomUUID } from "crypto";

// ✅ CRITICAL FIXES
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        // ✅ SAFE BODY PARSING (NO req.json)
        const text = await req.text();

        if (!text) {
            return NextResponse.json(
                { error: "Empty body" },
                { status: 400 }
            );
        }

        let body;

        try {
            body = JSON.parse(text);
        } catch {
            return NextResponse.json(
                { error: "Invalid JSON" },
                { status: 400 }
            );
        }

        const { invoiceId, userId } = body;

        if (!invoiceId || !userId) {
            return NextResponse.json(
                { error: "Missing data" },
                { status: 400 }
            );
        }

        const publicId = randomUUID().replace(/-/g, "").slice(0, 16);
        const token = randomUUID().replace(/-/g, "");

        await db!.collection("publicInvoices").doc(publicId).set({
            invoicePath: `users/${userId}/invoices/${invoiceId}`,
            token,
            autoCloseOnFullPayment: true,
            isActive: true,
            createdAt: new Date(),
        });

        return NextResponse.json({
            url: `https://cosmi-ten.vercel.app/invoice/${publicId}?t=${token}`,
        });

    } catch (err) {
        console.error("PUBLIC LINK ERROR:", err);

        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}