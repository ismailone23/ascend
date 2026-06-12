import Indicator from "@/components/onboarding/onboardIndicaor";
import PageOne from "@/components/onboarding/page1";
import PageTwo from "@/components/onboarding/page2";
import PageThree from "@/components/onboarding/page3";
import ThemedText from "@/components/ThemedText";
import { useApp } from "@/context/AppProvider";
import { useColors } from "@/hooks/useColors";

import { useRef, useState } from "react";
import { Pressable, StatusBar, StyleSheet, Text, View } from "react-native";

import PagerView from "react-native-pager-view";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const TOTAL_PAGES = 3;

export default function Onboard() {
  const colors = useColors();
  const [page, setPage] = useState(0);

  const pagerRef = useRef<PagerView>(null);

  const { completeOnboarding } = useApp();

  const progress = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        progress.value,
        [1.5, 2],
        [0, 1],
        Extrapolation.CLAMP,
      ),

      transform: [
        {
          translateX: interpolate(
            progress.value,
            [1.5, 2],
            [30, 0],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  return (
    <View style={{ flex: 1 }}>
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={0}
        onPageScroll={(e) => {
          progress.value = e.nativeEvent.position + e.nativeEvent.offset;
        }}
        onPageSelected={(e) => {
          setPage(e.nativeEvent.position);
        }}
      >
        <PageOne key="1" />
        <PageTwo key="2" />
        <PageThree key="3" />
      </PagerView>

      <View style={styles.indicatorContainer}>
        {[...Array(TOTAL_PAGES)].map((_, index) => (
          <Indicator
            key={index}
            index={index}
            progress={progress}
            colors={colors}
          />
        ))}
      </View>
      <Pressable onPress={completeOnboarding} style={styles.skipButton}>
        <ThemedText>Skip</ThemedText>
      </Pressable>

      <Animated.View
        pointerEvents={page === TOTAL_PAGES - 1 ? "auto" : "none"}
        style={[styles.footer, animatedStyle]}
      >
        <Pressable
          style={[
            styles.primaryButton,
            {
              backgroundColor: colors.primary,
              marginBottom: 16,
            },
          ]}
          onPress={completeOnboarding}
        >
          <Text
            style={[
              styles.primaryButtonText,
              {
                color: colors.text,
              },
            ]}
          >
            Let's Build Habit
          </Text>
        </Pressable>
      </Animated.View>

      <StatusBar hidden />
    </View>
  );
}

const styles = StyleSheet.create({
  indicatorContainer: {
    position: "absolute",
    top: 70,
    alignSelf: "center",

    flexDirection: "row",
    gap: 8,
  },

  skipButton: {
    position: "absolute",
    top: 60,
    right: 24,
  },

  footer: {
    position: "absolute",
    bottom: 60,
    left: 24,
    right: 24,
  },

  primaryButton: {
    height: 56,
    borderRadius: 16,

    justifyContent: "center",
    alignItems: "center",
  },

  primaryButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },

  googleButton: {
    height: 56,
    borderRadius: 16,

    borderWidth: 1,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 10,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
