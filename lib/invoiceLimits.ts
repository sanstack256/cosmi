// lib/invoiceLimits.ts
import {
  collection,
  getCountFromServer,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getMonthRange } from "./date";

export async function getMonthlyInvoiceCount(userId: string) {
  const { start, end } = getMonthRange();

  const q = query(
    collection(db, "invoices"),
    where("userId", "==", userId),
    where("createdAt", ">=", Timestamp.fromDate(start)),
    where("createdAt", "<", Timestamp.fromDate(end))
  );

  const snap = await getCountFromServer(q);
  return snap.data().count;
}
