import { db } from "@/db/sqlite";
import { Goal } from "@/types/goal";

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const goalRepository = {
  async getAll(): Promise<Goal[]> {
    const goals = await db.getAllAsync<{ id: string; title: string }>(
      `SELECT id, title FROM goals ORDER BY created_at DESC`,
    );
    const steps = await db.getAllAsync<{
      id: string;
      goal_id: string;
      title: string;
      done: number;
    }>(`SELECT id, goal_id, title, done FROM goal_steps ORDER BY created_at ASC`);

    return goals.map((goal) => ({
      ...goal,
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

  async deleteStep(stepId: string) {
    await db.runAsync(`DELETE FROM goal_steps WHERE id = ?`, [stepId]);
  },
};
