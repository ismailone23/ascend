import DataSettings from "@/components/settings/data-settings";
import Preferences from "@/components/settings/preferences";
import WidgetSettings from "@/components/settings/widget-settings";
import { useColors } from "@/hooks/useColors";

import { ScrollView, StyleSheet } from "react-native";

import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const colors = useColors();

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}

    >
      <ScrollView
        contentContainerStyle={{
          padding: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.Text
          entering={FadeInDown}
          style={[
            styles.header,
            {
              color: colors.text,
            },
          ]}
        >
          Settings
        </Animated.Text>

        {/* Preferences */}
        <Preferences />
        <WidgetSettings />
        <DataSettings />
      </ScrollView>
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
});
