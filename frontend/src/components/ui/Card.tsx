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
      className={`cf-card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}