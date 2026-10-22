import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Film, Trophy, Tv } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface TVCarouselSlide {
  category: string;
  title: string;
  description: string;
  badge: string;
  icon: React.ReactNode;
  /** Ruta de la foto del slide (relativa a frontend/, ej. "images/tv-slide-futbol.jpg"). */
  image: string;
  /** Tailwind color family used to tint icon, category, badge and glow (e.g. "lime", "teal", "sky"). */
  accent: "lime" | "teal" | "sky";
}

const defaultSlides: TVCarouselSlide[] = [
  {
    category: "Deportes en Vivo",
    title: "Liga 1 MAX",
    description:
      "Disfruta de todo el fútbol peruano en alta definición y sin cortes desde tu fibra óptica.",
    badge: "Incluido en tu plan",
    icon: <Trophy className="h-5 w-5" />,
    image: "images/tv-slide-futbol.jpg",
    accent: "lime",
  },
  {
    category: "Entretenimiento",
    title: "+80 Canales HD",
    description:
      "Variedad de canales nacionales e internacionales para toda la familia, sin decodificadores viejos.",
    badge: "Señal digital pura",
    icon: <Tv className="h-5 w-5" />,
    image: "images/tv-slide-canales.jpg",
    accent: "teal",
  },
  {
    category: "Cine y Series",
    title: "Contenido On-Demand",
    description:
      "Tus películas y series favoritas disponibles cuando quieras, listas para maratonear.",
    badge: "Multipantalla",
    icon: <Film className="h-5 w-5" />,
    image: "images/tv-slide-series.jpg",
    accent: "sky",
  },
];

const accentClasses: Record<
  TVCarouselSlide["accent"],
  { text: string; badgeBg: string; badgeBorder: string; glow: string; border: string; dot: string }
> = {
  lime: {
    text: "text-nf-lime-400",
    badgeBg: "bg-nf-lime-400/10",
    badgeBorder: "border-nf-lime-400/25",
    glow: "bg-nf-lime-400/15",
    border: "border-nf-lime-400/30",
    dot: "bg-nf-lime-400",
  },
  teal: {
    text: "text-teal-400",
    badgeBg: "bg-teal-400/10",
    badgeBorder: "border-teal-400/25",
    glow: "bg-teal-400/15",
    border: "border-teal-400/30",
    dot: "bg-teal-400",
  },
  sky: {
    text: "text-sky-400",
    badgeBg: "bg-sky-400/10",
    badgeBorder: "border-sky-400/25",
    glow: "bg-sky-400/15",
    border: "border-sky-400/30",
    dot: "bg-sky-400",
  },
};

export interface TVDigitalCarouselProps {
  slides?: TVCarouselSlide[];
  /** Milliseconds between automatic slide changes. Set to 0 to disable autoplay. */
  intervalMs?: number;
}

export function TVDigitalCarousel({
  slides = defaultSlides,
  intervalMs = 4000,
}: TVDigitalCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);

  useEffect(() => {
    if (!intervalMs || paused) return;
    timerRef.current = setInterval(next, intervalMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [intervalMs, paused, next]);

  const slide = slides[index];
  const accent = accentClasses[slide.accent];
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [slide.image]);

  return (
    <div
      className={`relative flex min-h-[340px] flex-col justify-between overflow-hidden rounded-3xl border ${accent.border} bg-gradient-to-b from-nf-purple-800/40 via-[#180a2c] to-[#0f0620] shadow-2xl transition-colors duration-500`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Resplandor ambiental que cambia de color según el slide */}
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full blur-3xl transition-colors duration-500 ${accent.glow}`}
      />

      {/* Foto del slide */}
      <div className="relative z-10 aspect-[16/9] w-full overflow-hidden sm:aspect-[16/8]">
        {!imgError ? (
          <img
            src={slide.image}
            alt={slide.title}
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-black/30">
            <span className={accent.text}>{slide.icon}</span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f0620] via-transparent to-black/10" />
        <span
          className={`absolute right-3 top-3 whitespace-nowrap rounded-xl border px-3 py-1.5 font-mono text-xs font-bold backdrop-blur-sm ${accent.badgeBg} ${accent.badgeBorder} ${accent.text}`}
        >
          {slide.badge}
        </span>
      </div>

      <div className="relative z-10 flex flex-1 flex-col justify-between p-7 pt-5 sm:p-8 sm:pt-5">
        {/* Encabezado */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/40 shadow-inner">
            <span className={accent.text}>{slide.icon}</span>
          </div>
          <div>
            <span
              className={`block font-mono text-xs font-bold uppercase tracking-wider ${accent.text}`}
            >
              {slide.category}
            </span>
            <span className="block text-xs text-nf-gray-500">
              Item {index + 1} de {count}
            </span>
          </div>
        </div>

        {/* Contenido animado */}
        <div className="relative z-10 my-5 min-h-[92px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <h3 className="mb-2.5 font-display text-2xl font-bold text-white sm:text-3xl">
                {slide.title}
              </h3>
              <p className="text-sm leading-relaxed text-nf-gray-300 sm:text-[15px]">
                {slide.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Controles */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-4">
          <div className="flex gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.title}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Ir al slide ${i + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index ? `w-6 ${accent.dot}` : "w-2 bg-white/20 hover:bg-white/35"
                }`}
              />
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={prev}
              aria-label="Anterior"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-black/30 text-white transition-colors hover:bg-black/55"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Siguiente"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-black/30 text-white transition-colors hover:bg-black/55"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
