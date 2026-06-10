import AntDesign from "@expo/vector-icons/AntDesign";
import { Pressable } from "react-native";

import ThemedText from "../ThemedText";
import ThemedView from "../ThemedView";

import { useColors } from "@/hooks/useColors";
import React from "react";

export default function EmptyIndex({
  //   onCreateHabit,
  setShowCreateHabit,
}: {
  //   onCreateHabit: () => void;
  setShowCreateHabit: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const colors = useColors();

  return (
    <ThemedView
      style={{
        alignItems: "center",
        paddingHorizontal: 32,
        marginTop: 80,
      }}
    >
      <AntDesign name="plus-circle" size={80} color={colors.primary} />

      <ThemedText
        style={{
          fontSize: 28,
          fontWeight: "700",
          marginTop: 24,
        }}
      >
        No Goals Yet
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
        Start building consistency one habit at a time.
      </ThemedText>

      <Pressable
        onPress={() => setShowCreateHabit(true)}
        style={{
          marginTop: 32,
          paddingHorizontal: 28,
          height: 56,
          borderRadius: 18,
          backgroundColor: colors.primary,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ThemedText
          style={{
            fontWeight: "700",
          }}
        >
          Create First Habit
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}
