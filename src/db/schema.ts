import { db } from "./sqlite";

export async function initializeDatabase() {
  await db.execAsync(`PRAGMA foreign_keys = ON;`);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habits (
      id               TEXT PRIMARY KEY NOT NULL,
      title            TEXT NOT NULL,
      comment          TEXT,
      icon             TEXT NOT NULL,
      days             TEXT NOT NULL DEFAULT '[]',   -- JSON: DayOfWeek[]
      daily_goal       INTEGER NOT NULL DEFAULT 1,
      streak_goal      TEXT NOT NULL DEFAULT 'Day',  -- "Day" | "Week" | "Month"
      reminder_enabled INTEGER NOT NULL DEFAULT 0,
      reminder_times   TEXT NOT NULL DEFAULT '[]',   -- JSON: string[]
      notification_ids TEXT NOT NULL DEFAULT '[]',   -- JSON: string[]
      created_at       TEXT NOT NULL,
      updated_at       TEXT NOT NULL
    );
  `);

  // Home screen order, set by dragging. Older installs lack the column.
  const habitColumns = (
    await db.getAllAsync<{ name: string }>(`PRAGMA table_info(habits)`)
  ).map((column) => column.name);
  if (!habitColumns.includes("position")) {
    await db.execAsync(
      `ALTER TABLE habits ADD COLUMN position INTEGER NOT NULL DEFAULT 0;`,
    );
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habit_logs (
      id           TEXT PRIMARY KEY NOT NULL,
      habit_id     TEXT NOT NULL,
      date         TEXT NOT NULL,                    -- ISODate: "2026-06-10"
      completed    INTEGER NOT NULL DEFAULT 0,
      progress     INTEGER NOT NULL DEFAULT 0,
      completed_at TEXT NOT NULL,                    -- ISODateTime
      FOREIGN KEY(habit_id) REFERENCES habits(id) ON DELETE CASCADE,
      UNIQUE(habit_id, date)
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS reminders (
      id        TEXT PRIMARY KEY NOT NULL,
      habit_id  TEXT NOT NULL,
      enabled   INTEGER NOT NULL DEFAULT 0,
      times     TEXT NOT NULL DEFAULT '[]',          -- JSON: string[]
      frequency TEXT NOT NULL DEFAULT 'daily',       -- "daily" | "hourly" | "custom"
      FOREIGN KEY(habit_id) REFERENCES habits(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS habit_stats (
      habit_id          TEXT PRIMARY KEY NOT NULL,
      current_streak    INTEGER NOT NULL DEFAULT 0,
      best_streak       INTEGER NOT NULL DEFAULT 0,
      total_completions INTEGER NOT NULL DEFAULT 0,
      completion_rate   REAL NOT NULL DEFAULT 0.0,
      FOREIGN KEY(habit_id) REFERENCES habits(id) ON DELETE CASCADE
    );
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS goals (
      id         TEXT PRIMARY KEY NOT NULL,
      title       TEXT NOT NULL,
      icon        TEXT NOT NULL DEFAULT 'mi::flag',
      target_date TEXT,                              -- ISODate, optional deadline
      created_at  TEXT NOT NULL
    );
  `);
  // Installs made before these columns existed already have the table.
  const goalColumns = (
    await db.getAllAsync<{ name: string }>(`PRAGMA table_info(goals)`)
  ).map((column) => column.name);
  if (!goalColumns.includes("target_date")) {
    await db.execAsync(`ALTER TABLE goals ADD COLUMN target_date TEXT;`);
  }
  if (!goalColumns.includes("icon")) {
    await db.execAsync(
      `ALTER TABLE goals ADD COLUMN icon TEXT NOT NULL DEFAULT 'mi::flag';`,
    );
  }

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS goal_steps (
      id         TEXT PRIMARY KEY NOT NULL,
      goal_id    TEXT NOT NULL,
      title      TEXT NOT NULL,
      done       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,                      -- also the roadmap order
      FOREIGN KEY(goal_id) REFERENCES goals(id) ON DELETE CASCADE
    );
  `);
}
