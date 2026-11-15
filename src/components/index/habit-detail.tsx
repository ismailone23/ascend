import ThemedText from "@/components/ThemedText";
import { useColors } from "@/hooks/useColors";
import { HabitStatsResult, logRepository } from "@/repositories/log.repository";
import { useHabitStore } from "@/store/habit.store";
import { Habit } from "@/types/habit";
import { Octicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

// No overshoot when the sheet arrives or settles back.
const SPRING = { dampingRatio: 1, duration: 350 };
import CompletionHeatmap from "./habit-detail/CompletionHeatmap";
import DetailHeader from "./habit-detail/DetailHeader";
import InfoPills from "./habit-detail/InfoPills";
import HabitStats from "./habit-detail/HabitStats";

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

  // The sheet slides up from the bottom and can be dragged back down by its
  // handle. The dimmed backdrop fades separately and stays put.
  const { height } = useWindowDimensions();
  const sheetY = useSharedValue(height);
  useEffect(() => {
    if (visible) {
      sheetY.value = height;
      sheetY.value = withSpring(0, SPRING);
    }
  }, [visible]);

  const dismiss = () => {
    sheetY.value = withSpring(height, SPRING, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  };

  // The whole sheet can be dragged down to close, not only its handle. The
  // list inside keeps scrolling: the sheet only follows a drag that starts
  // with the list at its top.
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useSharedValue(0);
  const atTop = useSharedValue(true);
  const drag = Gesture.Pan()
    .activeOffsetY(8) // downward only
    .failOffsetX([-16, 16]) // leave sideways drags to the heatmap
    .simultaneousWithExternalGesture(scrollRef as any)
    .onStart(() => {
      atTop.value = scrollY.value <= 0;
    })
    .onUpdate((e) => {
      if (atTop.value) sheetY.value = Math.max(e.translationY, 0);
    })
    .onEnd((e) => {
      if (!atTop.value) return;
      // Judge by where the drag is heading, so a quick flick down closes it.
      if (e.translationY + e.velocityY * 0.1 > 140) runOnJS(dismiss)();
      else sheetY.value = withSpring(0, SPRING);
    });
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      {/* Gestures inside a Modal need their own root on Android */}
      <GestureHandlerRootView style={styles.root}>
        <Pressable
          style={styles.backdrop}
          onPress={dismiss}
          accessibilityLabel="Close"
        />

        <GestureDetector gesture={drag}>
          <Animated.View
            style={[
              styles.sheet,
              { backgroundColor: colors.background },
              sheetStyle,
            ]}
          >
            <View style={styles.handleBar}>
              <View
                style={[styles.handle, { backgroundColor: colors.indicator }]}
              />
            </View>

            <ScrollView
              ref={scrollRef}
              onScroll={(e) => {
                scrollY.value = e.nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Header */}
              <DetailHeader habit={habit} onClose={dismiss} />

              {/* Info pills */}
              <InfoPills habit={habit} />

              {/* Stats grid */}
              <ThemedText
                accessibilityRole="header"
                style={styles.sectionTitle}
              >
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
                <HabitStats
                  habit={habit}
                  stats={stats}
                  progress={progressData}
                />
              )}

              {/* Heatmap */}
              <ThemedText
                accessibilityRole="header"
                style={styles.sectionTitle}
              >
                Last Year
              </ThemedText>

              <CompletionHeatmap data={progressData} loading={loading} />

              {/* Actions */}
              <ThemedText
                accessibilityRole="header"
                style={styles.sectionTitle}
              >
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
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.55)",
  },

  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "88%",
  },

  // Tall enough to grab comfortably.
  handleBar: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 16,
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
