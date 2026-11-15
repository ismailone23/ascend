// Self-check for streak.ts. Run: npx tsx src/lib/streak.check.ts
import { computeStats, parseStreakGoal } from "./streak";

const same = (got: unknown, want: unknown) => {
  if (JSON.stringify(got) !== JSON.stringify(want))
    throw new Error(
      `expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`,
    );
};

const wed = new Date("2026-11-11T09:00:00"); // a Wednesday

// Mon/Wed/Fri habit: the days in between do not break the streak.
let s = computeStats(["2026-11-06", "2026-11-09"], ["Mon", "Wed", "Fri"], wed);
same(s.currentStreak, 2); // today (Wed) is not over yet
same(s.completionRate, 67); // 2 of Fri, Mon, Wed

// The same logs on an every-day habit: the weekend broke it.
s = computeStats(["2026-11-06", "2026-11-09"], [], wed);
same([s.currentStreak, s.bestStreak], [0, 1]);

// A missed scheduled day resets the run but keeps the best.
s = computeStats(
  ["2026-11-02", "2026-11-04", "2026-11-06", "2026-11-11"],
  ["Mon", "Wed", "Fri"],
  wed,
);
same([s.currentStreak, s.bestStreak, s.totalCompletions], [1, 3, 4]);

same(computeStats([], ["Mon"], wed).currentStreak, 0);
same(
  ["Day", "Week", "Month", "100", null].map(parseStreakGoal),
  [0, 7, 30, 100, 0],
);
console.log("streak ok");
