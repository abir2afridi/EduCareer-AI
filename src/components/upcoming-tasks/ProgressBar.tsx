import { useEffect, useState } from "react";

export interface ProgressBarProps {
  startDate: Date;
  endDate: Date;
  className?: string;
}

const calculateProgress = (start: Date, end: Date): number => {
  const now = Date.now();
  const total = end.getTime() - start.getTime();
  if (total <= 0) return 100;

  const elapsed = now - start.getTime();
  const ratio = Math.min(Math.max(elapsed / total, 0), 1);
  return ratio * 100;
};

export function ProgressBar({ startDate, endDate, className = "" }: ProgressBarProps) {
  const [progress, setProgress] = useState(() => calculateProgress(startDate, endDate));

  useEffect(() => {
    setProgress(calculateProgress(startDate, endDate));
    const interval = setInterval(() => {
      setProgress(calculateProgress(startDate, endDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [startDate, endDate]);

  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-muted ${className}`.trim()}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 transition-all duration-700"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
