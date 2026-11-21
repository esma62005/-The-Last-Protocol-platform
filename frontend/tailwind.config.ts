import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { ink: "#151719", card: "#1b1e21", wine: "#762D35", rose: "#b0414d", gold: "#C5A56A", cream: "#E8DFD0", muted: "#69717A" },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"], mono: ["var(--font-mono)", "ui-monospace", "monospace"] },
      keyframes: { pulseRing: { "0%": { boxShadow: "0 0 0 0 rgba(176,65,77,.6)" }, "70%,100%": { boxShadow: "0 0 0 14px rgba(176,65,77,0)" } }, up: { from: { opacity: "0", transform: "translateY(24px)" } } },
      animation: { pulseRing: "pulseRing 2.4s infinite", up: "up .7s both" },
    },
  },
  plugins: [],
} satisfies Config;
