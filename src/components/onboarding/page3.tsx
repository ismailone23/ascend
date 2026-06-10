import { MaterialIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { APP_NAME } from "@/constants";
import { useColors } from "@/hooks/useColors";

export default function Page3() {
  const colors = useColors();

  const floating = useSharedValue(0);

  useEffect(() => {
    floating.value = withRepeat(withTiming(1, { duration: 2500 }), -1, true);
  }, []);

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: floating.value * -12,
      },
    ],
  }));

  return (
    <Animated.View
      entering={FadeIn.springify()}
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

      <Animated.View
        style={[
          styles.phoneCard,
          floatingStyle,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.notification}>
          <View style={styles.header}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <MaterialIcons
                name="notifications-active"
                size={20}
                color="#111"
              />
            </View>

            <View>
              <Text
                style={[
                  styles.appName,
                  {
                    color: colors.text,
                  },
                ]}
              >
                {APP_NAME}
              </Text>

              <Text
                style={[
                  styles.time,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                Now
              </Text>
            </View>
          </View>

          <Text
            style={[
              styles.notificationTitle,
              {
                color: colors.text,
              },
            ]}
          >
            Time for your workout
          </Text>

          <Text
            style={[
              styles.notificationBody,
              {
                color: colors.textMuted,
              },
            ]}
          >
            You're on a 6-day streak. Keep the momentum going.
          </Text>

          <View
            style={[
              styles.badge,
              {
                borderColor: colors.primary,
              },
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                {
                  color: colors.primary,
                },
              ]}
            >
              🔥 6 Day Streak
            </Text>
          </View>
        </View>
      </Animated.View>

      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          Never Miss a Habit
        </Text>

        <Text
          style={[
            styles.description,
            {
              color: colors.textMuted,
            },
          ]}
        >
          Get helpful reminders exactly when you need them. Build consistency
          without feeling overwhelmed.
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
    width: 350,
    height: 350,
    borderRadius: 175,
    opacity: 0.08,
  },

  phoneCard: {
    width: 320,
    padding: 22,
    borderRadius: 28,
    borderWidth: 1,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.35,
    shadowRadius: 24,

    elevation: 12,
  },

  notification: {
    gap: 14,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  appName: {
    fontSize: 15,
    fontWeight: "600",
  },

  time: {
    fontSize: 12,
    marginTop: 2,
  },

  notificationTitle: {
    fontSize: 20,
    fontWeight: "700",
  },

  notificationBody: {
    fontSize: 15,
    lineHeight: 22,
  },

  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  badgeText: {
    fontWeight: "600",
    fontSize: 13,
  },

  content: {
    marginTop: 50,
    alignItems: "center",
    maxWidth: 340,
  },

  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 16,
  },

  description: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: "center",
  },
});
