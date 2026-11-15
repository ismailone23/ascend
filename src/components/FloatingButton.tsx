import ThemedText from "@/components/ThemedText";
import { useColors } from "@/hooks/useColors";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable } from "react-native";

/** The primary "New …" button that floats over the bottom-right of a tab. */
export default function FloatingButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        position: "absolute",
        right: 20,
        bottom: 20,
        paddingLeft: 16,
        paddingRight: 22,
        gap: 6,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        alignItems: "center",
        flexDirection: "row",
        elevation: 6,
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        // Respond on touch-down, not on release.
        transform: [{ scale: pressed ? 0.96 : 1 }],
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <MaterialIcons name="add" size={22} color={colors.onPrimary} />
      <ThemedText
        style={{ color: colors.onPrimary, fontWeight: "600", fontSize: 16 }}
      >
        {label}
      </ThemedText>
    </Pressable>
  );
}
