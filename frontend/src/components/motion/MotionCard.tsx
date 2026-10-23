
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

type MotionCardProps = {
  children: ReactNode;
  index?: number;
  className?: string;
};

export function MotionCard({
  children,
  index = 0,
  className = "",
}: MotionCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={
        reduceMotion ? false : { opacity: 0, y: 14 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index, 8) * 0.055,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}
