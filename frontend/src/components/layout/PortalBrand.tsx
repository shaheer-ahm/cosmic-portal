
type PortalBrandProps = {
  compact?: boolean;
};

export function PortalBrand({
  compact = false,
}: PortalBrandProps) {
  return (
    <div className="flex min-w-0 flex-col items-start">
      <img
        src="/thomax-logo.png"
        alt="Thomax"
        className={
          compact
            ? "block h-8 w-auto max-w-[125px] object-contain object-left"
            : "block h-12 w-auto max-w-[190px] object-contain object-left"
        }
      />

      <div className={compact ? "mt-1" : "mt-2"}>
        <p
          className={
            compact
              ? "text-xs font-bold leading-tight text-[#172f50]"
              : "text-base font-bold leading-tight text-[#172f50]"
          }
        >
          Cosmic Fit
        </p>

        {!compact && (
          <p className="mt-1 text-xs text-[#8293a7]">
            Carton optimisation portal
          </p>
        )}
      </div>
    </div>
  );
}
