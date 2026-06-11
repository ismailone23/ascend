import { db } from "./sqlite";

export async function initializeDatabase() {
  await db.execAsync(`PRAGMA foreign_keys = ON;`);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      comment TEXT,
      icon TEXT NOT NULL,
      frequency TEXT NOT NULL,
      frequency_repeat TEXT,
      daily_goal INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Migration: add frequency_repeat if the table was created before this column existed
  try {
    await db.execAsync(`ALTER TABLE habits ADD COLUMN frequency_repeat TEXT;`);
  } catch {
    // Column already exists — ignore
  }

  try {
    await db.execAsync(
      `ALTER TABLE habits ADD COLUMN daily_goal INTEGER NOT NULL DEFAULT 1;`,
    );
  } catch {
    // Column already exists — ignore
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habit_logs (
      id TEXT PRIMARY KEY NOT NULL,
      habit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      completed INTEGER NOT NULL,
      progress INTEGER NOT NULL DEFAULT 1,
      completed_at TEXT,
      FOREIGN KEY(habit_id)
        REFERENCES habits(id)
        ON DELETE CASCADE,
      UNIQUE(habit_id, date)
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY NOT NULL,
      habit_id TEXT NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 0,
      frequency TEXT,
      times TEXT,
      FOREIGN KEY(habit_id)
        REFERENCES habits(id)
        ON DELETE CASCADE
    );
  `);
}
