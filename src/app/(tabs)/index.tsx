import CreateHabitModal from "@/components/index/create-habit";
import EmptyIndex from "@/components/index/empty-index";
import Greeting from "@/components/index/greeting";
import HabitList from "@/components/index/habit-list";
import HeaderIndex from "@/components/index/header-index";
import ThemedView from "@/components/ThemedView";
import { useColors } from "@/hooks/useColors";
import { useHabitStore } from "@/store/habit.store";
import AntDesign from "@expo/vector-icons/AntDesign";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [showCreateHabit, setShowCreateHabit] = useState(false);
  const colors = useColors();

  const { loadHabits, habits } = useHabitStore();

  useEffect(() => {
    loadHabits();
  }, []);
  return (
    <ThemedView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {habits.length === 0 ? (
          <>
            <HeaderIndex
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            <Greeting habits={[]} />
            <EmptyIndex setShowCreateHabit={setShowCreateHabit} />
          </>
        ) : (
          <FlatList
            data={habits}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingBottom: 140,
            }}
            ListHeaderComponent={
              <>
                <HeaderIndex
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
                <Greeting habits={habits} />
              </>
            }
            renderItem={({ item }) => (
              <HabitList habit={item} selectedDate={selectedDate} />
            )}
            ItemSeparatorComponent={() => (
              <ThemedView
                style={{
                  height: 1,
                  backgroundColor: colors.border,
                  marginHorizontal: 20,
                }}
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
      </SafeAreaView>
    </ThemedView>
  );
}
