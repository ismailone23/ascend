import { useColors } from "@/hooks/useColors";
import { refreshWidgets, WIDGETS } from "@/widgets/widgets";
import { MaterialIcons } from "@expo/vector-icons";
import { Alert, Platform, Pressable, Text, View } from "react-native";
import { requestPinWidget } from "react-native-android-widget";
import Animated, { FadeInDown } from "react-native-reanimated";
import { settingsStyles as styles } from "./styles";

export default function WidgetSettings() {
  const colors = useColors();
  if (Platform.OS !== "android") return null; // home-screen widgets are Android-only here

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
    </>
  );
}
