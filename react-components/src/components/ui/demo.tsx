import { LiquidMetalButton } from "@/components/ui/liquid-metal-button";

export default function LiquidMetalButtonDemo() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-nf-purple-950 p-8 font-body">
      <div className="text-center">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-nf-lime-400">
          NextFiber · Vitrina de componentes
        </p>
        <h1 className="font-display text-2xl font-bold text-white">
          Botón "metal líquido" — shader real (WebGL)
        </h1>
        <p className="mt-2 max-w-md text-sm text-nf-gray-300">
          Esta es la versión original con el shader de{" "}
          <code className="text-nf-lime-300">@paper-design/shaders</code>.
          El sitio principal de NextFiber usa una recreación en CSS puro de
          este mismo efecto, porque está construido en HTML/CSS/JS sin
          React.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-8">
        <LiquidMetalButton label="¡Contrata ya!" />
        <LiquidMetalButton label="Verificar disponibilidad" />
        <LiquidMetalButton viewMode="icon" />
      </div>
    </div>
  );
}
