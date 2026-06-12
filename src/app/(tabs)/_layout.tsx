import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StatusBar } from "react-native";

export default function TabsLayout() {
  const { isDark } = useTheme();
  const colors = useColors();

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#fff",
          tabBarInactiveTintColor: "#8B949E",
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 0,
          },
        }}
        screenListeners={{
          tabLongPress: () => {},
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="home" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "Stats",
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="leaderboard" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="settings" size={28} color={color} />
            ),
          }}
        />
      </Tabs>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
    </>
  );
}
