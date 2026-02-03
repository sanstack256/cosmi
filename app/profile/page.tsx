"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Shield, LogOut, Camera } from "lucide-react";
import { useAuth } from "@/app/providers/AuthProvider";

export default function ProfilePage() {
  const router = useRouter();
  const { user, plan, signOut, sendPasswordReset } = useAuth();


  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#050509] text-slate-100 px-6 py-10 relative overflow-hidden">
      {/* GLOW BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-[420px] h-[420px] bg-violet-500/20 blur-[160px]" />
        <div className="absolute top-1/3 right-0 w-[380px] h-[380px] bg-fuchsia-500/10 blur-[160px]" />
      </div>

      {/* BACK BUTTON */}
      <button
        onClick={() => router.push("/dashboard")}
        className="
          fixed top-6 left-6 z-50
          flex items-center gap-2
          px-4 py-2 rounded-xl
          bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20
          border border-violet-500/40
          text-sm text-violet-200
          shadow-[0_0_18px_rgba(139,92,246,0.45)]
          hover:from-violet-500/30 hover:to-fuchsia-500/30
          transition
        "
      >
        <ChevronLeft className="h-4 w-4" />
        Dashboard
      </button>

      <div className="relative max-w-5xl mx-auto space-y-8">
        {/* HEADER */}
        <div>
          <h1 className="text-2xl font-semibold">Profile & Settings</h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage your account, security, and preferences
          </p>
        </div>

        {/* USER CARD */}
        <div
          className="
            rounded-2xl p-6
            bg-gradient-to-br from-violet-500/10 via-slate-950 to-black
            border border-violet-500/25
            shadow-[0_0_35px_rgba(139,92,246,0.25)]
            flex items-center gap-5
          "
        >
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-2xl font-black text-black">
              {user.displayName?.[0]?.toUpperCase() || "U"}
            </div>
            <button className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-black border border-violet-500/40 flex items-center justify-center text-violet-300">
              <Camera className="h-3 w-3" />
            </button>
          </div>

          <div className="flex-1">
            <p className="text-lg font-semibold">{user.displayName || "User"}</p>
            <p className="text-sm text-slate-400">{user.email}</p>

            <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Active account
            </span>
          </div>

          <div className="text-right">
            <p className="text-xs text-slate-400">Plan</p>
            <p className="font-semibold capitalize text-violet-300">{plan}</p>
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PERSONAL INFO */}
          <div
            className="
              rounded-2xl p-6
              bg-gradient-to-br from-[#12121a] via-[#0c0c14] to-[#08080f]
              ring-1 ring-violet-600/20
            "
          >
            <h3 className="text-sm font-semibold mb-4">
              Personal Information
            </h3>

            <div className="space-y-4 text-sm">
              <div>
                <p className="text-slate-400 text-xs">Full Name</p>
                <p className="font-medium">{user.displayName || "—"}</p>
              </div>

              <div>
                <p className="text-slate-400 text-xs">Email</p>
                <p className="font-medium">{user.email}</p>
              </div>

              <div>
                <p className="text-slate-400 text-xs">User ID</p>
                <p className="font-mono text-xs text-slate-500 break-all no-underline select-all">
                  {user.uid}
                </p>

              </div>
            </div>
          </div>

          {/* SECURITY */}
          <div
            className="
              rounded-2xl p-6
              bg-gradient-to-br from-[#12121a] via-[#0c0c14] to-[#08080f]
              ring-1 ring-violet-600/20
            "
          >
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4 text-violet-400" />
              Security
            </h3>

            <p className="text-xs text-slate-400 mb-4">
              Manage your login and access
            </p>

            <button
              onClick={sendPasswordReset}
              className="
                w-full py-3 rounded-xl
                bg-violet-500 hover:bg-violet-600
                text-sm font-semibold
                shadow-[0_0_18px_rgba(139,92,246,0.5)]
              "
            >
              Send Password Reset Email
            </button>

            <button
              onClick={signOut}
              className="
                w-full mt-3 py-3 rounded-xl
                border border-white/20
                flex items-center justify-center gap-2
                hover:bg-white/10
                text-sm
              "
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
