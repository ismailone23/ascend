import { useColors } from "@/hooks/useColors";
import Entypo from "@expo/vector-icons/Entypo";
import { StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";

export default function Page2() {
  const colors = useColors();

  return (
    <Animated.View
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
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.habitList}>
          <View
            style={[
              styles.habitItem,
              {
                backgroundColor: colors.surface,
                alignItems: "flex-start",
                flexDirection: "row",
                gap: 5,
              },
            ]}
          >
            <Entypo name="code" size={20} color="white" />
            <Text style={{ color: colors.text }}>Contest</Text>
          </View>

          <View
            style={[
              styles.habitItem,
              {
                backgroundColor: colors.surface,
              },
            ]}
          >
            <Text style={{ color: colors.text }}>💪 Workout</Text>
          </View>

          <View
            style={[
              styles.habitItem,
              {
                backgroundColor: colors.surface,
              },
            ]}
          >
            <Text style={{ color: colors.text }}>💧 Drink Water</Text>
          </View>
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
          Build Better Habits
        </Text>

        <Text
          style={[
            styles.description,
            {
              color: colors.textMuted,
            },
          ]}
        >
          Create habits in seconds and start building routines that stick.
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
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.08,
  },

  card: {
    width: 320,
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: "center",
  },

  icon: {
    width: 72,
    height: 72,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  cardTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "700",
  },

  habitList: {
    marginTop: 20,
    width: "100%",
    gap: 12,
  },

  habitItem: {
    padding: 14,
    borderRadius: 14,
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
    textAlign: "center",
    lineHeight: 24,
  },
});
