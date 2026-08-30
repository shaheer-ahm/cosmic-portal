type StatusBadgeProps = {
  status: string;
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toLowerCase();

  const styles =
    normalized === "completed"
      ? "bg-green-500/15 text-green-400"
      : normalized === "invalid"
        ? "bg-red-500/15 text-red-400"
        : "bg-indigo-500/15 text-indigo-400";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${styles}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" />
      {status}
    </span>
  );
}