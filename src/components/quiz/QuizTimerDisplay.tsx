import { memo, useMemo, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface QuizTimerDisplayProps {
  totalSeconds: number;
  remainingSeconds: number;
  isExpired?: boolean;
  className?: string;
  style?: CSSProperties;
}

const pad = (value: number) => value.toString().padStart(2, "0");

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${pad(minutes)}:${pad(remaining)}`;
};

const QuizTimerDisplay = memo(function QuizTimerDisplay({ totalSeconds, remainingSeconds, isExpired = false, className, style }: QuizTimerDisplayProps) {
  const normalizedTotal = Math.max(totalSeconds, 0);
  const normalizedRemaining = Math.min(Math.max(remainingSeconds, 0), normalizedTotal || remainingSeconds);

  const { timeLabel, progressDegrees } = useMemo(() => {
    const safeTotal = normalizedTotal > 0 ? normalizedTotal : 1;
    const fraction = Math.min(Math.max(normalizedRemaining / safeTotal, 0), 1);
    return {
      timeLabel: formatTime(normalizedRemaining),
      progressDegrees: fraction * 360,
    };
  }, [normalizedTotal, normalizedRemaining]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-border/60 bg-background/80 px-4 py-2 shadow-sm backdrop-blur",
        className,
      )}
      style={style}
    >
      <div className="relative h-14 w-14">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(var(--progress-color, #2563eb) ${progressDegrees}deg, rgba(226, 232, 240, 0.4) ${progressDegrees}deg)`,
          }}
        />
        <div className="absolute inset-[6px] rounded-full bg-background/95 shadow-inner" />
        <div className="relative flex h-full w-full items-center justify-center">
          <span className={cn("text-sm font-semibold", isExpired ? "text-rose-600" : "text-primary")}>⏱️</span>
        </div>
      </div>
      <div className="flex flex-col text-left">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Time left</span>
        <span className={cn("text-xl font-semibold tabular-nums", isExpired ? "text-rose-600" : "text-foreground")}>{timeLabel}</span>
      </div>
    </div>
  );
});

export default QuizTimerDisplay;
