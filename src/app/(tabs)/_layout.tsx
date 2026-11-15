import ThemedText from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { Ionicons } from "@expo/vector-icons";
import TopTabs, { MaterialTopTabBarProps } from "expo-router/js-top-tabs";
import { Pressable, StatusBar, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Outline when idle, filled when selected.
const ICONS: Record<string, "today" | "flag" | "stats-chart" | "settings"> = {
  index: "today",
  goals: "flag",
  stats: "stats-chart",
  settings: "settings",
};

function TabBar({ state, descriptors, navigation }: MaterialTopTabBarProps) {
  const colors = useColors();
  const { bottom } = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          paddingBottom: bottom,
        },
      ]}
    >
      {state.routes.map(
        (route: { key: string; name: string }, index: number) => {
          const focused = state.index === index;
          const color = focused ? colors.text : colors.textMuted;
          const title = descriptors[route.key].options.title ?? route.name;

          return (
            <Pressable
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={title}
              style={({ pressed }) => [styles.tab, pressed && { opacity: 0.5 }]}
            >
              <Ionicons
                name={
                  focused ? ICONS[route.name] : `${ICONS[route.name]}-outline`
                }
                size={24}
                color={focused ? colors.icon : colors.textMuted}
              />
              <ThemedText
                style={[
                  styles.label,
                  { color, fontWeight: focused ? "700" : "500" },
                ]}
              >
                {title}
              </ThemedText>
            </Pressable>
          );
        },
      )}
    </View>
  );
}

export default function TabsLayout() {
  const { isDark } = useTheme();
  const colors = useColors();

  return (
    <>
      {/* A pager, so pages follow the finger when you swipe between tabs */}
      <TopTabs
        tabBarPosition="bottom"
        tabBar={(props: MaterialTopTabBarProps) => <TabBar {...props} />}
        screenOptions={{
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        <TopTabs.Screen name="index" options={{ title: "Today" }} />
        <TopTabs.Screen name="goals" options={{ title: "Goals" }} />
        <TopTabs.Screen name="stats" options={{ title: "Stats" }} />
        <TopTabs.Screen name="settings" options={{ title: "Settings" }} />
      </TopTabs>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 6,
    gap: 2,
  },
  label: {
    fontSize: 11,
  },
});
