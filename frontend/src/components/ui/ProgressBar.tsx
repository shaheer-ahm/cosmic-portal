type ProgressBarProps = {
  value: number;
};

export default function ProgressBar({ value }: ProgressBarProps) {
  const percentage = Math.min(Math.max(value, 0), 100);

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-[#e9f0f6]">
      <div
        className="h-full rounded-full bg-[#3fba92] transition-all"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}