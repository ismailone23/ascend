import SortableRows from "@/components/goals/SortableRows";
import IconView from "@/components/IconView";
import IconPickerModal from "@/components/index/create-habit/IconPickerModal";
import ThemedText from "@/components/ThemedText";
import { useColors } from "@/hooks/useColors";
import { goalRepository } from "@/repositories/goal.repository";
import { Goal, GoalStep } from "@/types/goal";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
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

/** "Due 30 Nov · 15 days left", "Due today", "3 days overdue". */
function dueLabel(targetDate: string) {
  const days = dayjs(targetDate)
    .startOf("day")
    .diff(dayjs().startOf("day"), "day");
  if (days < 0) return `${-days} day${days === -1 ? "" : "s"} overdue`;
  if (days === 0) return "Due today";
  const when = dayjs(targetDate).format("D MMM");
  return `Due ${when} · ${days} day${days === 1 ? "" : "s"} left`;
}

export default function GoalCard({ goal, open, onToggle, run }: Props) {
  const colors = useColors();
  const [draft, setDraft] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [pickingDate, setPickingDate] = useState(false);
  const [pickingIcon, setPickingIcon] = useState(false);
  // Field to focus when edit mode opens from a long-press (goal or step id).
  const [focusId, setFocusId] = useState<string | null>(null);
  const editing = open && editMode;

  const total = goal.steps.length;
  const done = goal.steps.filter((s) => s.done).length;
  const complete = total > 0 && done === total;
  const percent = total ? (done / total) * 100 : 0;
  const next = goal.steps.find((s) => !s.done);

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

  // Names typed in edit mode and not saved yet, by goal or step id. They are
  // saved when a field loses focus and when edit mode closes, because closing
  // it removes the field before it can lose focus. Empty text is ignored.
  const edits = useRef<Record<string, string>>({});
  const saveEdits = () => {
    for (const [id, text] of Object.entries(edits.current)) {
      const title = text.trim();
      if (!title) continue;
      if (id === goal.id) {
        if (title !== goal.title) run(goalRepository.rename(id, title));
      } else if (title !== goal.steps.find((s) => s.id === id)?.title) {
        run(goalRepository.renameStep(id, title));
      }
    }
    edits.current = {};
  };
  const closeEdit = () => {
    saveEdits();
    Keyboard.dismiss(); // the field being typed in goes away with edit mode
    setEditMode(false);
  };

  const startEdit = (id: string | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setFocusId(id);
    setEditMode(true);
    if (!open) onToggle();
  };

  const reorder = (ids: string[]) => {
    if (ids.join() !== goal.steps.map((s) => s.id).join())
      run(goalRepository.reorderSteps(ids));
  };

  const confirmDelete = () => {
    Alert.alert(
      "Delete goal?",
      `"${goal.title}" and its steps will be removed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => run(goalRepository.delete(goal.id)),
        },
      ],
    );
  };

  const summary = complete
    ? "Completed"
    : next
      ? `Next: ${next.title}`
      : "No steps yet";

  return (
    <Animated.View
      layout={LAYOUT}
      style={[
        styles.card,
        { backgroundColor: colors.surface },
        complete && !open && { opacity: 0.6 },
      ]}
    >
      <Pressable
        onPress={() => {
          closeEdit();
          onToggle();
        }}
        onLongPress={() => !editing && startEdit(goal.id)}
        accessibilityHint="Long-press to edit"
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${goal.title}, ${done} of ${total} steps. ${summary}`}
        style={({ pressed }) => [styles.header, pressed && { opacity: 0.6 }]}
      >
        <View style={[styles.icon, { backgroundColor: colors.background }]}>
          <IconView iconKey={goal.icon} size={20} color={colors.icon} />
        </View>
        <View style={styles.headerText}>
          <ThemedText style={styles.title} numberOfLines={2}>
            {goal.title}
          </ThemedText>
          <ThemedText variant="muted" numberOfLines={1}>
            {summary}
          </ThemedText>
        </View>
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
          style={[styles.fill, { backgroundColor: colors.primary }, fillStyle]}
        />
      </View>
      <View style={styles.meta}>
        <ThemedText variant="muted" style={styles.metaText}>
          {total === 0 ? "" : `${done} of ${total} steps`}
        </ThemedText>
        {goal.targetDate && !complete ? (
          <ThemedText variant="muted" style={styles.metaText}>
            {dueLabel(goal.targetDate)}
          </ThemedText>
        ) : null}
      </View>

      {open && !editing && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(120)}
          style={styles.body}
        >
          {goal.steps.map((step, index) => (
            <Pressable
              key={step.id}
              onPress={() => toggleStep(step)}
              onLongPress={() => startEdit(step.id)}
              accessibilityHint="Long-press to edit"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: step.done }}
              accessibilityLabel={`Step ${index + 1}: ${step.title}`}
              style={({ pressed }) => [
                styles.step,
                pressed && { opacity: 0.6 },
              ]}
            >
              <View style={styles.rail}>
                <View
                  style={[
                    styles.node,
                    {
                      borderColor:
                        step.done || step.id === next?.id
                          ? colors.primary
                          : colors.border,
                      backgroundColor: step.done
                        ? colors.primary
                        : "transparent",
                    },
                  ]}
                >
                  {step.done ? (
                    <MaterialIcons
                      name="check"
                      size={16}
                      color={colors.onPrimary}
                    />
                  ) : (
                    <ThemedText
                      style={[
                        styles.nodeNumber,
                        step.id !== next?.id && { color: colors.textMuted },
                      ]}
                    >
                      {index + 1}
                    </ThemedText>
                  )}
                </View>
                <View
                  style={[
                    styles.line,
                    {
                      backgroundColor: step.done
                        ? colors.primary
                        : colors.border,
                    },
                  ]}
                />
              </View>
              <ThemedText
                style={[
                  styles.stepText,
                  step.id === next?.id && { fontWeight: "600" },
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
                <MaterialIcons name="add" size={16} color={colors.textMuted} />
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

          <View style={styles.footer}>
            <View />
            <TextButton label="Edit" onPress={() => startEdit(null)} />
          </View>
        </Animated.View>
      )}

      {editing && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(120)}
          style={styles.body}
        >
          <ThemedText variant="muted" style={styles.fieldLabel}>
            Goal
          </ThemedText>
          <View style={styles.nameRow}>
            <Pressable
              onPress={() => setPickingIcon(true)}
              accessibilityRole="button"
              accessibilityLabel="Change icon"
              style={({ pressed }) => [
                styles.icon,
                styles.iconField,
                { backgroundColor: colors.background },
                pressed && { opacity: 0.6 },
              ]}
            >
              <IconView iconKey={goal.icon} size={20} color={colors.icon} />
            </Pressable>
            <TextInput
              defaultValue={goal.title}
              autoFocus={focusId === goal.id}
              onChangeText={(text) => (edits.current[goal.id] = text)}
              onEndEditing={saveEdits}
              maxLength={80}
              accessibilityLabel="Goal name"
              style={[
                styles.field,
                styles.editField,
                { color: colors.text, backgroundColor: colors.background },
              ]}
            />
          </View>
          <IconPickerModal
            visible={pickingIcon}
            onClose={() => setPickingIcon(false)}
            selectedIcon={goal.icon}
            onSelectIcon={(icon) => run(goalRepository.setIcon(goal.id, icon))}
          />

          <ThemedText variant="muted" style={styles.fieldLabel}>
            Target date
          </ThemedText>
          <View style={styles.dateRow}>
            <Pressable
              onPress={() => setPickingDate(true)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.field,
                styles.dateField,
                { backgroundColor: colors.background },
                pressed && { opacity: 0.6 },
              ]}
            >
              <MaterialIcons name="event" size={18} color={colors.icon} />
              <ThemedText style={styles.dateText}>
                {goal.targetDate
                  ? dayjs(goal.targetDate).format("D MMMM YYYY")
                  : "Add a target date"}
              </ThemedText>
            </Pressable>
            {goal.targetDate && (
              <IconButton
                icon="close"
                label="Remove target date"
                onPress={() => run(goalRepository.setTargetDate(goal.id, null))}
              />
            )}
          </View>
          {pickingDate && (
            <DateTimePicker
              value={goal.targetDate ? new Date(goal.targetDate) : new Date()}
              mode="date"
              minimumDate={new Date()}
              onDismiss={() => setPickingDate(false)}
              onValueChange={(_, date) => {
                setPickingDate(false);
                run(
                  goalRepository.setTargetDate(
                    goal.id,
                    dayjs(date).format("YYYY-MM-DD"),
                  ),
                );
              }}
            />
          )}

          {total > 0 && (
            <ThemedText variant="muted" style={styles.fieldLabel}>
              Steps
            </ThemedText>
          )}
          <SortableRows
            ids={goal.steps.map((step) => step.id)}
            gap={8}
            grab="handle"
            onReorder={reorder}
            handleLabel={(index) => `Reorder step ${index + 1}`}
            renderRow={(id, index) => (
              <>
                <TextInput
                  defaultValue={goal.steps[index].title}
                  autoFocus={focusId === id}
                  onChangeText={(text) => (edits.current[id] = text)}
                  onEndEditing={saveEdits}
                  maxLength={120}
                  accessibilityLabel={`Step ${index + 1}`}
                  style={[
                    styles.field,
                    styles.editField,
                    { color: colors.text, backgroundColor: colors.background },
                  ]}
                />
                <IconButton
                  icon="delete-outline"
                  label="Delete step"
                  onPress={() => run(goalRepository.deleteStep(id))}
                />
              </>
            )}
          />

          <View style={styles.footer}>
            <TextButton label="Delete goal" onPress={confirmDelete} />
            <TextButton label="Done" onPress={closeEdit} />
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

function TextButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      style={({ pressed }) => pressed && { opacity: 0.5 }}
    >
      <ThemedText style={[styles.textButton, { color: colors.text }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function IconButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.iconButton,
        (pressed || disabled) && { opacity: 0.3 },
      ]}
    >
      <MaterialIcons name={icon} size={20} color={colors.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    paddingBottom: 14,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    paddingBottom: 12,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  iconField: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  nameRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
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
  meta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 8,
  },
  metaText: {
    fontSize: 12,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  step: {
    flexDirection: "row",
    gap: 12,
    minHeight: 46,
  },
  rail: {
    width: 26,
    alignItems: "center",
  },
  node: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  nodeNumber: {
    fontSize: 12,
    fontWeight: "700",
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
    paddingTop: 2,
    paddingBottom: 18,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: 26,
    padding: 0,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  textButton: {
    fontSize: 15,
    fontWeight: "600",
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  field: {
    fontSize: 15,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 14,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },
  dateField: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    fontSize: 15,
  },
  editField: {
    flex: 1,
    height: 44, // step rows are placed by a fixed height, see SortableRows
    marginBottom: 0,
    marginRight: 4,
  },
  iconButton: {
    width: 36,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
