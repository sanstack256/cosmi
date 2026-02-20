"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useRouter } from "next/navigation";

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Safely compute display letter
  const displayLetter =
    user?.displayName?.charAt(0)?.toUpperCase() ||
    user?.email?.charAt(0)?.toUpperCase() ||
    "?";

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
  onClick={() => setOpen(!open)}
  className="
    relative h-9 w-9 rounded-xl overflow-hidden
    flex items-center justify-center select-none
    transition-all duration-200
    hover:scale-105
    hover:shadow-[0_0_18px_rgba(99,102,241,0.6)]
    text-white font-semibold text-sm
  "
  style={
    user?.photoURL
      ? undefined
      : {
          background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
        }
  }
>
  {user?.photoURL ? (
    <img
      src={user.photoURL}
      alt="profile"
      className="h-full w-full object-cover"
    />
  ) : (
    <span className="relative z-10">{displayLetter}</span>
  )}

  {/* Soft Glow Overlay */}
  {!user?.photoURL && (
    <span
      className="absolute inset-0 rounded-xl pointer-events-none"
      style={{
        boxShadow: "0 0 22px rgba(99,102,241,0.55)",
        mixBlendMode: "screen",
      }}
    />
  )}
</button>



      {/* Dropdown */}
      <div
        className={`
          absolute right-0 mt-2 w-52 rounded-xl bg-[#0f0f15] 
          border border-white/10 shadow-lg backdrop-blur-xl 
          z-50 p-2 transition-all duration-200
          ${
            open
              ? "opacity-100 translate-y-0 scale-100"
              : "opacity-0 translate-y-2 scale-95 pointer-events-none"
          }
        `}
      >
        <div className="px-3 py-2 text-xs text-slate-400">
          Signed in as:
          <div className="text-white mt-1 truncate">
            {user?.email ?? "Unknown"}
          </div>
        </div>

        <div className="h-px bg-white/10 my-2" />

        <button
          onClick={() => router.push("/profile")}
          className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-white/5 rounded-lg transition"
        >
          My Profile
        </button>

        <button
          onClick={() => router.push("/settings")}
          className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-white/5 rounded-lg transition"
        >
          Settings
        </button>

        <button
          onClick={handleSignOut}
          className="w-full text-left px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
