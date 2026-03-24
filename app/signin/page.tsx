// app/signin/page.tsx
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";

/**
 * Sign in page — wired to Firebase Auth safely.
 * Change: Sign In button is disabled only when the form is submitting (busy).
 * Added console logs to help debug if it still doesn't submit.
 */

const STARS = [
  /* (same star data you provided) */
  { left: "5%", top: "10%", size: 1, delay: 0.1 },
  { left: "12%", top: "18%", size: 1.2, delay: 0.3 },
  { left: "18%", top: "25%", size: 1.3, delay: 0.4 },
  { left: "26%", top: "15%", size: 1, delay: 0.7 },
  { left: "32%", top: "12%", size: 1.1, delay: 1.0 },
  { left: "38%", top: "22%", size: 1.3, delay: 1.4 },
  { left: "44%", top: "7%", size: 1.2, delay: 0.2 },
  { left: "52%", top: "18%", size: 1.2, delay: 0.6 },
  { left: "60%", top: "20%", size: 1, delay: 1.4 },
  { left: "68%", top: "12%", size: 1.4, delay: 0.9 },
  { left: "76%", top: "5%", size: 1.3, delay: 0.8 },
  { left: "82%", top: "14%", size: 1.2, delay: 1.1 },
  { left: "90%", top: "18%", size: 1, delay: 1.2 },
  { left: "94%", top: "9%", size: 1.3, delay: 0.5 },

  { left: "8%", top: "38%", size: 2, delay: 0.6 },
  { left: "20%", top: "48%", size: 2.1, delay: 1.2 },
  { left: "28%", top: "55%", size: 2.2, delay: 1.6 },
  { left: "36%", top: "44%", size: 2.3, delay: 0.9 },
  { left: "47%", top: "33%", size: 2.4, delay: 0.5 },
  { left: "55%", top: "52%", size: 2.1, delay: 1.3 },
  { left: "63%", top: "48%", size: 2.1, delay: 1.3 },
  { left: "72%", top: "39%", size: 2.4, delay: 1.0 },
  { left: "81%", top: "42%", size: 2.5, delay: 1.8 },
  { left: "88%", top: "50%", size: 2.3, delay: 1.4 },

  { left: "8%", top: "72%", size: 3, delay: 0.9 },
  { left: "16%", top: "82%", size: 3.1, delay: 0.5 },
  { left: "30%", top: "78%", size: 3.2, delay: 0.3 },
  { left: "40%", top: "88%", size: 3.4, delay: 0.8 },
  { left: "52%", top: "85%", size: 3.4, delay: 1.0 },
  { left: "63%", top: "78%", size: 3.1, delay: 1.7 },
  { left: "70%", top: "73%", size: 3, delay: 0.7 },
  { left: "78%", top: "83%", size: 3.3, delay: 1.2 },
  { left: "88%", top: "88%", size: 3.5, delay: 1.5 },
  { left: "94%", top: "76%", size: 3.2, delay: 1.1 },

  { left: "2%", top: "60%", size: 1.4, delay: 0.6 },
  { left: "22%", top: "68%", size: 1.6, delay: 0.9 },
  { left: "46%", top: "60%", size: 2.0, delay: 1.2 },
  { left: "74%", top: "62%", size: 1.8, delay: 0.4 },
];

export default function SignIn() {
  const { signInWithEmail, signInWithGoogle, user, loading } = useAuth();
  const router = useRouter();

  // local state for form + error display
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Safe redirect — happens in effect, not during render
  useEffect(() => {
    console.log("[SIGNIN] effect — loading:", loading, "user:", user);
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    console.log("[SIGNIN] submit pressed", { email, password });
    try {
      setBusy(true);
      await signInWithEmail(email, password);
      console.log("[SIGNIN] signInWithEmail returned");
      // redirect handled by effect above
    } catch (err: any) {
      console.error("Email sign in error:", err);
      setError(String(err?.message ?? err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    try {
      setBusy(true);
      await signInWithGoogle();
      // redirect handled by effect above
    } catch (err: any) {
      console.error("Google sign in error:", err);
      setError(String(err?.message ?? err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
      <div
        aria-hidden
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/mnt/data/72f8c468-e568-4530-bc04-4d4629b55016.png')",
          backgroundPosition: "center",
          backgroundSize: "cover",
          opacity: 0.03,
          pointerEvents: "none",
          mixBlendMode: "screen",
        }}
      />

      <div aria-hidden className="absolute inset-0 z-10">
        {STARS.map((s, i) => (
          <span
            key={i}
            className="star"
            style={{
              position: "absolute",
              left: s.left,
              top: s.top,
              width: `${s.size}px`,
              height: `${s.size}px`,
              borderRadius: "50%",
              background: "white",
              opacity: 0.95,
              filter: "drop-shadow(0 0 6px rgba(129,140,248,0.6))",
              transformOrigin: "center",
              animation: `twinkle 2.8s ${s.delay}s infinite ease-in-out`,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 36, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-30 w-full max-w-md p-8 rounded-2xl bg-[#0b0b0f]/80 backdrop-blur-xl border border-white/20 shadow-[0_0_40px_rgba(129,140,248,0.5),0_0_110px_rgba(129,140,248,0.35)] hover:shadow-[0_0_50px_rgba(129,140,248,0.65),0_0_150px_rgba(129,140,248,0.45)] transition"
      >
        <h2 className="text-3xl font-bold text-white text-center mb-6">Welcome Back</h2>

        <form onSubmit={handleEmailSignIn}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 px-4 py-3 bg-black/40 text-white rounded-lg border border-white/10 focus:border-indigo-400 focus:outline-none transition"
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full mb-4 px-4 py-3 bg-black/40 text-white rounded-lg border border-white/10 focus:border-indigo-400 focus:outline-none transition"
            required
          />

          <div className="text-right mb-4">
            <a className="text-indigo-300 text-sm hover:underline cursor-pointer">Forgot password?</a>
          </div>

          <button
            type="submit"
            disabled={busy}                              // <<< changed: only disabled when busy
            className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-[0_0_18px_rgba(129,140,248,0.28)] transition disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <div className="flex items-center my-6">
          <div className="h-px bg-white/10 flex-1" />
          <span className="text-white/50 px-3 text-sm">or</span>
          <div className="h-px bg-white/10 flex-1" />
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={busy}
          className="w-full py-3 rounded-lg border border-white/10 text-white bg-transparent hover:bg-white/5 transition disabled:opacity-60"
        >
          {busy ? "Please wait…" : "Continue with Google"}
        </button>

        {error && <p className="text-crimson mt-6 text-center text-sm">{error}</p>}

        <p className="text-white/60 mt-6 text-center text-sm">
          Don't have an account?{" "}
          <a href="/signup" className="text-indigo-300 hover:underline cursor-pointer">Sign Up</a>
        </p>
      </motion.div>

      <style>{`
        @keyframes twinkle {
          0% { opacity: .18; transform: scale(1); filter: drop-shadow(0 0 4px rgba(129,140,248,0.25)); }
          40% { opacity: 1; transform: scale(1.35); filter: drop-shadow(0 0 10px rgba(129,140,248,0.5)); }
          100% { opacity: .22; transform: scale(1); filter: drop-shadow(0 0 4px rgba(129,140,248,0.25)); }
        }
        @media (max-width: 480px) { .star { filter: none; } }
      `}</style>
    </div>
  );
}
