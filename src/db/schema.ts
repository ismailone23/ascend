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
      streak_target INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habit_logs (
      id TEXT PRIMARY KEY NOT NULL,
      habit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
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
