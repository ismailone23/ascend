import ThemedText from "@/components/ThemedText";
import { useColors } from "@/hooks/useColors";
import { HabitStatsResult, logRepository } from "@/repositories/log.repository";
import { useHabitStore } from "@/store/habit.store";
import { Habit } from "@/types/habit";
import { Octicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import CompletionHeatmap from "./habit-detail/CompletionHeatmap";
import DetailHeader from "./habit-detail/DetailHeader";
import InfoPills from "./habit-detail/InfoPills";
import StatCard from "./habit-detail/StatCard";

type Props = {
  habit: Habit | null;
  visible: boolean;
  onClose: () => void;
};

export default function HabitDetailModal({ habit, visible, onClose }: Props) {
  const colors = useColors();
  const deleteHabit = useHabitStore((s) => s.deleteHabit);

  const [stats, setStats] = useState<HabitStatsResult>({
    currentStreak: 0,
    bestStreak: 0,
    totalCompletions: 0,
    completionRate: 0,
  });
  const [progressData, setProgressData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (visible && habit) {
      setLoading(true);
      Promise.all([
        logRepository.getHabitStats(habit.id),
        logRepository.getHabitProgress(habit.id, 364),
      ]).then(([s, progressRec]) => {
        if (!active) return;
        setStats(s);
        // Normalize progress to a 0..1 ratio using habit.dailyGoal
        const normalized: Record<string, number> = {};
        for (const [date, prog] of Object.entries(progressRec)) {
          const ratio = habit.dailyGoal
            ? Math.min(prog / habit.dailyGoal, 1)
            : prog > 0
              ? 1
              : 0;
          normalized[date] = ratio;
        }
        setProgressData(normalized);
        setLoading(false);
      });
    }
    return () => {
      active = false;
    };
  }, [visible, habit]);

  const handleDelete = useCallback(() => {
    if (!habit) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      "Delete Habit",
      `Are you sure you want to delete "${habit.title}"? This will also remove all completion history.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteHabit(habit.id);
            onClose();
          },
        },
      ],
    );
  }, [habit, deleteHabit, onClose]);

  if (!habit) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
        ]}
      >
        {/* Handle bar */}
        <View style={styles.handleBar}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <DetailHeader habit={habit} onClose={onClose} />

          {/* Info pills */}
          <InfoPills habit={habit} stats={stats} />

          {/* Stats grid */}
          <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
            Statistics
          </ThemedText>

          {loading ? (
            <ThemedText
              variant="muted"
              style={{ textAlign: "center", paddingVertical: 20 }}
            >
              Loading stats…
            </ThemedText>
          ) : (
            <View style={styles.statsGrid}>
              <StatCard
                icon="flame"
                label="Current Streak"
                value={`${stats.currentStreak}d`}
                color="#F97316"
              />
              <StatCard
                icon="trophy"
                label="Best Streak"
                value={`${stats.bestStreak}d`}
                color="#EAB308"
              />
              <StatCard
                icon="check-circle"
                label="Completions"
                value={stats.totalCompletions}
                color="#22C55E"
              />
              <StatCard
                icon="graph"
                label="Success Rate"
                value={`${stats.completionRate}%`}
                color={colors.primary}
              />
            </View>
          )}

          {/* Heatmap */}
          <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
            Last Year
          </ThemedText>

          <CompletionHeatmap data={progressData} loading={loading} />

          {/* Actions */}
          <ThemedText accessibilityRole="header" style={styles.sectionTitle}>
            Actions
          </ThemedText>

          <Pressable
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel={`Delete habit: ${habit.title}`}
            style={[
              styles.actionButton,
              {
                backgroundColor: "rgba(239,68,68,0.1)",
                borderColor: "rgba(239,68,68,0.2)",
              },
            ]}
          >
            <Octicons name="trash" size={18} color="#EF4444" />
            <ThemedText style={[styles.actionText, { color: "#EF4444" }]}>
              Delete Habit
            </ThemedText>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    maxHeight: "88%",
  },

  handleBar: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },

  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },

  actionText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
