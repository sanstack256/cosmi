import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { publicId } = body;

        if (!publicId) {
            return NextResponse.json(
                { error: "Missing publicId" },
                { status: 400 }
            );
        }

        await db!.collection("publicInvoices").doc(publicId).update({
            isActive: false,
            closedAt: new Date(),
        });

        return NextResponse.json({ success: true });

    } catch (err) {
        console.error("CLOSE LINK ERROR:", err);

        return NextResponse.json(
            { error: "Failed to close link" },
            { status: 500 }
        );
    }
}