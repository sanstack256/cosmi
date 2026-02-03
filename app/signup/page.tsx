"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function SignUpPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Step 1: Create Firebase User
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Step 2: Set user name
      await updateProfile(cred.user, { displayName: fullName });

      // Step 3: Redirect to company onboarding page
      router.replace("/signup/company");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black flex justify-center items-center px-6">
      <div className="bg-white/5 p-8 rounded-2xl border border-white/10 max-w-md w-full backdrop-blur-xl">
        <h1 className="text-2xl font-bold text-white text-center mb-6">
          Create your account
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            className="w-full px-4 py-3 bg-black/40 text-white rounded-lg border border-white/10 focus:border-violet-400"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email Address"
            className="w-full px-4 py-3 bg-black/40 text-white rounded-lg border border-white/10 focus:border-violet-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 bg-black/40 text-white rounded-lg border border-white/10 focus:border-violet-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-violet-600 hover:bg-violet-700 rounded-lg text-white font-semibold transition disabled:opacity-40"
          >
            {loading ? "Creating Account…" : "Continue"}
          </button>

          {error && (
            <p className="text-red-400 text-center text-sm">{error}</p>
          )}
        </form>
      </div>
    </div>
  );
}
