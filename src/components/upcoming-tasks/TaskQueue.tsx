import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarDays, Clock, Folder, Loader2 } from "lucide-react";
import { format, formatDistanceToNowStrict, isBefore, differenceInCalendarDays } from "date-fns";
import type { UserEventView } from "@/data/events";
import { CountdownTimer } from "./CountdownTimer";
import { AnimatedProgressBar } from "./AnimatedProgressBar";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export interface TaskQueueProps {
  events: UserEventView[];
  isLoading?: boolean;
  className?: string;
}

const getEventDateTime = (event: UserEventView): Date => {
  const dateTime = new Date(event.date);
  if (event.time) {
    const [hours, minutes] = event.time.split(":").map((value) => Number(value));
    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      dateTime.setHours(hours, minutes, 0, 0);
      return dateTime;
    }
  }
  dateTime.setHours(23, 59, 59, 999);
  return dateTime;
};

export function TaskQueue({ events, isLoading = false, className = "" }: TaskQueueProps) {
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => getEventDateTime(a).getTime() - getEventDateTime(b).getTime());
  }, [events]);

  if (isLoading) {
    return (
      <div className={`flex h-full min-h-[320px] items-center justify-center rounded-3xl border border-border/60 bg-background/70 ${className}`.trim()}>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your tasks...
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-full flex-col rounded-3xl border border-border/60 bg-background/70 shadow-lg ${className}`.trim()}>
      <div className="border-b border-border/60 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Task Queue</h2>
            <p className="text-sm text-muted-foreground">Upcoming events sorted by nearest deadline</p>
          </div>
          <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
            {sortedEvents.length} event{sortedEvents.length === 1 ? "" : "s"}
          </Badge>
        </div>
      </div>

      <ScrollArea className="h-full max-h-[540px]">
        <div className="space-y-4 p-5">
          {sortedEvents.length === 0 && (
            <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl border border-dashed border-border/70 bg-muted/30 p-6 text-center">
              <div className="h-40 w-40">
                <DotLottieReact
                  src="https://lottie.host/4789df81-167c-4a79-80d7-7abfae7198cb/JdQftTnV3L.lottie"
                  loop
                  autoplay
                  className="h-full w-full"
                />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">No tasks yet</h3>
                <p className="text-sm text-muted-foreground">
                  Tap a date on the calendar to plan your next milestone.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="mt-2 rounded-xl" 
                onClick={() => {
                  // This will be handled by the parent component
                  const calendarButton = document.querySelector('button[aria-label*="calendar"]');
                  if (calendarButton) {
                    (calendarButton as HTMLElement).click();
                  }
                }}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Open Calendar
              </Button>
            </div>
          )}

          {sortedEvents.map((event) => {
            const eventDateTime = getEventDateTime(event);
            const isPast = isBefore(eventDateTime, new Date());
            const dayDiff = differenceInCalendarDays(eventDateTime, new Date());
            const createdAtLabel = format(event.createdAt, "MMM d, yyyy 'at' p");
            const dayDiffLabel = dayDiff > 0 ? `${dayDiff} day${dayDiff === 1 ? "" : "s"} left` : "Due today";
            const targetLabel = format(eventDateTime, "MMM d, yyyy");
            const timeLabel = event.time ? format(eventDateTime, "p") : "All day";

            return (
              <div
                key={event.id}
                className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-background/90 p-5 shadow-sm transition hover:shadow-md"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">{event.title}</h3>
                      <Badge variant={isPast ? "destructive" : "outline"} className="rounded-full">
                        {isPast ? "Past event" : dayDiffLabel}
                      </Badge>
                      {event.category && (
                        <Badge variant="secondary" className="rounded-full bg-sky-500/15 text-sky-500">
                          <Folder className="mr-1 h-3 w-3" />
                          {event.category}
                        </Badge>
                      )}
                    </div>
                    {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4" /> {targetLabel}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" /> {timeLabel}
                      </span>
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" /> Set {formatDistanceToNowStrict(event.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <CountdownTimer targetDate={eventDateTime} />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
                      <span>Progress</span>
                      <span>{format(event.createdAt, "MMM d")} → {format(eventDateTime, "MMM d")}</span>
                    </div>
                    <AnimatedProgressBar startDate={event.createdAt} endDate={eventDateTime} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
