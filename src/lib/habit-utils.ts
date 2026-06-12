import { Habit } from "@/types/habit";

/** Get a formatted string representing the habit's frequency */
export function getFrequencyLabel(habit: Habit, dailyLabel: string = "Every Day"): string {
  if (!habit.days || habit.days.length === 0) return "";
  if (habit.days.length === 7) return dailyLabel;
  return habit.days.join(", ");
}

/** Formats an ISO datetime string into a readable date (e.g. "Oct 15, 2026") */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
