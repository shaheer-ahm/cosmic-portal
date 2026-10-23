
import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "motion/react";

type AnimatedNumberProps = {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
};

export function AnimatedNumber({
  value,
  decimals = 0,
  suffix = "",
  className = "",
}: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;

    const controls = animate(0, value, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: setDisplay,
    });

    return () => controls.stop();
  }, [value, reduceMotion]);

  const shown = reduceMotion ? value : display;

  return (
    <span className={className}>
      {shown.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
