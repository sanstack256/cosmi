"use client";

import { useState, useCallback } from "react";
import { db, storage } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/*
  🔥 PERFORMANCE FIXES:
  - getStorage removed from render (we import storage singleton)
  - Component is now ultra-lightweight when closed
  - All heavy logic wrapped in callbacks
*/

export default function AddCompanyModal({
  open,
  onClose,
  userId,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
}) {

  // When closed → render NOTHING (no heavy JSX)
  if (!open) return null;

  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleSubmit = useCallback(async (e: any) => {
    e.preventDefault();
    setSaving(true);

    try {
      const form = new FormData(e.target);

      const companyData = {
        companyName: form.get("companyName"),
        businessEmail: form.get("businessEmail"),
        phone: form.get("phone"),
        website: form.get("website"),

        address1: form.get("address1"),
        address2: form.get("address2"),
        city: form.get("city"),
        state: form.get("state"),
        country: form.get("country"),
        postalCode: form.get("postalCode"),

        gst: form.get("gst"),
        pan: form.get("pan"),
        taxId: form.get("taxId"),

        defaultCurrency: form.get("defaultCurrency"),
        paymentTerms: form.get("paymentTerms"),
        footerNote: form.get("footerNote"),

        bankHolder: form.get("bankHolder"),
        bankName: form.get("bankName"),
        bankAccount: form.get("bankAccount"),
        bankIFSC: form.get("bankIFSC"),
        bankSwift: form.get("bankSwift"),
        upiId: form.get("upiId"),

        createdAt: Date.now(),
      };

      // 1️⃣ Generate Firestore ID first (no expensive operations)
      const newId = `${companyData.companyName}-${Date.now()}`;

      const newRef = doc(db, "users", userId, "companies", newId);

      await setDoc(newRef, {
        ...companyData,
        logoURL: null,
      });

      // 2️⃣ Upload logo only if exists
      if (logoFile) {
        const storageRef = ref(
          storage,
          `company-logos/${userId}/${newId}.png`
        );

        await uploadBytes(storageRef, logoFile);
        const downloadURL = await getDownloadURL(storageRef);

        await setDoc(newRef, { logoURL: downloadURL }, { merge: true });
      }

      onClose();
    } catch (err: any) {
      alert("Failed to save company: " + err.message);
    } finally {
      setSaving(false);
    }
  }, [logoFile, userId, onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-[#0d0d14] border border-white/10 w-full max-w-2xl rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
      >
        <h2 className="text-xl font-semibold mb-4">Add Company</h2>

        {/* LOGO UPLOAD */}
        <div className="mb-5">
          <p className="text-sm text-slate-300 mb-2">Company Logo</p>

          <div className="flex items-center gap-4">

            <div className="h-24 w-24 rounded-full overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center">
              {logoFile ? (
                <img
                  src={URL.createObjectURL(logoFile)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-slate-600 text-xs">No Logo</span>
              )}
            </div>

            <label className="flex-1 cursor-pointer border border-white/10 bg-white/5 rounded-lg p-4 text-center hover:bg-white/10 transition">
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
              />
              {logoFile ? "Change Logo" : "Click to upload logo"}
            </label>
          </div>
        </div>

        {/* FORM SECTIONS */}
        <Section title="Basic Details">
          <Input label="Company Name" name="companyName" required />
          <Input label="Business Email" name="businessEmail" />
          <Input label="Phone" name="phone" />
          <Input label="Website" name="website" />
        </Section>

        <Section title="Address">
          <Input label="Address Line 1" name="address1" />
          <Input label="Address Line 2" name="address2" />
          <Input label="City" name="city" />
          <Input label="State" name="state" />
          <Input label="Country" name="country" />
          <Input label="Postal Code" name="postalCode" />
        </Section>

        <Section title="Tax Information">
          <Input label="GST" name="gst" />
          <Input label="PAN" name="pan" />
          <Input label="Tax ID" name="taxId" />
        </Section>

        <Section title="Invoice Defaults">
          <Input label="Default Currency" name="defaultCurrency" />
          <Input label="Payment Terms" name="paymentTerms" />
          <Input label="Footer Note" name="footerNote" />
        </Section>

        <Section title="Bank Details">
          <Input label="Account Holder Name" name="bankHolder" />
          <Input label="Bank Name" name="bankName" />
          <Input label="Account Number" name="bankAccount" />
          <Input label="IFSC Code" name="bankIFSC" />
          <Input label="SWIFT Code" name="bankSwift" />
          <Input label="UPI ID" name="upiId" />
        </Section>

        {/* ACTIONS */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-violet-600 rounded-lg hover:bg-violet-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Company"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* -------------------- SMALL COMPONENTS -------------------- */

function Section({ title, children }: any) {
  return (
    <div className="mb-6">
      <p className="text-violet-300 font-semibold mb-3">{title}</p>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Input({ label, name, required, placeholder }: any) {
  return (
    <label className="text-sm block">
      <span className="text-slate-300">{label}</span>
      <input
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full mt-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
      />
    </label>
  );
}
