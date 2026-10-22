import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

// Configuración de build SEPARADA de la app de vitrina normal.
// Genera un único archivo .js listo para pegar en el sitio HTML principal.
export default defineConfig({
  plugins: [
    react(),
    // Empaqueta el CSS (Tailwind incluido) DENTRO del mismo .js, en vez de
    // generar un archivo .css aparte que habría que copiar y enlazar
    // también. Así sigue siendo "un solo archivo para pegar en el sitio".
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
    emptyOutDir: false, // no borrar tv-carousel.widget.js si ya existe
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(__dirname, "src/widget-entry.tsx"),
      name: "NextFiberLiquidButton",
      formats: ["iife"],
      fileName: () => "liquid-button.widget.js",
    },
  },
});
