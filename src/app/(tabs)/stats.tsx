import ThemedText from "@/components/ThemedText";
import { OverallHeatmap } from "@/components/stats/OverallHeatmap";
import { useColors } from "@/hooks/useColors";
import { useHabitStore } from "@/store/habit.store";
import { Octicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Stats() {
  const colors = useColors();
  const { habits, stats, appWideLogs } = useHabitStore();

  const totalCompletions = useMemo(() => {
    return Object.values(stats).reduce((acc, s) => acc + s.totalCompletions, 0);
  }, [stats]);

  const bestActiveStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    return Math.max(...habits.map((h) => stats[h.id]?.currentStreak || 0));
  }, [habits, stats]);

  const perfectDays = useMemo(() => {
    if (habits.length === 0) return 0;
    let count = 0;
    for (const completedCount of Object.values(appWideLogs)) {
      if (completedCount >= habits.length) {
        count++;
      }
    }
    return count;
  }, [habits.length, appWideLogs]);

  const topHabits = useMemo(() => {
    return [...habits]
      .sort((a, b) => {
        const streakA = stats[a.id]?.currentStreak || 0;
        const streakB = stats[b.id]?.currentStreak || 0;
        return streakB - streakA;
      })
      .slice(0, 3);
  }, [habits, stats]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <View style={styles.header} accessibilityRole="header">
        <ThemedText accessibilityRole="header" style={styles.title}>Your Progress</ThemedText>
        <ThemedText variant="muted" style={styles.subtitle}>
          Consistency is key to mastery.
        </ThemedText>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* At a glance */}
        <View style={styles.overviewGrid} accessibilityRole="list" accessibilityLabel="Overview statistics">
          <View
            accessible
            accessibilityRole="summary"
            accessibilityLabel={`Active Habits: ${habits.length}`}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.iconWrapper, { backgroundColor: `${colors.primary}15` }]} accessibilityElementsHidden>
              <Octicons name="tasklist" size={18} color={colors.primary} />
            </View>
            <ThemedText style={styles.cardValue} aria-hidden>{habits.length}</ThemedText>
            <ThemedText variant="muted" style={styles.cardLabel} aria-hidden>Active Habits</ThemedText>
          </View>

          <View
            accessible
            accessibilityRole="summary"
            accessibilityLabel={`Total Completions: ${totalCompletions}`}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.iconWrapper, { backgroundColor: `${colors.primary}15` }]} accessibilityElementsHidden>
              <Octicons name="check-circle" size={18} color={colors.primary} />
            </View>
            <ThemedText style={styles.cardValue} aria-hidden>{totalCompletions}</ThemedText>
            <ThemedText variant="muted" style={styles.cardLabel} aria-hidden>Total Completions</ThemedText>
          </View>

          <View
            accessible
            accessibilityRole="summary"
            accessibilityLabel={`Best Active Streak: ${bestActiveStreak} days`}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.iconWrapper, { backgroundColor: `${colors.primary}15` }]} accessibilityElementsHidden>
              <Octicons name="flame" size={18} color={colors.primary} />
            </View>
            <ThemedText style={styles.cardValue} aria-hidden>{bestActiveStreak}</ThemedText>
            <ThemedText variant="muted" style={styles.cardLabel} aria-hidden>Best Active Streak</ThemedText>
          </View>

          <View
            accessible
            accessibilityRole="summary"
            accessibilityLabel={`Perfect Days: ${perfectDays}`}
            style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.iconWrapper, { backgroundColor: `${colors.primary}15` }]} accessibilityElementsHidden>
              <Octicons name="star" size={18} color={colors.primary} />
            </View>
            <ThemedText style={styles.cardValue} aria-hidden>{perfectDays}</ThemedText>
            <ThemedText variant="muted" style={styles.cardLabel} aria-hidden>Perfect Days</ThemedText>
          </View>
        </View>

        {/* Contribution Graph */}
        <OverallHeatmap logs={appWideLogs} />

        {/* Top Habits */}
        {topHabits.length > 0 && (
          <View style={styles.topHabitsContainer}>
            <ThemedText accessibilityRole="header" style={styles.sectionTitle}>Top Habits</ThemedText>
            <View
              accessibilityRole="list"
              accessibilityLabel="Top habits ranked by streak"
              style={[styles.topHabitsList, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              {topHabits.map((habit, index) => {
                const habitStats = stats[habit.id] || { currentStreak: 0, completionRate: 0 };
                return (
                  <View
                    key={habit.id}
                    accessible

                    accessibilityLabel={`${habit.title}, ${habitStats.completionRate}% completion rate, ${habitStats.currentStreak} day streak`}
                    style={[
                      styles.topHabitItem,
                      index < topHabits.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                    ]}
                  >
                    <View style={styles.habitIconWrapper} accessibilityElementsHidden>
                      <ThemedText style={styles.habitIcon}>{habit.icon}</ThemedText>
                    </View>
                    <View style={styles.habitInfo}>
                      <ThemedText style={styles.habitTitle}>{habit.title}</ThemedText>
                      <ThemedText variant="muted" style={styles.habitRate}>
                        {habitStats.completionRate}% completion rate
                      </ThemedText>
                    </View>
                    <View style={[styles.streakPill, { backgroundColor: `${colors.primary}12` }]} accessibilityElementsHidden>
                      <Octicons name="flame" size={12} color={colors.primary} />
                      <ThemedText style={[styles.streakText, { color: colors.primary }]}>
                        {habitStats.currentStreak}
                      </ThemedText>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 140,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
  },
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 12,
  },
  card: {
    flex: 1,
    minWidth: "45%",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: "500",
  },
  topHabitsContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  topHabitsList: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  topHabitItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  habitIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(150, 150, 150, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  habitIcon: {
    fontSize: 20,
  },
  habitInfo: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  habitRate: {
    fontSize: 13,
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  streakText: {
    fontSize: 13,
    fontWeight: "700",
  },
});