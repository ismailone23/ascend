export type ISODate = string;

export type ISODateTime = string;

export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type Habit = {
  id: string;
  title: string;
  comment?: string;
  icon: string;
  days: DayOfWeek[];
  dailyGoal: number;
  streakGoal: "Day" | "Week" | "Month";
  reminderEnabled: boolean;
  reminderTimes: string[]; // e.g. ["08:30 AM", "09:00 PM"]
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type HabitLog = {
  id: string;
  habitId: string;
  date: ISODate;
  completed: boolean;
  progress: number;
  completedAt: ISODateTime;
};

export type HabitStats = {
  habitId: string;
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  completionRate: number;
};

export type CreateHabitInput = Omit<Habit, "createdAt" | "updatedAt">;

export type HabitStore = {
  habits: Habit[];
  loadHabits: () => Promise<void>;
  addHabit: (habit: CreateHabitInput) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  incrementProgress(habit: Habit, date: string): Promise<void>;
};
