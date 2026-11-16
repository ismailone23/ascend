import IconView from "@/components/IconView";
import Switch from "@/components/switch";
import { useColors } from "@/hooks/useColors";
import { goalRepository } from "@/repositories/goal.repository";
import { useHabitStore } from "@/store/habit.store";
import { Goal } from "@/types/goal";
import {
  loadWidgetHidden,
  refreshWidgets,
  saveWidgetHidden,
  WIDGETS,
} from "@/widgets/widgets";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Platform, Pressable, Text, View } from "react-native";
import { requestPinWidget } from "react-native-android-widget";
import Animated, { FadeInDown } from "react-native-reanimated";
import { settingsStyles as styles } from "./styles";

export default function WidgetSettings() {
  const colors = useColors();
  const habits = useHabitStore((state) => state.habits);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [hidden, setHidden] = useState<string[]>([]);

  // On focus, so goals made on the Goals tab show up here.
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== "android") return;
      goalRepository
        .getAll()
        .then(setGoals)
        .catch(() => {});
      loadWidgetHidden().then(setHidden);
    }, []),
  );

  if (Platform.OS !== "android") return null; // home-screen widgets are Android-only here

  const toggle = (id: string, show: boolean) => {
    const next = show ? hidden.filter((each) => each !== id) : [...hidden, id];
    setHidden(next);
    saveWidgetHidden(next).catch((error) => {
      if (__DEV__) console.warn("[Widgets]", error);
    });
  };
  const items = [
    ...habits.map((h) => ({ id: h.id, title: h.title, icon: h.icon })),
    ...goals.map((g) => ({ id: g.id, title: g.title, icon: g.icon })),
  ];

  const add = async (widgetName: string) => {
    // Android shows its own "Add to home screen" sheet.
    const supported = await requestPinWidget({ widgetName }).catch(() => false);
    if (supported) {
      refreshWidgets();
    } else {
      Alert.alert(
        "Add it from your home screen",
        "Your launcher can't add widgets from inside an app. Long-press the home screen, choose Widgets, then Ascend.",
      );
    }
  };

  return (
    <>
      <Animated.Text
        entering={FadeInDown.delay(250)}
        style={[styles.sectionTitle, { color: colors.textMuted }]}
      >
        Widgets
      </Animated.Text>

      <Animated.View
        entering={FadeInDown.delay(300)}
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {WIDGETS.map((widget, index) => (
          <View key={widget.name}>
            {index > 0 && (
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
            )}
            <Pressable
              onPress={() => add(widget.name)}
              accessibilityRole="button"
              accessibilityLabel={`Add the ${widget.label} widget to your home screen`}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.5 }]}
            >
              <View style={styles.rowLeft}>
                <MaterialIcons
                  name={widget.icon}
                  size={22}
                  color={colors.icon}
                />
                <Text style={[styles.rowText, { color: colors.text }]}>
                  {widget.label}
                </Text>
              </View>
              <Text style={{ color: colors.primary, fontWeight: "600" }}>
                Add
              </Text>
            </Pressable>
          </View>
        ))}
      </Animated.View>

      <Animated.Text
        entering={FadeInDown.delay(300)}
        style={[styles.footnote, { color: colors.textMuted }]}
      >
        Widgets sit on your phone's home screen and update as you log habits.
      </Animated.Text>

      {items.length > 0 && (
        <>
          <Animated.Text
            entering={FadeInDown.delay(300)}
            style={[styles.sectionTitle, { color: colors.textMuted }]}
          >
            Show on widgets
          </Animated.Text>
          <Animated.View
            entering={FadeInDown.delay(350)}
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {items.map((item, index) => (
              <View key={item.id}>
                {index > 0 && (
                  <View
                    style={[styles.divider, { backgroundColor: colors.border }]}
                  />
                )}
                <View style={styles.row}>
                  <View style={[styles.rowLeft, { flex: 1 }]}>
                    <IconView iconKey={item.icon} size={22} circle={false} />
                    <Text
                      numberOfLines={1}
                      style={[styles.rowText, { color: colors.text, flex: 1 }]}
                    >
                      {item.title}
                    </Text>
                  </View>
                  <Switch
                    value={!hidden.includes(item.id)}
                    onValueChange={(show) => toggle(item.id, show)}
                    accessibilityLabel={`Show ${item.title} on widgets`}
                  />
                </View>
              </View>
            ))}
          </Animated.View>
          <Animated.Text
            entering={FadeInDown.delay(350)}
            style={[styles.footnote, { color: colors.textMuted }]}
          >
            Turned off habits and goals are left out of every widget, streak
            included.
          </Animated.Text>
        </>
      )}
    </>
  );
}
