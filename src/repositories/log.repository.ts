import { db } from "@/db/sqlite";
import { DayOfWeek, HabitStats } from "@/types/habit";
import { toLocalDate } from "@/lib/date";
import { computeStats, HabitStatsResult } from "@/lib/streak";

export type { HabitStatsResult };

export type HabitLogRow = {
  date: string;
  completed: number;
};

export const logRepository = {
  async getLogsForDate(
    date: string,
  ): Promise<{ habit_id: string; progress: number; completed: number }[]> {
    try {
      return await db.getAllAsync<{
        habit_id: string;
        progress: number;
        completed: number;
      }>(
        `SELECT habit_id, progress, completed FROM habit_logs WHERE date = ?`,
        [date],
      );
    } catch (error) {
      if (__DEV__) console.warn("[LogRepo]", error);
      return [];
    }
  },

  async getHabitLogs(habitId: string, days: number = 365): Promise<string[]> {
    try {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - days);
      const thresholdStr = toLocalDate(threshold);

      const rows = await db.getAllAsync<{ date: string }>(
        `SELECT date FROM habit_logs
         WHERE habit_id = ? AND completed = 1
         AND date >= ?
         ORDER BY date ASC`,
        [habitId, thresholdStr],
      );
      return rows.map((r) => r.date);
    } catch (error) {
      if (__DEV__) console.warn("[LogRepo]", error);
      return [];
    }
  },

  async getHabitProgress(
    habitId: string,
    days: number = 365,
  ): Promise<Record<string, number>> {
    try {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - days);
      const thresholdStr = toLocalDate(threshold);

      const rows = await db.getAllAsync<{ date: string; progress: number }>(
        `SELECT date, progress FROM habit_logs
         WHERE habit_id = ? AND date >= ?
         ORDER BY date ASC`,
        [habitId, thresholdStr],
      );

      const result: Record<string, number> = {};
      for (const row of rows) {
        result[row.date] = row.progress;
      }
      return result;
    } catch (error) {
      if (__DEV__) console.warn("[LogRepo]", error);
      return {};
    }
  },

  async getAppWideLogs(days: number = 365): Promise<Record<string, number>> {
    try {
      const threshold = new Date();
      threshold.setDate(threshold.getDate() - days);
      const thresholdStr = toLocalDate(threshold);

      // Count how many distinct habits were completed each day
      const rows = await db.getAllAsync<{ date: string; count: number }>(
        `SELECT date, COUNT(habit_id) as count 
         FROM habit_logs
         WHERE completed = 1 AND date >= ?
         GROUP BY date
         ORDER BY date ASC`,
        [thresholdStr],
      );

      const result: Record<string, number> = {};
      for (const row of rows) {
        result[row.date] = row.count;
      }
      return result;
    } catch (error) {
      if (__DEV__) console.warn("[LogRepo]", error);
      return {};
    }
  },

  async getHabitStats(habitId: string): Promise<HabitStatsResult> {
    try {
      const [rows, habit] = await Promise.all([
        db.getAllAsync<{ date: string }>(
          `SELECT date FROM habit_logs WHERE habit_id = ? AND completed = 1`,
          [habitId],
        ),
        db.getFirstAsync<{ days: string }>(
          `SELECT days FROM habits WHERE id = ?`,
          [habitId],
        ),
      ]);
      return computeStats(
        rows.map((r) => r.date),
        JSON.parse(habit?.days || "[]"),
      );
    } catch (error) {
      if (__DEV__) console.warn("[LogRepo]", error);
      return computeStats([], []);
    }
  },

  async getAllHabitsStats(): Promise<Record<string, HabitStats>> {
    try {
      const [rows, habits] = await Promise.all([
        db.getAllAsync<{ habit_id: string; date: string }>(
          `SELECT habit_id, date FROM habit_logs WHERE completed = 1`,
        ),
        db.getAllAsync<{ id: string; days: string }>(
          `SELECT id, days FROM habits`,
        ),
      ]);

      const logsByHabit: Record<string, string[]> = {};
      for (const row of rows) (logsByHabit[row.habit_id] ??= []).push(row.date);

      // Habits with no completions get no entry, as before.
      const stats: Record<string, HabitStats> = {};
      for (const { id, days } of habits) {
        if (!logsByHabit[id]) continue;
        const habitDays: DayOfWeek[] = JSON.parse(days || "[]");
        stats[id] = { habitId: id, ...computeStats(logsByHabit[id], habitDays) };
      }
      return stats;
    } catch (error) {
      if (__DEV__) console.warn("[LogRepo]", error);
      return {};
    }
  },

  async saveProgress(
    habitId: string,
    date: string,
    progress: number,
    completed: boolean,
  ) {
    try {
      await db.runAsync(
        `
      INSERT OR REPLACE INTO habit_logs (
        id,
        habit_id,
        date,
        completed,
        progress,
        completed_at
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
        [
          `${habitId}-${date}`,
          habitId,
          date,
          completed ? 1 : 0,
          progress,
          new Date().toISOString(),
        ],
      );
    } catch (error) {
      if (__DEV__) console.warn("[LogRepo]", error);
    }
  },

  async deleteHabitLog(habitId: string, date: string) {
    try {
      await db.runAsync(
        `
      DELETE FROM habit_logs
      WHERE habit_id = ?
      AND date = ?
      `,
        [habitId, date],
      );
    } catch (error) {
      if (__DEV__) console.warn("[LogRepo]", error);
    }
  },
};
