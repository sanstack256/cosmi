// app/page.tsx
"use client";

import React from "react";
import Link from "next/link"; // <<-- added

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#0b0b2b] via-[#050505] to-black">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-10">
          <h1 className="text-2xl font-bold">
            <span className="text-white">Cosmi</span>
            <span className="text-indigo-400">.io</span>
          </h1>

          <div className="hidden md:flex gap-8 text-gray-300">
            <a href="#home" className="hover:text-white transition">
              Home
            </a>
            <a href="#features" className="hover:text-white transition">
              Features
            </a>
            <a href="#pricing" className="hover:text-white transition">
              Pricing
            </a>
            <a href="#howitworks" className="hover:text-white transition">
              How it Works
            </a>
            <a href="#contact" className="hover:text-white transition">
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
      <section className="flex flex-col items-center text-center mt-24 px-6">
        <h2 className="text-5xl md:text-6xl font-bold mb-[29px] leading-tight text-white">
          Get Paid Faster  <br />
          <span className="text-indigo-400">with  </span> Smart{" "}
          <span className="text-indigo-400">Invoicing</span>
        </h2>

        <p className="text-gray-300 text-lg max-w-2xl mb-[29px]">
          Create professional invoices instantly with Cosmi.io — the next-gen
          invoicing assistant built for creators, consultants, and small teams.
        </p>

        {/* Try it now button - uses .btn styles you provided in globals.css */}
        <button className="btn px-[23px] py-[15px] text-lg font-semibold">
          Try It Now
        </button>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="mt-40 px-6 max-w-5xl mx-auto text-center text-white"
      >
        <h3 className="text-4xl font-bold mb-16">
          Powerful <span className="text-indigo-400">Features</span>, Seamlessly
          Integrated
        </h3>

        <div className="flex flex-col md:flex-row items-center justify-center gap-16">
          {/* Instant Templates */}
          <div className="flex flex-col items-center text-center max-w-sm bg-white/5 p-8 rounded-2xl border border-indigo-500/20 hover:border-indigo-400/40 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all duration-300">
            <lord-icon
              src="https://cdn.lordicon.com/abwrkdvl.json"
              trigger="hover"
              colors="primary:#8b5cf6,secondary:#ffffff"
              style={{ width: "120px", height: "120px" }}
            ></lord-icon>
            <h4 className="text-2xl font-semibold mt-4 mb-2 text-indigo-300">
              Instant Templates
            </h4>
            <p className="text-gray-300">
              Choose from sleek invoice templates and customize them instantly.
            </p>
          </div>

          {/* Auto Calculations */}
          <div className="flex flex-col items-center text-center max-w-sm bg-white/5 p-8 rounded-2xl border border-indigo-500/20 hover:border-indigo-400/40 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all duration-300">
            <lord-icon
              src="https://cdn.lordicon.com/puvaffet.json"
              trigger="hover"
              colors="primary:#6366f1,secondary:#ffffff"
              style={{ width: "120px", height: "120px" }}
            ></lord-icon>
            <h4 className="text-2xl font-semibold mt-4 mb-2 text-indigo-300">
              Auto Calculations
            </h4>
            <p className="text-gray-300">
              Totals, taxes, and discounts — automatically handled for you.
            </p>
          </div>

          {/* AI Assistance */}
          <div className="flex flex-col items-center text-center max-w-sm bg-white/5 p-8 rounded-2xl border border-indigo-500/20 hover:border-indigo-400/40 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all duration-300">
            <lord-icon
              src="https://cdn.lordicon.com/wjyqkiew.json"
              trigger="hover"
              colors="primary:#818CF8,secondary:#ffffff"
              stroke="50"
              style={{ width: "120px", height: "120px" }}
            ></lord-icon>

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
            <lord-icon
              src="https://cdn.lordicon.com/qhgmphtg.json"
              trigger="hover"
              colors="primary:#818CF8,secondary:#ffffff"
              style={{ width: "120px", height: "120px" }}
            ></lord-icon>
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
            <lord-icon
              src="https://cdn.lordicon.com/gqqykmqo.json"
              trigger="hover"
              colors="primary:#6366f1,secondary:#ffffff"
              style={{ width: "120px", height: "120px" }}
            ></lord-icon>
            <h3 className="text-2xl font-semibold mt-4 mb-2 text-indigo-300">
              2. AI Auto-Fills
            </h3>
            <p className="text-gray-300">
              Cosmi auto-fills your brand info, taxes, and totals using saved
              data.
            </p>
          </div>

          {/* Download or Share */}
          <div className="flex flex-col items-center text-center max-w-sm bg-white/5 p-8 rounded-2xl border border-indigo-500/20 hover:border-indigo-400/40 hover:shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all duration-300">
            <lord-icon
              src="https://cdn.lordicon.com/pithnlch.json"
              trigger="hover"
              colors="primary:#818cf8,secondary:#ffffff"
              style={{ width: "120px", height: "120px" }}
            ></lord-icon>
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
