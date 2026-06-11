import { habitrepositry } from "@/repositories/habit.repository";
import { logRepository } from "@/repositories/log.repository";
import { CreateHabitInput, Habit, HabitStats, HabitStore } from "@/types/habit";
import { create } from "zustand";

type HabitStoreState = HabitStore & {
  dailyLogs: Record<string, { progress: number; isCompleted: boolean }>;
  stats: Record<string, HabitStats>;
  appWideLogs: Record<string, number>;
  loadLogs: (date: string) => Promise<void>;
  loadAllStats: () => Promise<void>;
};

export const useHabitStore = create<HabitStoreState>((set, get) => ({
  habits: [],
  dailyLogs: {},
  stats: {},
  appWideLogs: {},

  async loadHabits() {
    const habits = await habitrepositry.getAll();
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
    const dailyLogs: Record<string, { progress: number; isCompleted: boolean }> = {};
    for (const log of logs) {
      dailyLogs[log.habit_id] = {
        progress: log.progress,
        isCompleted: log.completed === 1,
      };
    }
    set({ dailyLogs });
  },

  async addHabit(habit: CreateHabitInput) {
    await habitrepositry.create(habit);
    const habits = await habitrepositry.getAll();
    set({ habits });
  },

  async deleteHabit(id: string) {
    await habitrepositry.delete(id);
    const habits = await habitrepositry.getAll();
    set({ habits });
  },

  async incrementProgress(habit: Habit, date: string) {
    const state = get();
    const currentLog = state.dailyLogs[habit.id] || { progress: 0, isCompleted: false };
    
    let newProgress = currentLog.progress + 1;
    let isCompleted = newProgress >= habit.dailyGoal;

    // Reset logic: if it was already completed (user tapping a full ring), reset to 0
    if (currentLog.isCompleted) {
      newProgress = 0;
      isCompleted = false;
      await logRepository.deleteHabitLog(habit.id, date);
    } else {
      await logRepository.saveProgress(habit.id, date, newProgress, isCompleted);
    }

    // Refresh data
    const habits = await habitrepositry.getAll();
    const logs = await logRepository.getLogsForDate(date);
    const dailyLogs: Record<string, { progress: number; isCompleted: boolean }> = {};
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
