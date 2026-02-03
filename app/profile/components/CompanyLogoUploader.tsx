"use client";

import { useState } from "react";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";

export default function CompanyLogoUploader({
  userId,
  companyId,
  currentURL,
}: {
  userId: string;
  companyId: string;
  currentURL?: string;
}) {
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: any) {
    const file: File | undefined = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const storageRef = ref(
        storage,
        `company-logos/${userId}/${companyId}.png`
      );

      // ⚡ Fast small-file upload (no progress spam)
      await uploadBytes(storageRef, file);

      const downloadURL = await getDownloadURL(storageRef);

      // Write only the changed field → ZERO unnecessary re-renders
      await updateDoc(doc(db, "users", userId, "companies", companyId), {
        logoURL: downloadURL,
      });

      alert("Logo updated!");
    } catch (err) {
      console.error("Upload failed:", err);
      alert("Upload failed.");
    }

    setUploading(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <img
        src={currentURL || "/default-logo.png"}
        loading="lazy"
        className="h-16 w-16 rounded-xl object-cover bg-white/10"
      />

      <label className="px-3 py-1.5 bg-violet-600 rounded-lg text-sm hover:bg-violet-700 cursor-pointer w-fit">
        Upload Logo
        <input
          type="file"
          accept="image/*"
          hidden
          onChange={handleFileChange}
        />
      </label>

      {uploading && (
        <div className="text-xs text-slate-300">Uploading…</div>
      )}
    </div>
  );
}
