import { useColors } from "@/hooks/useColors";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { ReactNode, useEffect } from "react";
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

type Props = {
  ids: string[];
  /** Every row is this tall, gap included: rows are placed by slot, not by layout. */
  rowHeight: number;
  /** Called on drop with the ids in their new order. */
  onReorder: (ids: string[]) => void;
  renderRow: (id: string, index: number) => ReactNode;
  /** Screen-reader name for a row's drag handle. */
  handleLabel: (index: number) => string;
};

/** A list whose rows are reordered by dragging the handle on their left. */
export default function SortableRows({
  ids,
  rowHeight,
  onReorder,
  renderRow,
  handleLabel,
}: Props) {
  // The order on screen. It runs ahead of `ids` while a row is being dragged.
  const order = useSharedValue(ids);
  const key = ids.join();
  useEffect(() => {
    order.value = ids;
  }, [key]);

  // Screen readers cannot drag, so the handle also moves a row one place.
  const nudge = (index: number, by: number) => {
    const to = index + by;
    if (to < 0 || to >= ids.length) return;
    const next = ids.slice();
    next.splice(to, 0, ...next.splice(index, 1));
    onReorder(next);
  };

  return (
    <View style={{ height: ids.length * rowHeight }}>
      {ids.map((id, index) => (
        <Row
          key={id}
          id={id}
          order={order}
          rowHeight={rowHeight}
          onReorder={onReorder}
          label={handleLabel(index)}
          onNudge={(by) => nudge(index, by)}
        >
          {renderRow(id, index)}
        </Row>
      ))}
    </View>
  );
}

const pickUp = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
const tick = () => Haptics.selectionAsync();
const drop = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

function Row({
  id,
  order,
  rowHeight,
  onReorder,
  label,
  onNudge,
  children,
}: {
  id: string;
  order: SharedValue<string[]>;
  rowHeight: number;
  onReorder: (ids: string[]) => void;
  label: string;
  onNudge: (by: number) => void;
  children: ReactNode;
}) {
  const colors = useColors();
  const dragging = useSharedValue(false);
  const startY = useSharedValue(0);
  const dragY = useSharedValue(0);

  // Follows the finger while held, otherwise springs to its slot.
  const y = useDerivedValue(() =>
    dragging.value
      ? dragY.value
      : withSpring(order.value.indexOf(id) * rowHeight, SPRING),
  );
  const style = useAnimatedStyle(() => ({
    zIndex: dragging.value ? 1 : 0,
    opacity: dragging.value ? 0.85 : 1,
    transform: [{ translateY: y.value }, { scale: dragging.value ? 1.02 : 1 }],
  }));

  const pan = Gesture.Pan()
    // Claims the touch before the list around it starts to scroll.
    .activeOffsetY([-3, 3])
    .hitSlop({ left: 12, right: 6, top: 4, bottom: 4 }) // easier to grab
    .onStart(() => {
      startY.value = order.value.indexOf(id) * rowHeight;
      dragY.value = startY.value;
      dragging.value = true;
      runOnJS(pickUp)();
    })
    .onUpdate((e) => {
      const last = (order.value.length - 1) * rowHeight;
      dragY.value = Math.min(Math.max(startY.value + e.translationY, 0), last);
      const from = order.value.indexOf(id);
      const to = Math.round(dragY.value / rowHeight);
      if (to === from) return;
      const next = order.value.slice();
      next.splice(to, 0, ...next.splice(from, 1));
      order.value = next; // the other rows spring out of the way
      runOnJS(tick)();
    })
    .onFinalize(() => {
      if (!dragging.value) return;
      dragging.value = false;
      runOnJS(drop)();
      runOnJS(onReorder)(order.value);
    });

  return (
    <Animated.View style={[styles.row, { height: rowHeight }, style]}>
      <GestureDetector gesture={pan}>
        <View
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel={label}
          accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
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
