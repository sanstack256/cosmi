"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function SignUpPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      router.replace("/onboarding");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050509] flex items-center justify-center relative text-white px-6">

      {/* BACKGROUND GLOW */}
      <div className="absolute w-[700px] h-[700px] bg-indigo-600/20 blur-[120px] rounded-full" />

      <div className="relative z-10 w-full max-w-md">

        {/* CARD */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-[0_30px_100px_rgba(0,0,0,0.9)]">

          {/* TITLE */}
          <h1 className="text-2xl font-semibold mb-2 text-center">
            Create your account
          </h1>

          <p className="text-sm text-white/50 text-center mb-6">
            Start invoicing in seconds
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
              required
            />

            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 transition-all font-medium disabled:opacity-40 active:scale-[0.98]"
            >
              {loading ? "Creating..." : "Continue"}
            </button>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}
          </form>

          {/* FOOTER */}
          <div className="text-center text-sm text-white/50 mt-6">
            Already have an account?{" "}
            <span
              onClick={() => router.push("/signin")}
              className="text-indigo-400 hover:text-indigo-300 cursor-pointer"
            >
              Sign in
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}