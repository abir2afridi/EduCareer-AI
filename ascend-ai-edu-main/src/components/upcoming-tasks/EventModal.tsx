import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

export type EventFormValues = {
  title: string;
  description?: string;
  date: Date;
  time?: string | null;
  category?: string | null;
};

export interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate: Date | null;
  onSubmit: (values: EventFormValues) => Promise<void> | void;
  isSubmitting?: boolean;
}

const formatDateInputValue = (date: Date | null) => {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
};

export function EventModal({ isOpen, onClose, initialDate, onSubmit, isSubmitting = false }: EventModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [time, setTime] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (isOpen) {
      setDateInput(formatDateInputValue(initialDate ?? new Date()));
    }
  }, [isOpen, initialDate]);

  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setDescription("");
      setTime("");
      setCategory("");
    }
  }, [isOpen]);

  const selectedDate = useMemo(() => {
    if (!dateInput) return null;
    const isoString = `${dateInput}T00:00:00`;
    const parsedDate = new Date(isoString);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }, [dateInput]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedDate || !title.trim()) {
      return;
    }

    await onSubmit({
      title: title.trim(),
      description: description.trim() ? description.trim() : undefined,
      date: selectedDate,
      time: time ? time : null,
      category: category ? category.trim() : null,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="max-w-lg rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create Event</DialogTitle>
          <DialogDescription>Select a date and add a personal reminder.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Exam revision, project check-in, ..."
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={dateInput}
                onChange={(event) => setDateInput(event.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time (optional)</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category (optional)</Label>
            <Input
              id="category"
              placeholder="Exam, Project, Meeting..."
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add notes, goals, or prep steps..."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="rounded-xl" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl" disabled={isSubmitting || !selectedDate || !title.trim()}>
              {isSubmitting ? "Saving..." : "Save Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
