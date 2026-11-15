import { db } from "@/db/sqlite";
import { useHabitStore } from "@/store/habit.store";
import {
  AESEncryptionKey,
  AESSealedData,
  aesDecryptAsync,
  aesEncryptAsync,
} from "expo-crypto";
import dayjs from "dayjs";
import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import * as Notifications from "expo-notifications";
import * as Sharing from "expo-sharing";
import type { SQLiteBindValue } from "expo-sqlite";

// Parents before children, so inserts satisfy the foreign keys.
const TABLES = [
  "habits",
  "habit_logs",
  "reminders",
  "habit_stats",
  "goals",
  "goal_steps",
] as const;

type Rows = Record<string, unknown>[];
export type Backup = {
  app: "ascend";
  version: 1;
  tables: Partial<Record<(typeof TABLES)[number], Rows>>;
};

// shortcut: the key ships inside the app, so a backup is unreadable and
// tamper-evident for ordinary users but not for someone who unpacks the app.
// Upgrade to a user passphrase (run through a KDF) if backups need real secrecy.
const KEY_HEX =
  "b808ef72c4cee45d6bab8df89771f9ce668ba8ba5fce698ed690bf4acf4f2775";
const getKey = () => AESEncryptionKey.import(KEY_HEX, "hex");

/** Encrypts every table (AES-256-GCM) into one file and opens the share sheet. */
export async function exportBackup(): Promise<void> {
  const backup: Backup = { app: "ascend", version: 1, tables: {} };
  for (const table of TABLES) {
    backup.tables[table] = await db.getAllAsync<Rows[number]>(
      `SELECT * FROM ${table}`,
    );
  }

  const sealed = await aesEncryptAsync(
    new TextEncoder().encode(JSON.stringify(backup)),
    await getKey(),
  );

  const file = new File(
    Paths.cache,
    `ascend-${dayjs().format("YYYY-MM-DD")}.backup`,
  );
  file.create({ overwrite: true });
  file.write(await sealed.combined("base64"));

  await Sharing.shareAsync(file.uri, {
    mimeType: "application/octet-stream",
    dialogTitle: "Save your Ascend backup",
  });
}

/**
 * Lets the user pick a backup file and decrypts it.
 * Returns null if they cancel; throws if the file is not a valid backup
 * (GCM rejects anything edited or made by something other than this app).
 */
export async function pickBackup(): Promise<Backup | null> {
  const picked = await DocumentPicker.getDocumentAsync({ type: "*/*" });
  if (picked.canceled) return null;

  const text = await new File(picked.assets[0].uri).text();
  const bytes = await aesDecryptAsync(
    AESSealedData.fromCombined(text.trim()),
    await getKey(),
  );
  const backup = JSON.parse(new TextDecoder().decode(bytes as Uint8Array));

  const valid =
    backup?.app === "ascend" &&
    backup.version === 1 &&
    typeof backup.tables === "object" &&
    backup.tables !== null &&
    TABLES.every((t) => Array.isArray(backup.tables[t] ?? []));
  if (!valid) throw new Error("Not an Ascend backup");

  return backup;
}

/** Replaces everything on this device with the backup. All or nothing. */
export async function restoreBackup(backup: Backup): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const table of [...TABLES].reverse()) {
      await db.runAsync(`DELETE FROM ${table}`);
    }

    for (const table of TABLES) {
      // Only real columns reach the SQL text; values are always bound.
      const columns = (
        await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${table})`)
      ).map((c) => c.name);

      for (const row of backup.tables[table] ?? []) {
        const keys = Object.keys(row).filter((k) => columns.includes(k));
        await db.runAsync(
          `INSERT INTO ${table} (${keys.join(", ")}) VALUES (${keys.map(() => "?").join(", ")})`,
          keys.map((k) => row[k] as SQLiteBindValue),
        );
      }
    }

    // The saved notification ids belong to the device that made the backup.
    await db.runAsync(`UPDATE habits SET notification_ids = '[]'`);
  });

  // Drop this device's old reminders, then schedule the restored ones.
  await Notifications.cancelAllScheduledNotificationsAsync();
  const store = useHabitStore.getState();
  await store.loadHabits();
  for (const habit of useHabitStore.getState().habits) {
    if (habit.reminderEnabled) await store.updateHabitReminder(habit);
  }
  await store.loadLogs(dayjs().format("YYYY-MM-DD"));
}
