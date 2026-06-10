import { TAB_WIDTH } from "@/constants";
import { useColors } from "@/hooks/useColors";
import { MaterialIcons } from "@expo/vector-icons";
import { type BottomTabBarProps } from "expo-router/tabs";

import { Pressable, StyleSheet, View } from "react-native";

import Animated, {
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

export default function Tabbar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const colors = useColors();
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(state.index * TAB_WIDTH, {
          damping: 70,
        }),
      },
    ],
  }));

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <Animated.View
          style={[
            styles.activePill,
            animatedStyle,
            { backgroundColor: colors.primary },
          ]}
        />

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;

          const onPress = () => {
            navigation.navigate(route.name);
          };

          const icon =
            route.name === "index"
              ? "home"
              : route.name === "stats"
                ? "bar-chart"
                : "settings";

          return (
            <Pressable key={route.key} style={styles.tab} onPress={onPress}>
              <MaterialIcons
                name={icon}
                size={24}
                color={isFocused ? "#fff" : "#8B949E"}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 32,
    alignItems: "center",
  },

  container: {
    flexDirection: "row",
    width: TAB_WIDTH * 3,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
  },

  activePill: {
    position: "absolute",
    width: TAB_WIDTH,
    height: 64,
    borderRadius: 32,
  },

  tab: {
    width: TAB_WIDTH,
    justifyContent: "center",
    alignItems: "center",
  },
});
