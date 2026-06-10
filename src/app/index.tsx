import { useApp } from "@/context/AppProvider";
import { Redirect } from "expo-router";

export default function Index() {
  const { isOnboarded } = useApp();

  if (!isOnboarded) {
    return <Redirect href="/onboard" />;
  }

  return <Redirect href="/(tabs)" />;
}
