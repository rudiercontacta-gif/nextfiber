import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

// Igual que vite.widget.config.ts (botón de metal líquido): un único
// archivo .js listo para pegar en el sitio HTML principal.
export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    outDir: "dist-widget",
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: path.resolve(__dirname, "src/widget-entry-moving-border.tsx"),
      name: "NextFiberMovingBorderButton",
      formats: ["iife"],
      fileName: () => "moving-border-button.widget.js",
    },
  },
});
