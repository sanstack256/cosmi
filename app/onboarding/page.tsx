"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [companyName, setCompanyName] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/signin");
    }
  }, [user, loading]);

  async function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          company: {
            name: companyName,
            currency,
          },
          onboardingComplete: true,
        },
        { merge: true }
      );

      router.replace("/invoice-editor"); // 🔥 MAGIC MOMENT
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050509] flex items-center justify-center relative text-white px-6">

      {/* Glow */}
      <div className="absolute w-[700px] h-[700px] bg-indigo-600/20 blur-[120px] rounded-full" />

      <div className="relative z-10 w-full max-w-md">

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8">

          <h1 className="text-2xl font-semibold mb-2 text-center">
            Let’s set things up
          </h1>

          <p className="text-sm text-white/50 text-center mb-6">
            Takes less than 30 seconds
          </p>

          <form onSubmit={handleContinue} className="space-y-4">

            <input
              type="text"
              placeholder="Your business name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 outline-none"
              required
            />

            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
            </select>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition"
            >
              {saving ? "Saving..." : "Continue"}
            </button>

          </form>

        </div>
      </div>
    </div>
  );
}