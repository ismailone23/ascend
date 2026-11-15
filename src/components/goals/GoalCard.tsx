import ThemedText from "@/components/ThemedText";
import { useColors } from "@/hooks/useColors";
import { goalRepository } from "@/repositories/goal.repository";
import { Goal, GoalStep } from "@/types/goal";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Alert, Pressable, StyleSheet, TextInput, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";

// Critically damped: settles without overshoot, and can be retargeted mid-flight.
const SPRING = { dampingRatio: 1, duration: 400 };
const LAYOUT = LinearTransition.springify().dampingRatio(1).duration(400);

type Props = {
  goal: Goal;
  open: boolean;
  onToggle: () => void;
  /** Awaits a repository write, then reloads the list. */
  run: (op: Promise<unknown>) => void;
};

export default function GoalCard({ goal, open, onToggle, run }: Props) {
  const colors = useColors();
  const [draft, setDraft] = useState("");

  const total = goal.steps.length;
  const done = goal.steps.filter((s) => s.done).length;
  const complete = total > 0 && done === total;
  const percent = total ? (done / total) * 100 : 0;
  const nextId = goal.steps.find((s) => !s.done)?.id;
  const accent = colors.primary;

  const progress = useDerivedValue(() => withSpring(percent, SPRING));
  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value}%` }));

  const rotation = useDerivedValue(() => withSpring(open ? 90 : 0, SPRING));
  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const toggleStep = (step: GoalStep) => {
    // A stronger haptic only for the step that finishes the whole goal.
    if (!step.done && done === total - 1) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    run(goalRepository.setStepDone(step.id, !step.done));
  };

  const addStep = () => {
    const title = draft.trim();
    if (!title) return;
    setDraft("");
    run(goalRepository.addStep(goal.id, title));
  };

  const confirmDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Delete goal?", `"${goal.title}" and its steps will be removed.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => run(goalRepository.delete(goal.id)),
      },
    ]);
  };

  const summary = complete
    ? "Completed"
    : total === 0
      ? "No steps yet"
      : `${done} of ${total} steps`;

  return (
    <Animated.View
      layout={LAYOUT}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <Pressable
        onPress={onToggle}
        onLongPress={confirmDelete}
        delayLongPress={400}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${goal.title}, ${summary}`}
        accessibilityHint="Long press to delete"
        style={({ pressed }) => [styles.header, pressed && { opacity: 0.6 }]}
      >
        <View style={styles.headerText}>
          <ThemedText style={styles.title} numberOfLines={2}>
            {goal.title}
          </ThemedText>
          <ThemedText variant="muted">{summary}</ThemedText>
        </View>
        {complete && (
          <MaterialIcons name="check-circle" size={22} color={colors.primary} />
        )}
        <Animated.View style={chevronStyle}>
          <MaterialIcons
            name="chevron-right"
            size={24}
            color={colors.textMuted}
          />
        </Animated.View>
      </Pressable>

      <View style={[styles.track, { backgroundColor: colors.border }]}>
        <Animated.View
          style={[styles.fill, { backgroundColor: accent }, fillStyle]}
        />
      </View>

      {open && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(120)}
          style={styles.roadmap}
        >
          {goal.steps.map((step) => (
            <Pressable
              key={step.id}
              onPress={() => toggleStep(step)}
              onLongPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                run(goalRepository.deleteStep(step.id));
              }}
              delayLongPress={400}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: step.done }}
              accessibilityHint="Long press to remove"
              style={({ pressed }) => [styles.step, pressed && { opacity: 0.6 }]}
            >
              <View style={styles.rail}>
                <View
                  style={[
                    styles.node,
                    {
                      borderColor:
                        step.done || step.id === nextId ? accent : colors.border,
                      backgroundColor: step.done ? accent : "transparent",
                    },
                  ]}
                >
                  {step.done && (
                    <MaterialIcons name="check" size={14} color={colors.onPrimary} />
                  )}
                </View>
                <View
                  style={[
                    styles.line,
                    { backgroundColor: step.done ? accent : colors.border },
                  ]}
                />
              </View>
              <ThemedText
                style={[
                  styles.stepText,
                  step.done && {
                    color: colors.textMuted,
                    textDecorationLine: "line-through",
                  },
                ]}
              >
                {step.title}
              </ThemedText>
            </Pressable>
          ))}

          <View style={styles.step}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.node,
                  { borderColor: colors.border, borderStyle: "dashed" },
                ]}
              >
                <MaterialIcons name="add" size={14} color={colors.textMuted} />
              </View>
            </View>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onSubmitEditing={addStep}
              autoFocus={total === 0} // a goal with no roadmap yet: go straight to writing it
              submitBehavior="submit" // keep the keyboard up to add several steps in a row
              placeholder={total === 0 ? "Add the first step" : "Add a step"}
              placeholderTextColor={colors.textMuted}
              returnKeyType="next"
              maxLength={120}
              style={[styles.input, { color: colors.text }]}
            />
          </View>

          {total > 0 && (
            <ThemedText variant="muted" style={styles.hint}>
              Hold a step to remove it.
            </ThemedText>
          )}
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    paddingBottom: 16,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
  },
  headerText: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  track: {
    height: 4,
    borderRadius: 2,
    marginHorizontal: 16,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 2,
  },
  roadmap: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  step: {
    flexDirection: "row",
    gap: 12,
    minHeight: 44,
  },
  rail: {
    width: 22,
    alignItems: "center",
  },
  node: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    flex: 1,
    width: 2,
    borderRadius: 1,
    marginVertical: 3,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    paddingBottom: 18,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: 22,
    padding: 0,
  },
  hint: {
    fontSize: 12,
    marginLeft: 34,
  },
});
