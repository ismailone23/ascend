import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import ThemedText from "../ThemedText";
import ThemedView from "../ThemedView";

import { useColors } from "@/hooks/useColors";

export default function EmptyIndex({ hasHabits }: { hasHabits: boolean }) {
  const colors = useColors();

  return (
    <ThemedView
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
      }}
    >
      <MaterialIcons name={hasHabits ? "event-available" : "wb-iridescent"} size={72} color={colors.primary} />

      <ThemedText
        style={{
          fontSize: 24,
          fontWeight: "700",
          letterSpacing: -0.3,
          marginTop: 24,
        }}
      >
        {hasHabits ? "Nothing scheduled" : "No habits yet"}
      </ThemedText>

      <ThemedText
        variant="muted"
        style={{
          textAlign: "center",
          marginTop: 12,
          lineHeight: 24,
          fontSize: 14,
        }}
      >
        {hasHabits
          ? "No habits fall on this day. Swipe the week to look around."
          : "Start building better habits today."}
      </ThemedText>
    </ThemedView>
  );
}
