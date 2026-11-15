export type GoalStep = {
  id: string;
  title: string;
  done: boolean;
};

export type Goal = {
  id: string;
  title: string;
  icon: string; // same keys as habit icons, e.g. "mi::flag"
  targetDate: string | null; // "2026-12-31", or null for no deadline
  steps: GoalStep[]; // the roadmap, in the order it was written
};
