import { db } from "@/db/sqlite";
import { Goal } from "@/types/goal";

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

async function reorder(
  table: "goals" | "goal_steps",
  ids: string[],
  direction: "ASC" | "DESC",
) {
  await db.withTransactionAsync(async () => {
    const rows = await db.getAllAsync<{ created_at: string }>(
      `SELECT created_at FROM ${table}
       WHERE id IN (${ids.map(() => "?").join(",")})
       ORDER BY created_at ${direction}`,
      ids,
    );
    if (rows.length !== ids.length) return;
    for (let i = 0; i < ids.length; i++) {
      await db.runAsync(`UPDATE ${table} SET created_at = ? WHERE id = ?`, [
        rows[i].created_at,
        ids[i],
      ]);
    }
  });
}

export const goalRepository = {
  async getAll(): Promise<Goal[]> {
    const goals = await db.getAllAsync<{
      id: string;
      title: string;
      icon: string;
      target_date: string | null;
    }>(
      `SELECT id, title, icon, target_date FROM goals ORDER BY created_at DESC`,
    );
    const steps = await db.getAllAsync<{
      id: string;
      goal_id: string;
      title: string;
      done: number;
    }>(
      `SELECT id, goal_id, title, done FROM goal_steps ORDER BY created_at ASC`,
    );

    return goals.map((goal) => ({
      id: goal.id,
      title: goal.title,
      icon: goal.icon,
      targetDate: goal.target_date,
      steps: steps
        .filter((s) => s.goal_id === goal.id)
        .map((s) => ({ id: s.id, title: s.title, done: s.done === 1 })),
    }));
  },

  async create(title: string): Promise<string> {
    const id = newId();
    await db.runAsync(
      `INSERT INTO goals (id, title, created_at) VALUES (?, ?, ?)`,
      [id, title, new Date().toISOString()],
    );
    return id;
  },

  async rename(id: string, title: string) {
    await db.runAsync(`UPDATE goals SET title = ? WHERE id = ?`, [title, id]);
  },

  async setIcon(id: string, icon: string) {
    await db.runAsync(`UPDATE goals SET icon = ? WHERE id = ?`, [icon, id]);
  },

  async setTargetDate(id: string, date: string | null) {
    await db.runAsync(`UPDATE goals SET target_date = ? WHERE id = ?`, [
      date,
      id,
    ]);
  },

  async delete(id: string) {
    await db.runAsync(`DELETE FROM goals WHERE id = ?`, [id]);
  },

  async addStep(goalId: string, title: string) {
    await db.runAsync(
      `INSERT INTO goal_steps (id, goal_id, title, created_at) VALUES (?, ?, ?, ?)`,
      [newId(), goalId, title, new Date().toISOString()],
    );
  },

  async setStepDone(stepId: string, done: boolean) {
    await db.runAsync(`UPDATE goal_steps SET done = ? WHERE id = ?`, [
      done ? 1 : 0,
      stepId,
    ]);
  },

  async renameStep(stepId: string, title: string) {
    await db.runAsync(`UPDATE goal_steps SET title = ? WHERE id = ?`, [
      title,
      stepId,
    ]);
  },

  /** Puts the goals in the given order, the first one on top. */
  reorderGoals: (ids: string[]) => reorder("goals", ids, "DESC"),

  /** Puts a goal's steps in the given order. */
  reorderSteps: (ids: string[]) => reorder("goal_steps", ids, "ASC"),

  async deleteStep(stepId: string) {
    await db.runAsync(`DELETE FROM goal_steps WHERE id = ?`, [stepId]);
  },
};
