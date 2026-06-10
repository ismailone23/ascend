// hooks/useColors.ts
import { Colors } from "@/constants/colors";
import { useTheme } from "@/context/ThemeContext";

export function useColors() {
  const { isDark } = useTheme();
  return isDark ? Colors.dark : Colors.light;
}
