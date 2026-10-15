type StatusBadgeProps = {
  status: string;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  const styles =
    normalized === "completed"
      ? "bg-[#e7f7ee] text-[#15845f]"
      : normalized === "invalid"
        ? "bg-[#fff0ed] text-[#b64641]"
        : "bg-[#e9f4ff] text-[#227cbd]";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${styles}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {status}
    </span>
  );
}