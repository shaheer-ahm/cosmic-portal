import type { InputHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  suffix?: string;
};

export function Field({
  label,
  suffix,
  className = "",
  ...props
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-[#777d92]">
        {label}
      </span>

      <div className="flex items-center rounded-xl border border-[#343842] bg-[#191c22] px-3">
        <input
          {...props}
          className={`min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-[#555b6e] ${className}`}
        />

        {suffix && (
          <span className="ml-2 text-xs text-[#686f84]">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}