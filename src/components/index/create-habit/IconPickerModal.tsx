import ThemedView from "@/components/ThemedView";
import { useColors } from "@/hooks/useColors";
import {
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
  Octicons,
} from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ThemedText from "../../ThemedText";

type IconDef = {
  name: string;
  lib: React.ComponentType<any>;
  key: string; // unique string ID to store/compare
};

const makeIcon = (
  lib: IconDef["lib"],
  name: string,
  libLabel: string,
): IconDef => ({
  lib,
  name,
  key: `${libLabel}::${name}`,
});

const mc = (name: string) => makeIcon(MaterialCommunityIcons, name, "mc");
const io = (name: string) => makeIcon(Ionicons, name, "io");
const fa = (name: string) => makeIcon(FontAwesome5, name, "fa");
const fe = (name: string) => makeIcon(Feather, name, "fe");

type Category = {
  id: string;
  label: string;
  icons?: IconDef[];
};

const CATEGORIES: Category[] = [
  { id: "all", label: "All" },
  {
    id: "fitness",
    label: "Fitness",
    icons: [
      mc("run"),
      mc("dumbbell"),
      mc("yoga"),
      mc("bike"),
      mc("swim"),
      mc("soccer"),
      mc("tennis"),
      mc("weight-lifter"),
      mc("hiking"),
      mc("gymnastics"),
    ],
  },
  {
    id: "learning",
    label: "Learning",
    icons: [
      io("book-outline"),
      io("pencil-outline"),
      io("bulb-outline"),
      io("school-outline"),
      io("document-text-outline"),
      io("flask-outline"),
      io("telescope-outline"),
      io("calculator-outline"),
      io("library-outline"),
      io("code-slash-outline"),
    ],
  },
  {
    id: "health",
    label: "Health",
    icons: [
      io("water-outline"),
      io("leaf-outline"),
      io("moon-outline"),
      io("medical-outline"),
      fa("apple-alt"),
      fa("tooth"),
      fa("heartbeat"),
      mc("food-apple"),
      mc("shower"),
      mc("hand-wash"),
    ],
  },
  {
    id: "productivity",
    label: "Productivity",
    icons: [
      fe("monitor"),
      fe("bar-chart-2"),
      fe("mail"),
      fe("clock"),
      fe("smartphone"),
      fe("folder"),
      fe("check-square"),
      fe("zap"),
      fe("calendar"),
      fe("trending-up"),
    ],
  },
  {
    id: "mindfulness",
    label: "Mindfulness",
    icons: [
      mc("leaf"),
      mc("weather-sunny"),
      mc("candle"),
      mc("tea"),
      mc("flower"),
      mc("meditation"),
      mc("cloud"),
      mc("weather-windy"),
      mc("spa"),
      io("heart-outline"),
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icons: [
      fa("dollar-sign"),
      fa("chart-line"),
      fa("coins"),
      fa("credit-card"),
      fa("university"),
      fa("money-bill-wave"),
      fa("receipt"),
      fa("gem"),
      fa("shopping-cart"),
      fa("piggy-bank"),
    ],
  },
];

const ALL_ICONS: IconDef[] = CATEGORIES.filter((c) => c.id !== "all").flatMap(
  (c) => c.icons || [],
);

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedIcon: string; // stores the icon key e.g. "mc::dumbbell"
  onSelectIcon: (iconKey: string) => void;
};

export default function IconPickerModal({
  visible,
  onClose,
  selectedIcon,
  onSelectIcon,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState("all");

  const filteredIcons = useMemo<IconDef[]>(() => {
    if (activeCategory === "all") return ALL_ICONS;
    return CATEGORIES.find((c) => c.id === activeCategory)?.icons || [];
  }, [activeCategory]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={{ flex: 1 }}>
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}>
          <Pressable onPress={onClose} hitSlop={20} style={styles.closeBtn}>
            <Octicons name="x" size={24} color={colors.text} />
          </Pressable>
          <ThemedText style={[styles.title, { color: colors.text }]}>
            Choose Icon
          </ThemedText>
          <View style={styles.closeBtn} />
        </View>

        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveCategory(cat.id);
                  }}
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: isActive
                        ? colors.primary
                        : colors.surface,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <ThemedText
                    style={{
                      fontWeight: isActive ? "700" : "500",
                      color: isActive ? "#1C1C1E" : colors.text,
                    }}
                  >
                    {cat.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.gridScroll,
            { paddingBottom: insets.bottom + 24 },
          ]}
        >
          <View style={styles.grid}>
            {filteredIcons.map((icon) => {
              const isSelected = selectedIcon === icon.key;
              const IconComponent = icon.lib;
              return (
                <Pressable
                  key={icon.key}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onSelectIcon(icon.key);
                    onClose();
                  }}
                  style={[
                    styles.gridItem,
                    {
                      backgroundColor: isSelected
                        ? `${colors.primary}18`
                        : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                      borderWidth: 1,
                    },
                  ]}
                >
                  <IconComponent
                    name={icon.name}
                    size={26}
                    color={isSelected ? colors.primary : colors.text}
                  />
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  closeBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  categoryScroll: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  gridScroll: {
    paddingHorizontal: 20,
  },
  grid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    padding: 18,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
});
