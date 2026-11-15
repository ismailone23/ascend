import type { DayOfWeek } from "../types/habit";
import { toLocalDate } from "./date";

export const DAY_NAMES: DayOfWeek[] = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
];

export type HabitStatsResult = {
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  completionRate: number;
};

/**
 * Streaks count the days a habit repeats on. A day it is not scheduled for
 * never breaks the streak, and today only breaks it once today is over.
 * `completed` holds the ISO dates the habit was finished; an empty `days`
 * means every day.
 */
export function computeStats(
  completed: string[],
  days: DayOfWeek[],
  today = new Date(),
): HabitStatsResult {
  const done = new Set(completed);
  let currentStreak = 0;
  let bestStreak = 0;
  let due = 0; // days the habit was scheduled for, or done anyway

  if (done.size > 0) {
    const todayStr = toLocalDate(today);
    const day = new Date([...done].sort()[0] + "T12:00:00");
    for (
      let key;
      (key = toLocalDate(day)) <= todayStr;
      day.setDate(day.getDate() + 1)
    ) {
      const scheduled =
        days.length === 0 || days.includes(DAY_NAMES[day.getDay()]);
      if (done.has(key)) currentStreak++;
      else if (scheduled && key !== todayStr) currentStreak = 0;
      if (scheduled || done.has(key)) due++;
      bestStreak = Math.max(bestStreak, currentStreak);
    }
  }

  return {
    currentStreak,
    bestStreak,
    totalCompletions: done.size,
    completionRate: due ? Math.round((done.size / due) * 100) : 0,
  };
}

/**
 * How the last `span` days went: the days the habit was due and how many of
 * them were completed. Days before the habit existed are left out, and today
 * only counts once it is done.
 */
export function recentDays(
  completed: Set<string>,
  days: DayOfWeek[],
  createdAt: string,
  span = 30,
  today = new Date(),
) {
  const start = toLocalDate(new Date(createdAt));
  const day = new Date(today);
  day.setHours(12);
  let due = 0;
  let done = 0;
  for (let i = 0; i < span; i++, day.setDate(day.getDate() - 1)) {
    const key = toLocalDate(day);
    if (key < start) break;
    const scheduled =
      days.length === 0 || days.includes(DAY_NAMES[day.getDay()]);
    if (completed.has(key)) done++;
    if (completed.has(key) || (scheduled && i > 0)) due++;
  }
  return { due, done };
}

/** The streak goal is stored as text; older habits hold "Day", "Week" or "Month". */
export function parseStreakGoal(stored: string | null | undefined): number {
  if (stored === "Week") return 7;
  if (stored === "Month") return 30;
  return Number(stored) || 0; // 0 (and the old "Day") mean no goal
}
