import ThemedText from "@/components/ThemedText";
import { useColors } from "@/hooks/useColors";
import { useHabitStore } from "@/store/habit.store";
import { MaterialIcons } from "@expo/vector-icons";
import dayjs, { Dayjs } from "dayjs";
import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

// Critically damped: no overshoot, and a new drag can take over mid-flight.
const SPRING = { dampingRatio: 1, duration: 350 };

type Props = {
  selectedDate: Dayjs;
  onSelectDate: (date: Dayjs) => void;
};

export default function HeaderIndex({ selectedDate, onSelectDate }: Props) {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const today = dayjs();

  // The strip always shows the week that holds the selected day.
  const weekStart = selectedDate.startOf("week");
  const weekDays = Array.from({ length: 7 }, (_, i) => weekStart.add(i, "day"));

  const dayOffset = selectedDate
    .startOf("day")
    .diff(today.startOf("day"), "day");
  const title =
    dayOffset === 0
      ? "Today"
      : dayOffset === -1
        ? "Yesterday"
        : dayOffset === 1
          ? "Tomorrow"
          : selectedDate.format("dddd");

  const stats = useHabitStore((s) => s.stats);
  const streak = Math.max(
    0,
    ...Object.values(stats).map((s) => s.currentStreak),
  );

  const shiftWeek = (direction: number) => {
    Haptics.selectionAsync();
    onSelectDate(selectedDate.add(direction * 7, "day"));
  };

  const stripX = useSharedValue(0);
  const swipeWeek = Gesture.Pan()
    .activeOffsetX([-6, 6])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      stripX.value = e.translationX; // the strip stays under the finger
    })
    .onEnd((e) => {
      // Judge by where the swipe is heading, so a short flick counts too.
      const projected = e.translationX + e.velocityX * 0.1;
      if (Math.abs(projected) < width / 3) {
        stripX.value = withSpring(0, SPRING);
        return;
      }
      const direction = projected < 0 ? 1 : -1; // swipe left = next week
      stripX.value = withTiming(-direction * width, { duration: 160 }, () => {
        runOnJS(shiftWeek)(direction);
        stripX.value = direction * width; // the new week comes in from the far side
        stripX.value = withSpring(0, SPRING);
      });
    });
  const stripStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: stripX.value }],
    opacity: 1 - Math.min(Math.abs(stripX.value) / width, 1) * 0.7,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View>
          <ThemedText accessibilityRole="header" style={styles.title}>
            {title}
          </ThemedText>
          <ThemedText variant="muted" style={styles.date}>
            {selectedDate.format("dddd, MMMM D")}
          </ThemedText>
        </View>

        {dayOffset === 0 ? (
          <View
            style={[styles.streak, { backgroundColor: colors.surface }]}
            accessible
            accessibilityLabel={`Longest current streak: ${streak} days`}
          >
            <ThemedText style={styles.streakText}>{streak}</ThemedText>
            <MaterialIcons
              name="local-fire-department"
              size={18}
              color={colors.icon}
            />
          </View>
        ) : (
          <Pressable
            onPress={() => onSelectDate(dayjs())}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Go to today"
            style={({ pressed }) => [
              styles.todayButton,
              { backgroundColor: colors.primary + "22" },
              pressed && { opacity: 0.5 },
            ]}
          >
            <ThemedText style={[styles.todayText, { color: colors.primary }]}>
              Today
            </ThemedText>
          </Pressable>
        )}
      </View>

      <GestureDetector gesture={swipeWeek}>
        <Animated.View style={[styles.weekRow, stripStyle]}>
          {weekDays.map((date) => {
            const selected = date.isSame(selectedDate, "day");
            const isToday = date.isSame(today, "day");

            return (
              <Pressable
                key={date.format("YYYY-MM-DD")}
                onPress={() => onSelectDate(date)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={date.format("dddd, MMMM D")}
                style={({ pressed }) => [
                  styles.day,
                  pressed && { opacity: 0.5 },
                ]}
              >
                <ThemedText
                  style={[
                    styles.dayName,
                    { color: selected ? colors.text : colors.textMuted },
                  ]}
                >
                  {date.format("dd")}
                </ThemedText>
                {/* Selected day: filled circle. Today, when not selected: ring. */}
                <View
                  style={[
                    styles.dayCircle,
                    {
                      backgroundColor: selected
                        ? colors.primary
                        : "transparent",
                      borderColor:
                        isToday && !selected ? colors.primary : "transparent",
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.dayNumber,
                      { color: selected ? colors.onPrimary : colors.text },
                    ]}
                  >
                    {date.format("D")}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 20,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  streak: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
  },
  streakText: {
    fontSize: 15,
    fontWeight: "700",
  },
  date: {
    fontSize: 15,
    marginTop: 2,
  },
  todayButton: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
  },
  todayText: {
    fontSize: 14,
    fontWeight: "600",
  },
  // Same side margin as the title, so the first and last days line up with it.
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  day: {
    alignItems: "center",
    gap: 8,
  },
  dayName: {
    fontSize: 12,
    fontWeight: "600",
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: "600",
  },
});
