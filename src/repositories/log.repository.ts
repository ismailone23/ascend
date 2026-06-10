import { db } from "@/db/sqlite";

export const logRepository = {
  async completeHabit(habitId: string, date: string) {
    try {
      await db.runAsync(
        `
      INSERT OR REPLACE INTO habit_logs (
        id,
        habit_id,
        date,
        completed,
        completed_at
      )
      VALUES (?, ?, ?, 1, ?)
      `,
        [`${habitId}-${date}`, habitId, date, new Date().toISOString()],
      );
    } catch (error) {
      console.log({ error });
    }
  },

  async incompleteHabit(habitId: string, date: string) {
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
