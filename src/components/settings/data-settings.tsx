import { useColors } from "@/hooks/useColors";
import {
  exportBackup,
  pickBackup,
  restoreBackup,
} from "@/services/backupService";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { settingsStyles as styles } from "./styles";

export default function DataSettings() {
  const colors = useColors();
  const [busy, setBusy] = useState(false);

  const handleExport = async () => {
    setBusy(true);
    try {
      await exportBackup();
    } catch (error) {
      if (__DEV__) console.warn("[Backup]", error);
      Alert.alert("Export failed", "Your backup could not be created.");
    } finally {
      setBusy(false);
    }
  };

  const handleImport = async () => {
    setBusy(true);
    try {
      const backup = await pickBackup();
      if (!backup) return;

      Alert.alert(
        "Replace all data?",
        "Everything on this device will be replaced with the backup. This cannot be undone.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Replace",
            style: "destructive",
            onPress: async () => {
              setBusy(true);
              try {
                await restoreBackup(backup);
                Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success,
                );
                Alert.alert("Backup restored");
              } catch (error) {
                if (__DEV__) console.warn("[Backup]", error);
                Alert.alert(
                  "Import failed",
                  "Nothing was changed. The backup could not be restored.",
                );
              } finally {
                setBusy(false);
              }
            },
          },
        ],
      );
    } catch (error) {
      if (__DEV__) console.warn("[Backup]", error);
      Alert.alert(
        "Import failed",
        "That file is not an Ascend backup, or it has been changed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const rows = [
    { icon: "ios-share", label: "Export Backup", onPress: handleExport },
    { icon: "file-download", label: "Import Backup", onPress: handleImport },
  ] as const;

  return (
    <>
      <Animated.Text
        entering={FadeInDown.delay(250)}
        style={[styles.sectionTitle, { color: colors.textMuted }]}
      >
        Data
      </Animated.Text>

      <Animated.View
        entering={FadeInDown.delay(300)}
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {rows.map((row, index) => (
          <View key={row.label}>
            {index > 0 && (
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
            )}
            <Pressable
              onPress={row.onPress}
              disabled={busy}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.row,
                (pressed || busy) && { opacity: 0.5 },
              ]}
            >
              <View style={styles.rowLeft}>
                <MaterialIcons
                  name={row.icon}
                  size={22}
                  color={colors.icon}
                />
                <Text style={[styles.rowText, { color: colors.text }]}>
                  {row.label}
                </Text>
              </View>
            </Pressable>
          </View>
        ))}
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.delay(300)}
        style={[styles.footnote, { color: colors.textMuted }]}
      >
        Backups are encrypted for compatibility, but the key is included in
        Ascend, so they are not secret from someone inspecting the app.
        Importing replaces everything on this device.
      </Animated.Text>
    </>
  );
}
