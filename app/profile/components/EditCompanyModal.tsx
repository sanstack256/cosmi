"use client";

import { useState, useCallback, useEffect } from "react";
import { db, storage } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export default function EditCompanyModal({
  open,
  onClose,
  userId,
  companyId,
  existing,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  companyId: string;
  existing: any;
}) {

  // 🚀 Do NOT mount heavy modal UI if not open
  if (!open) return null;

  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // 🟣 Initialize form only once when opened
  const [formState, setFormState] = useState<any>({});

  useEffect(() => {
    setFormState(existing); // fast assignment, no deep clone
  }, [existing]);

  const updateField = useCallback((name: string, value: any) => {
    setFormState((prev: any) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: any) => {
    e.preventDefault();
    setSaving(true);

    try {
      const refDoc = doc(db, "users", userId, "companies", companyId);

      // 1️⃣ Update fields
      await updateDoc(refDoc, formState);

      // 2️⃣ Upload logo if changed
      if (logoFile) {
        const storageRef = ref(
          storage,
          `company-logos/${userId}/${companyId}.png`
        );

        await uploadBytes(storageRef, logoFile);
        const downloadURL = await getDownloadURL(storageRef);

        await updateDoc(refDoc, { logoURL: downloadURL });
      }

      onClose();
    } catch (err: any) {
      alert("Failed to update company: " + err.message);
    } finally {
      setSaving(false);
    }
  }, [formState, logoFile, userId, companyId, onClose]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-[#0d0d14] border border-white/10 w-full max-w-2xl rounded-2xl p-6 overflow-y-auto max-h-[90vh]"
      >
        <h2 className="text-xl font-semibold mb-4">Edit Company</h2>

        {/* LOGO PREVIEW */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-28 w-28 rounded-full overflow-hidden bg-white/10 border border-white/20 flex items-center justify-center">
            {logoFile ? (
              <img src={URL.createObjectURL(logoFile)} className="h-full w-full object-cover" />
            ) : existing?.logoURL ? (
              <img src={existing.logoURL} className="h-full w-full object-cover" />
            ) : (
              <span className="text-slate-500 text-xs">No Logo</span>
            )}
          </div>

          <label className="mt-3 px-4 py-2 text-sm bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition">
            Change Logo
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
            />
          </label>
        </div>

        {/* BASIC DETAILS */}
        <Section title="Basic Details">
          <Input label="Company Name" value={formState.companyName} onChange={(v) => updateField("companyName", v)} />
          <Input label="Business Email" value={formState.businessEmail} onChange={(v) => updateField("businessEmail", v)} />
          <Input label="Phone" value={formState.phone} onChange={(v) => updateField("phone", v)} />
          <Input label="Website" value={formState.website} onChange={(v) => updateField("website", v)} />
        </Section>

        {/* ADDRESS */}
        <Section title="Address">
          <Input label="Address Line 1" value={formState.address1} onChange={(v) => updateField("address1", v)} />
          <Input label="Address Line 2" value={formState.address2} onChange={(v) => updateField("address2", v)} />
          <Input label="City" value={formState.city} onChange={(v) => updateField("city", v)} />
          <Input label="State" value={formState.state} onChange={(v) => updateField("state", v)} />
          <Input label="Country" value={formState.country} onChange={(v) => updateField("country", v)} />
          <Input label="Postal Code" value={formState.postalCode} onChange={(v) => updateField("postalCode", v)} />
        </Section>

        {/* TAX */}
        <Section title="Tax Information">
          <Input label="GST" value={formState.gst} onChange={(v) => updateField("gst", v)} />
          <Input label="PAN" value={formState.pan} onChange={(v) => updateField("pan", v)} />
          <Input label="Tax ID" value={formState.taxId} onChange={(v) => updateField("taxId", v)} />
        </Section>

        {/* INVOICE DEFAULTS */}
        <Section title="Invoice Defaults">
          <Input label="Default Currency" value={formState.defaultCurrency} onChange={(v) => updateField("defaultCurrency", v)} />
          <Input label="Payment Terms" value={formState.paymentTerms} onChange={(v) => updateField("paymentTerms", v)} />
          <Input label="Footer Note" value={formState.footerNote} onChange={(v) => updateField("footerNote", v)} />
        </Section>

        {/* BANK DETAILS */}
        <Section title="Bank Details">
          <Input label="Account Holder" value={formState.bankHolder} onChange={(v) => updateField("bankHolder", v)} />
          <Input label="Bank Name" value={formState.bankName} onChange={(v) => updateField("bankName", v)} />
          <Input label="Account Number" value={formState.bankAccount} onChange={(v) => updateField("bankAccount", v)} />
          <Input label="IFSC" value={formState.bankIFSC} onChange={(v) => updateField("bankIFSC", v)} />
          <Input label="SWIFT" value={formState.bankSwift} onChange={(v) => updateField("bankSwift", v)} />
          <Input label="UPI ID" value={formState.upiId} onChange={(v) => updateField("upiId", v)} />
        </Section>

        {/* BUTTONS */}
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
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

/* -------------------- UI COMPONENTS -------------------- */

function Section({ title, children }: any) {
  return (
    <div className="mb-6">
      <p className="text-violet-300 font-semibold mb-3">{title}</p>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Input({ label, value, onChange }: any) {
  return (
    <label className="text-sm block">
      <span className="text-slate-300">{label}</span>
      <input
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white"
      />
    </label>
  );
}
