import { useEffect, useState } from "react";
import { differenceInMilliseconds } from "date-fns";

const formatTimeLeft = (target: Date): {
  isPast: boolean;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
} => {
  const now = new Date();
  const diffMs = differenceInMilliseconds(target, now);

  if (diffMs <= 0) {
    return {
      isPast: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / (60 * 60 * 24));
  const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  return { isPast: false, days, hours, minutes, seconds };
};

export interface CountdownTimerProps {
  targetDate: Date;
  className?: string;
}

export function CountdownTimer({ targetDate, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState(() => formatTimeLeft(targetDate));

  useEffect(() => {
    setTimeLeft(formatTimeLeft(targetDate));
    const interval = setInterval(() => {
      setTimeLeft(formatTimeLeft(targetDate));
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [targetDate]);

  if (timeLeft.isPast) {
    return <span className={`text-sm font-medium text-rose-500 ${className}`.trim()}>Event has passed</span>;
  }

  const segments = [
    { label: "Days", value: timeLeft.days },
    { label: "Hours", value: timeLeft.hours },
    { label: "Minutes", value: timeLeft.minutes },
    { label: "Seconds", value: timeLeft.seconds },
  ];

  return (
    <div className={`flex flex-wrap gap-2 ${className}`.trim()}>
      {segments.map((segment) => (
        <div
          key={segment.label}
          className="flex min-w-[70px] flex-1 items-center justify-center rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-center shadow-sm"
        >
          <div>
            <div className="text-lg font-semibold text-foreground">{segment.value.toString().padStart(2, "0")}</div>
            <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{segment.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
