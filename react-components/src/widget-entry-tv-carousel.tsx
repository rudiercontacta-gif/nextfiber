import React from "react";
import { createRoot } from "react-dom/client";
import { TVDigitalCarousel } from "./components/ui/tv-digital-carousel";
import "./index.css";

/**
 * Se compila como un paquete independiente (IIFE) que el sitio principal
 * (nextfiber/frontend) carga como un <script> normal.
 *
 * Busca cualquier elemento con [data-tv-carousel] en la página, oculta el
 * panel de respaldo (CSS puro, sin animar) y monta ahí el carrusel real
 * hecho con React + Framer Motion.
 *
 * Si este script no se carga (por ejemplo, porque todavía no lo
 * compilaste, o el usuario tiene JavaScript deshabilitado), el panel de
 * respaldo se queda visible y el sitio sigue funcionando exactamente igual.
 */
function mountTVCarousels() {
  const targets = document.querySelectorAll<HTMLElement>("[data-tv-carousel]");

  targets.forEach((el) => {
    const fallbackId = el.dataset.fallbackId;
    if (fallbackId) {
      const fallback = document.getElementById(fallbackId);
      if (fallback) fallback.style.display = "none";
    }

    el.style.display = "block";

    const root = createRoot(el);
    root.render(<TVDigitalCarousel />);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountTVCarousels);
} else {
  mountTVCarousels();
}
