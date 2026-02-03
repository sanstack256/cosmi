"use client";

import { deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DeleteCompanyModal({
  open,
  onClose,
  userId,
  companyId,
  companyName,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  companyId: string;
  companyName: string;
}) {
  if (!open) return null;

  async function handleDelete() {
    await deleteDoc(doc(db, "users", userId, "companies", companyId));
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#0f0f14] p-6 rounded-xl border border-white/10 w-full max-w-sm">
        <h2 className="text-xl font-semibold text-red-400">Delete Company?</h2>
        <p className="text-slate-300 mt-2">
          Are you sure you want to delete <strong>{companyName}</strong>?  
          This action cannot be undone.
        </p>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
