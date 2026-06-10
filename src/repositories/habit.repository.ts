import { db } from "@/db/sqlite";
import { CreateHabitInput, Habit } from "@/types/habit";

export const habitrepositry = {
  async getAll(): Promise<Habit[]> {
    try {
      return await db.getAllAsync(`
        SELECT * FROM habits
        ORDER BY created_at DESC

        `);
    } catch (error) {
      console.log({ error });
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
        frequency,
        streak_target,
        created_at,
        updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          habit.id,
          habit.title,
          habit.comment ?? null,
          habit.icon,
          habit.frequency,
          habit.streakTarget,
          now,
          now,
        ],
      );
    } catch (error) {
      console.log({ error });
    }
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
