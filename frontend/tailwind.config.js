/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#FFFFFF",
          sunk: "#F1F5FB",
        },
        surfaceDark: {
          DEFAULT: "#0E1523",
          sunk: "#080D18",
          raised: "#172035",
        },
        brand: {
          navy: "#060E20",
          blue: "#4361EE",
          bluelight: "#7B9EFF",
          cyan: "#06B6D4",
          purple: "#7C3AED",
          indigo: "#3730A3",
        },
        ink: {
          DEFAULT: "#0F172A",
          muted: "#64748B",
        },
        inkDark: {
          DEFAULT: "#E2E8F0",
          muted: "#64748B",
        },
        success: "#059669",
        successDark: "#34D399",
        danger: "#DC2626",
        dangerDark: "#F87171",
        amber: {
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(11,37,69,0.06), 0 8px 32px rgba(11,37,69,0.08)",
        cardDark: "0 1px 3px rgba(0,0,0,0.5), 0 8px 32px rgba(0,0,0,0.4)",
        glow: "0 0 32px rgba(67,97,238,0.35)",
        glowSm: "0 0 16px rgba(67,97,238,0.25)",
        sidebar: "4px 0 24px rgba(0,0,0,0.15)",
      },
      borderRadius: {
        card: "16px",
        xl2: "20px",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, #4361EE 0%, #7C3AED 100%)",
        "gradient-card": "linear-gradient(135deg, #1E2D5A 0%, #0E1523 100%)",
        "gradient-hero": "linear-gradient(135deg, #060E20 0%, #0E1523 60%, #1a1040 100%)",
        "gradient-success": "linear-gradient(135deg, #059669 0%, #06B6D4 100%)",
        "gradient-danger": "linear-gradient(135deg, #DC2626 0%, #9333EA 100%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 2.5s linear infinite",
        "spin-slow": "spin 8s linear infinite",
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        slideUp: {
          from: { opacity: 0, transform: "translateY(16px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
