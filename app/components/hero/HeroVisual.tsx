"use client";

import { useEffect, useRef } from "react";

export default function HeroVisual() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let t = 0;
    const el = ref.current;
    if (!el) return;

    function animate() {
      t += 0.003;
      const y = Math.sin(t) * 12;
      const r = t * 10;

      el.style.transform = `
        translateY(${y}px)
        rotate(${r}deg)
      `;

      requestAnimationFrame(animate);
    }

    animate();
  }, []);

  return (
    <div className="relative w-[420px] h-[420px]">
      {/* Glow */}
      <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-3xl" />

      {/* Ring */}
      <div
        ref={ref}
        className="absolute inset-0 rounded-full border border-white/20 backdrop-blur-xl"
      />

      {/* Invoice card */}
      <div className="absolute inset-16 rounded-xl bg-white/90 shadow-xl p-4 text-black">
        <div className="font-semibold">Invoice</div>
        <div className="text-xs text-slate-500 mt-1">Cosmi</div>
      </div>
    </div>
  );
}
