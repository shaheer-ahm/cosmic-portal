
import { useId, useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronDown } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";

type CollapsibleSectionProps = {
  title: string;
  count: number;
  countLabel: string;
  icon: LucideIcon;
  children: ReactNode;
};

export function CollapsibleSection({
  title,
  count,
  countLabel,
  icon: Icon,
  children,
}: CollapsibleSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const reduceMotion = useReducedMotion();

  return (
    <section className="min-w-0 self-start overflow-hidden rounded-2xl border border-[#dce5ee] bg-white shadow-sm transition-colors duration-200 hover:border-[#85b6e5] hover:bg-[#f3f8ff] focus-within:border-[#85b6e5]">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={detailsId}
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-[#eaf3ff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2686d5] sm:p-5"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e7f3ff] text-[#2582ce]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-[#172f50] sm:text-base">
            {title}
          </span>

          <span className="mt-1 block text-xs text-[#6a7f99]">
            {count} {countLabel}
          </span>
        </span>

        <motion.span
          aria-hidden="true"
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{
            duration: reduceMotion ? 0 : 0.25,
          }}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#dce5ee] bg-white text-[#416c9c]"
        >
          <ChevronDown className="h-5 w-5" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            id={detailsId}
            key="details"
            initial={
              reduceMotion
                ? false
                : { height: 0, opacity: 0 }
            }
            animate={{
              height: "auto",
              opacity: 1,
            }}
            exit={
              reduceMotion
                ? {
                    opacity: 0,
                    transition: { duration: 0 },
                  }
                : { height: 0, opacity: 0 }
            }
            transition={{
              duration: reduceMotion ? 0 : 0.3,
              ease: "easeInOut",
            }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-[#e3ebf3] p-3 sm:p-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
