import EmptyIndex from "@/components/index/empty-index";
import HabitDetailModal from "@/components/index/habit-detail";
import HabitList from "@/components/index/habit-list";
import HeaderIndex from "@/components/index/header-index";
import ThemedText from "@/components/ThemedText";
import ThemedView from "@/components/ThemedView";
import { swipeHintSeenKey } from "@/constants/storagekeys";
import { useColors } from "@/hooks/useColors";
import { useHabitStore } from "@/store/habit.store";
import { DayOfWeek, Habit } from "@/types/habit";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);
  const colors = useColors();
  const { loadHabits, loadLogs, habits } = useHabitStore();

  useEffect(() => {
    loadHabits();
  }, []);

  // The swipe hint shows until the first swipe, then never again.
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(swipeHintSeenKey)
      .then((seen) => setShowHint(seen !== "true"))
      .catch(() => {});
  }, []);
  const hideHint = () => {
    if (!showHint) return;
    setShowHint(false);
    AsyncStorage.setItem(swipeHintSeenKey, "true").catch(() => {});
  };

  useEffect(() => {
    loadLogs(selectedDate.format("YYYY-MM-DD"));
  }, [selectedDate]);

  const weekday = selectedDate.format("ddd") as DayOfWeek;

  const filteredHabits = useMemo(() => {
    return habits.filter((h) => h.days?.includes(weekday));
  }, [habits, weekday]);

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
          data={filteredHabits}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent:
              filteredHabits.length === 0 ? "center" : "flex-start",
            paddingBottom: 140,
            gap: 12,
          }}
          ListHeaderComponent={
            <HeaderIndex
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          }
          ListEmptyComponent={<EmptyIndex hasHabits={habits.length > 0} />}
          ListFooterComponent={
            showHint && filteredHabits.length > 0 ? (
              <ThemedText
                variant="muted"
                style={{ textAlign: "center", fontSize: 12, marginTop: 8 }}
              >
                Swipe right to log · left for details
              </ThemedText>
            ) : null
          }
          renderItem={({ item }) => (
            <HabitList
              habit={item}
              selectedDate={selectedDate}
              onLongPress={() => setDetailHabit(item)}
              onSwiped={hideHint}
            />
          )}
        />

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => ({
            position: "absolute",
            right: 20,
            bottom: 20,
            paddingLeft: 16,
            paddingRight: 22,
            gap: 6,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.primary,
            alignItems: "center",
            flexDirection: "row",
            elevation: 6,
            shadowColor: "#000",
            shadowOpacity: 0.2,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            // Respond on touch-down, not on release.
            transform: [{ scale: pressed ? 0.96 : 1 }],
            opacity: pressed ? 0.85 : 1,
          })}
          onPress={() => router.push("/create-habit")}
        >
          <MaterialIcons name="add" size={22} color={colors.onPrimary} />
          <ThemedText
            style={{ color: colors.onPrimary, fontWeight: "600", fontSize: 16 }}
          >
            New Habit
          </ThemedText>
        </Pressable>

        <HabitDetailModal
          habit={detailHabit}
          visible={detailHabit !== null}
          onClose={() => setDetailHabit(null)}
        />
      </SafeAreaView>
    </ThemedView>
  );
}
