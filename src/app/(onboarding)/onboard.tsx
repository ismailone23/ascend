import Indicator from "@/components/onboardIndicaor";
import PageOne from "@/components/onboarding/page1";
import PageTwo from "@/components/onboarding/page2";
import PageThree from "@/components/onboarding/page3";

import { useApp } from "@/context/AppProvider";
import { useColors } from "@/hooks/useColors";

import { useRef, useState } from "react";
import { Pressable, StatusBar, StyleSheet, Text, View } from "react-native";

import PagerView from "react-native-pager-view";
import { useSharedValue } from "react-native-reanimated";

const TOTAL_PAGES = 3;

export default function Onboard() {
  const colors = useColors();

  const [page, setPage] = useState(0);

  const pagerRef = useRef<PagerView>(null);

  const { completeOnboarding } = useApp();

  const nextPage = () => {
    if (page < TOTAL_PAGES - 1) {
      pagerRef.current?.setPage(page + 1);
    }
  };

  const progress = useSharedValue(0);

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
        <Text>Skip</Text>
      </Pressable>

      <View style={styles.footer}>
        {page === TOTAL_PAGES - 1 && (
          <Pressable
            style={[
              styles.button,
              {
                backgroundColor: colors.primary,
              },
            ]}
            onPress={page === TOTAL_PAGES - 1 ? completeOnboarding : nextPage}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color: colors.text,
                },
              ]}
            >
              {page === TOTAL_PAGES - 1 ? "Get Started" : "Continue"}
            </Text>
          </Pressable>
        )}
      </View>

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

  dot: {
    height: 8,
    borderRadius: 999,
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

  button: {
    height: 56,
    borderRadius: 18,

    justifyContent: "center",
    alignItems: "center",
  },

  buttonText: {
    fontWeight: "700",
    fontSize: 16,
  },
});
