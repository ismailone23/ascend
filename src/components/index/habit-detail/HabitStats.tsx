import ThemedText from "@/components/ThemedText";
import { useColors } from "@/hooks/useColors";
import { toLocalDate } from "@/lib/date";
import { DAY_NAMES, HabitStatsResult, recentDays } from "@/lib/streak";
import { Habit } from "@/types/habit";
import { MaterialIcons, Octicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import StatCard from "./StatCard";

type Props = {
  habit: Habit;
  stats: HabitStatsResult;
  /** Date → how much of the daily goal was done, 0 to 1. */
  progress: Record<string, number>;
};

const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;

/** This week at a glance, the streak against its goal, and recent form. */
export default function HabitStats({ habit, stats, progress }: Props) {
  const colors = useColors();
  const today = new Date();
  const todayKey = toLocalDate(today);
  const scheduled = (day: Date) =>
    habit.days.length === 0 || habit.days.includes(DAY_NAMES[day.getDay()]);

  // Sunday to Saturday of the current week.
  const week = DAY_NAMES.map((name, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - today.getDay() + index);
    const key = toLocalDate(date);
    const state =
      (progress[key] ?? 0) >= 1
        ? "done"
        : !scheduled(date)
          ? "off"
          : key === todayKey
            ? "today"
            : key < todayKey
              ? "missed"
              : "upcoming";
    return { name, key, state };
  });

  const completed = new Set(
    Object.keys(progress).filter((date) => progress[date] >= 1),
  );
  const recent = recentDays(completed, habit.days, habit.createdAt);

  const goal = habit.streakGoal;
  const left = goal - stats.currentStreak;

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <ThemedText variant="muted" style={styles.cardLabel}>
          This week
        </ThemedText>
        <View style={styles.week}>
          {week.map(({ name, key, state }) => (
            <View
              key={key}
              accessible
              accessibilityLabel={`${name}: ${
                state === "off" ? "not scheduled" : state
              }`}
              style={styles.weekDay}
            >
              <ThemedText
                variant="muted"
                style={[
                  styles.weekName,
                  key === todayKey && { color: colors.text, fontWeight: "700" },
                ]}
              >
                {name[0]}
              </ThemedText>
              <View
                style={[
                  styles.dot,
                  state === "done" && { backgroundColor: colors.primary },
                  state === "today" && {
                    borderWidth: 2,
                    borderColor: colors.primary,
                  },
                  (state === "missed" || state === "upcoming") && {
                    borderWidth: 1.5,
                    borderColor: colors.border,
                  },
                ]}
              >
                {state === "done" && (
                  <MaterialIcons
                    name="check"
                    size={16}
                    color={colors.onPrimary}
                  />
                )}
                {state === "missed" && (
                  <MaterialIcons
                    name="close"
                    size={14}
                    color={colors.textMuted}
                  />
                )}
                {state === "off" && (
                  <View
                    style={[styles.offDot, { backgroundColor: colors.border }]}
                  />
                )}
              </View>
            </View>
          ))}
        </View>
      </View>

      <View
        accessible
        accessibilityLabel={`Current streak ${days(stats.currentStreak)}, best ${days(stats.bestStreak)}${
          goal > 0 ? `, goal ${days(goal)}` : ""
        }`}
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.streakRow}>
          <Octicons
            name={goal > 0 && left <= 0 ? "trophy" : "flame"}
            size={20}
            color={colors.primary}
          />
          <ThemedText style={styles.streakValue}>
            {stats.currentStreak}
          </ThemedText>
          <ThemedText style={styles.streakUnit}>day streak</ThemedText>
          <ThemedText variant="muted" style={styles.best}>
            Best {days(stats.bestStreak)}
          </ThemedText>
        </View>
        {goal > 0 && (
          <>
            <View style={[styles.track, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.fill,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.min(stats.currentStreak / goal, 1) * 100}%`,
                  },
                ]}
              />
            </View>
            <ThemedText variant="muted" style={styles.goalText}>
              {left <= 0
                ? `${goal}-day goal reached`
                : `${days(left)} to go to your ${goal}-day goal`}
            </ThemedText>
          </>
        )}
      </View>

      <View style={styles.pair}>
        <StatCard
          icon="graph"
          label="Last 30 days"
          value={
            recent.due
              ? `${Math.round((recent.done / recent.due) * 100)}%`
              : "–"
          }
          hint={
            recent.due
              ? `${recent.done} of ${days(recent.due)}`
              : "Nothing due yet"
          }
          color={colors.primary}
        />
        <StatCard
          icon="check-circle"
          label="All time"
          value={stats.totalCompletions}
          hint={`days done, ${stats.completionRate}% of those due`}
          color={colors.primary}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginBottom: 24,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 10,
  },
  week: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weekDay: {
    alignItems: "center",
    gap: 6,
  },
  weekName: {
    fontSize: 12,
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  offDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  streakValue: {
    fontSize: 28,
    fontWeight: "800",
  },
  streakUnit: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
  },
  best: {
    fontSize: 13,
  },
  track: {
    height: 6,
    borderRadius: 3,
    marginTop: 12,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 3,
  },
  goalText: {
    fontSize: 12,
    marginTop: 6,
  },
  pair: {
    flexDirection: "row",
    gap: 10,
  },
});
