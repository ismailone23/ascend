import { useColors } from "@/hooks/useColors";
import { Habit } from "@/types/habit";
import { HabitStatsResult } from "@/repositories/log.repository";
import { Octicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import ThemedText from "@/components/ThemedText";

function getFrequencyLabel(habit: Habit): string {
  if (!habit.days || habit.days.length === 0) return "";
  if (habit.days.length === 7) return "Daily";
  return habit.days.join(", ");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface InfoPillsProps {
  habit: Habit;
  stats: HabitStatsResult;
}

export default function InfoPills({ habit, stats }: InfoPillsProps) {
  const colors = useColors();
  const frequencyLabel = getFrequencyLabel(habit);

  return (
    <View style={styles.pillRow} accessibilityRole="list" accessibilityLabel="Habit details">
      <View
        accessible
        accessibilityLabel={`${stats.currentStreak} day streak`}
        style={[styles.pill, { backgroundColor: `${colors.primary}12` }]}
      >
        <Octicons name="flame" size={13} color={colors.primary} />
        <ThemedText style={[styles.pillText, { color: colors.primary }]}>
          {stats.currentStreak} day streak
        </ThemedText>
      </View>
      {habit.dailyGoal > 1 ? (
        <View
          accessible
          accessibilityLabel={`${habit.dailyGoal} times daily`}
          style={[
            styles.pill,
            { backgroundColor: `${colors.textMuted}15` },
          ]}
        >
          <Octicons
            name="iterations"
            size={12}
            color={colors.textMuted}
          />
          <ThemedText
            style={[styles.pillText, { color: colors.textMuted }]}
          >
            {habit.dailyGoal}x daily
          </ThemedText>
        </View>
      ) : null}
      {frequencyLabel ? (
        <View
          accessible
          accessibilityLabel={`Frequency: ${frequencyLabel}`}
          style={[
            styles.pill,
            { backgroundColor: `${colors.textMuted}15` },
          ]}
        >
          <Octicons name="sync" size={12} color={colors.textMuted} />
          <ThemedText
            style={[styles.pillText, { color: colors.textMuted }]}
          >
            {frequencyLabel}
          </ThemedText>
        </View>
      ) : null}
      <View
        accessible
        accessibilityLabel={`Created since ${formatDate(habit.createdAt)}`}
        style={[
          styles.pill,
          { backgroundColor: `${colors.textMuted}15` },
        ]}
      >
        <Octicons name="calendar" size={12} color={colors.textMuted} />
        <ThemedText
          style={[styles.pillText, { color: colors.textMuted }]}
        >
          Since {formatDate(habit.createdAt)}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },

  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
  },

  pillText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
