import { initializeDatabase } from "@/db/schema";
import { createContext, useContext, useEffect } from "react";

type HabitContextType = {};

export const HabitContext = createContext<HabitContextType | undefined>(
  undefined,
);

export function HabitProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeDatabase();
  }, []);

  return <HabitContext.Provider value={{}}>{children}</HabitContext.Provider>;
}
export function useHabit() {
  const context = useContext(HabitContext);
  if (!context) {
    throw new Error("useHabit must be used inside HabitProvider");
  }

  return context;
}
