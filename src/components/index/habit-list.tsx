import IconView from "@/components/IconView";
import ThemedText from "@/components/ThemedText";
import { useColors } from "@/hooks/useColors";
import { useHabitStore } from "@/store/habit.store";
import { Habit } from "@/types/habit";
import { MaterialIcons } from "@expo/vector-icons";
import { Dayjs } from "dayjs";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { getFrequencyLabel } from "@/lib/habit-utils";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const EMPTY_LOG = { progress: 0, isCompleted: false };

// How far a card must travel before letting go triggers its action.
const THRESHOLD = 88;
const SPRING = { dampingRatio: 1, duration: 350 };

// Past the threshold the card follows the finger less and less, so the edge
// feels soft instead of like a wall.
function rubberBand(x: number) {
  "worklet";
  const over = Math.abs(x) - THRESHOLD;
  if (over <= 0) return x;
  return Math.sign(x) * (THRESHOLD + (over * 110) / (200 + 0.55 * over));
}

export default function HabitList({
  habit,
  selectedDate,
  onLongPress,
  onSwiped,
}: {
  habit: Habit;
  selectedDate: Dayjs;
  onLongPress?: () => void;
  /** Called after a swipe triggers its action. */
  onSwiped?: () => void;
}) {
  const colors = useColors();
  // Only this habit's log: logging another habit leaves this card alone.
  const log = useHabitStore((s) => s.dailyLogs[habit.id]) ?? EMPTY_LOG;
  const incrementProgress = useHabitStore((s) => s.incrementProgress);
  const { isCompleted, progress } = log;

  const clampedProgress = Math.min(progress, habit.dailyGoal);
  const progressPercent =
    habit.dailyGoal > 0 ? (clampedProgress / habit.dailyGoal) * 100 : 0;

  const animProgress = useSharedValue(progressPercent);

  useEffect(() => {
    animProgress.value = withSpring(progressPercent, SPRING);
  }, [progressPercent]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${animProgress.value}%`,
  }));

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 400 });
  };

  const handleToggle = useCallback(() => {
    // Not awaited: the haptic and the visual change land together.
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    incrementProgress(habit, selectedDate.format("YYYY-MM-DD"));
  }, [habit, selectedDate, incrementProgress]);

  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.();
  }, [onLongPress]);

  // Swipe right to log progress, left to open details.
  const dragX = useSharedValue(0);
  const grabX = useSharedValue(0);
  const armed = useSharedValue(false);
  const tick = () => Haptics.selectionAsync();
  const swiped = (action: () => void) => {
    action();
    onSwiped?.();
  };

  const swipe = Gesture.Pan()
    .activeOffsetX([-6, 6]) // claim the drag before the tab pager does
    .failOffsetY([-12, 12])
    .onStart((e) => {
      grabX.value = e.translationX; // start from where the finger is: no jump
    })
    .onUpdate((e) => {
      const x = e.translationX - grabX.value;
      dragX.value = rubberBand(x);
      const nowArmed = Math.abs(x) > THRESHOLD;
      if (nowArmed !== armed.value) {
        armed.value = nowArmed;
        if (nowArmed) runOnJS(tick)(); // one tick when the action is armed
      }
    })
    .onEnd((e) => {
      // Judge by where the swipe is heading, so a short flick counts too.
      const projected = e.translationX - grabX.value + e.velocityX * 0.1;
      if (projected > THRESHOLD) runOnJS(swiped)(handleToggle);
      else if (projected < -THRESHOLD) runOnJS(swiped)(handleLongPress);
    })
    .onFinalize(() => {
      armed.value = false;
      dragX.value = withSpring(0, SPRING);
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.value }, { scale: scale.value }],
    opacity: withTiming(isCompleted ? 0.85 : 1, { duration: 200 }),
  }));

  // Each action icon grows as its side is revealed, and is full size once armed.
  const logStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      dragX.value,
      [8, THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          dragX.value,
          [8, THRESHOLD],
          [0.6, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));
  const detailsStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      -dragX.value,
      [8, THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        scale: interpolate(
          -dragX.value,
          [8, THRESHOLD],
          [0.6, 1],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const frequencyLabel = getFrequencyLabel(habit);

  return (
    <View style={styles.wrapper}>
      {/* What the card uncovers as it slides */}
      <View
        style={[styles.actions, { backgroundColor: colors.primary + "22" }]}
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
      >
        <Animated.View style={logStyle}>
          <MaterialIcons
            name={isCompleted ? "undo" : "add"}
            size={26}
            color={colors.primary}
          />
        </Animated.View>
        <Animated.View style={detailsStyle}>
          <MaterialIcons name="info-outline" size={26} color={colors.primary} />
        </Animated.View>
      </View>

      <GestureDetector gesture={swipe}>
        <AnimatedPressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          // Holding the card drags it (see the home screen), so details are
          // a swipe left, or this action for screen readers.
          accessibilityActions={[{ name: "longpress", label: "Show details" }]}
          onAccessibilityAction={handleLongPress}
          style={[
            cardStyle,
            styles.card,
            {
              backgroundColor: colors.surface,
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
              <IconView iconKey={habit.icon} size={24} circle={false} />
            </View>

            {/* Middle: title + frequency */}
            <View style={styles.textBlock}>
              <ThemedText style={styles.title} numberOfLines={1}>
                {habit.title}
              </ThemedText>
              <ThemedText style={styles.frequency} variant="muted">
                {[frequencyLabel, `${clampedProgress}/${habit.dailyGoal}`]
                  .filter(Boolean)
                  .join(" · ")}
              </ThemedText>
            </View>

            {/* Right: count pill */}
            <Pressable
              onPress={handleToggle}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={`${habit.title}, ${clampedProgress} of ${habit.dailyGoal}. ${isCompleted ? "Reset" : "Log progress"}`}
              style={({ pressed }) => pressed && { opacity: 0.5 }}
            >
              <View
                style={[
                  styles.pill,
                  {
                    backgroundColor: isCompleted
                      ? colors.primary
                      : colors.background,
                  },
                ]}
              >
                <MaterialIcons
                  name={isCompleted ? "check" : "add"}
                  size={22}
                  color={isCompleted ? colors.onPrimary : colors.text}
                />
              </View>
            </Pressable>
          </View>
          <View
            style={[
              styles.progressBarBg,
              { backgroundColor: colors.border + "4D" },
            ]}
          >
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: colors.primary,
                },
                progressStyle,
              ]}
            />
          </View>
        </AnimatedPressable>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 16,
  },
  actions: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 28,
  },
  card: {
    borderRadius: 20,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
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
    letterSpacing: -0.1,
  },
  frequency: {
    fontSize: 13,
    fontWeight: "400",
  },
  // Round action button
  pill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  // The card's bottom edge; its rounded corners clip the ends.
  progressBarBg: {
    height: 3,
  },
  progressBarFill: {
    height: "100%",
  },
});
