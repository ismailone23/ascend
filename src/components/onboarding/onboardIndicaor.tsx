import type { SharedValue } from "react-native-reanimated";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Colors } from "@/constants/colors";

export default function Indicator({
  index,
  progress,
  colors,
}: {
  index: number;
  progress: SharedValue<number>;
  colors: typeof Colors.light | typeof Colors.dark;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const width = interpolate(
      progress.value,
      [index - 1, index, index + 1],
      [8, 30, 8],
      Extrapolation.CLAMP,
    );

    const opacity = interpolate(
      progress.value,
      [index - 1, index, index + 1],
      [0.4, 1, 0.4],
      Extrapolation.CLAMP,
    );

    const scale = interpolate(
      progress.value,
      [index - 1, index, index + 1],
      [0.9, 1.1, 0.9],
      Extrapolation.CLAMP,
    );

    return {
      width,
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          height: 8,
          borderRadius: 999,
          backgroundColor: colors.primary,
        },
        animatedStyle,
      ]}
    />
  );
}
