import FloatingButton from "@/components/FloatingButton";
import SortableRows from "@/components/goals/SortableRows";
import EmptyIndex from "@/components/index/empty-index";
import HabitDetailModal from "@/components/index/habit-detail";
import HabitList from "@/components/index/habit-list";
import HeaderIndex from "@/components/index/header-index";
import ThemedText from "@/components/ThemedText";
import ThemedView from "@/components/ThemedView";
import {
  remindersRefreshedKey,
  swipeHintSeenKey,
} from "@/constants/storagekeys";
import { useHabitStore } from "@/store/habit.store";
import { DayOfWeek, Habit } from "@/types/habit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);
  const { loadHabits, loadLogs, habits, refreshReminders, reorderHabits } =
    useHabitStore();

  useEffect(() => {
    // The first launch of each day rewrites the reminders, so their wording
    // keeps changing. Rescheduling all of them is slow, so not every launch.
    loadHabits().then(async () => {
      const today = dayjs().format("YYYY-MM-DD");
      if ((await AsyncStorage.getItem(remindersRefreshedKey)) === today) return;
      await refreshReminders();
      await AsyncStorage.setItem(remindersRefreshedKey, today);
    });
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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent:
              filteredHabits.length === 0 ? "center" : "flex-start",
            paddingBottom: 140,
            gap: 12,
          }}
        >
          <HeaderIndex
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          {filteredHabits.length === 0 ? (
            <EmptyIndex hasHabits={habits.length > 0} />
          ) : (
            // Press and hold a habit to drag it to a new place.
            <SortableRows
              ids={filteredHabits.map((h) => h.id)}
              gap={12}
              grab="hold"
              onReorder={(ids) => {
                if (ids.join() !== filteredHabits.map((h) => h.id).join())
                  reorderHabits(ids);
              }}
              renderRow={(_id, index) => (
                <HabitList
                  habit={filteredHabits[index]}
                  selectedDate={selectedDate}
                  onLongPress={() => setDetailHabit(filteredHabits[index])}
                  onSwiped={hideHint}
                />
              )}
            />
          )}
          {showHint && filteredHabits.length > 0 && (
            <ThemedText
              variant="muted"
              style={{ textAlign: "center", fontSize: 12, marginTop: 8 }}
            >
              Swipe right to log · left for details · hold to move
            </ThemedText>
          )}
        </ScrollView>

        <FloatingButton
          label="New Habit"
          onPress={() => router.push("/create-habit")}
        />

        <HabitDetailModal
          habit={detailHabit}
          visible={detailHabit !== null}
          onClose={() => setDetailHabit(null)}
        />
      </SafeAreaView>
    </ThemedView>
  );
}
