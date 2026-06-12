import Switch from "@/components/switch";
import { notificationsKey, weeklyReportsKey } from "@/constants/storagekeys";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import {
  checkNotificationPermission,
  requestPermissions,
} from "@/services/notificationService";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function Preferences() {
  const { isDark, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const colors = useColors();

  useEffect(() => {
    async function loadPreferences() {
      try {
        const hasPermission = await checkNotificationPermission();
        const storedNotif = await AsyncStorage.getItem(notificationsKey);
        const storedWeekly = await AsyncStorage.getItem(weeklyReportsKey);

        // Forced to false if system permission is disabled, otherwise defaults to true
        const notifEnabled = hasPermission && storedNotif !== "false";
        setNotifications(notifEnabled);
        setWeeklyReports(hasPermission && storedWeekly === "true");
      } catch (error) {
        if (__DEV__) console.warn("Failed to load preferences:", error);
      }
    }
    loadPreferences();
  }, []);

  const handleNotificationsToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestPermissions();
      if (granted) {
        setNotifications(true);
        await AsyncStorage.setItem(notificationsKey, "true");
      } else {
        setNotifications(false);
        await AsyncStorage.setItem(notificationsKey, "false");
        Alert.alert(
          "Permission Required",
          "Please enable notification permissions in your system settings to receive reminders."
        );
      }
    } else {
      setNotifications(false);
      await AsyncStorage.setItem(notificationsKey, "false");
      // If notifications are disabled, weekly reports should also be disabled
      setWeeklyReports(false);
      await AsyncStorage.setItem(weeklyReportsKey, "false");
    }
  };

  const handleWeeklyReportsToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestPermissions();
      if (granted) {
        setWeeklyReports(true);
        await AsyncStorage.setItem(weeklyReportsKey, "true");
      } else {
        setWeeklyReports(false);
        await AsyncStorage.setItem(weeklyReportsKey, "false");
        Alert.alert(
          "Permission Required",
          "Notification permissions are required to enable weekly reports."
        );
      }
    } else {
      setWeeklyReports(false);
      await AsyncStorage.setItem(weeklyReportsKey, "false");
    }
  };

  return (
    <>
      <Animated.Text
        entering={FadeInDown.delay(150)}
        style={[
          styles.sectionTitle,
          {
            color: colors.textMuted,
          },
        ]}
      >
        Preferences
      </Animated.Text>

      <Animated.View
        entering={FadeInDown.delay(200)}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <MaterialIcons name="dark-mode" size={22} color={colors.primary} />

            <Text
              style={[
                styles.settingText,
                {
                  color: colors.text,
                },
              ]}
            >
              Dark Mode
            </Text>
          </View>

          <Switch
            value={isDark}
            onValueChange={toggleTheme}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <MaterialIcons
              name="notifications"
              size={22}
              color={colors.primary}
            />

            <Text
              style={[
                styles.settingText,
                {
                  color: colors.text,
                },
              ]}
            >
              Notifications
            </Text>
          </View>

          <Switch
            value={notifications}
            onValueChange={handleNotificationsToggle}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <MaterialIcons name="leaderboard" size={22} color={colors.primary} />

            <Text
              style={[
                styles.settingText,
                {
                  color: colors.text,
                },
              ]}
            >
              Weekly Reports
            </Text>
          </View>

          <Switch
            value={weeklyReports}
            onValueChange={handleWeeklyReportsToggle}
          />
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    paddingHorizontal: 18,
    paddingVertical: 18,
  },

  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  settingText: {
    fontSize: 16,
    fontWeight: "500",
  },

  divider: {
    height: 1,
    backgroundColor: "rgba(120,120,120,0.15)",
    marginHorizontal: 18,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    textTransform: "uppercase",
  },
});
