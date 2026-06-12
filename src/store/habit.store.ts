import { habitRepository } from "@/repositories/habit.repository";
import { logRepository } from "@/repositories/log.repository";
import {
    cancelHabitReminders,
    requestPermissions,
    scheduleHabitReminders,
} from "@/services/notificationService";
import { CreateHabitInput, Habit, HabitStats, HabitStore } from "@/types/habit";
import { create } from "zustand";

type HabitStoreState = HabitStore & {
  dailyLogs: Record<string, { progress: number; isCompleted: boolean }>;
  stats: Record<string, HabitStats>;
  appWideLogs: Record<string, number>;
  loadLogs: (date: string) => Promise<void>;
  loadAllStats: () => Promise<void>;
  updateHabitReminder: (habit: Habit) => Promise<void>;
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
        const notificationIds = await scheduleHabitReminders(habit);
        await habitRepository.saveNotificationIds(habit.id, notificationIds);
      }
    }

    const habits = await habitRepository.getAll();
    set({ habits });
  },

  async incrementProgress(habit: Habit, date: string) {
    const state = get();
    const currentLog = state.dailyLogs[habit.id] || {
      progress: 0,
      isCompleted: false,
    };
    let newProgress = currentLog.progress + 1;
    let isCompleted = newProgress >= habit.dailyGoal;

    if (currentLog.isCompleted) {
      newProgress = 0;
      isCompleted = false;
      await logRepository.deleteHabitLog(habit.id, date);
    } else {
      await logRepository.saveProgress(
        habit.id,
        date,
        newProgress,
        isCompleted,
      );
    }

    const habits = await habitRepository.getAll();
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
    set({ habits, dailyLogs });
    await get().loadAllStats();
  },
}));
