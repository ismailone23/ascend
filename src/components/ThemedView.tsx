// components/ThemedView.tsx
import { useColors } from "@/hooks/useColors";
import { View, ViewProps } from "react-native";

export default function ThemedView({ style, ...props }: ViewProps) {
  const colors = useColors();
  return (
    <View style={[{ backgroundColor: colors.background }, style]} {...props} />
  );
}
