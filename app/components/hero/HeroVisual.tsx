"use client";

import Image from "next/image";

export default function HeroVisual() {
  return (
    <section className="relative mt-24">
      {/* BLEED CONTAINER (Linear-style) */}
      <div
        className="
          relative
          w-screen
          left-1/2
          right-1/2
          -ml-[50vw]
          -mr-[50vw]
          overflow-hidden
          pointer-events-none
        "
      >
        {/* PERSPECTIVE */}
        <div className="relative h-[70vh] perspective-[1800px]">
          {/* IMAGE WRAPPER */}
          <div
            className="
              absolute
              bottom-[-20%]
              left-1/2
              -translate-x-1/2
              transform-gpu
              rotate-x-[24deg]
              rotate-z-[-12deg]
              scale-[1.18]
            "
          >
            <Image
              src="/hero/dashboard.png"
              alt="Cosmi dashboard"
              width={1800}
              height={1100}
              priority
              className="rounded-xl shadow-[0_120px_300px_rgba(0,0,0,0.95)]"
            />

            {/* TOP FADE */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-xl" />

            {/* BOTTOM FADE */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90 rounded-xl" />
          </div>
        </div>

        {/* GLOBAL VIGNETTE */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06)_0%,rgba(0,0,0,0.85)_70%)]" />
      </div>
    </section>
  );
}
