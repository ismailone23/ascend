import { useColors } from "@/hooks/useColors";
import { MaterialIcons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

export default function LogoutButton() {
  const colors = useColors();
  return (
    <Animated.View entering={FadeInDown.delay(350)}>
      <Pressable
        style={[
          styles.logoutButton,
          {
            borderColor: colors.border,
            backgroundColor: colors.card,
          },
        ]}
      >
        <MaterialIcons name="logout" size={20} color="#ef4444" />

        <Text
          style={[
            styles.logoutText,
            {
              color: "#ef4444",
            },
          ]}
        >
          Sign Out
        </Text>
      </Pressable>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  logoutButton: {
    marginTop: 30,

    height: 56,

    borderRadius: 18,
    borderWidth: 1,

    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",

    gap: 10,
  },

  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
