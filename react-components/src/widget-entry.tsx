import React from "react";
import { createRoot } from "react-dom/client";
import { LiquidMetalButton } from "./components/ui/liquid-metal-button";
import "./index.css";

/**
 * Este archivo se compila como un paquete independiente (IIFE) que el
 * sitio principal (nextfiber/frontend) carga como un <script> normal.
 * Busca cualquier elemento con [data-liquid-button] en la página,
 * oculta el botón de respaldo (CSS puro) y monta ahí el botón React
 * real con el shader animado.
 *
 * Si este script no se carga (por ejemplo, porque todavía no lo
 * compilaste), el botón de respaldo se queda visible y el sitio
 * sigue funcionando exactamente igual.
 */
function mountLiquidButtons() {
  const targets = document.querySelectorAll<HTMLElement>("[data-liquid-button]");

  targets.forEach((el) => {
    const label = el.dataset.label || "Get Started";
    const href = el.dataset.href;
    const fallbackId = el.dataset.fallbackId;

    if (fallbackId) {
      const fallback = document.getElementById(fallbackId);
      if (fallback) fallback.style.display = "none";
    }

    el.style.display = "inline-block";

    const root = createRoot(el);
    root.render(
      <LiquidMetalButton
        label={label}
        onClick={() => {
          if (href) {
            if (href.startsWith("#")) {
              document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
            } else {
              window.location.href = href;
            }
          }
        }}
      />,
    );
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountLiquidButtons);
} else {
  mountLiquidButtons();
}
