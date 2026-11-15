import { useColors } from "@/hooks/useColors";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ReactNode, useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const SPRING = { dampingRatio: 1, duration: 300 };

type Heights = Record<string, number>;

type Props = {
  ids: string[];
  /** Space between rows. */
  gap?: number;
  /**
   * How a row is picked up: "handle" adds a grip on its left that drags at
   * once, "hold" drags the row itself after a press and hold.
   */
  grab: "handle" | "hold";
  /** Rows that cannot be picked up right now. Others still move around them. */
  canDrag?: (id: string) => boolean;
  /** Called on drop with the ids in their new order. */
  onReorder: (ids: string[]) => void;
  renderRow: (id: string, index: number) => ReactNode;
  /** Screen-reader name for a row's grip ("handle" only). */
  handleLabel?: (index: number) => string;
};

/** Where a row starts: the heights of the rows before it. */
function offsetOf(order: string[], heights: Heights, gap: number, id?: string) {
  "worklet";
  let top = 0;
  for (const other of order) {
    if (other === id) break;
    top += (heights[other] ?? 0) + gap;
  }
  return top;
}

/**
 * A list whose rows can be dragged into a new order. Rows may differ in
 * height and change height: each is measured and placed by the rows above it.
 * shortcut: the page does not scroll while a row is dragged to its edge, add
 * auto-scroll if lists grow longer than a screen.
 */
export default function SortableRows({
  ids,
  gap = 0,
  grab,
  canDrag,
  onReorder,
  renderRow,
  handleLabel,
}: Props) {
  // The order on screen. It runs ahead of `ids` while a row is being dragged.
  const order = useSharedValue(ids);
  const heights = useSharedValue<Heights>({});
  // Rows are placed without animation until every one has been measured.
  const settled = useSharedValue(false);
  const key = ids.join();
  useEffect(() => {
    order.value = ids;
  }, [key]);

  // Collected here and handed over whole: reading a shared value back on this
  // thread can return an older copy and drop rows measured in the same tick.
  const measuredHeights = useRef<Heights>({});
  const measured = (id: string, height: number) => {
    const next = { ...measuredHeights.current, [id]: height };
    measuredHeights.current = next;
    heights.value = next;
    if (!settled.value && ids.every((each) => next[each] != null)) {
      requestAnimationFrame(() => {
        settled.value = true;
      });
    }
  };

  const containerStyle = useAnimatedStyle(() => {
    const total = Math.max(offsetOf(order.value, heights.value, gap) - gap, 0);
    return { height: settled.value ? withSpring(total, SPRING) : total };
  });

  // Screen readers cannot drag, so the grip also moves a row one place.
  const nudge = (index: number, by: number) => {
    const to = index + by;
    if (to < 0 || to >= ids.length) return;
    const next = ids.slice();
    next.splice(to, 0, ...next.splice(index, 1));
    onReorder(next);
  };

  return (
    <Animated.View style={containerStyle}>
      {ids.map((id, index) => (
        <Row
          key={id}
          id={id}
          order={order}
          heights={heights}
          settled={settled}
          gap={gap}
          grab={grab}
          enabled={canDrag ? canDrag(id) : true}
          onReorder={onReorder}
          onMeasure={measured}
          label={handleLabel?.(index)}
          onNudge={(by) => nudge(index, by)}
        >
          {renderRow(id, index)}
        </Row>
      ))}
    </Animated.View>
  );
}

const pickUp = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
const tick = () => Haptics.selectionAsync();
const drop = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

function Row({
  id,
  order,
  heights,
  settled,
  gap,
  grab,
  enabled,
  onReorder,
  onMeasure,
  label,
  onNudge,
  children,
}: {
  id: string;
  order: SharedValue<string[]>;
  heights: SharedValue<Heights>;
  settled: SharedValue<boolean>;
  gap: number;
  grab: "handle" | "hold";
  enabled: boolean;
  onReorder: (ids: string[]) => void;
  onMeasure: (id: string, height: number) => void;
  label?: string;
  onNudge: (by: number) => void;
  children: ReactNode;
}) {
  const colors = useColors();
  const dragging = useSharedValue(false);
  const startY = useSharedValue(0);
  const dragY = useSharedValue(0);

  // Follows the finger while held, otherwise springs to its place.
  const y = useDerivedValue(() => {
    if (dragging.value) return dragY.value;
    const top = offsetOf(order.value, heights.value, gap, id);
    return settled.value ? withSpring(top, SPRING) : top;
  });
  const style = useAnimatedStyle(() => ({
    zIndex: dragging.value ? 1 : 0,
    opacity: dragging.value ? 0.9 : 1,
    transform: [{ translateY: y.value }, { scale: dragging.value ? 1.02 : 1 }],
  }));

  const pan = (
    grab === "hold"
      ? Gesture.Pan().activateAfterLongPress(350)
      : Gesture.Pan()
          // Claims the touch before the list around it starts to scroll.
          .activeOffsetY([-3, 3])
          .hitSlop({ left: 12, right: 6, top: 4, bottom: 4 })
  ) // easier to grab
    .enabled(enabled)
    // Marked by hand: the gesture is built from a condition, which the
    // compiler does not recognise as one whose callbacks run on the UI thread.
    .onStart(() => {
      "worklet";
      startY.value = offsetOf(order.value, heights.value, gap, id);
      dragY.value = startY.value;
      dragging.value = true;
      runOnJS(pickUp)();
    })
    .onUpdate((e) => {
      "worklet";
      const own = heights.value[id] ?? 0;
      const total = offsetOf(order.value, heights.value, gap) - gap;
      dragY.value = Math.min(
        Math.max(startY.value + e.translationY, 0),
        total - own,
      );

      // Its new place: after every other row whose middle it has passed.
      const middle = dragY.value + own / 2;
      let top = 0;
      let to = 0;
      for (const other of order.value) {
        if (other === id) continue;
        const height = heights.value[other] ?? 0;
        if (middle > top + height / 2) to++;
        top += height + gap;
      }
      const from = order.value.indexOf(id);
      if (to === from) return;
      const next = order.value.slice();
      next.splice(to, 0, ...next.splice(from, 1));
      order.value = next; // the other rows spring out of the way
      runOnJS(tick)();
    })
    .onFinalize(() => {
      "worklet";
      if (!dragging.value) return;
      dragging.value = false;
      runOnJS(drop)();
      runOnJS(onReorder)(order.value);
    });

  return (
    <Animated.View
      style={[styles.row, style]}
      onLayout={(e) => onMeasure(id, e.nativeEvent.layout.height)}
    >
      {grab === "hold" ? (
        <GestureDetector gesture={pan}>
          <View>{children}</View>
        </GestureDetector>
      ) : (
        <View style={styles.withHandle}>
          <GestureDetector gesture={pan}>
            <View
              accessible
              accessibilityRole="adjustable"
              accessibilityLabel={label}
              accessibilityActions={[
                { name: "increment" },
                { name: "decrement" },
              ]}
              onAccessibilityAction={(e) =>
                onNudge(e.nativeEvent.actionName === "increment" ? 1 : -1)
              }
              style={styles.handle}
            >
              <MaterialIcons
                name="drag-indicator"
                size={22}
                color={colors.textMuted}
              />
            </View>
          </GestureDetector>
          {children}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  withHandle: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  handle: {
    width: 32,
    height: 44,
    marginLeft: -8,
    alignItems: "center",
    justifyContent: "center",
  },
});
