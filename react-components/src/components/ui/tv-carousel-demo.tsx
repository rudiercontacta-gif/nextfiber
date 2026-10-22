import { TVDigitalCarousel } from "@/components/ui/tv-digital-carousel";

export default function TVCarouselDemo() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-nf-purple-950 p-8 font-body">
      <div className="max-w-md text-center">
        <p className="mb-2 font-mono text-xs uppercase tracking-widest text-nf-lime-400">
          NextFiber · Vitrina de componentes
        </p>
        <h1 className="font-display text-2xl font-bold text-white">
          Carrusel "TV Digital" — React + Framer Motion
        </h1>
        <p className="mt-2 text-sm text-nf-gray-300">
          Rotación automática, control manual y transición animada por
          slide. El sitio principal lo consume como widget compilado
          (<code className="text-nf-lime-300">tv-carousel.widget.js</code>).
        </p>
      </div>

      <div className="w-full max-w-xl">
        <TVDigitalCarousel />
      </div>
    </div>
  );
}
