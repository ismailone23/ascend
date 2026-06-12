import { useColors } from "@/hooks/useColors";
import { Octicons } from "@expo/vector-icons";
import { Dimensions, StyleSheet, View } from "react-native";
import ThemedText from "@/components/ThemedText";

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}

export default function StatCard({
  icon,
  label,
  value,
  color,
}: StatCardProps) {
  const colors = useColors();
  return (
    <View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${label}: ${value}`}
      style={[
        styles.statCard,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={[styles.statIconWrap, { backgroundColor: `${color}18` }]} accessibilityElementsHidden>
        <Octicons name={icon as any} size={16} color={color} />
      </View>
      <ThemedText style={styles.statValue} aria-hidden>{value}</ThemedText>
      <ThemedText variant="muted" style={styles.statLabel} aria-hidden>
        {label}
      </ThemedText>
    </View>
  );
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const styles = StyleSheet.create({
  statCard: {
    width: (SCREEN_WIDTH - 48 - 10) / 2, // 24px padding each side + 10px gap
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },

  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  statValue: {
    fontSize: 24,
    fontWeight: "800",
  },

  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 2,
  },
});
