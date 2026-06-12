import IconView from "@/components/IconView";
import ThemedText from "@/components/ThemedText";
import { useColors } from "@/hooks/useColors";
import { useHabitStore } from "@/store/habit.store";
import { Habit } from "@/types/habit";
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getFrequencyLabel(habit: Habit): string {
  if (!habit.days || habit.days.length === 0) return "";
  if (habit.days.length === 7) return "Every Day";
  return habit.days.join(", ");
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
  const { dailyLogs, incrementProgress } = useHabitStore();
  const log = dailyLogs[habit.id] || { progress: 0, isCompleted: false };
  const { isCompleted, progress } = log;

  const clampedProgress = Math.min(progress, habit.dailyGoal);

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 400 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: withTiming(isCompleted ? 0.85 : 1, { duration: 200 }),
  }));

  const handleToggle = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await incrementProgress(habit, selectedDate.format("YYYY-MM-DD"));
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
        animatedStyle,
        styles.card,
        {
          backgroundColor: colors.background,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.row}>
        {/* Left: icon circle */}
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.primary + "33" },
          ]}
        >
          <IconView iconKey={habit.icon} size={26} circle={false} />
        </View>

        {/* Middle: title + frequency */}
        <View style={styles.textBlock}>
          <ThemedText style={styles.title}>{habit.title}</ThemedText>
          {frequencyLabel ? (
            <ThemedText style={styles.frequency} variant="muted">
              {frequencyLabel}
            </ThemedText>
          ) : null}
        </View>

        {/* Right: count pill */}
        <Pressable onPress={handleToggle} hitSlop={12}>
          <View
            style={[
              styles.pill,
              {
                backgroundColor: isCompleted
                  ? colors.primary + "33"
                  : colors.surface,
              },
            ]}
          >
            <Text
              style={[
                styles.pillText,
                { color: isCompleted ? "#fff" : colors.primary },
              ]}
            >
              {clampedProgress}/{habit.dailyGoal}
            </Text>
          </View>
        </Pressable>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  textBlock: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  frequency: {
    fontSize: 13,
    fontWeight: "400",
  },
  pill: {
    padding: 14,
    borderRadius: 99,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  pillText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
