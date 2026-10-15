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
      <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.15em] text-[#6a7f99]">
        {label}
      </span>

      <div className="flex items-center rounded-lg border border-[#dce5ee] bg-[#f8fbff] px-3">
        <input
          {...props}
          className={`min-w-0 flex-1 bg-transparent py-3 text-sm text-[#172f50] outline-none placeholder:text-[#94a5b8] ${className}`}
        />

        {suffix && (
          <span className="ml-2 text-xs text-[#71849a]">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}