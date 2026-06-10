import Tabbar from "@/components/tab-bar";
import { useTheme } from "@/context/ThemeContext";
import { Tabs } from "expo-router";
import { StatusBar } from "react-native";

export default function TabsLayout() {
  const { isDark } = useTheme();
  return (
    <>
      <Tabs
        tabBar={(props) => <Tabbar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="stats" />
        <Tabs.Screen name="settings" />
      </Tabs>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
    </>
  );
}
