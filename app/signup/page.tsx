"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";

// ✅ SAME stars as signin
const STARS = [
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
];

export default function SignUp() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      setBusy(true);

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: fullName });

      router.replace("/onboarding");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Sign up failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">

      {/* SAME background image */}
      <div
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

      {/* SAME stars */}
      <div className="absolute inset-0 z-10">
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
              animation: `twinkle 2.8s ${s.delay}s infinite ease-in-out`,
            }}
          />
        ))}
      </div>

      {/* SAME animated card */}
      <motion.div
        initial={{ opacity: 0, y: 36, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-30 w-full max-w-md p-8 rounded-2xl bg-[#0b0b0f]/80 backdrop-blur-xl border border-white/20 shadow-[0_0_40px_rgba(129,140,248,0.5),0_0_70px_rgba(129,140,248,0.35)] hover:shadow-[0_0_50px_rgba(129,140,248,0.65),0_0_150px_rgba(129,140,248,0.45)] transition"
      >
        <h2 className="text-3xl font-bold text-white text-center mb-6">
          Create your account
        </h2>

        <form onSubmit={handleSignUp}>
          <input
            type="text"
            placeholder="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full mb-4 px-4 py-3 bg-black/40 text-white rounded-lg border border-white/10 focus:border-indigo-400 focus:outline-none transition"
            required
          />

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

          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-[0_0_18px_rgba(129,140,248,0.28)] transition disabled:opacity-60"
          >
            {busy ? "Creating account…" : "Continue"}
          </button>

        </form>

        {error && <p className="text-crimson mt-6 text-center text-sm">{error}</p>}

        <p className="text-white/60 mt-6 text-center text-sm">
          Already have an account?{" "}
          <span
            onClick={() => router.push("/signin")}
            className="text-indigo-300 hover:underline cursor-pointer"
          >
            Sign In
          </span>
        </p>

        


      </motion.div>

     

      {/* SAME animation */}
      <style>{`
        @keyframes twinkle {
          0% { opacity: .18; transform: scale(1); }
          40% { opacity: 1; transform: scale(1.35); }
          100% { opacity: .22; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}