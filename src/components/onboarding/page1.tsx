import ThemedText from "@/components/ThemedText";
import { useColors } from "@/hooks/useColors";
import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

export default function Page1() {
  const colors = useColors();

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      style={[
        styles.container,
        {
          backgroundColor: colors.background,
        },
      ]}
    >
      <View
        style={[
          styles.glow,
          {
            backgroundColor: colors.primary,
          },
        ]}
      />

      <View
        accessible
        accessibilityRole="summary"
        accessibilityLabel="24 day streak progress card"
        style={[
          styles.statsCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.topRow}>
          <View accessible accessibilityLabel="24 day streak">
            <ThemedText
              style={[
                styles.bigNumber,
                {
                  color: colors.primary,
                },
              ]}
            >
              24
            </ThemedText>

            <ThemedText
              variant="muted"
            >
              Day Streak
            </ThemedText>
          </View>

          <MaterialIcons
            name="local-fire-department"
            size={42}
            color={colors.primary}
            accessibilityElementsHidden
          />
        </View>

        <View
          accessible
          accessibilityRole="image"
          accessibilityLabel="Weekly progress bar chart showing increasing activity"
          style={styles.chart}
        >
          {[45, 70, 55, 90, 100, 85, 100].map((height, index) => (
            <View
              key={index}
              style={[
                styles.bar,
                {
                  height,
                  backgroundColor: index > 4 ? colors.primary : colors.surface,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.content}>
        <ThemedText
          accessibilityRole="header"
          style={styles.title}
        >
          Track Your Progress
        </ThemedText>

        <ThemedText
          variant="muted"
          style={styles.description}
        >
          Watch your streaks grow and stay motivated with visual progress
          tracking.
        </ThemedText>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },

  glow: {
    position: "absolute",
    width: 320,
    height: 320,
    borderRadius: 160,
    opacity: 0.08,
  },

  statsCard: {
    width: 320,
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  bigNumber: {
    fontSize: 42,
    fontWeight: "800",
  },

  chart: {
    marginTop: 30,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 120,
  },

  bar: {
    width: 24,
    borderRadius: 8,
  },

  content: {
    marginTop: 40,
    alignItems: "center",
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
  },

  description: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
});
