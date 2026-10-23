
import { useId, useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";

type PackedItem = {
  Sequence: number;
  InstanceId: string;
  ItemCode: string;
  ItemReference: string;
  Position: {
    X: number;
    Y: number;
    Z: number;
  };
  Dimensions: {
    Width: number;
    Length: number;
    Depth: number;
  };
  Orientation: {
    Code: string;
  };
  Weight: number;
};

type PackedBox = {
  BoxIndex: number;
  Reference: string;
  BoxGroup?: string | null;
  Dimensions: {
    Width: number;
    Length: number;
    Depth: number;
  };
  ItemCount: number;
  TotalWeight: number;
  MaxWeight?: number | null;
  VolumeUtilisation: number;
  Items: PackedItem[];
};

type PackingPlanBoxProps = {
  box: PackedBox;
  visualizerUrl: string;
};

export function PackingPlanBox({
  box,
  visualizerUrl,
}: PackingPlanBoxProps) {
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();
  const detailsId = useId();

  const utilisation = box.VolumeUtilisation * 100;
  const boxNumber = box.BoxIndex + 1;

  return (
    <motion.div
      className="group overflow-hidden rounded-2xl border border-[#dce5ee] bg-white shadow-sm transition-colors duration-200 hover:border-[#85b6e5] hover:bg-[#f3f8ff] focus-within:border-[#85b6e5] focus-within:bg-[#f3f8ff]"
      whileHover={
        reduceMotion
          ? undefined
          : { y: -3 }
      }
      transition={{ duration: 0.2 }}
    >
      <div className="p-4 sm:p-5">
        {/* Box header */}
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#e7f3ff] text-[#2582ce]">
            <Box className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-[#172f50]">
              Box {boxNumber}
            </h3>

            <p className="mt-1 break-words text-xs text-[#236eaf]">
              {box.Reference}
            </p>

            {box.BoxGroup && (
              <p className="mt-1 text-xs text-[#6a7f99]">
                Group: {box.BoxGroup}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full bg-[#eaf9f0] px-2.5 py-1 text-xs font-semibold text-[#137452]">
              {box.ItemCount}{" "}
              {box.ItemCount === 1 ? "item" : "items"}
            </span>

            <motion.button
              type="button"
              onClick={() =>
                setExpanded((current) => !current)
              }
              aria-label={
                expanded
                  ? `Collapse Box ${boxNumber} details`
                  : `Expand Box ${boxNumber} details`
              }
              aria-expanded={expanded}
              aria-controls={detailsId}
              whileTap={
                reduceMotion
                  ? undefined
                  : { scale: 0.92 }
              }
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#dce5ee] bg-white text-[#416c9c] transition-colors hover:border-[#70a9df] hover:bg-[#e0efff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2686d5]"
            >
              <motion.span
                animate={{
                  rotate: expanded ? 180 : 0,
                }}
                transition={{
                  duration: reduceMotion ? 0 : 0.25,
                }}
              >
                <ChevronDown className="h-5 w-5" />
              </motion.span>
            </motion.button>
          </div>
        </div>

        {/* Compact box summary */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
          <div>
            <p className="text-[#70839c]">Weight</p>
            <p className="mt-1 text-[#283f5b]">
              {box.TotalWeight.toFixed(2)} kg /{" "}
              {box.MaxWeight != null
                ? `${box.MaxWeight.toFixed(2)} kg`
                : "no limit"}
            </p>
          </div>

          <div>
            <p className="text-[#70839c]">
              Utilisation
            </p>
            <p className="mt-1 text-[#283f5b]">
              {utilisation.toFixed(1)}%
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <p className="text-[#70839c]">
              Dimensions
            </p>
            <p className="mt-1 text-[#283f5b]">
              {box.Dimensions.Width} ×{" "}
              {box.Dimensions.Length} ×{" "}
              {box.Dimensions.Depth}
            </p>
          </div>
        </div>

        {/* Utilisation bar */}
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e7eef6]">
          <div
            className="h-full rounded-full bg-[#2686d5]"
            style={{
              width: `${Math.max(
                0,
                Math.min(utilisation, 100),
              )}%`,
            }}
          />
        </div>

        {/* Animated packed-item details */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="packing-details"
              id={detailsId}
              initial={
                reduceMotion
                  ? false
                  : {
                      height: 0,
                      opacity: 0,
                    }
              }
              animate={{
                height: "auto",
                opacity: 1,
              }}
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : {
                      height: 0,
                      opacity: 0,
                    }
              }
              transition={{
                duration: reduceMotion ? 0 : 0.35,
                ease: "easeInOut",
              }}
              className="overflow-hidden"
            >
              <div className="mt-5 border-t border-[#e1e9f2] pt-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#7187a0]">
                  Packed Items
                </p>

                <div className="mt-3 space-y-2">
                  {box.Items.map((item) => (
                    <div
                      key={item.InstanceId}
                      className="rounded-xl border border-[#dfe7f1] bg-white p-3 transition-colors hover:border-[#9dc7ed] hover:bg-[#f1f7ff]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold text-[#172f50]">
                            {item.ItemReference}
                          </p>

                          <p className="mt-1 font-mono text-xs text-[#6a7f99]">
                            {item.ItemCode}
                          </p>
                        </div>

                        <span className="shrink-0 text-xs text-[#71849a]">
                          {item.Weight} kg
                        </span>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-[#70839c]">
                            Position
                          </p>
                          <p className="mt-1 text-[#283f5b]">
                            X {item.Position.X}, Y{" "}
                            {item.Position.Y}, Z{" "}
                            {item.Position.Z}
                          </p>
                        </div>

                        <div>
                          <p className="text-[#70839c]">
                            Orientation
                          </p>
                          <p className="mt-1 text-[#283f5b]">
                            {item.Orientation.Code}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <p className="text-[#70839c]">W</p>
                          <p className="mt-1 text-[#283f5b]">
                            {item.Dimensions.Width}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#70839c]">L</p>
                          <p className="mt-1 text-[#283f5b]">
                            {item.Dimensions.Length}
                          </p>
                        </div>
                        <div>
                          <p className="text-[#70839c]">D</p>
                          <p className="mt-1 text-[#283f5b]">
                            {item.Dimensions.Depth}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {box.Items.length === 0 && (
                    <p className="text-xs text-[#71849a]">
                      No packed items in this box.
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Separate visualiser navigation */}
        <div className="mt-4 flex justify-end">
          <Link
            to={visualizerUrl}
            aria-label={`View Box ${boxNumber} in 3D`}
            className="inline-flex items-center gap-2 rounded-lg bg-[#5275bd] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#365d9e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2686d5]"
          >
            View
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
