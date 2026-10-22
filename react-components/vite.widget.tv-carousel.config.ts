import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

// Configuración de build SEPARADA de la app de vitrina normal.
// Genera un único archivo .js listo para pegar en el sitio HTML principal.
// emptyOutDir: false porque dist-widget/ ya contiene liquid-button.widget.js
// compilado con otra config — no queremos que un build borre al otro.
export default defineConfig({
  plugins: [
    react(),
    // Empaqueta el CSS (Tailwind incluido) DENTRO del mismo .js.
    cssInjectedByJsPlugin(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Reemplaza process.env.NODE_ENV por un valor fijo: React lo revisa
  // internamente, pero "process" no existe dentro del navegador y sin
  // esto el widget se rompe con "process is not defined".
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: "dist-widget",
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(__dirname, "src/widget-entry-tv-carousel.tsx"),
      name: "NextFiberTVCarousel",
      formats: ["iife"],
      fileName: () => "tv-carousel.widget.js",
    },
  },
});
