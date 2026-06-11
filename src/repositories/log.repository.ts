import { db } from "@/db/sqlite";
import { HabitStats } from "@/types/habit";

/** Format Date as YYYY-MM-DD in local timezone (matches dayjs format) */
function toLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type HabitLogRow = {
  date: string;
  completed: number;
};

export type HabitStatsResult = {
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  completionRate: number;
};

export const logRepository = {
  async getLogsForDate(
    date: string,
  ): Promise<{ habit_id: string; progress: number; completed: number }[]> {
    try {
      return await db.getAllAsync<{ habit_id: string; progress: number; completed: number }>(
        `SELECT habit_id, progress, completed FROM habit_logs WHERE date = ?`,
        [date],
      );
    } catch (error) {
      console.log({ error });
      return [];
    }
  },

  async getHabitLogs(
    habitId: string,
    days: number = 365,
  ): Promise<string[]> {
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
      console.log({ error });
      return [];
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
      console.log({ error });
      return {};
    }
  },

  async getHabitStats(habitId: string): Promise<HabitStatsResult> {
    try {
      const rows = await db.getAllAsync<{ date: string }>(
        `SELECT date FROM habit_logs
         WHERE habit_id = ? AND completed = 1
         ORDER BY date DESC`,
        [habitId],
      );

      const totalCompletions = rows.length;
      if (totalCompletions === 0) {
        return { currentStreak: 0, bestStreak: 0, totalCompletions: 0, completionRate: 0 };
      }

      const dates = new Set(rows.map((r) => r.date));

      let currentStreak = 0;
      const today = new Date();
      const todayStr = toLocalDate(today);

      const checkDate = new Date(today);
      if (!dates.has(todayStr)) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (true) {
        const dateStr = toLocalDate(checkDate);
        if (dates.has(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      const sortedDates = Array.from(dates).sort();
      let bestStreak = 1;
      let streak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i - 1] + "T12:00:00");
        prevDate.setDate(prevDate.getDate() + 1);
        const expectedNext = toLocalDate(prevDate);

        if (sortedDates[i] === expectedNext) {
          streak++;
          bestStreak = Math.max(bestStreak, streak);
        } else {
          streak = 1;
        }
      }

      // Completion rate: completions / days since first completion
      const firstDate = new Date(sortedDates[0] + "T12:00:00");
      const daysSinceFirst =
        Math.floor((today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const completionRate = Math.round((totalCompletions / Math.max(daysSinceFirst, 1)) * 100);

      return { currentStreak, bestStreak, totalCompletions, completionRate };
    } catch (error) {
      console.log({ error });
      return { currentStreak: 0, bestStreak: 0, totalCompletions: 0, completionRate: 0 };
    }
  },

  async getAllHabitsStats(): Promise<Record<string, HabitStats>> {
    try {
      const rows = await db.getAllAsync<{ habit_id: string; date: string }>(
        `SELECT habit_id, date FROM habit_logs WHERE completed = 1 ORDER BY date DESC`
      );

      const logsByHabit: Record<string, string[]> = {};
      for (const row of rows) {
        if (!logsByHabit[row.habit_id]) logsByHabit[row.habit_id] = [];
        logsByHabit[row.habit_id].push(row.date);
      }

      const stats: Record<string, HabitStats> = {};
      const today = new Date();
      const todayStr = toLocalDate(today);

      for (const [habitId, datesArray] of Object.entries(logsByHabit)) {
        const totalCompletions = datesArray.length;
        const dates = new Set(datesArray);

        let currentStreak = 0;
        const checkDate = new Date(today);
        if (!dates.has(todayStr)) {
          checkDate.setDate(checkDate.getDate() - 1);
        }

        while (true) {
          const dateStr = toLocalDate(checkDate);
          if (dates.has(dateStr)) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            break;
          }
        }

        const sortedDates = Array.from(dates).sort();
        let bestStreak = 1;
        let streak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const prevDate = new Date(sortedDates[i - 1] + "T12:00:00");
          prevDate.setDate(prevDate.getDate() + 1);
          if (sortedDates[i] === toLocalDate(prevDate)) {
            streak++;
            bestStreak = Math.max(bestStreak, streak);
          } else {
            streak = 1;
          }
        }

        const firstDate = new Date(sortedDates[0] + "T12:00:00");
        const daysSinceFirst = Math.floor((today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const completionRate = Math.round((totalCompletions / Math.max(daysSinceFirst, 1)) * 100);

        stats[habitId] = { habitId, currentStreak, bestStreak, totalCompletions, completionRate };
      }

      return stats;
    } catch (error) {
      console.log({ error });
      return {};
    }
  },

  async saveProgress(habitId: string, date: string, progress: number, completed: boolean) {
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
        [`${habitId}-${date}`, habitId, date, completed ? 1 : 0, progress, new Date().toISOString()],
      );
    } catch (error) {
      console.log({ error });
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
      console.log({ error });
    }
  },
};

