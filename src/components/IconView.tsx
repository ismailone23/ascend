import { useColors } from "@/hooks/useColors";
import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Octicons,
} from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  iconKey?: string | null; // e.g. "mc::dumbbell" or emoji
  size?: number;
  color?: string;
  bg?: string | null;
  circle?: boolean;
};

const LIB_MAP: Record<string, any> = {
  mc: MaterialCommunityIcons,
  io: Ionicons,
  fa: FontAwesome5,
  fe: Feather,
  oc: Octicons,
  mi: MaterialIcons,
};

export default function IconView({
  iconKey,
  size = 28,
  color,
  bg,
  circle = false,
}: Props) {
  const colors = useColors();
  if (!iconKey) return null;

  // If the key contains :: we treat it as lib::name
  if (iconKey.includes("::")) {
    const [libLabel, name] = iconKey.split("::");
    const Lib = LIB_MAP[libLabel] || MaterialIcons;
    const iconColor = color ?? colors.text;

    if (circle) {
      return (
        <View
          style={[styles.circle, { backgroundColor: bg ?? colors.surface }]}
        >
          <Lib name={name} size={size} color={iconColor} />
        </View>
      );
    }

    return <Lib name={name} size={size} color={iconColor} />;
  }

  // fallback: treat as text/emoji
  return (
    <View
      style={[
        circle ? styles.circle : undefined,
        { backgroundColor: bg ?? "transparent" },
      ]}
    >
      <Text style={{ fontSize: size }}>{iconKey}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
});
