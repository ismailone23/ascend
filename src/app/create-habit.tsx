import IconView from "@/components/IconView";
import Dropdown from "@/components/index/create-habit/drop-down";
import IconPickerModal from "@/components/index/create-habit/IconPickerModal";
import ReminderPicker from "@/components/index/create-habit/reminder-pick";
import Switch from "@/components/switch";
import ThemedText from "@/components/ThemedText";
import ThemedView from "@/components/ThemedView";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { requestPermissions } from "@/services/notificationService";
import { useHabitStore } from "@/store/habit.store";
import { DayOfWeek } from "@/types/habit";
import AntDesign from "@expo/vector-icons/AntDesign";
import dayjs from "dayjs";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Keyboard,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const week: Record<string, DayOfWeek> = {
  S: "Sun",
  M: "Mon",
  T: "Tue",
  W: "Wed",
  t: "Thu",
  F: "Fri",
  s: "Sat",
};

const WEEK_ORDER = Object.values(week);

// Streak goals as a length of time, in calendar days.
const STREAK_GOALS: Record<string, number> = {
  None: 0,
  "1 week": 7,
  "1 month": 30,
  "3 months": 90,
};

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function CreateHabit() {
  const handleGoBack = useCallback(() => {
    if (router.canGoBack()) router.back();
  }, []);

  const colors = useColors();
  const { isDark } = useTheme();
  const addHabit = useHabitStore((s) => s.addHabit);

  // Form state
  const [title, setTitle] = useState("");
  const [openIcon, setOpenIcon] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState("mc::hiking");
  const day = dayjs().format("ddd") as DayOfWeek;

  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([day]);

  const [reminder, setReminder] = useState(false);
  const [reminderTimes, setReminderTimes] = useState<string[]>([]);
  const [dailyGoal, setDailyGoal] = useState(1);
  const [streakGoal, setStreakGoal] = useState(0);
  const [comment, setComment] = useState("");
  const expandAnim = useRef(new Animated.Value(0)).current;

  // Edge-to-edge Android does not resize for the keyboard, and
  // KeyboardAvoidingView leaves its padding behind after the keyboard closes,
  // so the space is added and removed by hand.
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) =>
      setKeyboardHeight(e.endCoordinates.height),
    );
    const hide = Keyboard.addListener("keyboardDidHide", () =>
      setKeyboardHeight(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const toggleDay = useCallback((day: DayOfWeek) => {
    setSelectedDays((prev) => {
      if (!prev.includes(day))
        return WEEK_ORDER.filter((d) => d === day || prev.includes(d));
      // A habit with no days would never show up, so the last one stays.
      return prev.length > 1 ? prev.filter((d) => d !== day) : prev;
    });
  }, []);

  const handleReminderToggle = useCallback(async (value: boolean) => {
    if (value) {
      const granted = await requestPermissions();
      if (!granted) {
        // Permission denied — don't turn the switch on
        Alert.alert(
          "Notifications Disabled",
          "Enable notifications in your device settings to use reminders.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ],
        );
        return; // switch stays OFF
      }
    }
    setReminder(value);
  }, []);
  const perWeek = selectedDays.length;

  const handleCreate = useCallback(async () => {
    if (!title.trim()) return;

    await addHabit({
      id: generateId(),
      title: title.trim(),
      comment: comment.trim() || undefined,
      icon: selectedIcon,
      days: selectedDays,
      dailyGoal,
      // Stored as the number of scheduled days that fit in that time, so
      // "1 month" at 3 days a week is a 13-day streak.
      streakGoal: Math.ceil((streakGoal * perWeek) / 7),
      reminderEnabled: reminder,
      reminderTimes: reminder ? reminderTimes : [],
    });

    if (router.canGoBack()) router.back();
  }, [
    title,
    comment,
    selectedIcon,
    selectedDays,
    dailyGoal,
    streakGoal,
    perWeek,
    reminder,
    reminderTimes,
    addHabit,
  ]);

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: reminder ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start();
  }, [reminder, expandAnim]);
  return (
    <>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: colors.background }}
        edges={["top"]}
      >
        <View style={{ flex: 1, paddingBottom: keyboardHeight }}>
          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            <ThemedView style={{ flex: 1, padding: 20, gap: 20 }}>
              <View style={{ flexDirection: "row" }}>
                <Pressable onPress={handleGoBack}>
                  <AntDesign name="arrow-left" size={24} color={colors.text} />
                </Pressable>
                <ThemedText
                  variant="heading"
                  style={{ flex: 1, textAlign: "center" }}
                >
                  New Habit
                </ThemedText>
              </View>

              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Pressable
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    width: 80,
                    height: 80,
                    borderRadius: 24,
                    borderWidth: 2,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                  }}
                  onPress={() => setOpenIcon(true)}
                >
                  <IconView iconKey={selectedIcon} size={32} />
                </Pressable>
              </View>

              <View>
                <TextInput
                  placeholder="Habit Name"
                  value={title}
                  onChangeText={setTitle}
                  placeholderTextColor={colors.textMuted}
                  style={{
                    paddingHorizontal: 20,
                    lineHeight: 36,
                    borderRadius: 16,
                    fontSize: 16,
                    backgroundColor: colors.surface,
                    color: colors.text,
                  }}
                />
              </View>
              <View style={{ gap: 5 }}>
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderTopLeftRadius: 16,
                      borderTopRightRadius: 16,
                      borderBottomLeftRadius: 8,
                      borderBottomRightRadius: 8,
                    },
                  ]}
                >
                  <View>
                    <ThemedText style={{ fontSize: 16 }}>Repeat</ThemedText>
                    <ThemedText style={{ fontSize: 14, opacity: 0.5 }}>
                      {perWeek === 7
                        ? "Every day"
                        : `${perWeek} ${perWeek === 1 ? "day" : "days"} a week`}
                    </ThemedText>
                  </View>
                  <View style={{ gap: 2, flexDirection: "row" }}>
                    {Object.entries(week).map(([key, value], index) => (
                      <Pressable
                        key={key}
                        onPress={() => toggleDay(value)}
                        style={{
                          backgroundColor: selectedDays.includes(value)
                            ? colors.primary
                            : colors.border,
                          borderTopLeftRadius: index == 0 ? 10 : 0,
                          borderBottomLeftRadius: index == 0 ? 10 : 0,
                          padding: 10,
                          borderTopRightRadius: index == 6 ? 10 : 0,
                          borderBottomRightRadius: index == 6 ? 10 : 0,
                        }}
                      >
                        <ThemedText
                          style={{
                            color: selectedDays.includes(value)
                              ? colors.onPrimary
                              : colors.text,
                            fontSize: 12,
                            textTransform: "capitalize",
                          }}
                        >
                          {key}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderRadius: 8,
                    },
                  ]}
                >
                  <View>
                    <ThemedText style={{ fontSize: 16 }}>Daily Goal</ThemedText>
                    <ThemedText style={{ fontSize: 14, opacity: 0.5 }}>
                      {dailyGoal === 1
                        ? "Once a day"
                        : dailyGoal === 2
                          ? "Twice a day"
                          : `${dailyGoal} times a day`}
                    </ThemedText>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Pressable
                      onPress={() => setDailyGoal((g) => Math.max(1, g - 1))}
                      style={{
                        backgroundColor: colors.border,
                        width: 40,
                        height: 40,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 99,
                      }}
                    >
                      <AntDesign name="minus" size={16} color={colors.text} />
                    </Pressable>
                    <ThemedText style={{ fontSize: 16, fontWeight: 500 }}>
                      {dailyGoal}
                    </ThemedText>
                    <Pressable
                      onPress={() => setDailyGoal((g) => g + 1)}
                      style={{
                        backgroundColor: colors.border,
                        width: 40,
                        height: 40,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 99,
                      }}
                    >
                      <AntDesign name="plus" size={16} color={colors.text} />
                    </Pressable>
                  </View>
                </View>
                <View
                  style={[
                    {
                      backgroundColor: colors.surface,
                      borderTopLeftRadius: 8,
                      borderTopRightRadius: 8,
                      borderBottomLeftRadius: 16,
                      borderBottomRightRadius: 16,
                    },
                  ]}
                >
                  <View style={styles.card}>
                    <View>
                      <ThemedText style={{ fontSize: 16 }}>Reminder</ThemedText>
                      <ThemedText style={{ fontSize: 14, opacity: 0.5 }}>
                        Receive notification
                      </ThemedText>
                    </View>
                    <Switch
                      onValueChange={handleReminderToggle}
                      value={reminder}
                    />
                  </View>
                  {reminder && (
                    <Animated.View
                      style={{ opacity: expandAnim, overflow: "hidden" }}
                    >
                      <View
                        style={{
                          height: 1,
                          backgroundColor: colors.border,
                          marginVertical: 4,
                        }}
                      />
                      <ReminderPicker onTimesChange={setReminderTimes} />
                    </Animated.View>
                  )}
                </View>
              </View>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ fontSize: 16 }}>Streak Goal</ThemedText>
                  <ThemedText style={{ fontSize: 14, opacity: 0.5 }}>
                    Keep it going for
                  </ThemedText>
                </View>
                <Dropdown
                  options={Object.keys(STREAK_GOALS)}
                  value={
                    Object.keys(STREAK_GOALS).find(
                      (label) => STREAK_GOALS[label] === streakGoal,
                    ) ?? "None"
                  }
                  onChange={(label) => setStreakGoal(STREAK_GOALS[label])}
                />
              </View>

              <View>
                <ThemedText style={{ paddingVertical: 10 }}>
                  Optional
                </ThemedText>
                <TextInput
                  style={{
                    height: 120,
                    textAlignVertical: "top",
                    paddingHorizontal: 16,
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    color: colors.text,
                  }}
                  placeholder="Comment...."
                  placeholderTextColor={colors.textMuted}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                />
              </View>
            </ThemedView>
          </ScrollView>
          <IconPickerModal
            onClose={() => setOpenIcon(false)}
            onSelectIcon={setSelectedIcon}
            selectedIcon={selectedIcon}
            visible={openIcon}
          />
          <Pressable
            onPress={handleCreate}
            style={{
              paddingVertical: 30,
              alignItems: "center",
              backgroundColor: colors.text,
            }}
          >
            <ThemedText
              style={{ fontSize: 18, fontWeight: 500, color: colors.surface }}
            >
              Create
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>

      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}
const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
