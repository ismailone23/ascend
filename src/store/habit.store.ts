import { nextProgress } from "@/lib/habit-utils";
import { habitRepository } from "@/repositories/habit.repository";
import { logRepository } from "@/repositories/log.repository";
import {
  cancelHabitReminders,
  checkNotificationPermission,
  requestPermissions,
  scheduleHabitReminders,
} from "@/services/notificationService";
import { CreateHabitInput, Habit, HabitStats, HabitStore } from "@/types/habit";
import { refreshWidgets } from "@/widgets/widgets";
import { create } from "zustand";

type HabitStoreState = HabitStore & {
  dailyLogs: Record<string, { progress: number; isCompleted: boolean }>;
  stats: Record<string, HabitStats>;
  appWideLogs: Record<string, number>;
  loadLogs: (date: string) => Promise<void>;
  loadAllStats: () => Promise<void>;
  updateHabitReminder: (habit: Habit) => Promise<void>;
  refreshReminders: (only?: Habit) => Promise<void>;
  reorderHabits: (ids: string[]) => Promise<void>;
};

export const useHabitStore = create<HabitStoreState>((set, get) => ({
  habits: [],
  dailyLogs: {},
  stats: {},
  appWideLogs: {},

  async loadHabits() {
    const habits = await habitRepository.getAll();
    set({ habits });
    await get().loadAllStats();
  },

  async loadAllStats() {
    const stats = await logRepository.getAllHabitsStats();
    const appWideLogs = await logRepository.getAppWideLogs();
    set({ stats, appWideLogs });
  },

  async loadLogs(date: string) {
    const logs = await logRepository.getLogsForDate(date);
    const dailyLogs: Record<
      string,
      { progress: number; isCompleted: boolean }
    > = {};
    for (const log of logs) {
      dailyLogs[log.habit_id] = {
        progress: log.progress,
        isCompleted: log.completed === 1,
      };
    }
    set({ dailyLogs });
  },

  async addHabit(input: CreateHabitInput) {
    await habitRepository.create(input);

    // Schedule notifications if enabled
    if (input.reminderEnabled && input.reminderTimes.length > 0) {
      const granted = await requestPermissions();
      if (granted) {
        const now = new Date().toISOString();
        // Build a full Habit shape so scheduleHabitReminders can consume it
        const habitForScheduling: Habit = {
          ...input,
          createdAt: now,
          updatedAt: now,
        };
        const notificationIds =
          await scheduleHabitReminders(habitForScheduling);
        await habitRepository.saveNotificationIds(input.id, notificationIds);
      }
    }

    const habits = await habitRepository.getAll();
    set({ habits });
  },

  async deleteHabit(id: string) {
    // Cancel notifications before deleting (FK cascade will remove reminders row)
    const notificationIds = await habitRepository.getNotificationIds(id);
    if (notificationIds.length > 0) {
      await cancelHabitReminders(notificationIds);
    }

    await habitRepository.delete(id);
    const habits = await habitRepository.getAll();
    set({ habits });
  },

  // `ids` may be only the habits on screen: they swap among the places they
  // already hold, and the hidden ones stay put.
  async reorderHabits(ids: string[]) {
    const all = get().habits;
    const moved = all
      .filter((h) => ids.includes(h.id))
      .sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
    let next = 0;
    const habits = all.map((h) => (ids.includes(h.id) ? moved[next++] : h));
    set({ habits });
    try {
      await habitRepository.reorder(habits.map((h) => h.id));
    } catch (error) {
      if (__DEV__) console.warn("[HabitStore]", error);
      set({ habits: await habitRepository.getAll() });
    }
  },

  // Call this when user edits reminder times or toggles reminder on/off
  async updateHabitReminder(habit: Habit) {
    // Always cancel existing notifications first
    const existingIds = await habitRepository.getNotificationIds(habit.id);
    if (existingIds.length > 0) {
      await cancelHabitReminders(existingIds);
      await habitRepository.saveNotificationIds(habit.id, []);
    }

    // Re-schedule only if still enabled
    if (habit.reminderEnabled && habit.reminderTimes.length > 0) {
      const granted = await requestPermissions();
      if (granted) {
        const notificationIds = await scheduleHabitReminders(
          habit,
          get().stats[habit.id]?.currentStreak ?? 0,
        );
        await habitRepository.saveNotificationIds(habit.id, notificationIds);
      }
    }

    const habits = await habitRepository.getAll();
    set({ habits });
  },

  // Rewrites reminders with fresh wording and the current streak. Unlike
  // updateHabitReminder it never asks for permission, so it is safe at launch.
  async refreshReminders(only?: Habit) {
    try {
      if (!(await checkNotificationPermission())) return;
      for (const habit of only ? [only] : get().habits) {
        if (!habit.reminderEnabled || habit.reminderTimes.length === 0)
          continue;
        await cancelHabitReminders(
          await habitRepository.getNotificationIds(habit.id),
        );
        const ids = await scheduleHabitReminders(
          habit,
          get().stats[habit.id]?.currentStreak ?? 0,
        );
        await habitRepository.saveNotificationIds(habit.id, ids);
      }
    } catch (error) {
      if (__DEV__) console.warn("[HabitStore]", error);
    }
  },

  async incrementProgress(habit: Habit, date: string) {
    const current = get().dailyLogs[habit.id] || {
      progress: 0,
      isCompleted: false,
    };
    const next = nextProgress(
      current.progress,
      current.isCompleted,
      habit.dailyGoal,
    );
    const { progress } = next;

    // Show the result first; the database catches up behind it.
    set({ dailyLogs: { ...get().dailyLogs, [habit.id]: next } });
    try {
      if (progress <= 0) {
        await logRepository.deleteHabitLog(habit.id, date);
      } else {
        await logRepository.saveProgress(
          habit.id,
          date,
          progress,
          next.isCompleted,
        );
      }
    } catch (error) {
      if (__DEV__) console.warn("[HabitStore]", error);
      await get().loadLogs(date); // the write failed: show what is really stored
    }
    await get().loadAllStats();
    // Finishing (or un-finishing) a habit changes its streak, so its
    // reminders are rewritten to match.
    if (next.isCompleted !== current.isCompleted) {
      await get().refreshReminders(habit);
    }
  },
}));

// Any change to habits, logs or stats redraws the home-screen widgets.
useHabitStore.subscribe(refreshWidgets);
