import { notificationsKey } from "@/constants/storagekeys";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import type { DayOfWeek, Habit } from "../types/habit";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// DayOfWeek → OS weekday number (1=Sun, 2=Mon, ..., 7=Sat)
const DAY_MAP: Record<DayOfWeek, number> = {
  Sun: 1,
  Mon: 2,
  Tue: 3,
  Wed: 4,
  Thu: 5,
  Fri: 6,
  Sat: 7,
};

// "08:30 AM" / "09:00 PM" → { hour: 8, minute: 30 }
function parseReminderTime(time: string): { hour: number; minute: number } {
  const [timePart, meridiem] = time.split(" ");
  let [hour, minute] = timePart.split(":").map(Number);
  if (meridiem === "PM" && hour !== 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return { hour, minute };
}

export async function requestPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function checkNotificationPermission(): Promise<boolean> {
  if (!Device.isDevice) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === "granted";
}

const pick = (items: string[]) =>
  items[Math.floor(Math.random() * items.length)];

/**
 * Writes one reminder. The wording depends on the streak, how many times a day
 * the habit is done and the time of day, and one fitting line is picked at
 * random, so the same habit does not say the same thing every day.
 */
export function reminderMessage(habit: Habit, hour: number, streak: number) {
  const lines: string[] = [];

  if (streak >= 2) {
    lines.push(
      `${streak} days in a row. Today makes ${streak + 1}.`,
      `Your ${streak}-day streak is still alive. Keep it that way.`,
      `${streak} days so far. One more.`,
    );
  } else {
    lines.push(
      "A fresh start. Today can be day one.",
      "Small and done beats big and skipped.",
    );
  }

  if (habit.dailyGoal > 1) {
    lines.push(
      `${habit.dailyGoal} times today. Start with the first.`,
      `No need for all ${habit.dailyGoal} at once. Just one for now.`,
    );
  }

  if (hour < 12) {
    lines.push(
      "Do it early and the rest of the day is yours.",
      "A good morning to get this done.",
    );
  } else if (hour < 18) {
    lines.push(
      "A quick one before the afternoon gets away.",
      "Halfway through the day. Still time.",
    );
  } else {
    lines.push(
      "Before the day ends, a few minutes for this.",
      "Close the day with this one done.",
    );
  }

  if (habit.comment) lines.push(habit.comment); // the user's own note, sometimes

  return pick(lines);
}

export async function scheduleHabitReminders(
  habit: Habit,
  streak = 0,
): Promise<string[]> {
  if (!habit.reminderEnabled || habit.reminderTimes.length === 0) return [];
  // The Notifications switch in Settings turns every reminder off.
  if ((await AsyncStorage.getItem(notificationsKey)) === "false") return [];

  const ids: string[] = [];

  for (const day of habit.days) {
    for (const time of habit.reminderTimes) {
      const { hour, minute } = parseReminderTime(time);

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: habit.title,
          body: reminderMessage(habit, hour, streak),
          data: { habitId: habit.id },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: DAY_MAP[day],
          hour,
          minute,
        },
      });

      ids.push(id);
    }
  }

  return ids;
}

export async function cancelHabitReminders(
  notificationIds: string[],
): Promise<void> {
  await Promise.all(
    notificationIds.map((id) =>
      Notifications.cancelScheduledNotificationAsync(id),
    ),
  );
}

/** Removes every reminder this app has scheduled. */
export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
