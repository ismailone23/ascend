import GeneralSettings from "@/components/settings/general-settings";
import LogoutButton from "@/components/settings/logout";
import Preferences from "@/components/settings/preferences";
import { useColors } from "@/hooks/useColors";
import { MaterialIcons } from "@expo/vector-icons";

import { ScrollView, StyleSheet, Text, View } from "react-native";

import Animated, { FadeInDown } from "react-native-reanimated";

export default function SettingsScreen() {
  const colors = useColors();

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
      contentContainerStyle={{
        padding: 20,
        paddingTop: 60,
        paddingBottom: 120,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.Text
        entering={FadeInDown}
        style={[
          styles.header,
          {
            color: colors.text,
          },
        ]}
      >
        Settings
      </Animated.Text>

      {/* Profile */}

      <Animated.View
        entering={FadeInDown.delay(100)}
        style={[
          styles.profileCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: colors.primary,
            },
          ]}
        >
          <Text style={styles.avatarText}>I</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.profileName,
              {
                color: colors.text,
              },
            ]}
          >
            Ismail
          </Text>

          <Text
            style={[
              styles.profileSubtitle,
              {
                color: colors.textMuted,
              },
            ]}
          >
            View Profile
          </Text>
        </View>

        <MaterialIcons
          name="chevron-right"
          size={24}
          color={colors.textMuted}
        />
      </Animated.View>

      {/* Preferences */}
      <Preferences />

      {/* General */}

      <GeneralSettings />

      {/* Sign Out */}

      <LogoutButton />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    marginTop: 24,
    textTransform: "uppercase",
  },

  profileCard: {
    flexDirection: "row",
    alignItems: "center",

    borderRadius: 24,
    borderWidth: 1,

    padding: 18,
  },

  avatar: {
    width: 56,
    height: 56,

    borderRadius: 28,

    justifyContent: "center",
    alignItems: "center",

    marginRight: 16,
  },

  avatarText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  profileName: {
    fontSize: 18,
    fontWeight: "600",
  },

  profileSubtitle: {
    marginTop: 2,
    fontSize: 14,
  },
});
