import IconView from "@/components/IconView";
import HabitDetailModal from "@/components/index/habit-detail";
import { OverallHeatmap } from "@/components/stats/OverallHeatmap";
import ThemedText from "@/components/ThemedText";
import { useColors } from "@/hooks/useColors";
import { useHabitStore } from "@/store/habit.store";
import { DayOfWeek, Habit } from "@/types/habit";
import { MaterialIcons, Octicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const BAR_HEIGHT = 72;
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

export default function Stats() {
  const colors = useColors();
  const { habits, stats, appWideLogs } = useHabitStore();
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);

  // appWideLogs: date -> how many habits were completed that day.
  const completedOn = (date: dayjs.Dayjs) =>
    appWideLogs[date.format("YYYY-MM-DD")] ?? 0;

  // How many habits were due that day: scheduled for its weekday and already
  // created. Never less than what was actually done.
  const dueOn = (date: dayjs.Dayjs) =>
    Math.max(
      completedOn(date),
      habits.filter(
        (h) =>
          (h.days.length === 0 ||
            h.days.includes(date.format("ddd") as DayOfWeek)) &&
          !date.isBefore(dayjs(h.createdAt), "day"),
      ).length,
    );

  const today = dayjs();
  const weekStart = today.startOf("week");
  const todayIndex = today.diff(weekStart, "day");
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = weekStart.add(i, "day");
    return {
      date,
      count: completedOn(date),
      due: dueOn(date),
      future: i > todayIndex,
    };
  });

  // Compare like with like: the same weekdays of last week, not its full total.
  const elapsed = week.slice(0, todayIndex + 1);
  const thisWeek = elapsed.reduce((sum, d) => sum + d.count, 0);
  const dueThisWeek = elapsed.reduce((sum, d) => sum + d.due, 0);
  const leftToday = week[todayIndex].due - week[todayIndex].count;
  const lastWeek = elapsed.reduce(
    (sum, d) => sum + completedOn(d.date.subtract(7, "day")),
    0,
  );
  const change = thisWeek - lastWeek;
  const trend =
    (leftToday > 0 ? `${leftToday} left today · ` : "") +
    (change === 0
      ? "same as this point last week"
      : `${Math.abs(change)} ${change > 0 ? "more" : "fewer"} than this point last week`);
  const barScale = Math.max(...week.map((d) => d.due), 1);

  // The last 30 days, today left out until it is over: overall rate, days
  // where everything due was done, and the weekday that goes best.
  let done30 = 0;
  let due30 = 0;
  const byWeekday: Record<string, { done: number; due: number }> = {};
  for (let i = 1; i <= 30; i++) {
    const date = today.subtract(i, "day");
    const due = dueOn(date);
    if (due === 0) continue;
    const done = completedOn(date);
    done30 += done;
    due30 += due;
    const day = (byWeekday[date.format("dddd")] ??= { done: 0, due: 0 });
    day.done += done;
    day.due += due;
  }
  const rate = (d: { done: number; due: number }) => d.done / d.due;
  const bestDay = Object.entries(byWeekday).sort(
    (a, b) => rate(b[1]) - rate(a[1]),
  )[0];

  const perfectDays = Object.keys(appWideLogs).filter((key) => {
    const date = dayjs(key);
    return completedOn(date) >= dueOn(date);
  }).length;

  const streakHabit = [...habits].sort(
    (a, b) =>
      (stats[b.id]?.currentStreak || 0) - (stats[a.id]?.currentStreak || 0),
  )[0];
  const longestStreak = stats[streakHabit?.id]?.currentStreak || 0;

  // Each tile says what the number is about, not only the number.
  const tiles = [
    {
      icon: "flame",
      value: plural(longestStreak, "day"),
      label:
        longestStreak > 0 ? `Streak: ${streakHabit.title}` : "No streak yet",
    },
    {
      icon: "graph",
      value: due30 ? `${Math.round((done30 / due30) * 100)}%` : "–",
      label: due30 ? `Last 30 days, ${done30} of ${due30}` : "Last 30 days",
    },
    {
      icon: "star",
      value: String(perfectDays),
      label: "Perfect days, all due habits done",
    },
    {
      icon: "calendar",
      value: bestDay && bestDay[1].done > 0 ? bestDay[0] : "–",
      label:
        bestDay && bestDay[1].done > 0
          ? `Your best day, ${Math.round(rate(bestDay[1]) * 100)}% done`
          : "Your best day",
    },
  ] as const;

  const rankedHabits = [...habits].sort(
    (a, b) =>
      (stats[b.id]?.currentStreak || 0) - (stats[a.id]?.currentStreak || 0),
  );

  const cardColors = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ThemedText accessibilityRole="header" style={styles.title}>
          Stats
        </ThemedText>

        {habits.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="leaderboard" size={56} color={colors.icon} />
            <ThemedText style={styles.emptyTitle}>
              Nothing to show yet
            </ThemedText>
            <ThemedText variant="muted" style={styles.emptyText}>
              Create a habit and log it for a few days. Your streaks and weekly
              progress will appear here.
            </ThemedText>
            <Pressable
              onPress={() => router.push("/create-habit")}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.emptyButton,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.7 },
              ]}
            >
              <ThemedText
                style={[styles.emptyButtonText, { color: colors.onPrimary }]}
              >
                Create a habit
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          <>
            {/* This week */}
            <View style={[styles.card, cardColors]}>
              <ThemedText variant="muted" style={styles.cardLabel}>
                This week
              </ThemedText>
              <ThemedText style={styles.hero}>
                {dueThisWeek > 0
                  ? `${thisWeek} of ${dueThisWeek} done`
                  : plural(thisWeek, "completion")}
              </ThemedText>
              <ThemedText variant="muted" style={styles.trend}>
                {trend}
              </ThemedText>

              {barScale > 0 && (
                <View style={styles.bars}>
                  {week.map(({ date, count, due, future }) => {
                    const isToday = date.isSame(today, "day");
                    return (
                      <View
                        key={date.format("YYYY-MM-DD")}
                        style={styles.barColumn}
                        accessible
                        accessibilityLabel={`${date.format("dddd")}: ${
                          future
                            ? `${plural(due, "habit")} due`
                            : `${count} of ${due} done`
                        }`}
                      >
                        {/* Only today is labelled; the rest read off the bars. */}
                        <ThemedText style={styles.barValue}>
                          {isToday ? `${count}/${due}` : ""}
                        </ThemedText>
                        {/* The grey bar is what was due, the fill what got done. */}
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.bar,
                              {
                                height: Math.max(
                                  (due / barScale) * BAR_HEIGHT,
                                  3,
                                ),
                                backgroundColor: colors.border,
                              },
                              future && { opacity: 0.5 },
                            ]}
                          >
                            <View
                              style={[
                                styles.barFill,
                                {
                                  height: due ? `${(count / due) * 100}%` : 0,
                                  backgroundColor: colors.primary,
                                  opacity: isToday ? 1 : 0.55,
                                },
                              ]}
                            />
                          </View>
                        </View>
                        <ThemedText
                          variant={isToday ? "body" : "muted"}
                          style={[
                            styles.barDay,
                            isToday && { fontWeight: "700" },
                          ]}
                        >
                          {date.format("dd")}
                        </ThemedText>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* At a glance */}
            <View style={styles.grid}>
              {tiles.map((tile) => (
                <View
                  key={tile.label}
                  accessible
                  accessibilityLabel={`${tile.label}: ${tile.value}`}
                  style={[styles.card, styles.tile, cardColors]}
                >
                  <Octicons name={tile.icon} size={18} color={colors.icon} />
                  <ThemedText style={styles.tileValue}>{tile.value}</ThemedText>
                  <ThemedText variant="muted" style={styles.tileLabel}>
                    {tile.label}
                  </ThemedText>
                </View>
              ))}
            </View>

            {/* The year */}
            <View style={[styles.card, cardColors]}>
              <OverallHeatmap logs={appWideLogs} habitCount={habits.length} />
            </View>

            {/* Every habit, best streak first */}
            <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
              Habits
            </ThemedText>
            <View style={[styles.card, styles.list, cardColors]}>
              {rankedHabits.map((habit, index) => {
                const { currentStreak = 0, completionRate = 0 } =
                  stats[habit.id] ?? {};
                return (
                  <Pressable
                    key={habit.id}
                    onPress={() => setDetailHabit(habit)}
                    accessibilityRole="button"
                    accessibilityLabel={`${habit.title}, ${completionRate}% completed, ${currentStreak}-day streak`}
                    accessibilityHint="Opens details"
                    style={({ pressed }) => [
                      styles.row,
                      index > 0 && {
                        borderTopWidth: StyleSheet.hairlineWidth,
                        borderTopColor: colors.border,
                      },
                      pressed && { opacity: 0.5 },
                    ]}
                  >
                    <View
                      style={[
                        styles.rowIcon,
                        { backgroundColor: colors.primary + "22" },
                      ]}
                    >
                      <IconView iconKey={habit.icon} size={20} />
                    </View>
                    <View style={styles.rowBody}>
                      <View style={styles.rowTop}>
                        <ThemedText style={styles.rowTitle} numberOfLines={1}>
                          {habit.title}
                        </ThemedText>
                        <ThemedText variant="muted">
                          {completionRate}%
                        </ThemedText>
                      </View>
                      <View
                        style={[
                          styles.rate,
                          { backgroundColor: colors.border },
                        ]}
                      >
                        <View
                          style={[
                            styles.rateFill,
                            {
                              width: `${Math.min(completionRate, 100)}%`,
                              backgroundColor: colors.primary,
                            },
                          ]}
                        />
                      </View>
                      <ThemedText variant="muted" style={styles.rowStreak}>
                        {habit.streakGoal > 0
                          ? currentStreak >= habit.streakGoal
                            ? `${currentStreak}-day streak, goal reached`
                            : `${currentStreak} of ${habit.streakGoal} day streak goal`
                          : currentStreak > 0
                            ? `${currentStreak}-day streak`
                            : "No streak yet"}
                      </ThemedText>
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={22}
                      color={colors.textMuted}
                    />
                  </Pressable>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>

      <HabitDetailModal
        habit={detailHabit}
        visible={detailHabit !== null}
        onClose={() => setDetailHabit(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  card: {
    borderRadius: 20,
    padding: 16,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  hero: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.4,
    marginTop: 2,
  },
  trend: {
    fontSize: 14,
    marginTop: 2,
  },
  bars: {
    flexDirection: "row",
    marginTop: 16,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  barValue: {
    fontSize: 12,
    fontWeight: "700",
    height: 16,
  },
  barTrack: {
    height: BAR_HEIGHT,
    justifyContent: "flex-end",
  },
  bar: {
    width: 16,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  barFill: {
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barDay: {
    fontSize: 12,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  tile: {
    flexGrow: 1,
    flexBasis: "40%",
    gap: 6,
  },
  tileValue: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginTop: 4,
  },
  tileLabel: {
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginTop: 12,
  },
  list: {
    padding: 0,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  rowBody: {
    flex: 1,
    gap: 6,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    gap: 8,
  },
  rowTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  rate: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  rateFill: {
    height: "100%",
    borderRadius: 2,
  },
  rowStreak: {
    fontSize: 12,
  },
  empty: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 72,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8,
  },
  emptyButton: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    justifyContent: "center",
    marginTop: 24,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
