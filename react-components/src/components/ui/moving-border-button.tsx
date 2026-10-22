import { motion, useAnimationFrame, useMotionTemplate, useMotionValue, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MovingBorderButtonProps {
  label?: string;
  onClick?: () => void;
  block?: boolean;
  duration?: number;
}

export function MovingBorderButton({
  label = "Continuar",
  onClick,
  block = false,
  duration = 2600,
}: MovingBorderButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={cn(
        "relative inline-flex items-center justify-center overflow-hidden rounded-full p-[3px]",
        block ? "w-full" : "w-auto",
      )}
      style={{
        transform: isPressed ? "translateY(2px)" : "translateY(0)",
        transition: "transform .12s ease",
      }}
    >
      <span className="absolute inset-0 rounded-full">
        <MovingBorder duration={duration} rx="50%" ry="50%">
          <div className="h-16 w-16 opacity-90 bg-[radial-gradient(circle,_#c084fc_0%,_#6d28d9_60%,_transparent_80%)]" />
        </MovingBorder>
      </span>
      <span
        className={cn(
          "relative z-10 inline-flex w-full items-center justify-center gap-2 rounded-full px-[23px] py-[11px]",
          "font-body text-[15px] font-bold text-nf-black",
        )}
        style={{
          background: "linear-gradient(160deg, #d4ff8a 0%, #b6ff3c 55%, #9ee61f 100%)",
          boxShadow: isPressed
            ? "0 3px 0 0 #241040"
            : "0 6px 0 0 #241040, inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -8px 12px rgba(0,0,0,0.12)",
        }}
      >
        {label}
      </span>
    </button>
  );
}

function MovingBorder({
  children,
  duration = 2600,
  rx,
  ry,
}: {
  children: React.ReactNode;
  duration?: number;
  rx?: string;
  ry?: string;
}) {
  const pathRef = useRef<SVGRectElement>(null);
  const progress = useMotionValue<number>(0);

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength();
    if (length) {
      const pxPerMillisecond = length / duration;
      progress.set((time * pxPerMillisecond) % length);
    }
  });

  const x = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val).x ?? 0);
  const y = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val).y ?? 0);
  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`;

  return (
    <>
      <svg
        preserveAspectRatio="none"
        className="absolute h-full w-full"
        width="100%"
        height="100%"
      >
        <rect fill="none" width="100%" height="100%" rx={rx} ry={ry} ref={pathRef} />
      </svg>
      <motion.div style={{ position: "absolute", top: 0, left: 0, display: "inline-block", transform }}>
        {children}
      </motion.div>
    </>
  );
}
