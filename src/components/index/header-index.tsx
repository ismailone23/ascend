import ThemedText from "@/components/ThemedText";
import ThemedView from "@/components/ThemedView";
import { useColors } from "@/hooks/useColors";
import { MaterialIcons } from "@expo/vector-icons";
import dayjs, { Dayjs } from "dayjs";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";

type Props = {
  selectedDate: Dayjs;
  onSelectDate: (date: Dayjs) => void;
};

export default function HeaderIndex({ selectedDate, onSelectDate }: Props) {
  const colors = useColors();

  const weekDays = useMemo(() => {
    const startOfWeek = dayjs().startOf("week");
    return Array.from({ length: 7 }, (_, i) =>
      startOfWeek.add(i, "day"),
    );
  }, []);

  const title = selectedDate.isSame(dayjs(), "day")
    ? "Today"
    : selectedDate.format("dddd");

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <ThemedText style={styles.title}>{title}</ThemedText>

        <Pressable>
          <MaterialIcons name="sort" size={28} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {weekDays.map((date) => {
          const selected = date.isSame(selectedDate, "day");

          return (
            <Pressable
              key={date.toString()}
              onPress={() => onSelectDate(date)}
              style={styles.dayWrapper}
            >
              <ThemedText
                style={[
                  styles.dayName,
                  {
                    color: colors.textMuted,
                  },
                ]}
              >
                {date.format("ddd")}
              </ThemedText>
              <ThemedView
                style={[
                  styles.dayPill,
                  {
                    borderColor: selected ? colors.primary : colors.border,
                  },
                  selected && {
                    borderWidth: 2,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.dayNumber,
                    {
                      color: selected ? colors.primary : colors.text,
                    },
                  ]}
                >
                  {date.format("DD")}
                </ThemedText>
              </ThemedView>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    marginBottom: 24,
  },

  title: {
    fontSize: 36,
    fontWeight: "700",
  },

  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  dayWrapper: {
    alignItems: "center",
  },

  dayName: {
    fontSize: 13,
    marginBottom: 10,
  },

  dayPill: {
    width: 48,
    height: 48,
    borderRadius: 26,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  dayNumber: {
    fontSize: 16,
    fontWeight: "600",
  },
});
