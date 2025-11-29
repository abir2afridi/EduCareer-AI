import { useMemo, useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/upcoming-tasks/Calendar";
import { EventModal, type EventFormValues } from "@/components/upcoming-tasks/EventModal";
import { TaskQueue } from "@/components/upcoming-tasks/TaskQueue";
import { createUserEvent } from "@/lib/firebaseHelpers";
import { useUserEvents } from "@/hooks/useUserEvents";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export default function Tasks() {
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const { toast } = useToast();

  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { events, isLoading, error } = useUserEvents(uid);

  const highlightedDates = useMemo(() => events.map((event) => event.date), [events]);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleCreateEvent = async (values: EventFormValues) => {
    if (!uid) return;

    setIsSubmitting(true);
    try {
      await createUserEvent(uid, {
        title: values.title,
        description: values.description,
        date: values.date,
        time: values.time ?? null,
        category: values.category ?? null,
      });

      setIsModalOpen(false);
      toast({
        title: "Event added",
        description: `Saved for ${format(values.date, "MMMM d, yyyy")}`,
      });
    } catch (err) {
      console.error("Failed to create event", err);
      toast({
        title: "Could not save event",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!uid) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center space-y-6 rounded-3xl border border-border/60 bg-background/80 p-10 text-center shadow-lg">
        <div className="h-48 w-48">
          <DotLottieReact
            src="https://lottie.host/4789df81-167c-4a79-80d7-7abfae7198cb/JdQftTnV3L.lottie"
            loop
            autoplay
            className="h-full w-full"
          />
        </div>
        <h1 className="text-3xl font-semibold text-foreground">Upcoming Tasks</h1>
        <p className="text-muted-foreground">
          Sign in or create a student account to plan personal events and keep track of upcoming milestones.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="grid gap-4 rounded-3xl border border-border/60 bg-background/70 p-6 shadow-lg md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 flex-shrink-0">
              <DotLottieReact
                src="https://lottie.host/4789df81-167c-4a79-80d7-7abfae7198cb/JdQftTnV3L.lottie"
                loop
                autoplay
                className="h-full w-full"
              />
            </div>
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-border/60 px-3 py-1 text-xs uppercase tracking-widest text-muted-foreground">
                Personal Planner
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Upcoming Tasks & Events</h1>
          <p className="text-sm text-muted-foreground">
            Build your personal roadmap, track deadlines, and stay accountable with live countdowns.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button className="rounded-xl" onClick={() => handleDateClick(new Date())}>
              Plan something today
            </Button>
            <Button variant="outline" className="rounded-xl" onClick={() => setIsModalOpen(true)}>
              Quick add event
            </Button>
          </div>
        </div>
        <div className="relative flex items-center justify-center overflow-hidden p-0">
          <div className="h-full w-full">
            <DotLottieReact
              src="https://lottie.host/4789df81-167c-4a79-80d7-7abfae7198cb/JdQftTnV3L.lottie"
              loop
              autoplay
              className="h-full w-full scale-110"
            />
          </div>
        </div>
      </header>

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600 dark:border-rose-500/40 dark:bg-rose-500/10">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] xl:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <Calendar
          currentDate={currentMonth}
          selectedDate={selectedDate}
          onDateChange={handleDateClick}
          onMonthChange={(date) => setCurrentMonth(date)}
          highlightedDates={highlightedDates}
          className="min-h-[520px]"
        />

        <TaskQueue events={events} isLoading={isLoading} />
      </div>

      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialDate={selectedDate ?? new Date()}
        onSubmit={handleCreateEvent}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
