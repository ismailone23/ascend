import { MaterialIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";

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
        style={[
          styles.statsCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.topRow}>
          <View>
            <Text
              style={[
                styles.bigNumber,
                {
                  color: colors.primary,
                },
              ]}
            >
              24
            </Text>

            <Text
              style={{
                color: colors.textMuted,
              }}
            >
              Day Streak
            </Text>
          </View>

          <MaterialIcons
            name="local-fire-department"
            size={42}
            color={colors.primary}
          />
        </View>

        <View style={styles.chart}>
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
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          Track Your Progress
        </Text>

        <Text
          style={[
            styles.description,
            {
              color: colors.textMuted,
            },
          ]}
        >
          Watch your streaks grow and stay motivated with visual progress
          tracking.
        </Text>
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
