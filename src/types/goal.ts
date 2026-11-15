export type GoalStep = {
  id: string;
  title: string;
  done: boolean;
};

export type Goal = {
  id: string;
  title: string;
  steps: GoalStep[]; // the roadmap, in the order it was written
};
