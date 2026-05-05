export function CosmiLogo({ size = 260 }: { size?: number }) {
  const dots = [];

  const rows = 28;
  const cols = 28;

  const centerX = cols / 2;
  const centerY = rows / 2;

  // 🔥 SHIFTED LEFT CENTER (CRITICAL FIX)
const shiftedCenterX = centerX - 0.9;

  const spacingX = 100 / cols;
  const spacingY = 100 / rows;
  const maxR = Math.min(spacingX, spacingY) / 2;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {

      const t = x / cols;

      //  smooth asymmetric shaping (no flat edge)
      const dx = x - shiftedCenterX;
      const dy = y - centerY;

      //  PERFECT CIRCLE (no distortion)
      const dist = Math.sqrt(dx * dx + dy * dy);



      if (dist > rows / 2) continue;

      const radial = 1 - dist / (rows / 2);

      // slight center suppression
      const centerFade = 0.85 + 0.15 * (1 - Math.abs(t - 0.2));
      const intensity = radial * (1 - t * 0.75) * centerFade;

      const cx = (x / cols) * 100;
      const cy = (y / rows) * 100;

      const seed = x * 100 + y;
      const rand = Math.abs(Math.sin(seed) * 10000) % 1;

      // stronger left dominance
      const bias = Math.pow(1 - t, 2.6);

      const edgeBoost = t < 0.22 ? (0.22 - t) * 2.5 : 0;

      // size strictly position-based
      const sizeFalloff = Math.pow(1 - t, 1.3);
      const sizeMultiplier = 0.7 + sizeFalloff * 0.75;

      let color;

      const brightThreshold = bias * (0.65 + edgeBoost);
      const midThreshold = bias * (0.9 + edgeBoost * 0.4);

      if (rand < brightThreshold) {
        color = "#c084fc";
      } else if (rand < midThreshold) {
        color = "#a855f7";
      } else {
        color = "#6d28d9";
      }

      const r = Math.min(maxR * 0.85, 3.5 * intensity * sizeMultiplier);
      const opacity = 0.5 + intensity * 0.6;

      if (t < 0.15 && radial > 0.4) {
        dots.push(
          <circle
            key={`${x}-${y}`}
            cx={cx}
            cy={cy}
            r={Math.min(maxR * 0.9, r * 1.1)}
            fill={color}
            opacity={1}
          />
        );
        continue;
      }

      dots.push(
        <circle
          key={`${x}-${y}`}
          cx={cx}
          cy={cy}
          r={r}
          fill={color}
          opacity={opacity}
        />
      );
    }
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#050509",
      }}
    >
      {/* glow */}
      <div
        style={{
          position: "absolute",
          width: "140%",
          height: "140%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(124,58,237,0.08) 35%, rgba(124,58,237,0.03) 55%, transparent 70%)",
          filter: "blur(24px)",
          zIndex: 0,
        }}
      />

      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        style={{ position: "relative", zIndex: 1 }}
      >
        {dots}
      </svg>
    </div>
  );
}