import GeneralSettings from "@/components/settings/general-settings";
import Preferences from "@/components/settings/preferences";
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
        <GeneralSettings />
      </ScrollView>
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 24,
  },
});
