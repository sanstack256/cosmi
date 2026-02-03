// app/components/SignOutButton.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";

/**
 * Responsive SignOut button:
 * - measures actual button size and sizes the SVG border to match
 * - uses strokeDasharray (segment + gap) so the moving purple line never meets
 * - strokeLinecap = "butt" for thin flat ends
 * - constant soft glow behind the button
 */

export default function SignOutButton() {
  const { signOut } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  // measure wrapper size so SVG matches button
  const wrapperRef = React.useRef<HTMLDivElement | null>(null);
  const [rect, setRect] = React.useState({ w: 0, h: 0 });

  React.useLayoutEffect(() => {
    function measure() {
      const el = wrapperRef.current;
      if (!el) return;
      // measure the visible button element inside wrapper
      const btn = el.querySelector("button");
      if (!btn) return;
      const r = btn.getBoundingClientRect();
      setRect({ w: Math.round(r.width), h: Math.round(r.height) });
    }

    measure();
    const ro = new ResizeObserver(() => measure());
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  async function handleSignOut() {
    setBusy(true);
    try {
      await signOut();
      router.replace("/");
    } catch (err) {
      const msg = (err as any)?.message ?? "Unknown error";
      alert("Sign out failed: " + msg);
    } finally {
      setBusy(false);
    }
  }

  // padding around button to place SVG border outside comfortably
  const pad = 12;
  const svgW = rect.w ? rect.w + pad * 2 : 300;
  const svgH = rect.h ? rect.h + pad * 2 : 72;

  // values used for rect inside svg that match the button's interior
  const innerX = pad;
  const innerY = pad;
  const innerW = Math.max(0, (rect.w || 260));
  const innerH = Math.max(0, (rect.h || 48));
  const rx = innerH / 2; // pill radius

  // approximate perimeter of rounded rect — close enough for dash animation
  const perimeter = 2 * (innerW + innerH);
  // segment length (short moving stroke); choose small fraction of perimeter
  const segment = Math.max(12, Math.round(perimeter * 0.12));
  // gap ensures ends never meet
  const gap = Math.max(8, Math.round(perimeter - segment - 4));

  const strokeWidth = 2.4;
  const strokeColor = "url(#signoutGrad)"; // gradient defined in SVG

  return (
    <div
      ref={wrapperRef}
      style={{
        position: "relative",
        display: "inline-block",
        overflow: "visible", // allow glow + stroke to escape
        borderRadius: 999,
      }}
    >
      {/* constant soft glow */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: -18,
          borderRadius: 999,
          pointerEvents: "none",
          zIndex: 0,
          background:
            "radial-gradient(40% 40% at 25% 25%, rgba(186,142,255,0.10), transparent 12%), radial-gradient(40% 40% at 75% 75%, rgba(124,58,237,0.06), transparent 12%)",
          filter: "blur(18px)",
          opacity: 0.95,
        }}
      />

      {/* SVG border with moving dash */}
      <svg
        width={svgW}
        height={svgH}
        viewBox={`0 0 ${svgW} ${svgH}`}
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          left: `-${pad}px`,
          top: `-${pad}px`,
          pointerEvents: "none",
          zIndex: 1,
          overflow: "visible",
        }}
        aria-hidden
      >
        <defs>
          <linearGradient id="signoutGrad" x1="0" x2="1">
            <stop offset="0%" stopColor="#d6c6ff" stopOpacity="1" />
            <stop offset="55%" stopColor="#b08aff" stopOpacity="1" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* faint base border so there's always a visible outline */}
        <rect
          x={innerX}
          y={innerY}
          rx={rx}
          ry={rx}
          width={innerW}
          height={innerH}
          fill="none"
          stroke="rgba(124,58,237,0.12)"
          strokeWidth={1.6}
        />

        {/* moving short stroke (segment + gap). strokeLinecap: 'butt' gives thin flat edges */}
        <rect
          x={innerX}
          y={innerY}
          rx={rx}
          ry={rx}
          width={innerW}
          height={innerH}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="butt"
          style={{
            strokeDasharray: `${segment} ${gap}`,
            strokeDashoffset: 0,
            filter: "drop-shadow(0 10px 28px rgba(124,58,237,0.22))",
            transformOrigin: "center",
            animation: "cosmi-dash-move 2.6s linear infinite",
            opacity: 0.98,
          }}
        />
      </svg>

      {/* clickable button */}
      <button
        onClick={handleSignOut}
        disabled={busy}
        style={{
          position: "relative",
          zIndex: 2,
          display: "inline-block",
          padding: "12px 44px",
          borderRadius: 999,
          background: "linear-gradient(180deg, rgba(12,10,12,0.86), rgba(6,6,8,0.86))",
          color: "#efe6ff",
          fontWeight: 800,
          fontSize: 16,
          letterSpacing: "0.4px",
          border: "1px solid rgba(140,110,255,0.06)",
          boxShadow: "inset 0 -6px 18px rgba(0,0,0,0.56)",
          backdropFilter: "blur(6px)",
          cursor: busy ? "not-allowed" : "pointer",
        }}
      >
        {busy ? "Signing out…" : "Sign Out"}
      </button>

      <style>{`
        @keyframes cosmi-dash-move {
          0%   { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -${perimeter}; }
        }

        /* hover intensify */
        div:hover > span[aria-hidden] {
          filter: blur(22px);
          opacity: 1;
        }
        div:hover rect[style] {
          animation-duration: 1.8s !important;
        }
      `}</style>
    </div>
  );
}
