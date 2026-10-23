
import type { ReactNode } from "react";
import {
  motion,
  useReducedMotion,
} from "motion/react";

type StatMotionCardProps = {
  children: ReactNode;
  variant?: "blue" | "green" | "amber";
  className?: string;
};

export function StatMotionCard({
  children,
  variant = "blue",
  className = "",
}: StatMotionCardProps) {
  const reduceMotion = useReducedMotion();

  const hoverColors = {
    blue: "hover:border-[#9ac4ed] hover:bg-[#f0f7ff]",
    green: "hover:border-[#99ceb0] hover:bg-[#edf9f2]",
    amber: "hover:border-[#edcf8f] hover:bg-[#fff8eb]",
  };

  return (
    <motion.div
      whileHover={
        reduceMotion ? undefined : { y: -5 }
      }
      whileTap={
        reduceMotion ? undefined : { scale: 0.97 }
      }
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 24,
      }}
      className={`group min-w-0 ${className}`}
    >
      <div
        className={`h-full rounded-2xl border border-[#dce5ee] bg-white p-4 shadow-sm transition-colors duration-200 hover:shadow-lg ${hoverColors[variant]}`}
      >
        {children}
      </div>
    </motion.div>
  );
}
