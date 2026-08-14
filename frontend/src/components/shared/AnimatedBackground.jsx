import { useTheme } from "../../context/ThemeContext";
import { useMemo } from "react";

// ─── Icons (16 project‑feature icons) ────────────────────────
const icons = [
  // 1. Bank
  {
    paths: [
      "M12 3 L2 8 L22 8 L12 3Z",
      "M5 8 L5 18",
      "M9 8 L9 18",
      "M12 8 L12 18",
      "M15 8 L15 18",
      "M19 8 L19 18",
      "M2 18 L22 18",
      "M2 21 L22 21",
    ],
    viewBox: "0 0 24 24",
    strokeWidth: 1.8,
  },
  // 2. Security
  {
    paths: [
      "M12 2 L4 6 L4 13 C4 17.5 7.5 21.5 12 22 C16.5 21.5 20 17.5 20 13 L20 6 L12 2Z",
      "M9 12 L15 12 L15 17 L9 17 L9 12Z",
      "M10.5 12 C10.5 10.6 11.2 9.5 12 9.5 C12.8 9.5 13.5 10.6 13.5 12",
    ],
    viewBox: "0 0 24 24",
    strokeWidth: 2,
  },
  // 3. WiFi
  {
    paths: [
      "M12 20 C12.55 20 13 19.55 13 19 C13 18.45 12.55 18 12 18 C11.45 18 11 18.45 11 19 C11 19.55 11.45 20 12 20Z",
      "M8.5 15.5 C9.3 14.3 10.6 13.5 12 13.5 C13.4 13.5 14.7 14.3 15.5 15.5",
      "M5 12 C6.7 9.7 9.2 8.5 12 8.5 C14.8 8.5 17.3 9.7 19 12",
      "M1.5 8.5 C4.2 5.3 7.9 3.5 12 3.5 C16.1 3.5 19.8 5.3 22.5 8.5",
    ],
    viewBox: "0 0 24 24",
    strokeWidth: 2,
  },
  // 4. User
  {
    paths: [
      "M12 2 C9.2 2 7 4.2 7 7 C7 9.8 9.2 12 12 12 C14.8 12 17 9.8 17 7 C17 4.2 14.8 2 12 2Z",
      "M3 21 C3 17.1 7.1 14 12 14 C16.9 14 21 17.1 21 21",
    ],
    viewBox: "0 0 24 24",
    strokeWidth: 2,
  },
  // 5. Officer
  {
    paths: [
      "M12 2 C9.8 2 8 3.8 8 6 C8 8.2 9.8 10 12 10 C14.2 10 16 8.2 16 6 C16 3.8 14.2 2 12 2Z",
      "M4 20 C4 16.7 7.6 14 12 14 C16.4 14 20 16.7 20 20",
      "M12 15 L12.6 16.8 L14.5 16.8 L13 17.9 L13.6 19.8 L12 18.7 L10.4 19.8 L11 17.9 L9.5 16.8 L11.4 16.8Z",
    ],
    viewBox: "0 0 24 24",
    strokeWidth: 2,
  },
  // 6. Admin
  {
    paths: [
      "M9 2 C7 2 5.5 3.5 5.5 5.5 C5.5 7.5 7 9 9 9 C11 9 12.5 7.5 12.5 5.5 C12.5 3.5 11 2 9 2Z",
      "M2 20 C2 16.7 5.1 14 9 14 C10.3 14 11.5 14.3 12.5 14.9",
      "M20 8 C18.3 8 17 9.3 17 11 C17 12.7 18.3 14 20 14 C21.7 14 23 12.7 23 11 C23 9.3 21.7 8 20 8Z",
      "M17 14 L14 17",
      "M14 17 L14 20",
      "M14 20 L16 20",
      "M16 20 L16 18",
    ],
    viewBox: "0 0 24 24",
    strokeWidth: 2,
  },
  // 7. Electricity
  {
    paths: ["M13 2 L4.5 13.5 L11 13.5 L11 22 L19.5 10.5 L13 10.5 L13 2Z"],
    viewBox: "0 0 24 24",
    strokeWidth: 2.2,
  },
  // 8. Credit Card — (thicker for detail)
  {
    paths: [
      "M2 7 L22 7 C22 5.9 21.1 5 20 5 L4 5 C2.9 5 2 5.9 2 7 L2 18 C2 19.1 2.9 20 4 20 L20 20 C21.1 20 22 19.1 22 18 L22 7",
      "M2 10 L22 10",
      "M6 15 L10 15",
      "M15 14 C15 13.4 15.4 13 16 13 C16.6 13 17 13.4 17 14 C17 14.6 16.6 15 16 15 C15.4 15 15 14.6 15 14Z",
    ],
    viewBox: "0 0 24 24",
    strokeWidth: 2.2,
  },
  // 9. Transfer
  {
    paths: [
      "M17 2 L17 7 L22 7",
      "M21.5 7 C20 4.5 17.2 3 14 3 C9.6 3 6 6.6 6 11",
      "M7 22 L7 17 L2 17",
      "M2.5 17 C4 19.5 6.8 21 10 21 C14.4 21 18 17.4 18 13",
    ],
    viewBox: "0 0 24 24",
    strokeWidth: 2,
  },
  // 10. Statement — (thicker for detail)
  {
    paths: [
      "M14 2 L6 2 C4.9 2 4 2.9 4 4 L4 20 C4 21.1 4.9 22 6 22 L18 22 C19.1 22 20 21.1 20 20 L20 8 L14 2Z",
      "M14 2 L14 8 L20 8",
      "M8 13 L16 13",
      "M8 16 L16 16",
      "M8 10 L12 10",
    ],
    viewBox: "0 0 24 24",
    strokeWidth: 2.2,
  },
  // 11. Withdrawal — more gap between arrow and tray, single closed tray path
  // (previously the arrow and tray sat too close together and merged into a
  // fuzzy blob under the dark-mode glow blur)
  {
    paths: [
      "M12 3 L12 12",
      "M7.5 7.5 L12 3 L16.5 7.5",
      "M3 16 L21 16 L21 21 L3 21 Z",
    ],
    viewBox: "0 0 24 24",
    strokeWidth: 2,
  },
  // 12. Deposit — more gap between arrow and tray, single closed tray path
  {
    paths: [
      "M12 4 L12 13",
      "M7.5 9.5 L12 13 L16.5 9.5",
      "M3 16 L21 16 L21 21 L3 21 Z",
    ],
    viewBox: "0 0 24 24",
    strokeWidth: 2,
  },
  // 13. Bank to Bank — wider layout, clearer facade (roof + entablature + columns),
  // bigger gap for the arrow so it reads as two buildings connected by a transfer, not two triangles
  {
    paths: [
      // Left building: roof
      "M1 7 L6 2.5 L11 7",
      // Left building: entablature line under the roof
      "M1.5 7.5 L10.5 7.5",
      // Left building: columns
      "M3 8 L3 16",
      "M6 8 L6 16",
      "M9 8 L9 16",
      // Left building: base + platform
      "M0.5 16 L11.5 16",
      "M0.5 18.5 L11.5 18.5",
      // Right building: roof
      "M23 7 L28 2.5 L33 7",
      // Right building: entablature line
      "M23.5 7.5 L32.5 7.5",
      // Right building: columns
      "M25 8 L25 16",
      "M28 8 L28 16",
      "M31 8 L31 16",
      // Right building: base + platform
      "M22.5 16 L33.5 16",
      "M22.5 18.5 L33.5 18.5",
      // Arrow: long shaft + wide chevron head, wide open gap between buildings
      "M12 11.5 L21 11.5",
      "M18 8.5 L21.5 11.5 L18 14.5",
    ],
    viewBox: "0 0 34 24",
    strokeWidth: 1.5,
  },
  // 14. Bank to Mobile — wider layout, bigger/clearer phone (screen lines, speaker, home button),
  // bigger gap for the arrow so it reads as bank → phone, not triangle → rectangle
  {
    paths: [
      // Bank: roof
      "M1 7 L6 2.5 L11 7",
      // Bank: entablature line under the roof
      "M1.5 7.5 L10.5 7.5",
      // Bank: columns
      "M3 8 L3 16",
      "M6 8 L6 16",
      "M9 8 L9 16",
      // Bank: base + platform
      "M0.5 16 L11.5 16",
      "M0.5 18.5 L11.5 18.5",
      // Phone: body (bigger, clearly a rounded-rect handset)
      "M26 2 L31 2 C31.8 2 32.5 2.7 32.5 3.5 L32.5 18.5 C32.5 19.3 31.8 20 31 20 L26 20 C25.2 20 24.5 19.3 24.5 18.5 L24.5 3.5 C24.5 2.7 25.2 2 26 2 Z",
      // Phone: top speaker
      "M27.7 3.2 L29.3 3.2",
      // Phone: screen separators (top & bottom of screen area)
      "M24.5 4.5 L32.5 4.5",
      "M24.5 16.5 L32.5 16.5",
      // Phone: home bar
      "M27.5 18.2 L29.5 18.2",
      // Arrow: long shaft + wide chevron head, wide open gap between bank and phone
      "M12 11.5 L22 11.5",
      "M19 8.5 L22.5 11.5 L19 14.5",
    ],
    viewBox: "0 0 34 24",
    strokeWidth: 1.5,
  },
  // 15. Notification
  {
    paths: [
      "M6 10 C6 7 8.7 4.5 12 4.5 C15.3 4.5 18 7 18 10 L18 16 L20 18 L4 18 L6 16 L6 10Z",
      "M10 18 C10 19.1 10.9 20 12 20 C13.1 20 14 19.1 14 18",
      "M12 4.5 L12 2",
    ],
    viewBox: "0 0 24 24",
    strokeWidth: 2,
  },
  // 16. Wallet — (thicker for detail)
  {
    paths: [
      "M2 8 L20 8 C21.1 8 22 8.9 22 10 L22 19 C22 20.1 21.1 21 20 21 L4 21 C2.9 21 2 20.1 2 19 L2 8",
      "M2 8 L4 5 L20 5 L22 8",
      "M16 14.5 C16 13.7 16.7 13 17.5 13 C18.3 13 19 13.7 19 14.5 C19 15.3 18.3 16 17.5 16 C16.7 16 16 15.3 16 14.5Z",
      "M16 14.5 L22 14.5",
    ],
    viewBox: "0 0 24 24",
    strokeWidth: 2.2,
  },
  // 17. Dollar sign ($)
  {
    paths: [
      "M12 2 L12 22",
      "M16.5 7 C16.5 5 14.5 3.5 12 3.5 C9 3.5 7 5.2 7 7.5 C7 10 9.5 10.8 12 11.5 C14.5 12.2 17 13 17 15.5 C17 17.8 15 19.5 12 19.5 C9.5 19.5 7.5 18 7.5 16",
    ],
    viewBox: "0 0 24 24",
    strokeWidth: 2,
  },
];

