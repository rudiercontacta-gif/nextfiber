import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  // Sin "preflight": el reset global de Tailwind se inyectaba en TODO el sitio
  // (dejaba los títulos en peso 400). El reset mínimo de los widgets está en
  // src/index.css y solo afecta a [data-liquid-button] y [data-tv-carousel].
  corePlugins: {
    preflight: false,
  },
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // Paleta de marca NextFiber, disponible como bg-nf-purple, text-nf-lime, etc.
        nf: {
          "purple-950": "#180a2c",
          "purple-800": "#3a1468",
          "purple-600": "#6d28d9",
          "purple-400": "#a575f0",
          "lime-400": "#b6ff3c",
          "lime-300": "#d4ff8a",
          black: "#0b0b0d",
          "gray-300": "#d3d0da",
          "gray-500": "#8b8794",
          "gray-700": "#4a4650",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
