import { useColors } from "@/hooks/useColors";
import { useHabitStore } from "@/store/habit.store";
import { CreateHabitInput, DayOfWeek } from "@/types/habit";
import { Octicons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import * as Haptics from "expo-haptics";
import { useCallback, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import ThemedText from "../ThemedText";

// ── Icon data ──────────────────────────────────────────────
const ICON_SECTIONS = [
  {
    label: "Health & Fitness",
    icons: ["🏃", "💪", "🧘", "🚴", "🏊", "⚽", "🎯", "❤️"],
  },
  {
    label: "Mind & Learning",
    icons: ["📖", "✍️", "🧠", "🎓", "📝", "💡", "🎨", "🎵"],
  },
  {
    label: "Lifestyle",
    icons: ["💧", "🥗", "😴", "🧹", "🌿", "☀️", "🚿", "💊"],
  },
  {
    label: "Work & Productivity",
    icons: ["💻", "📊", "📧", "⏰", "📱", "🗂️", "✅", "🚀"],
  },
];

const ALL_DAYS: DayOfWeek[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// ── Component ──────────────────────────────────────────────
type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function CreateHabitModal({ visible, onClose }: Props) {
  const colors = useColors();
  const addHabit = useHabitStore((s) => s.addHabit);

  // Form state
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [frequency, setFrequency] = useState<"daily" | "weekly" | "custom">(
    "daily",
  );
  const [timesPerWeek, setTimesPerWeek] = useState(3);
  const [customDays, setCustomDays] = useState<DayOfWeek[]>([]);
  const [dailyGoal, setDailyGoal] = useState(1);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const resetForm = useCallback(() => {
    setTitle("");
    setComment("");
    setIcon("🎯");
    setFrequency("daily");
    setTimesPerWeek(3);
    setCustomDays([]);
    setDailyGoal(1);
    setShowIconPicker(false);
  }, []);

  const handleSave = async () => {
    if (!title.trim()) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const base = {
      id: Crypto.randomUUID(),
      title: title.trim(),
      comment: comment.trim() || undefined,
      icon,
      dailyGoal,
    };

    let habit: CreateHabitInput;
    if (frequency === "weekly") {
      habit = { ...base, frequency: "weekly", timesPerWeek };
    } else if (frequency === "custom") {
      habit = { ...base, frequency: "custom", days: customDays };
    } else {
      habit = { ...base, frequency: "daily" };
    }

    await addHabit(habit);
    resetForm();
    onClose();
  };

  const toggleDay = (day: DayOfWeek) => {
    Haptics.selectionAsync();
    setCustomDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const canSave =
    title.trim().length > 0 &&
    (frequency !== "custom" || customDays.length > 0);

  // ── Styles that depend on colors ──
  const inputStyle = {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    color: colors.text,
    fontSize: 15,
    backgroundColor: `${colors.surface}`,
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable
          style={styles.backdrop}
          onPress={() => {
            resetForm();
            onClose();
          }}
        />

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <ThemedText style={styles.headerTitle}>New Habit</ThemedText>
            <Pressable
              onPress={() => {
                resetForm();
                onClose();
              }}
              hitSlop={12}
            >
              <Octicons name="x" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* ── Icon + Title row ────────────────────── */}
            <View style={styles.iconTitleRow}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowIconPicker((v) => !v);
                }}
                style={[
                  styles.iconButton,
                  {
                    backgroundColor: `${colors.primary}15`,
                    borderColor: showIconPicker
                      ? colors.primary
                      : colors.border,
                  },
                ]}
              >
                <Text style={styles.iconButtonEmoji}>{icon}</Text>
              </Pressable>

              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Habit name"
                placeholderTextColor={colors.textMuted}
                style={[inputStyle, { flex: 1, marginLeft: 12 }]}
              />
            </View>

            {/* ── Icon picker grid ────────────────────── */}
            {showIconPicker && (
              <View
                style={[
                  styles.iconPicker,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                {ICON_SECTIONS.map((section) => (
                  <View key={section.label} style={styles.iconSection}>
                    <ThemedText
                      variant="muted"
                      style={styles.iconSectionLabel}
                    >
                      {section.label}
                    </ThemedText>
                    <View style={styles.iconGrid}>
                      {section.icons.map((emoji) => (
                        <Pressable
                          key={emoji}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setIcon(emoji);
                            setShowIconPicker(false);
                          }}
                          style={[
                            styles.iconGridItem,
                            {
                              backgroundColor:
                                icon === emoji
                                  ? `${colors.primary}25`
                                  : "transparent",
                              borderColor:
                                icon === emoji
                                  ? colors.primary
                                  : "transparent",
                            },
                          ]}
                        >
                          <Text style={styles.iconGridEmoji}>{emoji}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ── Comment ─────────────────────────────── */}
            <ThemedText variant="muted" style={styles.fieldLabel}>
              Description (optional)
            </ThemedText>
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="e.g. 30 minutes before bed"
              placeholderTextColor={colors.textMuted}
              style={inputStyle}
              multiline
            />

            {/* ── Frequency ───────────────────────────── */}
            <ThemedText variant="muted" style={styles.fieldLabel}>
              Frequency
            </ThemedText>
            <View style={styles.frequencyRow}>
              {(["daily", "weekly", "custom"] as const).map((f) => {
                const selected = frequency === f;
                return (
                  <Pressable
                    key={f}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setFrequency(f);
                    }}
                    style={[
                      styles.frequencyChip,
                      {
                        backgroundColor: selected
                          ? colors.primary
                          : colors.surface,
                        borderColor: selected
                          ? colors.primary
                          : colors.border,
                      },
                    ]}
                  >
                    <ThemedText
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: selected ? "#fff" : colors.text,
                      }}
                    >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            {/* Weekly: times per week */}
            {frequency === "weekly" && (
              <View style={styles.subOption}>
                <ThemedText variant="muted" style={styles.subLabel}>
                  Times per week
                </ThemedText>
                <View style={styles.stepperRow}>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setTimesPerWeek((v) => Math.max(1, v - 1));
                    }}
                    style={[
                      styles.stepperBtn,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Octicons name="dash" size={16} color={colors.text} />
                  </Pressable>
                  <ThemedText style={styles.stepperValue}>
                    {timesPerWeek}
                  </ThemedText>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      setTimesPerWeek((v) => Math.min(7, v + 1));
                    }}
                    style={[
                      styles.stepperBtn,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    <Octicons name="plus" size={16} color={colors.text} />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Custom: day picker */}
            {frequency === "custom" && (
              <View style={styles.subOption}>
                <ThemedText variant="muted" style={styles.subLabel}>
                  Select days
                </ThemedText>
                <View style={styles.dayRow}>
                  {ALL_DAYS.map((day) => {
                    const active = customDays.includes(day);
                    return (
                      <Pressable
                        key={day}
                        onPress={() => toggleDay(day)}
                        style={[
                          styles.dayChip,
                          {
                            backgroundColor: active
                              ? colors.primary
                              : colors.surface,
                            borderColor: active
                              ? colors.primary
                              : colors.border,
                          },
                        ]}
                      >
                        <ThemedText
                          style={{
                            fontSize: 12,
                            fontWeight: "600",
                            color: active ? "#fff" : colors.textMuted,
                          }}
                        >
                          {day}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── Daily Goal ────────────────────────────── */}
            <ThemedText variant="muted" style={styles.fieldLabel}>
              Daily Goal (times per day)
            </ThemedText>
            <View style={styles.stepperRow}>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setDailyGoal((v) => Math.max(1, v - 1));
                }}
                style={[
                  styles.stepperBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Octicons name="dash" size={16} color={colors.text} />
              </Pressable>
              <ThemedText style={styles.stepperValue}>
                {dailyGoal}
              </ThemedText>
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setDailyGoal((v) => Math.min(100, v + 1));
                }}
                style={[
                  styles.stepperBtn,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Octicons name="plus" size={16} color={colors.text} />
              </Pressable>
            </View>
          </ScrollView>

          {/* ── Save button ─────────────────────────── */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleSave}
              disabled={!canSave}
              style={[
                styles.saveButton,
                {
                  backgroundColor: canSave
                    ? colors.primary
                    : `${colors.primary}40`,
                },
              ]}
            >
              <ThemedText style={styles.saveText}>Create Habit</ThemedText>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ── Styles ──────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    maxHeight: "85%",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },

  // Icon + title
  iconTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },

  iconButton: {
    width: 52,
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },

  iconButtonEmoji: {
    fontSize: 26,
  },

  // Icon picker
  iconPicker: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },

  iconSection: {
    marginBottom: 10,
  },

  iconSectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  iconGridItem: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },

  iconGridEmoji: {
    fontSize: 20,
  },

  // Fields
  fieldLabel: {
    marginTop: 18,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  // Frequency
  frequencyRow: {
    flexDirection: "row",
    gap: 8,
  },

  frequencyChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },

  // Sub options
  subOption: {
    marginTop: 14,
  },

  subLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 8,
  },

  dayRow: {
    flexDirection: "row",
    gap: 6,
  },

  dayChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
  },

  // Stepper
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  stepperBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  stepperValue: {
    fontSize: 20,
    fontWeight: "700",
    marginHorizontal: 20,
    minWidth: 30,
    textAlign: "center",
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 34,
  },

  saveButton: {
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  saveText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
