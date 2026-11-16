import IconView from "@/components/IconView";
import ThemeProvider from "@/context/ThemeContext";
import { initializeDatabase } from "@/db/schema";
import { useColors } from "@/hooks/useColors";
import { goalRepository } from "@/repositories/goal.repository";
import { habitRepository } from "@/repositories/habit.repository";
import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { WidgetConfigurationScreenProps } from "react-native-android-widget";
import { loadWidgetItems, renderWidget, saveWidgetItems } from "./widgets";

type Item = { id: string; title: string; icon: string };

/**
 * Android opens this when a widget is added, and again from the widget's
 * Configure option, so each widget shows only the habits or goals picked here.
 */
export function WidgetConfigScreen(props: WidgetConfigurationScreenProps) {
  return (
    <ThemeProvider>
      <Picker {...props} />
    </ThemeProvider>
  );
}

function Picker({
  widgetInfo,
  renderWidget: draw,
  setResult,
}: WidgetConfigurationScreenProps) {
  const colors = useColors();
  const isGoals = widgetInfo.widgetName === "Goals";
  const [items, setItems] = useState<Item[] | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        // The app may not be running, so nothing has opened the database yet.
        await initializeDatabase();
        const all = isGoals
          ? await goalRepository.getAll()
          : await habitRepository.getAll();
        setItems(all.map(({ id, title, icon }) => ({ id, title, icon })));
        setChosen((await loadWidgetItems(widgetInfo.widgetId)) ?? []);
      } catch (error) {
        if (__DEV__) console.warn("[WidgetConfig]", error);
        setItems([]);
      }
    })();
  }, []);

  const toggle = (id: string) =>
    setChosen((now) =>
      now.includes(id) ? now.filter((each) => each !== id) : [...now, id],
    );

  const save = async () => {
    try {
      await saveWidgetItems(widgetInfo.widgetId, chosen);
      draw(await renderWidget(widgetInfo));
      setResult("ok");
    } catch (error) {
      if (__DEV__) console.warn("[WidgetConfig]", error);
      setResult("cancel");
    }
  };

  const noun = isGoals ? "goals" : "habits";
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Text
        accessibilityRole="header"
        style={[styles.title, { color: colors.text }]}
      >
        Choose {noun}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Only the {noun} you tick show on this widget.
      </Text>

      <ScrollView
        style={[styles.card, { backgroundColor: colors.surface }]}
        contentContainerStyle={{ paddingVertical: 4 }}
      >
        {items?.length === 0 && (
          <Text style={[styles.empty, { color: colors.textMuted }]}>
            No {noun} yet. Add some in Ascend first.
          </Text>
        )}
        {items?.map((item) => {
          const on = chosen.includes(item.id);
          return (
            <Pressable
              key={item.id}
              onPress={() => toggle(item.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
              accessibilityLabel={item.title}
              style={({ pressed }) => [styles.row, pressed && { opacity: 0.5 }]}
            >
              <IconView iconKey={item.icon} size={22} circle={false} />
              <Text
                numberOfLines={1}
                style={[styles.rowText, { color: colors.text }]}
              >
                {item.title}
              </Text>
              <MaterialIcons
                name={on ? "check-box" : "check-box-outline-blank"}
                size={24}
                color={on ? colors.primary : colors.textMuted}
              />
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.buttons}>
        <Pressable
          onPress={() => setResult("cancel")}
          accessibilityRole="button"
          style={[styles.button, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.buttonText, { color: colors.text }]}>
            Cancel
          </Text>
        </Pressable>
        <Pressable
          onPress={save}
          disabled={chosen.length === 0}
          accessibilityRole="button"
          accessibilityState={{ disabled: chosen.length === 0 }}
          style={[
            styles.button,
            { backgroundColor: colors.primary },
            chosen.length === 0 && { opacity: 0.4 },
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.onPrimary }]}>
            {chosen.length ? `Show ${chosen.length}` : "Pick at least one"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 16, paddingTop: 48 },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { fontSize: 14, marginTop: 4, marginBottom: 16 },
  card: { flex: 1, borderRadius: 20 },
  empty: { padding: 16, fontSize: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 52,
    paddingHorizontal: 16,
  },
  rowText: { flex: 1, fontSize: 16, fontWeight: "500" },
  buttons: { flexDirection: "row", gap: 12, marginTop: 16 },
  button: {
    flex: 1,
    minHeight: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { fontSize: 16, fontWeight: "600" },
});
