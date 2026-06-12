import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import ThemedText from "../ThemedText";
import ThemedView from "../ThemedView";

import { useColors } from "@/hooks/useColors";

export default function EmptyIndex() {
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
      <MaterialIcons name="wb-iridescent" size={80} color={colors.primary} />

      <ThemedText
        style={{
          fontSize: 28,
          fontWeight: "700",
          marginTop: 24,
        }}
      >
        No Habits Yet!
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
        Start building better habits today.
      </ThemedText>
    </ThemedView>
  );
}
