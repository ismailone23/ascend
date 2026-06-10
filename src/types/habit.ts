// types/habit.ts

export type ISODate = string;
// 2026-06-10

export type ISODateTime = string;
// 2026-06-10T08:30:00.000Z

export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type HabitFrequency =
  | {
      frequency: "daily";
    }
  | {
      frequency: "weekly";
      timesPerWeek: number;
    }
  | {
      frequency: "custom";
      days: DayOfWeek[];
    };

export type Habit = {
  id: string;
  title: string;
  comment?: string;
  icon: string;
  streakTarget: number;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
} & HabitFrequency;

export type HabitLog = {
  id: string;
  habitId: string;
  date: ISODate;
  completed: boolean;
  completedAt: ISODateTime;
};

export type Reminder = {
  id: string;
  habitId: string;
  enabled: boolean;
  times: string[];
  frequency: "daily" | "hourly" | "custom";
};

export type HabitStats = {
  habitId: string;
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  completionRate: number;
};

export type HabitWithStats = Habit & {
  stats: HabitStats;
};
export type CreateHabitInput = Omit<Habit, "createdAt" | "updatedAt">;

export type HabitStore = {
  habits: Habit[];
  loadHabits: () => Promise<void>;
  addHabit: (habit: CreateHabitInput) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  completeHabit(habitId: string, date: string): Promise<void>;
  incompleteHabit(habitId: string, date: string): Promise<void>;
};
