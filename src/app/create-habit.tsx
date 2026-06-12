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
  const day = dayjs().format('ddd') as DayOfWeek;

  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([day]);

  const [reminder, setReminder] = useState(false);
  const [reminderTimes, setReminderTimes] = useState<string[]>([]);
  const [dailyGoal, setDailyGoal] = useState(1);
  const [streakGoal, setStreakGoal] = useState<"Day" | "Week" | "Month">("Day");
  const [comment, setComment] = useState("");
  const expandAnim = useRef(new Animated.Value(0)).current;

  const toggleDay = useCallback((day: DayOfWeek) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
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
  const handleCreate = useCallback(async () => {
    if (!title.trim()) return;

    await addHabit({
      id: generateId(),
      title: title.trim(),
      comment: comment.trim() || undefined,
      icon: selectedIcon,
      days: selectedDays,
      dailyGoal,
      streakGoal,
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
        <ScrollView style={{ flex: 1 }}>
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
                <ThemedText style={{ fontSize: 16 }}>Repeat</ThemedText>
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
                            ? "#fff"
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
                  <ThemedText style={{ fontSize: 16 }}>Frequency</ThemedText>
                  <ThemedText style={{ fontSize: 14 }}>
                    Completion per day
                  </ThemedText>
                </View>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
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
                  <Switch onValueChange={handleReminderToggle} value={reminder} />
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
              <ThemedText style={{ fontSize: 16 }}>Streak Goal</ThemedText>
              <Dropdown
                options={["Day", "Week", "Month"]}
                value={streakGoal}
                onChange={(val) => setStreakGoal(val as "Day" | "Week" | "Month")}
              />
            </View>

            <View>
              <ThemedText style={{ paddingVertical: 10 }}>Optional</ThemedText>
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
