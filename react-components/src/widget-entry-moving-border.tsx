import React from "react";
import { createRoot } from "react-dom/client";
import { MovingBorderButton } from "./components/ui/moving-border-button";
import "./index.css";

/**
 * Igual que widget-entry.tsx (botón de metal líquido): se compila como
 * paquete independiente (IIFE) que el sitio principal carga con <script>.
 * Busca cualquier elemento con [data-moving-border-button], oculta el
 * botón de respaldo (CSS puro) y monta ahí el botón React real con el
 * borde animado.
 *
 * Si este script no se carga, el botón de respaldo se queda visible y
 * el sitio sigue funcionando exactamente igual.
 */
function aplicarPlanEnFormulario(plan: string) {
  const select = document.querySelector<HTMLSelectElement>('select[name="plan_interes"]');
  if (!select) return;
  select.value = plan;
  select.classList.remove("plan-marcado");
  void select.offsetWidth;
  select.classList.add("plan-marcado");
  setTimeout(() => select.classList.remove("plan-marcado"), 2500);
}

function mountMovingBorderButtons() {
  const targets = document.querySelectorAll<HTMLElement>("[data-moving-border-button]");

  targets.forEach((el) => {
    const label = el.dataset.label || "Continuar";
    const href = el.dataset.href;
    const block = el.dataset.block === "true";
    const external = el.dataset.external === "true";
    const plan = el.dataset.plan;
    const fallbackId = el.dataset.fallbackId;
    const formId = el.dataset.formId;

    if (fallbackId) {
      const fallback = document.getElementById(fallbackId);
      if (fallback) fallback.style.display = "none";
    }

    el.style.display = block ? "block" : "inline-block";

    const root = createRoot(el);
    root.render(
      <MovingBorderButton
        label={label}
        block={block}
        onClick={() => {
          if (formId) {
            const form = document.getElementById(formId) as HTMLFormElement | null;
            form?.requestSubmit();
            return;
          }
          if (plan) aplicarPlanEnFormulario(plan);
          if (href) {
            if (external) {
              window.open(href, "_blank", "noopener");
            } else if (href.startsWith("#")) {
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
  document.addEventListener("DOMContentLoaded", mountMovingBorderButtons);
} else {
  mountMovingBorderButtons();
}
