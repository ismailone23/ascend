import { habitrepositry } from "@/repositories/habit.repository";
import { logRepository } from "@/repositories/log.repository";
import { CreateHabitInput, HabitStore } from "@/types/habit";
import { create } from "zustand";

export const useHabitStore = create<HabitStore>((set) => ({
  habits: [],
  async loadHabits() {
    const habits = await habitrepositry.getAll();
    set({ habits });
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
  async completeHabit(habitId: string, date: string) {
    await logRepository.completeHabit(habitId, date);
    const habits = await habitrepositry.getAll();
    set({ habits });
  },
  async incompleteHabit(habitId: string, date: string) {
    await logRepository.incompleteHabit(habitId, date);
    const habits = await habitrepositry.getAll();
    set({ habits });
  },
}));
