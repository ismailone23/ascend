import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Props = {
  options: string[];
  value: string;
  onChange: (val: string) => void;
};

export default function Dropdown({ options, value, onChange }: Props) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const [anchorY, setAnchorY] = useState(0);
  const [anchorX, setAnchorX] = useState(0);
  const [anchorWidth, setAnchorWidth] = useState(0);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const triggerRef = useRef<View>(null);

  const toggleOpen = () => {
    Haptics.selectionAsync();
    if (!open) {
      triggerRef.current?.measureInWindow((x, y, width, height) => {
        setAnchorX(x);
        setAnchorY(y + height + 6);
        setAnchorWidth(width);
      });
    }
    Animated.timing(rotateAnim, {
      toValue: open ? 0 : 1,
      duration: 180,
      useNativeDriver: true,
    }).start();
    setOpen((prev) => !prev);
  };

  const handleSelect = (opt: string) => {
    Haptics.selectionAsync();
    onChange(opt);
    Animated.timing(rotateAnim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
    setOpen(false);
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <>
      <Pressable
        ref={triggerRef}
        onPress={toggleOpen}
        style={[
          styles.trigger,
          {
            backgroundColor: colors.surface,
            borderColor: open ? colors.primary : colors.border,
          },
        ]}
      >
        <Text style={[styles.triggerText, { color: colors.text }]}>
          {value}
        </Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Feather name="chevron-down" size={14} color={colors.text} />
        </Animated.View>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={toggleOpen}
      >
        <Pressable style={styles.backdrop} onPress={toggleOpen} />
        <View
          style={[
            styles.menu,
            {
              top: anchorY,
              left: anchorX,
              minWidth: anchorWidth,
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {options.map((opt) => {
            const isSelected = opt === value;
            return (
              <Pressable
                key={opt}
                onPress={() => handleSelect(opt)}
                style={[
                  styles.menuItem,
                  isSelected && { backgroundColor: `${colors.primary}18` },
                ]}
              >
                <Text
                  style={[
                    styles.menuText,
                    {
                      color: isSelected ? colors.primary : colors.text,
                      fontWeight: isSelected ? "600" : "400",
                    },
                  ]}
                >
                  {opt}
                </Text>
                {isSelected && (
                  <Feather name="check" size={14} color={colors.primary} />
                )}
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  triggerText: {
    fontSize: 15,
    fontWeight: "500",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  menu: {
    position: "absolute",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 24,
  },
  menuText: {
    fontSize: 15,
  },
});
