import Switch from "@/components/switch";
import { notificationsKey } from "@/constants/storagekeys";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import {
  cancelAllReminders,
  checkNotificationPermission,
  requestPermissions,
} from "@/services/notificationService";
import { useHabitStore } from "@/store/habit.store";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { settingsStyles as styles } from "./styles";

export default function Preferences() {
  const { isDark, toggleTheme } = useTheme();
  const colors = useColors();
  const [notifications, setNotifications] = useState(false);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const hasPermission = await checkNotificationPermission();
        const stored = await AsyncStorage.getItem(notificationsKey);
        // Off if the system permission is off; otherwise on unless switched off here.
        setNotifications(hasPermission && stored !== "false");
      } catch (error) {
        if (__DEV__) console.warn("Failed to load preferences:", error);
      }
    }
    loadPreferences();
  }, []);

  const handleNotificationsToggle = async (value: boolean) => {
    if (!value) {
      setNotifications(false);
      await AsyncStorage.setItem(notificationsKey, "false");
      await cancelAllReminders();
      return;
    }

    if (!(await requestPermissions())) {
      setNotifications(false);
      await AsyncStorage.setItem(notificationsKey, "false");
      Alert.alert(
        "Permission Required",
        "Please enable notification permissions in your system settings to receive reminders.",
      );
      return;
    }

    setNotifications(true);
    await AsyncStorage.setItem(notificationsKey, "true");
    // Bring back the reminders of every habit that has them.
    const { habits, updateHabitReminder } = useHabitStore.getState();
    for (const habit of habits) {
      if (habit.reminderEnabled) await updateHabitReminder(habit);
    }
  };

  const rows = [
    {
      icon: "dark-mode",
      label: "Dark Mode",
      value: isDark,
      onChange: toggleTheme,
    },
    {
      icon: "notifications",
      label: "Notifications",
      value: notifications,
      onChange: handleNotificationsToggle,
    },
  ] as const;

  return (
    <>
      <Animated.Text
        entering={FadeInDown.delay(150)}
        style={[styles.sectionTitle, { color: colors.textMuted }]}
      >
        Preferences
      </Animated.Text>

      <Animated.View
        entering={FadeInDown.delay(200)}
        style={[styles.card, { backgroundColor: colors.card }]}
      >
        {rows.map((row, index) => (
          <View key={row.label}>
            {index > 0 && (
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
            )}
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <MaterialIcons name={row.icon} size={22} color={colors.icon} />
                <Text style={[styles.rowText, { color: colors.text }]}>
                  {row.label}
                </Text>
              </View>
              <Switch value={row.value} onValueChange={row.onChange} />
            </View>
          </View>
        ))}
      </Animated.View>
    </>
  );
}