// ─── Light mode: 16 distinct, vibrant solid colours ──────
const lightSolidColors = [
  "#3B82F6", // Blue
  "#F97316", // Orange
  "#EF4444", // Red
  "#22C55E", // Green
  "#14B8A6", // Teal
  "#A855F7", // Purple
  "#EC4899", // Pink
  "#EAB308", // Yellow
  "#84CC16", // Lime
  "#06B6D4", // Cyan
  "#6366F1", // Indigo
  "#F59E0B", // Amber
  "#F43F5E", // Rose
  "#10B981", // Emerald
  "#8B5CF6", // Violet
  "#FB7185", // Coral
  "#0EA5E9", // Sky
];

// ─── Bokeh orbs (dark mode only) ─────────────────────────────
const orbsDark = [
  { cx: "15%", cy: "20%", r: 340, color: "rgba(0,212,255,0.10)", dur: 22 },
  { cx: "75%", cy: "15%", r: 280, color: "rgba(217,70,239,0.08)", dur: 28 },
  { cx: "85%", cy: "65%", r: 320, color: "rgba(251,191,36,0.09)", dur: 18 },
  { cx: "25%", cy: "75%", r: 260, color: "rgba(0,153,255,0.06)", dur: 24 },
  { cx: "50%", cy: "45%", r: 200, color: "rgba(52,211,153,0.06)", dur: 32 },
];

