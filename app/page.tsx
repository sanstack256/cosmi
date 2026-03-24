// app/page.tsx
"use client";

import React from "react";
import Link from "next/link"; // <<-- added
import { useRouter } from "next/navigation";


export default function Home() {
  const router = useRouter();
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b0b2b] via-[#050505] to-black">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-10">
          <h1 className="text-2xl font-bold">
            <span className="text-white">Cosmi</span>
            <span className="text-indigo-400">.com</span>
          </h1>

          <div className="hidden md:flex gap-8 text-gray-300">
            <a href="#home" className="text-white hover:text-violet-300">
              Home
            </a>
            <a href="#features" className="text-white hover:text-violet-300">
              Features
            </a>
            <Link href="/pricing" className="text-white hover:text-violet-300">
              Pricing
            </Link>

            <a href="#howitworks" className="text-white hover:text-violet-300">
              How it Works
            </a>
            <a href="#contact" className="text-white hover:text-violet-300">
              Contact
            </a>
          </div>
        </div>

        {/* <- Replaced <button> with Link to /signin */}
        <Link
          href="/signin"
          className="px-6 py-2 rounded-lg bg-white/10 border border-white/20 backdrop-blur-md text-white font-semibold hover:bg-white/20 transition"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero Section */}
      <section className="relative flex flex-col items-center text-center mt-24 px-6 pb-48">

        {/* Content Layer */}
        <div className="relative z-10 flex flex-col items-center">
          <h2 className="text-5xl md:text-6xl font-bold mb-[29px] leading-tight text-white">
            Get Paid Faster <br />
            <span className="text-indigo-400">with</span> Smart{" "}
            <span className="text-indigo-400">Invoicing</span>
          </h2>

          <p className="text-gray-300 text-lg max-w-2xl mb-[29px]">
            Create polished invoices in seconds, automate reminders,
            and get paid on time every time.
          </p>

          <button onClick={() => router.push("/signup")}
            className="btn px-[23px] py-[15px] text-lg font-semibold" >
            Create Your First Invoice
          </button>
        </div>

        {/* 🔥 Purple Glow Curve (Front Layer) */}
        <svg
          className="absolute -bottom-12 left-0 w-full h-[220px] z-20 pointer-events-none"
          viewBox="0 0 1440 200"
          preserveAspectRatio="none"
        >
          <defs>
            <filter
              id="glow"
              x="-100%"
              y="-100%"
              width="300%"
              height="300%"
            >
              <feGaussianBlur stdDeviation="25" result="blur1" />
              <feGaussianBlur stdDeviation="8" in="SourceGraphic" result="blur2" />

              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="20%" stopColor="#7c3aed" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="80%" stopColor="#7c3aed" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>

          <path
            d="M0,130 C360,0 1080,0 1440,130"
            fill="none"
            stroke="url(#purpleGradient)"
            strokeWidth="3.5"
            filter="url(#glow)"
          />
        </svg>


      </section>



      {/* Features Section */}
      <section
        id="features"
        className="mt-15 px-6 max-w-5xl mx-auto text-center text-white"
      >
        <h3 className="text-4xl font-bold mb-16">
          Powerful <span className="text-indigo-400">Features</span>, Seamlessly
          Integrated
        </h3>

        <div className="flex flex-col md:flex-row items-center justify-center gap-16">
          {/* Instant Templates */}
          <div className="flex flex-col items-center text-center max-w-sm bg-white/5 p-8 rounded-2xl border border-indigo-500/20 hover:border-indigo-400/40 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all duration-300">
            <div
              dangerouslySetInnerHTML={{
                __html: `
            <lord-icon
              src="https://cdn.lordicon.com/abwrkdvl.json"
              trigger="hover"
              colors="primary:#8b5cf6,secondary:#ffffff"
              style="width:120px;height:120px"
            ></lord-icon>
            `,
              }}
            />
            <h4 className="text-2xl font-semibold mt-4 mb-2 text-indigo-300">
              Instant Templates
            </h4>
            <p className="text-gray-300">
              Choose from sleek invoice templates and customize them instantly.
            </p>
          </div>

          {/* Auto Calculations */}
          <div className="flex flex-col items-center text-center max-w-sm bg-white/5 p-8 rounded-2xl border border-indigo-500/20 hover:border-indigo-400/40 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all duration-300">
            <div
              dangerouslySetInnerHTML={{
                __html: `
            <lord-icon
              src="https://cdn.lordicon.com/puvaffet.json"
              trigger="hover"
              colors="primary:#6366f1,secondary:#ffffff"
              style="width:120px;height:120px"
            ></lord-icon>
            `,
              }}
            />
            <h4 className="text-2xl font-semibold mt-4 mb-2 text-indigo-300">
              Auto Calculations
            </h4>
            <p className="text-gray-300">
              Totals, taxes, and discounts — automatically handled for you.
            </p>
          </div>

          {/* AI Assistance */}
          <div className="flex flex-col items-center text-center max-w-sm bg-white/5 p-8 rounded-2xl border border-indigo-500/20 hover:border-indigo-400/40 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all duration-300">
            <div
              dangerouslySetInnerHTML={{
                __html: `
            <lord-icon
              src="https://cdn.lordicon.com/wjyqkiew.json"
              trigger="hover"
              colors="primary:#818CF8,secondary:#ffffff"
              stroke="50"
              style="width:120px;height:120px"
            ></lord-icon>
 `,
              }}
            />
            <h4 className="text-2xl font-semibold mb-3 mt-4 text-white">
              AI Assistance
            </h4>
            <p className="text-gray-300">
              Generate invoices from simple text prompts — coming soon!
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section
        id="how-it-works"
        className="mt-40 px-6 max-w-5xl mx-auto text-center text-white"
      >
        <h2 className="text-4xl font-bold mb-16">
          How It <span className="text-indigo-400">Works</span>
        </h2>

        <div className="flex flex-col md:flex-row items-center justify-center gap-16">
          {/* Enter Details */}
          <div className="flex flex-col items-center text-center max-w-sm bg-white/5 p-8 rounded-2xl border border-indigo-500/20 hover:border-indigo-400/40 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all duration-300">
            <div
              dangerouslySetInnerHTML={{
                __html: `
            <lord-icon
              src="https://cdn.lordicon.com/qhgmphtg.json"
              trigger="hover"
              colors="primary:#818CF8,secondary:#ffffff"
              style="width:120px;height:120px"
            ></lord-icon>
             `,
              }}
            />
            <h3 className="text-2xl font-semibold mt-4 mb-2 text-indigo-300">
              1. Enter Details
            </h3>
            <p className="text-gray-300">
              Add your client information, item details, and payment terms
              easily.
            </p>
          </div>

          {/* AI Auto-Fills */}
          <div className="flex flex-col items-center text-center max-w-sm bg-white/5 p-8 rounded-2xl border border-indigo-500/20 hover:border-indigo-400/40 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all duration-300">
            <div
              dangerouslySetInnerHTML={{
                __html: `
            <lord-icon
              src="https://cdn.lordicon.com/gqqykmqo.json"
              trigger="hover"
              colors="primary:#6366f1,secondary:#ffffff"
              style="width:120px;height:120px"
            ></lord-icon>
             `,
              }}
            />
            <h3 className="text-2xl font-semibold mt-4 mb-2 text-indigo-300">
              2. AI Auto-Fills
            </h3>
            <p className="text-gray-300">
              Cosmi auto-fills your brand info, taxes, and totals using saved
              data.
            </p>
          </div>

          {/* Download or Share */}
          <div className="flex flex-col items-center text-center max-w-sm bg-white/5 p-6 rounded-2xl border border-indigo-500/20 hover:border-indigo-400/40 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all duration-300">
            <div
              dangerouslySetInnerHTML={{
                __html: `
      <lord-icon
        src="https://cdn.lordicon.com/pithnlch.json"
        trigger="hover"
        colors="primary:#818cf8,secondary:#ffffff"
        style="width:110px;height:110px"
      ></lord-icon>
    `,
              }}
            />
            <h3 className="text-2xl font-semibold mt-4 mb-2 text-indigo-300">
              3. Download or Share
            </h3>
            <p className="text-gray-300">
              Instantly download or share your invoice — polished and
              professional.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-40 border-t border-white/10 py-8 text-center text-gray-400 text-sm">
        © {new Date().getFullYear()} Cosmi.io — All rights reserved.
      </footer>
    </main>
  );
}
