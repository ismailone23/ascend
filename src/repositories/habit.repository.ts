import { db } from "@/db/sqlite";
import { CreateHabitInput, Habit } from "@/types/habit";

export const habitrepositry = {
  async getAll(): Promise<Habit[]> {
    try {
      const rows = await db.getAllAsync<any>(`
        SELECT * FROM habits
        ORDER BY created_at DESC
      `);

      return rows.map((row) => {
        const base = {
          id: row.id,
          title: row.title,
          comment: row.comment,
          icon: row.icon,
          dailyGoal: row.daily_goal,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };

        if (row.frequency === "weekly") {
          const repeat = row.frequency_repeat ? JSON.parse(row.frequency_repeat) : { timesPerWeek: 1 };
          return { ...base, frequency: "weekly", timesPerWeek: repeat.timesPerWeek } as Habit;
        } else if (row.frequency === "custom") {
          const repeat = row.frequency_repeat ? JSON.parse(row.frequency_repeat) : { days: [] };
          return { ...base, frequency: "custom", days: repeat.days } as Habit;
        }

        return { ...base, frequency: "daily" } as Habit;
      });
    } catch (error) {
      console.log({ error });
      return [];
    }
  },
  async create(habit: CreateHabitInput) {
    const now = new Date().toISOString();

    // Build frequency_repeat from the union type
    let frequencyRepeat: string | null = null;
    if (habit.frequency === "weekly") {
      frequencyRepeat = JSON.stringify({ timesPerWeek: habit.timesPerWeek });
    } else if (habit.frequency === "custom") {
      frequencyRepeat = JSON.stringify({ days: habit.days });
    }

    try {
      await db.runAsync(
        `
        INSERT INTO habits (
        id,
        title,
        comment,
        icon,
        frequency,
        frequency_repeat,
        daily_goal,
        created_at,
        updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          habit.id,
          habit.title,
          habit.comment ?? null,
          habit.icon,
          habit.frequency,
          frequencyRepeat,
          habit.dailyGoal,
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
