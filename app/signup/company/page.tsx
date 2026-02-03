"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, collection, addDoc } from "firebase/firestore";

export default function CompanyOnboarding() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [address, setAddress] = useState("");
  const [gst, setGst] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Redirect if user is not logged in
  useEffect(() => {
    if (!loading && !user) router.replace("/signin");
    if (user && businessEmail === "") setBusinessEmail(user.email || "");
  }, [user, loading, router]);

  async function handleCreateCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      let logoURL = null;

      // NEXT — implement logo upload in Step 3B
      // (we will integrate Firebase Storage)
      // For now, skip upload.

      // Create company in Firestore
      const companiesRef = collection(db, "users", user.uid, "companies");

      await addDoc(companiesRef, {
        companyName,
        businessEmail,
        address,
        gst,
        logoURL,
        createdAt: Date.now(),
      });

      // Redirect to dashboard
      router.replace("/dashboard");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to create company");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex justify-center items-center px-6">
      <div className="bg-white/5 p-8 rounded-2xl border border-white/10 max-w-lg w-full backdrop-blur-xl">
        <h1 className="text-2xl font-bold text-white text-center mb-6">
          Set Up Your Company
        </h1>

        <form onSubmit={handleCreateCompany} className="space-y-5">
          {/* Company Name */}
          <input
            type="text"
            placeholder="Company Name"
            className="w-full px-4 py-3 bg-black/40 text-white rounded-lg border border-white/10 focus:border-violet-400"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />

          {/* Business Email */}
          <input
            type="email"
            placeholder="Business Email"
            className="w-full px-4 py-3 bg-black/40 text-white rounded-lg border border-white/10 focus:border-violet-400"
            value={businessEmail}
            onChange={(e) => setBusinessEmail(e.target.value)}
          />

          {/* Address */}
          <textarea
            placeholder="Business Address"
            className="w-full px-4 py-3 bg-black/40 text-white rounded-lg border border-white/10 focus:border-violet-400"
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          {/* GST / Tax ID */}
          <input
            type="text"
            placeholder="GST / Tax ID (optional)"
            className="w-full px-4 py-3 bg-black/40 text-white rounded-lg border border-white/10 focus:border-violet-400"
            value={gst}
            onChange={(e) => setGst(e.target.value)}
          />

          {/* Logo Upload */}
          <div>
            <p className="text-sm text-slate-300 mb-1">Company Logo (optional)</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogo(e.target.files?.[0] || null)}
              className="text-white text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-semibold transition disabled:opacity-40"
          >
            {saving ? "Saving Company…" : "Create Company"}
          </button>

          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
        </form>
      </div>
    </div>
  );
}
