import IconView from "@/components/IconView";
import ThemedText from "@/components/ThemedText";
import { useColors } from "@/hooks/useColors";
import { Habit } from "@/types/habit";
import { Octicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";

interface DetailHeaderProps {
  habit: Habit;
  onClose: () => void;
}

export default function DetailHeader({ habit, onClose }: DetailHeaderProps) {
  const colors = useColors();

  return (
    <View style={styles.headerRow}>
      <View
        style={[styles.headerIcon, { backgroundColor: `${colors.primary}15` }]}
        accessibilityElementsHidden
      >
        <IconView iconKey={habit.icon} size={28} circle={false} />
      </View>
      <View style={styles.headerText}>
        <ThemedText accessibilityRole="header" style={styles.headerTitle}>
          {habit.title}
        </ThemedText>
        {habit.comment ? (
          <ThemedText variant="muted" style={styles.headerComment}>
            {habit.comment}
          </ThemedText>
        ) : null}
      </View>
      <Pressable
        onPress={onClose}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Close habit details"
      >
        <Octicons name="x" size={22} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 16,
  },

  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  headerEmoji: {
    fontSize: 28,
  },

  headerText: {
    flex: 1,
    marginLeft: 14,
    marginRight: 12,
  },

  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
  },

  headerComment: {
    marginTop: 2,
    fontSize: 14,
  },
});
