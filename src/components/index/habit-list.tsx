import { useColors } from "@/hooks/useColors";
import { useHabitStore } from "@/store/habit.store";
import { Habit } from "@/types/habit";
import { Octicons } from "@expo/vector-icons";
import { Dayjs } from "dayjs";
import * as Haptics from "expo-haptics";
import { useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import ThemedText from "../ThemedText";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getFrequencyLabel(habit: Habit): string {
  switch (habit.frequency) {
    case "daily":
      return "Daily";
    case "weekly":
      return `${habit.timesPerWeek}x/wk`;
    case "custom":
      return habit.days.join(", ");
    default:
      return "";
  }
}

export default function HabitList({
  habit,
  selectedDate,
  onLongPress,
}: {
  habit: Habit;
  selectedDate: Dayjs;
  onLongPress?: () => void;
}) {
  const colors = useColors();
  const { dailyLogs, incrementProgress, stats } = useHabitStore();

  const log = dailyLogs[habit.id] || { progress: 0, isCompleted: false };
  const { isCompleted, progress } = log;

  const currentStreak = stats[habit.id]?.currentStreak || 0;

  // Cap progress at dailyGoal for calculation
  const clampedProgress = Math.min(progress, habit.dailyGoal);
  const percentage = Math.round((clampedProgress / habit.dailyGoal) * 100);

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.96, {
      damping: 20,
      stiffness: 400,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 20,
      stiffness: 400,
    });
  };

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: withTiming(isCompleted ? 0.9 : 1, { duration: 200 }),
    };
  });

  const handleToggle = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const dateStr = selectedDate.format("YYYY-MM-DD");
    await incrementProgress(habit, dateStr);
  }, [habit, selectedDate, incrementProgress]);

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.();
  }, [onLongPress]);

  const frequencyLabel = getFrequencyLabel(habit);

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={handleLongPress}
      delayLongPress={400}
      style={[
        animatedCardStyle,
        styles.card,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      {/* Top row: icon + text + checkbox ring */}
      <View style={styles.topRow}>
        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: "transparent" }]}>
          <Text style={styles.iconEmoji}>{habit.icon}</Text>
        </View>

        {/* Title + comment */}
        <View style={styles.textBlock}>
          <ThemedText style={styles.title}>{habit.title}</ThemedText>

          {habit.comment ? (
            <ThemedText style={styles.comment} variant="muted">
              {habit.comment}
            </ThemedText>
          ) : null}
        </View>

        <Pressable
          onPress={handleToggle}
          hitSlop={12}
          style={[styles.ringContainer]}
        >
          {isCompleted ? (
            <View
              style={[
                styles.ring,
                {
                  borderColor: colors.primary,
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Octicons name="check" size={24} color={colors.background} />
            </View>
          ) : (
            <View style={styles.svgContainer}>
              <Svg width="52" height="52" viewBox="0 0 52 52">
                <Circle
                  cx="26"
                  cy="26"
                  r="22"
                  stroke={colors.primary}
                  strokeWidth="4"
                  fill="transparent"
                  strokeOpacity={0.2}
                />
                {/* Progress Ring */}
                <Circle
                  cx="26"
                  cy="26"
                  r="22"
                  stroke={colors.primary}
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={`${22 * 2 * Math.PI}`}
                  strokeDashoffset={`${22 * 2 * Math.PI * (1 - clampedProgress / habit.dailyGoal)}`}
                  strokeLinecap="round"
                  rotation="-90"
                  origin="26, 26"
                />
              </Svg>
              <View style={styles.ringTextContainer}>
                <Text style={styles.ringText}>{percentage}%</Text>
              </View>
            </View>
          )}
        </Pressable>
      </View>

      {/* Footer: streak goal + frequency */}
      <View
        style={[
          styles.footer,
          { borderTopWidth: 1, borderTopColor: colors.border },
        ]}
      >
        <View style={styles.streakBadge}>
          <Octicons name="flame" size={14} color={colors.primary} />
          <Text style={styles.streakText}>{currentStreak} day streak</Text>
        </View>

        {frequencyLabel ? (
          <View
            style={[styles.frequencyBadge, { backgroundColor: colors.surface }]}
          >
            <Text style={styles.frequencyText}>{frequencyLabel}</Text>
          </View>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    marginHorizontal: 16,
    overflow: "hidden",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },

  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  iconEmoji: {
    fontSize: 30,
  },

  textBlock: {
    flex: 1,
    marginLeft: 14,
    marginRight: 12,
  },

  title: {
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  comment: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: "500",
  },

  ringContainer: {
    width: 52,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },

  svgContainer: {
    width: 52,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  ringTextContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },

  ring: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 4,
    justifyContent: "center",
    alignItems: "center",
  },

  ringText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#38BDF8",
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },

  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  streakText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#38BDF8",
  },

  frequencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  frequencyText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8B949E",
  },
});
