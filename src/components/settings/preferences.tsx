import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function Preferences() {
  const { isDark, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState(true);

  const [weeklyReports, setWeeklyReports] = useState(false);
  const colors = useColors();
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
            trackColor={{
              true: colors.border,
            }}
            thumbColor={isDark ? colors.primary : colors.textMuted}
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
            onValueChange={setNotifications}
            trackColor={{
              true: colors.border,
            }}
            thumbColor={notifications ? colors.primary : colors.textMuted}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <MaterialIcons name="bar-chart" size={22} color={colors.primary} />

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
            onValueChange={setWeeklyReports}
            trackColor={{
              true: colors.border,
            }}
            thumbColor={weeklyReports ? colors.primary : colors.textMuted}
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
    marginTop: 24,
    textTransform: "uppercase",
  },
});
