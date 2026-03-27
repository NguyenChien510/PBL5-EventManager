/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1978e5",
        electric: "#2e90fa",
        "background-light": "#f6f7f8",
        "background-dark": "#111821",
        porcelain: "#ffffff",
        brandBlue: "#0077FF",
        brandPurple: "#8E2DE2",
        "cat-music": "#ec4899",
        "cat-tech": "#06b6d4",
        "cat-art": "#8b5cf6",
        "cat-sport": "#f97316",
        "cat-food": "#eab308",
        success: "#10b981",
        danger: "#ef4444",
        "accent-pink": "#f472b6",
        "accent-orange": "#fb923c",
        surface: "#f8fafc",
        "border-color": "#e2e8f0",
        "navy-deep": "#0f172a",
        "electric-blue": "#2563eb",
        "cat-purple": "#8b5cf6",
        "cat-cyan": "#06b6d4",
        "cat-green": "#22c55e",
        "cat-gold": "#eab308",
        "ocean-blue": "#0ea5e9",
        warning: "#f59e0b",
        conflict: "#ef4444",
      },
      boxShadow: {
        soft: "0 4px 20px -2px rgba(25, 120, 229, 0.05)",
        glow: "0 0 20px rgba(46, 144, 250, 0.35)",
        minimal: "0 2px 12px rgba(0, 0, 0, 0.03)",
      },
      fontFamily: {
        display: ["Inter", "sans-serif"],
        sans: ["Inter", "sans-serif"],
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.2s ease-out",
        "slide-down": "slide-down 0.2s ease-out",
      },
    },
  },
  plugins: [],
}

