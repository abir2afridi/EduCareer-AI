import { addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, subMonths, addDays } from "date-fns";
import { cn } from "@/lib/utils";

export interface CalendarProps {
  currentDate: Date;
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
  onMonthChange?: (date: Date) => void;
  highlightedDates?: Date[];
  className?: string;
}

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function Calendar({
  currentDate,
  selectedDate,
  onDateChange,
  onMonthChange,
  highlightedDates = [],
  className,
}: CalendarProps) {
  const startMonth = startOfMonth(currentDate);
  const endMonth = endOfMonth(currentDate);
  const startDate = startOfWeek(startMonth, { weekStartsOn: 0 });
  const endDate = endOfWeek(endMonth, { weekStartsOn: 0 });

  const calendarDays: Date[] = [];
  let day = startDate;

  while (day <= endDate) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  const isHighlighted = (date: Date) => highlightedDates.some((highlighted) => isSameDay(highlighted, date));

  const handlePrevMonth = () => {
    const newDate = subMonths(currentDate, 1);
    onMonthChange?.(newDate);
  };

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    onMonthChange?.(newDate);
  };

  return (
    <div className={cn("rounded-3xl border border-border/60 bg-background/70 p-6 shadow-lg", className)}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">{format(currentDate, "MMMM yyyy")}</h2>
            <p className="text-sm text-muted-foreground">Tap a date to plan a task</p>
          </div>
          <div className="flex items-center gap-2 self-start">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/90 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              aria-label="Previous month"
            >
              &larr;
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/90 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              aria-label="Next month"
            >
              &rarr;
            </button>
          </div>
        </div>

        <div className="grid gap-2">
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {weekdayLabels.map((label) => (
              <div key={label} className="py-2">
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 text-sm">
            {calendarDays.map((calendarDay) => {
              const isCurrentMonth = isSameMonth(calendarDay, currentDate);
              const isSelected = selectedDate ? isSameDay(calendarDay, selectedDate) : false;
              const highlighted = isHighlighted(calendarDay);
              return (
                <button
                  key={calendarDay.toISOString()}
                  type="button"
                  onClick={() => onDateChange(calendarDay)}
                  className={cn(
                    "relative flex min-h-[82px] flex-col items-center justify-between rounded-2xl border p-3 text-sm transition",
                    isCurrentMonth ? "bg-background/90" : "bg-muted/60 text-muted-foreground",
                    "hover:border-primary/50 hover:shadow-sm",
                    isSelected && "border-primary bg-primary/10 text-primary",
                    highlighted && !isSelected && "border-primary/40",
                  )}
                >
                  <span className="self-end text-xs font-medium">{format(calendarDay, "d")}</span>
                  {highlighted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                      Event
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
