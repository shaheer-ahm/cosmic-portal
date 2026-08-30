import type {
  HTMLAttributes,
  PropsWithChildren,
} from "react";

type CardProps = PropsWithChildren<
  HTMLAttributes<HTMLDivElement>
>;

export function Card({
  children,
  className = "",
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-[24px] border border-[#30343f] bg-[#22252c] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}