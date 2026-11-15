import IconView from "@/components/IconView";
import HabitDetailModal from "@/components/index/habit-detail";
import ThemedText from "@/components/ThemedText";
import { OverallHeatmap } from "@/components/stats/OverallHeatmap";
import { useColors } from "@/hooks/useColors";
import { useHabitStore } from "@/store/habit.store";
import { Habit } from "@/types/habit";
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

  const today = dayjs();
  const weekStart = today.startOf("week");
  const todayIndex = today.diff(weekStart, "day");
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = weekStart.add(i, "day");
    return { date, count: completedOn(date), future: i > todayIndex };
  });

  // Compare like with like: the same weekdays of last week, not its full total.
  const elapsed = week.slice(0, todayIndex + 1);
  const thisWeek = elapsed.reduce((sum, d) => sum + d.count, 0);
  const lastWeek = elapsed.reduce(
    (sum, d) => sum + completedOn(d.date.subtract(7, "day")),
    0,
  );
  const change = thisWeek - lastWeek;
  const trend =
    change === 0
      ? "Same as this point last week"
      : `${Math.abs(change)} ${change > 0 ? "more" : "fewer"} than this point last week`;
  const barScale = Math.max(habits.length, ...week.map((d) => d.count), 1);

  const totalCompletions = Object.values(stats).reduce(
    (sum, s) => sum + s.totalCompletions,
    0,
  );
  const longestStreak = Math.max(
    0,
    ...habits.map((h) => stats[h.id]?.currentStreak || 0),
  );
  const perfectDays = Object.values(appWideLogs).filter(
    (count) => count >= habits.length,
  ).length;

  const tiles = [
    {
      icon: "flame",
      value: plural(longestStreak, "day"),
      label: "Longest current streak",
    },
    { icon: "star", value: String(perfectDays), label: "Perfect days" },
    {
      icon: "check-circle",
      value: String(totalCompletions),
      label: "Completions, all time",
    },
    { icon: "tasklist", value: String(habits.length), label: "Habits" },
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
            <MaterialIcons
              name="leaderboard"
              size={56}
              color={colors.icon}
            />
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
                {plural(thisWeek, "completion")}
              </ThemedText>
              <ThemedText variant="muted" style={styles.trend}>
                {trend}
              </ThemedText>

              {thisWeek + lastWeek > 0 && (
                <View style={styles.bars}>
                  {week.map(({ date, count, future }) => {
                    const isToday = date.isSame(today, "day");
                    return (
                      <View
                        key={date.format("YYYY-MM-DD")}
                        style={styles.barColumn}
                        accessible
                        accessibilityLabel={`${date.format("dddd")}: ${
                          future
                            ? "not yet"
                            : plural(count, "habit") + " completed"
                        }`}
                      >
                        {/* Only today is labelled; the rest read off the bars. */}
                        <ThemedText style={styles.barValue}>
                          {isToday ? count : ""}
                        </ThemedText>
                        <View style={styles.barTrack}>
                          <View
                            style={[
                              styles.bar,
                              {
                                height: Math.max(
                                  (count / barScale) * BAR_HEIGHT,
                                  3,
                                ),
                                backgroundColor:
                                  count === 0 ? colors.border : colors.primary,
                                opacity: isToday || count === 0 ? 1 : 0.55,
                              },
                              future && { opacity: 0.4 },
                            ]}
                          />
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
                        {currentStreak > 0
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