// ─── Animations ────────────────────────────────────────────
const animations = [
  { duration: 18, x: 16, y: 12, sd: 0.06 },
  { duration: 24, x: -20, y: 10, sd: 0.08 },
  { duration: 20, x: 14, y: -16, sd: 0.05 },
  { duration: 27, x: -22, y: 14, sd: 0.07 },
  { duration: 22, x: 18, y: -12, sd: 0.09 },
  { duration: 16, x: -14, y: 18, sd: 0.05 },
  { duration: 26, x: 12, y: -16, sd: 0.07 },
  { duration: 21, x: -16, y: 18, sd: 0.06 },
  { duration: 23, x: 20, y: -10, sd: 0.08 },
  { duration: 19, x: -18, y: 14, sd: 0.05 },
  { duration: 25, x: 14, y: -20, sd: 0.07 },
  { duration: 22, x: -12, y: 16, sd: 0.06 },
  { duration: 17, x: -15, y: -12, sd: 0.07 },
  { duration: 29, x: 18, y: 10, sd: 0.05 },
  { duration: 21, x: -12, y: -18, sd: 0.08 },
  { duration: 24, x: 22, y: 14, sd: 0.06 },
];

// ─── Depth configs (3 layers, sizes optimized for readability) ──
const depthConfigs = [
  ...Array(5)
    .fill(null)
    .map(() => ({ sMin: 46, sMax: 68, oMin: 0.12, oMax: 0.22 })), // far
  ...Array(8)
    .fill(null)
    .map(() => ({ sMin: 78, sMax: 110, oMin: 0.20, oMax: 0.35 })), // mid
  ...Array(4)
    .fill(null)
    .map(() => ({ sMin: 120, sMax: 170, oMin: 0.28, oMax: 0.45 })), // near
];

