import { useColors } from "@/hooks/useColors";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function GeneralSettings() {
  const colors = useColors();
  return (
    <>
      <Animated.Text
        entering={FadeInDown.delay(250)}
        style={[
          styles.sectionTitle,
          {
            color: colors.textMuted,
          },
        ]}
      >
        General
      </Animated.Text>

      <Animated.View
        entering={FadeInDown.delay(300)}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        {[
          {
            icon: "flag",
            label: "Goals",
          },
          {
            icon: "lock",
            label: "Privacy",
          },
          {
            icon: "help-outline",
            label: "Help & Support",
          },
          {
            icon: "info-outline",
            label: "About",
          },
        ].map((item, index) => (
          <View key={item.label}>
            <Pressable style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <MaterialIcons
                  name={item.icon as any}
                  size={22}
                  color={colors.primary}
                />

                <Text
                  style={[
                    styles.settingText,
                    {
                      color: colors.text,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </View>

              <MaterialIcons
                name="chevron-right"
                size={22}
                color={colors.textMuted}
              />
            </Pressable>

            {index !== 3 && <View style={styles.divider} />}
          </View>
        ))}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 24,
    textTransform: "uppercase",
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    paddingHorizontal: 18,
    paddingVertical: 18,
  },

  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  settingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(120,120,120,0.15)",
    marginHorizontal: 18,
  },
});
