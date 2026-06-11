import CreateHabitModal from "@/components/index/create-habit";
import EmptyIndex from "@/components/index/empty-index";
import HabitDetailModal from "@/components/index/habit-detail";
import HabitList from "@/components/index/habit-list";
import HeaderIndex from "@/components/index/header-index";
import ThemedText from "@/components/ThemedText";
import ThemedView from "@/components/ThemedView";
import { useColors } from "@/hooks/useColors";
import { useHabitStore } from "@/store/habit.store";
import { Habit } from "@/types/habit";
import AntDesign from "@expo/vector-icons/AntDesign";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [showCreateHabit, setShowCreateHabit] = useState(false);
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null);
  const colors = useColors();

  const { loadHabits, loadLogs, habits } = useHabitStore();

  useEffect(() => {
    loadHabits();
  }, []);

  // Load completion logs whenever the selected date changes
  useEffect(() => {
    loadLogs(selectedDate.format("YYYY-MM-DD"));
  }, [selectedDate]);

  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {habits.length === 0 ? (
          <>
            <HeaderIndex
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
            <ThemedText
              variant="heading"
              style={{ paddingHorizontal: 20, paddingVertical: 12 }}
            >
              Tasks
            </ThemedText>
            <EmptyIndex setShowCreateHabit={setShowCreateHabit} />
          </>
        ) : (
          <FlatList
            data={habits}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 140,
              gap: 12,
            }}
            ListHeaderComponent={
              <>
                <HeaderIndex
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
                <ThemedText
                  variant="heading"
                  style={{ paddingHorizontal: 20, paddingVertical: 12 }}
                >
                  Tasks
                </ThemedText>
              </>
            }
            renderItem={({ item }) => (
              <HabitList
                habit={item}
                selectedDate={selectedDate}
                onLongPress={() => setDetailHabit(item)}
              />
            )}
          />
        )}

        {habits.length > 0 && (
          <Pressable
            style={{
              position: "absolute",
              right: 24,
              bottom: 110,
              width: 72,
              height: 72,
              borderRadius: 999,
              backgroundColor: colors.primary,
              justifyContent: "center",
              alignItems: "center",
              elevation: 8,
            }}
            onPress={() => setShowCreateHabit(true)}
          >
            <AntDesign name="plus" size={28} color={colors.background} />
          </Pressable>
        )}

        <CreateHabitModal
          visible={showCreateHabit}
          onClose={() => setShowCreateHabit(false)}
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
