import { db } from "@/db/sqlite";
import { parseStreakGoal } from "@/lib/streak";
import { CreateHabitInput, Habit } from "@/types/habit";

export const habitRepository = {
  async getAll(): Promise<Habit[]> {
    try {
      const rows = await db.getAllAsync<any>(`
        SELECT * FROM habits
        ORDER BY position ASC, created_at DESC
      `);

      return rows.map((row) => ({
        id: row.id,
        title: row.title,
        comment: row.comment,
        icon: row.icon,
        days: row.days ? JSON.parse(row.days) : [],
        dailyGoal: row.daily_goal,
        streakGoal: parseStreakGoal(row.streak_goal),
        reminderEnabled: row.reminder_enabled === 1,
        reminderTimes: row.reminder_times ? JSON.parse(row.reminder_times) : [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    } catch (error) {
      if (__DEV__) console.warn("[HabitRepo]", error);
      return [];
    }
  },

  async saveNotificationIds(habitId: string, ids: string[]): Promise<void> {
    await db.runAsync(`UPDATE habits SET notification_ids = ? WHERE id = ?`, [
      JSON.stringify(ids),
      habitId,
    ]);
  },

  async getNotificationIds(habitId: string): Promise<string[]> {
    const row = await db.getFirstAsync<{ notification_ids: string }>(
      `SELECT notification_ids FROM habits WHERE id = ?`,
      [habitId],
    );
    if (!row?.notification_ids) return [];
    try {
      return JSON.parse(row.notification_ids);
    } catch {
      return [];
    }
  },
  async create(habit: CreateHabitInput) {
    const now = new Date().toISOString();

    try {
      await db.runAsync(
        `
        INSERT INTO habits (
        id,
        title,
        comment,
        icon,
        days,
        daily_goal,
        streak_goal,
        reminder_enabled,
        reminder_times,
        created_at,
        updated_at,
        position
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          (SELECT COALESCE(MIN(position), 0) - 1 FROM habits))
        `,
        [
          habit.id,
          habit.title,
          habit.comment ?? null,
          habit.icon,
          JSON.stringify(habit.days),
          habit.dailyGoal,
          String(habit.streakGoal),
          habit.reminderEnabled ? 1 : 0,
          JSON.stringify(habit.reminderTimes),
          now,
          now,
        ],
      );
    } catch (error) {
      if (__DEV__) console.warn("[HabitRepo]", error);
    }
  },
  /** Puts the habits in the given order, the first one on top. */
  async reorder(ids: string[]) {
    await db.withTransactionAsync(async () => {
      for (let i = 0; i < ids.length; i++) {
        await db.runAsync(`UPDATE habits SET position = ? WHERE id = ?`, [
          i,
          ids[i],
        ]);
      }
    });
  },
  async delete(id: string) {
    await db.runAsync(
      `
      DELETE FROM habits
      WHERE id = ?
    `,
      [id],
    );
  },
};
