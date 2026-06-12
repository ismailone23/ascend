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

export async function scheduleHabitReminders(habit: Habit): Promise<string[]> {
  if (!habit.reminderEnabled || habit.reminderTimes.length === 0) return [];

  const ids: string[] = [];

  for (const day of habit.days) {
    for (const time of habit.reminderTimes) {
      const { hour, minute } = parseReminderTime(time);

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${habit.icon} ${habit.title}`,
          body: habit.comment ?? "Time to work on your habit!",
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
