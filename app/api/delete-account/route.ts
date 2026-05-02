import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";

export async function POST(req: Request) {
    try {
        const authHeader = req.headers.get("authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.split("Bearer ")[1];

        const decoded = await adminAuth.verifyIdToken(token);
        const uid = decoded.uid;

        if (!uid) {
            return NextResponse.json({ error: "Missing uid" }, { status: 400 });
        }

        // 🔥 1. Delete Firestore data (invoices)
        const userInvoices = await adminDb
            .collection("invoices")
            .where("userId", "==", uid)
            .get();

        for (const doc of userInvoices.docs) {
            await doc.ref.delete();
        }

        // 🔥 2. Delete user document (if exists)
        await adminDb.collection("users").doc(uid).delete().catch(() => { });

        // 🔥 3. Delete auth user
        await adminAuth.deleteUser(uid);

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Delete account error:", error);
        return NextResponse.json(
            { error: "Failed to delete account" },
            { status: 500 }
        );
    }
}