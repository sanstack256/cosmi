"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/app/providers/AuthProvider";
import { useRouter } from "next/navigation";
import HeroVisual from "@/app/components/hero/HeroVisual";

/* ------------------------------------------
   Fix for <lord-icon /> JSX error
------------------------------------------- */
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "lord-icon": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        src?: string;
        trigger?: string;
        colors?: string;
        stroke?: string;
      };
    }
  }
}

/* ------------------------------------------
   Icon helper
------------------------------------------- */

function IconBox({
  src,
  colors,
  stroke,
}: {
  src: string;
  colors: string;
  stroke?: string;
}) {
  return (
    <div className="flex items-center justify-center h-[120px] w-[120px] mb-4">
      <lord-icon
        src={src}
        trigger="hover"
        colors={colors}
        stroke={stroke}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}

/* ------------------------------------------
   Home Page (SINGLE default export)
------------------------------------------- */

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b0b2b] via-[#050505] to-black text-white">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-10">
          <h1 className="text-2xl font-bold">
            <span className="text-white">Cosmi</span>
            <span className="text-indigo-400">.io</span>
          </h1>

          <div className="hidden md:flex gap-8 text-gray-300">
            <a href="#home" className="hover:text-white transition">Home</a>
            <a href="#features" className="hover:text-white transition">Features</a>
            <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
            <a href="#how-it-works" className="hover:text-white transition">How it Works</a>
            <a href="#contact" className="hover:text-white transition">Contact</a>
          </div>
        </div>

        <Link
          href={user ? "/dashboard" : "/signin"}
          className="px-6 py-2 rounded-lg bg-white/10 border border-white/20 backdrop-blur-md font-semibold hover:bg-white/20 transition"
        >
          {user ? "Dashboard" : "Sign In"}
        </Link>
      </nav>

      {/* Hero */}
      <section
        id="home"
        className="grid grid-cols-1 lg:grid-cols-2 items-center gap-12 max-w-7xl mx-auto px-6 mt-24"
      >
        <div className="text-center lg:text-left">
          <h2 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Smart Invoicing for{" "}
            <span className="text-indigo-400">Freelancers</span> and{" "}
            <span className="text-indigo-400">Small Businesses</span>
          </h2>

          <p className="text-gray-300 text-lg max-w-xl mb-8">
            Create professional invoices instantly with Cosmi.io — built for
            creators, consultants, and small teams.
          </p>

          <Link
            href={user ? "/dashboard" : "/signin"}
            className="inline-block px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 font-semibold transition"
          >
            Try It Now
          </Link>
        </div>

        <div className="flex justify-center">
          <HeroVisual />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mt-40 px-6 max-w-5xl mx-auto text-center">
        <h3 className="text-4xl font-bold mb-16">
          Powerful <span className="text-indigo-400">Features</span>
        </h3>

        <div className="flex flex-col md:flex-row items-center justify-center gap-16">
          <div className="group max-w-sm bg-white/5 p-8 rounded-2xl border border-indigo-500/20 hover:border-indigo-400/40 transition">
            <IconBox src="https://cdn.lordicon.com/abwrkdvl.json" colors="primary:#8b5cf6,secondary:#ffffff" />
            <h4 className="text-2xl font-semibold text-indigo-300 mb-2">Instant Templates</h4>
            <p className="text-gray-300">Choose sleek invoice templates instantly.</p>
          </div>

          <div className="group max-w-sm bg-white/5 p-8 rounded-2xl border border-indigo-500/20 hover:border-indigo-400/40 transition">
            <IconBox src="https://cdn.lordicon.com/puvaffet.json" colors="primary:#6366f1,secondary:#ffffff" />
            <h4 className="text-2xl font-semibold text-indigo-300 mb-2">Auto Calculations</h4>
            <p className="text-gray-300">Totals, taxes, and discounts handled.</p>
          </div>

          <div className="group max-w-sm bg-white/5 p-8 rounded-2xl border border-indigo-500/20 hover:border-indigo-400/40 transition">
            <IconBox src="https://cdn.lordicon.com/wjyqkiew.json" colors="primary:#818CF8,secondary:#ffffff" stroke="50" />
            <h4 className="text-2xl font-semibold mb-2">AI Assistance</h4>
            <p className="text-gray-300">Smart invoice generation (soon).</p>
          </div>
        </div>
      </section>

      <footer className="mt-40 border-t border-white/10 py-8 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} Cosmi.io — All rights reserved.
      </footer>
    </main>
  );
}
