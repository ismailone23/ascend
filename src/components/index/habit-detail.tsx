import { useColors } from "@/hooks/useColors";
import {
  HabitStatsResult,
  logRepository,
} from "@/repositories/log.repository";
import { useHabitStore } from "@/store/habit.store";
import { Habit } from "@/types/habit";
import { Octicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import ThemedText from "../ThemedText";

// ── Helpers ──────────────────────────────────────────────
function getFrequencyLabel(habit: Habit): string {
  switch (habit.frequency) {
    case "daily":
      return "Daily";
    case "weekly":
      return `${habit.timesPerWeek}x / week`;
    case "custom":
      return habit.days.join(", ");
    default:
      return "";
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Heatmap component ────────────────────────────────────
const WEEKS = 52;
const CELL_SIZE = 12;
const CELL_GAP = 3;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

/** Convert 6-digit hex + opacity 0-1 to rgba() for SVG compatibility */
function hexToRgba(hex: string, opacity: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}

/** Format a Date as YYYY-MM-DD in local timezone (matches dayjs format) */
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function CompletionHeatmap({
  completedDates,
  colors,
}: {
  completedDates: Set<string>;
  colors: ReturnType<typeof useColors>;
}) {
  const today = new Date();
  today.setHours(12, 0, 0, 0); // Avoid DST skips
  const todayStr = toLocalDateStr(today);
  const grid: { date: string; completed: boolean }[][] = [];

  // Find the Sunday of the CURRENT week
  const currentDayOfWeek = today.getDay(); // 0=Sun
  const currentSunday = new Date(today);
  currentSunday.setDate(today.getDate() - currentDayOfWeek);

  // The start date is exactly WEEKS - 1 weeks before the current Sunday
  const startDate = new Date(currentSunday);
  startDate.setDate(currentSunday.getDate() - (WEEKS - 1) * 7);

  const cursor = new Date(startDate);
  for (let w = 0; w < WEEKS; w++) {
    const week: { date: string; completed: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = toLocalDateStr(cursor);
      const isFuture = dateStr > todayStr;
      week.push({
        date: dateStr,
        completed: !isFuture && completedDates.has(dateStr),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    grid.push(week);
  }

  const labelWidth = 28;
  const svgWidth = labelWidth + WEEKS * (CELL_SIZE + CELL_GAP);
  const svgHeight = 7 * (CELL_SIZE + CELL_GAP) + 20; // +20 for month labels

  const monthLabels: { text: string; x: number }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < WEEKS; w++) {
    const firstDayOfWeek = new Date(grid[w][0].date + "T00:00:00");
    const month = firstDayOfWeek.getMonth();
    if (month !== lastMonth) {
      monthLabels.push({
        text: firstDayOfWeek.toLocaleDateString("en-US", { month: "short" }),
        x: labelWidth + w * (CELL_SIZE + CELL_GAP),
      });
      lastMonth = month;
    }
  }

  return (
    <Svg width={svgWidth} height={svgHeight}>
      {monthLabels.map((m, i) => (
        <SvgText
          key={i}
          x={m.x}
          y={10}
          fontSize={10}
          fill={colors.textMuted}
        >
          {m.text}
        </SvgText>
      ))}

      {/* Day labels */}
      {DAY_LABELS.map(
        (label, d) =>
          label ? (
            <SvgText
              key={`day-${d}`}
              x={0}
              y={18 + d * (CELL_SIZE + CELL_GAP) + CELL_SIZE - 2}
              fontSize={9}
              fill={colors.textMuted}
            >
              {label}
            </SvgText>
          ) : null,
      )}

      {/* Grid cells */}
      {grid.map((week, w) =>
        week.map((day, d) => {
          const isFuture = day.date > todayStr;
          let fillColor: string;
          let fillOpacity: number;
          if (isFuture) {
            fillColor = colors.border;
            fillOpacity = 0.12;
          } else if (day.completed) {
            fillColor = colors.primary;
            fillOpacity = 1;
          } else {
            fillColor = colors.border;
            fillOpacity = 0.35;
          }
          return (
            <Rect
              key={`${w}-${d}`}
              x={labelWidth + w * (CELL_SIZE + CELL_GAP)}
              y={18 + d * (CELL_SIZE + CELL_GAP)}
              width={CELL_SIZE}
              height={CELL_SIZE}
              rx={3}
              fill={fillColor}
              fillOpacity={fillOpacity}
            />
          );
        }),
      )}
    </Svg>
  );
}


function StatCard({
  icon,
  label,
  value,
  color,
  colors,
}: {
  icon: string;
  label: string;
  value: string | number;
  color: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View
      style={[
        styles.statCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.statIconWrap, { backgroundColor: `${color}18` }]}>
        <Octicons name={icon as any} size={16} color={color} />
      </View>
      <ThemedText style={styles.statValue}>{value}</ThemedText>
      <ThemedText variant="muted" style={styles.statLabel}>
        {label}
      </ThemedText>
    </View>
  );
}
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
  const [completedDates, setCompletedDates] = useState<Set<string>>(
    new Set(),
  );
  const [loading, setLoading] = useState(true);
  const heatmapScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && habit) {
      setLoading(true);
      Promise.all([
        logRepository.getHabitStats(habit.id),
        logRepository.getHabitLogs(habit.id, WEEKS * 7),
      ]).then(([s, logs]) => {
        setStats(s);
        setCompletedDates(new Set(logs));
        setLoading(false);
      });
    }
  }, [visible, habit?.id]);

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

  const frequencyLabel = getFrequencyLabel(habit);

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
          <View
            style={[styles.handle, { backgroundColor: colors.border }]}
          />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── Header ───────────────────────────────── */}
          <View style={styles.headerRow}>
            <View
              style={[
                styles.headerIcon,
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Text style={styles.headerEmoji}>{habit.icon}</Text>
            </View>
            <View style={styles.headerText}>
              <ThemedText style={styles.headerTitle}>
                {habit.title}
              </ThemedText>
              {habit.comment ? (
                <ThemedText variant="muted" style={styles.headerComment}>
                  {habit.comment}
                </ThemedText>
              ) : null}
            </View>
            <Pressable onPress={onClose} hitSlop={12}>
              <Octicons name="x" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* ── Info pills ────────────────────────────── */}
          <View style={styles.pillRow}>
            <View
              style={[
                styles.pill,
                { backgroundColor: `${colors.primary}12` },
              ]}
            >
              <Octicons name="flame" size={13} color={colors.primary} />
              <ThemedText
                style={[styles.pillText, { color: colors.primary }]}
              >
                {stats.currentStreak} day streak
              </ThemedText>
            </View>
            {habit.dailyGoal > 1 ? (
              <View
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
                style={[
                  styles.pill,
                  { backgroundColor: `${colors.textMuted}15` },
                ]}
              >
                <Octicons
                  name="sync"
                  size={12}
                  color={colors.textMuted}
                />
                <ThemedText
                  style={[styles.pillText, { color: colors.textMuted }]}
                >
                  {frequencyLabel}
                </ThemedText>
              </View>
            ) : null}
            <View
              style={[
                styles.pill,
                { backgroundColor: `${colors.textMuted}15` },
              ]}
            >
              <Octicons
                name="calendar"
                size={12}
                color={colors.textMuted}
              />
              <ThemedText
                style={[styles.pillText, { color: colors.textMuted }]}
              >
                Since {formatDate(habit.createdAt)}
              </ThemedText>
            </View>
          </View>

          {/* ── Stats grid ────────────────────────────── */}
          <ThemedText style={styles.sectionTitle}>Statistics</ThemedText>

          {loading ? (
            <ThemedText variant="muted" style={{ textAlign: "center", paddingVertical: 20 }}>
              Loading stats…
            </ThemedText>
          ) : (
            <View style={styles.statsGrid}>
              <StatCard
                icon="flame"
                label="Current Streak"
                value={`${stats.currentStreak}d`}
                color="#F97316"
                colors={colors}
              />
              <StatCard
                icon="trophy"
                label="Best Streak"
                value={`${stats.bestStreak}d`}
                color="#EAB308"
                colors={colors}
              />
              <StatCard
                icon="check-circle"
                label="Completions"
                value={stats.totalCompletions}
                color="#22C55E"
                colors={colors}
              />
              <StatCard
                icon="graph"
                label="Success Rate"
                value={`${stats.completionRate}%`}
                color={colors.primary}
                colors={colors}
              />
            </View>
          )}

          {/* ── Heatmap ───────────────────────────────── */}
          <ThemedText style={styles.sectionTitle}>
            Last Year
          </ThemedText>

          <View
            style={[
              styles.heatmapCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            {loading ? (
              <ThemedText
                variant="muted"
                style={{ textAlign: "center", paddingVertical: 20 }}
              >
                Loading…
              </ThemedText>
            ) : (
              <ScrollView
                ref={heatmapScrollRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 8 }}
                onLayout={() => {
                  // Scroll to end (current date) on mount
                  heatmapScrollRef.current?.scrollToEnd({ animated: false });
                }}
                onContentSizeChange={() => {
                  heatmapScrollRef.current?.scrollToEnd({ animated: false });
                }}
              >
                <CompletionHeatmap
                  completedDates={completedDates}
                  colors={colors}
                />
              </ScrollView>
            )}

            {/* Legend */}
            <View style={styles.legendRow}>
              <ThemedText variant="muted" style={styles.legendText}>
                Less
              </ThemedText>
              <View
                style={[
                  styles.legendCell,
                  { backgroundColor: `${colors.border}60` },
                ]}
              />
              <View
                style={[
                  styles.legendCell,
                  { backgroundColor: colors.primary },
                ]}
              />
              <ThemedText variant="muted" style={styles.legendText}>
                More
              </ThemedText>
            </View>
          </View>

          {/* ── Actions ───────────────────────────────── */}
          <ThemedText style={styles.sectionTitle}>Actions</ThemedText>

          <Pressable
            onPress={handleDelete}
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

// ── Styles ──────────────────────────────────────────────
const { width: SCREEN_WIDTH } = Dimensions.get("window");

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

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 16,
  },

  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  headerEmoji: {
    fontSize: 28,
  },

  headerText: {
    flex: 1,
    marginLeft: 14,
    marginRight: 12,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },

  headerComment: {
    marginTop: 2,
    fontSize: 14,
  },

  // Pills
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

  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },

  // Stats grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },

  statCard: {
    width: (SCREEN_WIDTH - 48 - 10) / 2, // 24px padding each side + 10px gap
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },

  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  statValue: {
    fontSize: 24,
    fontWeight: "800",
  },

  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },

  // Heatmap
  heatmapCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 24,
  },

  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 8,
  },

  legendText: {
    fontSize: 10,
  },

  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },

  // Actions
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
