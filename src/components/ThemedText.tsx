// components/ThemedText.tsx
import { useColors } from "@/hooks/useColors";
import { Text, TextProps } from "react-native";

type ThemedTextProps = TextProps & {
  variant?: "body" | "muted" | "heading";
};

export function ThemedText({
  style,
  variant = "body",
  ...props
}: ThemedTextProps) {
  const colors = useColors();

  const variantStyles = {
    body: { color: colors.text, fontSize: 14 },
    muted: { color: colors.textMuted, fontSize: 13 },
    heading: { color: colors.text, fontSize: 22, fontWeight: "700" as const },
  };

  return <Text style={[variantStyles[variant], style]} {...props} />;
}
