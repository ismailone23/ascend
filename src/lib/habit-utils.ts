import { Habit } from "@/types/habit";

/** Get a formatted string representing the habit's frequency */
export function getFrequencyLabel(
  habit: Habit,
  dailyLabel: string = "Every Day",
): string {
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

/**
 * A habit's progress after one more log. A finished habit steps back by one
 * (undo the last log) instead of wiping the whole day.
 */
export function nextProgress(
  progress: number,
  done: boolean,
  dailyGoal: number,
) {
  const next = done ? Math.min(progress, dailyGoal) - 1 : progress + 1;
  return { progress: next, isCompleted: next >= dailyGoal };
}
