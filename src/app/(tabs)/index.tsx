import EmptyIndex from "@/components/index/empty-index";
import HabitDetailModal from "@/components/index/habit-detail";
import HabitList from "@/components/index/habit-list";
import HeaderIndex from "@/components/index/header-index";
import ThemedText from "@/components/ThemedText";
import ThemedView from "@/components/ThemedView";
import { useColors } from "@/hooks/useColors";
import { useHabitStore } from "@/store/habit.store";
import { Habit } from "@/types/habit";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import dayjs from "dayjs";
import { router } from "expo-router";
import { useEffect, useState } from "react";
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

  useEffect(() => {
    loadLogs(selectedDate.format("YYYY-MM-DD"));
  }, [selectedDate]);

  const weekday = (() => {
    try {
      return selectedDate.format("ddd");
    } catch (e) {
      return "Mon";
    }
  })();

  const filteredHabits = habits.filter((h) => h.days?.includes(weekday as any));

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
          ListEmptyComponent={<EmptyIndex />}
          renderItem={({ item }) => (
            <HabitList
              habit={item}
              selectedDate={selectedDate}
              onLongPress={() => setDetailHabit(item)}
            />
          )}
        />

        <Pressable
          style={{
            position: "absolute",
            right: 20,
            bottom: 20,
            paddingHorizontal: 20,
            height: 56,
            borderRadius: 12,
            backgroundColor: colors.primary,
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "row",
            gap: 8,
            elevation: 8,
          }}
          onPress={() => router.push("/create-habit")}
        >
          <MaterialIcons name="add" size={24} color="#fff" />
          <ThemedText
            style={{ color: "#fff", fontWeight: "500", fontSize: 16 }}
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