export default function AnimatedBackground() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const positions = useMemo(() => {
    const placed = [];
    const result = [];
    for (let i = 0; i < icons.length; i++) {
      let x = 0,
        y = 0,
        att = 0;
      do {
        x = 4 + Math.random() * 90;
        y = 4 + Math.random() * 90;
        att++;
      } while (att < 50 && placed.some((p) => Math.hypot(p.x - x, p.y - y) < 13));
      placed.push({ x, y });
      const depth = depthConfigs[i] ?? depthConfigs[depthConfigs.length - 1];
      result.push({
        x,
        y,
        size: depth.sMin + Math.random() * (depth.sMax - depth.sMin),
        rotation: (Math.random() - 0.5) * 50,
        opacity: depth.oMin + Math.random() * (depth.oMax - depth.oMin),
        anim: animations[i % animations.length],
        entranceDur: 0.6 + Math.random() * 0.6,
      });
    }
    return result;
  }, []);

  const keyframesCSS = useMemo(() => {
    let css = "";
    for (let i = 0; i < 5; i++) {
      css += `
        @keyframes orbDrift${i} {
          0%   { transform: translate(0,0) scale(1); }
          33%  { transform: translate(${30 + i * 8}px,${-20 - i * 6}px) scale(1.06); }
          66%  { transform: translate(${-20 - i * 5}px,${25 + i * 7}px) scale(0.94); }
          100% { transform: translate(0,0) scale(1); }
        }
        @keyframes orbPulse${i} {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.72; }
        }`;
    }
    css += `
      @keyframes linePulse {
        0%,100% { opacity: 0.22; }
        50%     { opacity: 0.05; }
      }
      @keyframes bgShift {
        0%   { background-position: 0% 50%; }
        50%  { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
      }
      @keyframes gridFade {
        0%,100% { opacity: ${isDark ? 0.04 : 0.06}; }
        50%     { opacity: ${isDark ? 0.07 : 0.09}; }
      }`;
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const { x, y, sd } = pos.anim;
      const r = pos.rotation;
      const op = isDark ? Math.min(pos.opacity * 1.9, 0.9) : pos.opacity;
      const peak = Math.min(op * 1.7, isDark ? 0.95 : 0.65);
      css += `
        @keyframes fadeInIcon${i} {
          from { opacity: 0; transform: scale(0.5); filter: blur(4px); }
          to   { opacity: 1; transform: scale(1);   filter: blur(0px); }
        }
        @keyframes floatBreatheIcon${i} {
          0%   { transform: translate(0px,0px) rotate(${r}deg) scale(1); opacity: ${op}; }
          20%  { transform: translate(${x}px,${-y * 0.8}px) rotate(${r + 8}deg) scale(${1 + sd}); opacity: ${peak}; }
          40%  { transform: translate(${-x * 0.7}px,${y}px) rotate(${r - 5}deg) scale(${1 - sd * 0.4}); opacity: ${op * 0.9}; }
          60%  { transform: translate(${x * 0.5}px,${-y * 0.5}px) rotate(${r + 4}deg) scale(${1 + sd * 0.6}); opacity: ${peak}; }
          80%  { transform: translate(${-x * 0.3}px,${y * 0.4}px) rotate(${r - 3}deg) scale(${1 - sd * 0.2}); opacity: ${op * 0.95}; }
          100% { transform: translate(0px,0px) rotate(${r}deg) scale(1); opacity: ${op}; }
        }`;
    }
    return css;
  }, [isDark, positions]);

  const lines = useMemo(() => {
    const maxDist = 28;
    const result = [];
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const dist = Math.hypot(
          positions[i].x - positions[j].x,
          positions[i].y - positions[j].y
        );
        if (dist < maxDist) {
          result.push({
            x1: positions[i].x,
            y1: positions[i].y,
            x2: positions[j].x,
            y2: positions[j].y,
            alpha: (1 - dist / maxDist) * (isDark ? 0.24 : 0.12),
            dur: 14 + (i % 4) * 3,
            delay: (i + j) * 0.18,
          });
        }
      }
    }
    return result;
  }, [positions, isDark]);

  const bg = isDark
    ? "linear-gradient(135deg,#0A0F1E 0%,#0D1B3E 30%,#0F172A 50%,#1A0B2E 75%,#0A0F1E 100%)"
    : "linear-gradient(135deg,#F0F4FF 0%,#F5FAF7 30%,#F8F4FF 55%,#FFFAED 80%,#F0F4FF 100%)";

  const gridColor = isDark ? "rgba(148,163,184,0.04)" : "rgba(99,102,241,0.04)";

  // ─── Critical: thinner multiplier ──────────────────────────
  const strokeMultiplier = isDark ? 1.0 : 1.3;

  return (
    <div
      className="amb-motion"
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: keyframesCSS }} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: bg,
          backgroundSize: "300% 300%",
          animation: "bgShift 20s ease infinite",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `radial-gradient(circle,${gridColor} 1px,transparent 1px)`,
          backgroundSize: "36px 36px",
          animation: "gridFade 8s ease-in-out infinite",
        }}
      />

      {isDark &&
        orbsDark.map((orb, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: orb.cx,
              top: orb.cy,
              width: orb.r * 2,
              height: orb.r * 2,
              transform: "translate(-50%,-50%)",
              borderRadius: "50%",
              background: `radial-gradient(circle at 40% 40%,${orb.color},transparent 70%)`,
              filter: "blur(70px)",
              animation: `orbDrift${i} ${orb.dur}s ease-in-out infinite, orbPulse${i} ${orb.dur * 0.6}s ease-in-out infinite`,
            }}
          />
        ))}

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isDark
            ? "radial-gradient(ellipse 85% 80% at 50% 50%,transparent 40%,rgba(0,0,0,0.55) 100%)"
            : "radial-gradient(ellipse 85% 80% at 50% 50%,transparent 40%,rgba(255,255,255,0.6) 100%)",
        }}
      />

      <svg
        width="100%"
        height="100%"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 1,
          overflow: "visible",
        }}
      >
        {lines.map((l, idx) => (
          <line
            key={idx}
            x1={`${l.x1}%`}
            y1={`${l.y1}%`}
            x2={`${l.x2}%`}
            y2={`${l.y2}%`}
            stroke={isDark ? "#00D4FF" : "#CBD5E1"}
            strokeWidth={0.6}
            strokeOpacity={l.alpha}
            style={{
              animation: `linePulse ${l.dur}s ease-in-out ${l.delay}s infinite`,
            }}
          />
        ))}
      </svg>

      {positions.map((pos, index) => {
        const icon = icons[index % icons.length];
        const solidColor = lightSolidColors[index % lightSolidColors.length];
        const { duration } = pos.anim;
        const entranceDelay = index * 0.06;

        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: pos.size,
              height: pos.size,
              marginLeft: -pos.size / 2,
              marginTop: -pos.size / 2,
              pointerEvents: "none",
              zIndex: 2,
              animation: `fadeInIcon${index} ${pos.entranceDur}s cubic-bezier(.22,1,.36,1) ${entranceDelay}s both`,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                willChange: "transform, opacity",
                animation: `floatBreatheIcon${index} ${duration}s ease-in-out infinite`,
              }}
            >
              <svg
                viewBox={icon.viewBox}
                width="100%"
                height="100%"
                style={{ display: "block", overflow: "visible" }}
              >
                {null}

                <g>
                  {icon.paths.map((d, pi) => (
                    <path
                      key={pi}
                      d={d}
                      stroke={solidColor}
                      strokeWidth={icon.strokeWidth * strokeMultiplier}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                </g>
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
}