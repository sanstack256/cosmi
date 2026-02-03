"use client";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#050509] flex items-center justify-center">
      <div className="loader-wrapper">
        <div className="loader">
          <svg width="0" height="0">
            <defs>
              <mask id="clipping">
                <polygon points="50 0, 100 50, 50 100, 0 50" fill="white" />
                <polygon points="50 10, 90 50, 50 90, 10 50" fill="white" />
                <polygon points="50 20, 80 50, 50 80, 20 50" fill="white" />
                <polygon points="50 30, 70 50, 50 70, 30 50" fill="white" />
                <polygon points="50 40, 60 50, 50 60, 40 50" fill="white" />
                <polygon points="50 45, 55 50, 50 55, 45 50" fill="white" />
                <polygon points="50 48, 52 50, 50 52, 48 50" fill="white" />
              </mask>
            </defs>
          </svg>

          <div className="box" />
        </div>

        <p className="mt-6 text-xs text-slate-400 tracking-wide animate-pulse">
          Loading invoice editor…
        </p>
      </div>

      {/* Loader styles */}
      <style jsx>{`
        .loader {
          --color-one: #7c3aed;
          --color-two: #c084fc;
          --color-three: #7c3aed80;
          --color-four: #c084fc80;
          --color-five: #7c3aed40;
          --time-animation: 2s;
          --size: 0.9;

          position: relative;
          border-radius: 50%;
          transform: scale(var(--size));
          box-shadow:
            0 0 25px 0 var(--color-three),
            0 20px 50px 0 var(--color-four);
          animation: colorize calc(var(--time-animation) * 3) ease-in-out infinite;
        }

        .loader::before {
          content: "";
          position: absolute;
          width: 100px;
          height: 100px;
          border-radius: 50%;
          border-top: solid 1px var(--color-one);
          border-bottom: solid 1px var(--color-two);
          background: linear-gradient(180deg, var(--color-five), var(--color-four));
          box-shadow:
            inset 0 10px 10px 0 var(--color-three),
            inset 0 -10px 10px 0 var(--color-four);
        }

        .loader .box {
          width: 100px;
          height: 100px;
          background: linear-gradient(
            180deg,
            var(--color-one) 30%,
            var(--color-two) 70%
          );
          mask: url(#clipping);
          -webkit-mask: url(#clipping);
        }

        .loader svg {
          position: absolute;
        }

        #clipping {
          filter: contrast(15);
          animation: roundness calc(var(--time-animation) / 2) linear infinite;
        }

        #clipping polygon {
          filter: blur(7px);
        }

        @keyframes rotation {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes roundness {
          0%, 60%, 100% { filter: contrast(15); }
          20%, 40% { filter: contrast(3); }
        }

        @keyframes colorize {
          0% { filter: hue-rotate(0deg); }
          40% { filter: hue-rotate(-60deg); }
          80% { filter: hue-rotate(-30deg); }
          100% { filter: hue-rotate(0deg); }
        }
      `}</style>
    </div>
  );
}
