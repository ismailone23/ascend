import { useColors } from "@/hooks/useColors";
import { Habit } from "@/types/habit";
import { Octicons } from "@expo/vector-icons";
import { Dayjs } from "dayjs";
import { Pressable, View } from "react-native";
import ThemedText from "../ThemedText";
import ThemedView from "../ThemedView";

export default function HabitList({
  habit,
  selectedDate,
}: {
  habit: Habit;
  selectedDate: Dayjs;
}) {
  const colors = useColors();

  const isCompleted = false;

  return (
    <ThemedView
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 18,
        paddingHorizontal: 20,
      }}
    >
      <Pressable
        style={{
          width: 52,
          height: 52,
          borderRadius: 999,
          borderWidth: 2,
          borderColor: isCompleted ? colors.primary : colors.border,
          backgroundColor: isCompleted ? colors.primary : "transparent",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {isCompleted && (
          <Octicons name="check" size={22} color={colors.background} />
        )}
      </Pressable>

      <View
        style={{
          flex: 1,
          marginLeft: 16,
        }}
      >
        <ThemedText
          style={{
            fontSize: 20,
            fontWeight: "600",
            textDecorationLine: isCompleted ? "line-through" : "none",
            opacity: isCompleted ? 0.7 : 1,
          }}
        >
          {habit.title}
        </ThemedText>
        <ThemedText
          variant="muted"
          style={{
            marginTop: 4,
          }}
        >
          {habit.comment}
        </ThemedText>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
        }}
      >
        <Octicons name="flame" size={18} color={colors.primary} />
        <ThemedText
          style={{
            color: colors.primary,
            fontWeight: "700",
          }}
        >
          {habit.streakTarget}
        </ThemedText>
      </View>
    </ThemedView>
  );
}
