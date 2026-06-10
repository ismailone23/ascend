import { useColors } from "@/hooks/useColors";
import { Habit } from "@/types/habit";
import ThemedText from "../ThemedText";
import ThemedView from "../ThemedView";

export default function Greeting({ habits }: { habits: Habit[] }) {
  const colors = useColors();
  const isCompleted = false;
  return (
    <ThemedView
      style={{
        marginVertical: 20,
        marginHorizontal: 20,
        padding: 20,
        borderRadius: 24,
        backgroundColor: colors.card,
        marginBottom: 20,
      }}
    >
      <ThemedText
        style={{
          fontSize: 28,
          fontWeight: "700",
        }}
      >
        Today's Goals
      </ThemedText>

      <ThemedText
        style={{
          color: colors.primary,
          marginTop: 4,
          fontSize: 16,
        }}
      >
        {habits.filter((h) => isCompleted).length} / {habits.length} completed
      </ThemedText>
    </ThemedView>
  );
}
