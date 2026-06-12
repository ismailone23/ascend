import { useColors } from "@/hooks/useColors";
import { useRef, useEffect } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";

type Props = {
  value: boolean;
  onValueChange: (val: boolean) => void;
};

const TRACK_WIDTH = 52;
const TRACK_HEIGHT = 30;
const THUMB_SIZE = 22;
const THUMB_PADDING = 4;
const TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_PADDING * 2;

export default function Switch({ value, onValueChange }: Props) {
  const colors = useColors();
  const translateX = useRef(new Animated.Value(value ? TRAVEL : 0)).current;
  const colorAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: value ? TRAVEL : 0,
        useNativeDriver: true,
        bounciness: 4,
      }),
      Animated.timing(colorAnim, {
        toValue: value ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [value]);

  const toggle = () => {
    onValueChange(!value);
  };

  const trackBg = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border, colors.primary],
  });

  return (
    <Pressable onPress={toggle} hitSlop={8}>
      <Animated.View style={[styles.track, { backgroundColor: trackBg }]}>
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: "#FFFFFF",
              transform: [{ translateX }],
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: "center",
    paddingHorizontal: THUMB_PADDING,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
