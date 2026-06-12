import { AppProvider, useApp } from "@/context/AppProvider";
import ThemeProvider from "@/context/ThemeContext";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AppProvider>
      <ThemeProvider>
        <InsideLayout />
      </ThemeProvider>
    </AppProvider>
  );
}

function InsideLayout() {
  const { isReady } = useApp();

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
