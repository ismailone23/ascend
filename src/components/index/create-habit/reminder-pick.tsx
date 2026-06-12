import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

type ReminderTime = {
  id: string;
  date: Date;
};

function formatTime(date: Date) {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  const min = m.toString().padStart(2, "0");
  return `${hour}:${min} ${ampm}`;
}

type Props = {
  onTimesChange?: (times: string[]) => void;
};

export default function ReminderPicker({ onTimesChange }: Props) {
  const colors = useColors();
  const [times, setTimes] = useState<ReminderTime[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  // Sync formatted times to parent whenever times array changes
  useEffect(() => {
    onTimesChange?.(times.map((t) => formatTime(t.date)));
  }, [times]);

  const openPicker = (id?: string) => {
    Haptics.selectionAsync();
    if (id) {
      const existing = times.find((t) => t.id === id);
      setTempDate(existing?.date ?? new Date());
      setEditingId(id);
    } else {
      setTempDate(new Date());
      setEditingId(null);
    }
    setPickerVisible(true);
  };

  const handleConfirm = (date: Date) => {
    if (editingId) {
      setTimes((prev) =>
        prev.map((t) => (t.id === editingId ? { ...t, date } : t)),
      );
    } else {
      setTimes((prev) => [...prev, { id: Date.now().toString(), date }]);
    }
    setPickerVisible(false);
  };

  const handleRemove = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimes((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.timesRow}>
        {times.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => openPicker(t.id)}
            onLongPress={() => handleRemove(t.id)}
            style={[
              styles.timeChip,
              {
                backgroundColor: colors.background,
              },
            ]}
          >
            <Feather name="clock" size={13} color={colors.text} />
            <Text style={[styles.timeText, { color: colors.text }]}>
              {formatTime(t.date)}
            </Text>
          </Pressable>
        ))}
        <Pressable
          onPress={() => openPicker()}
          style={[
            styles.timeChip,
            styles.newChip,
            {
              backgroundColor: `${colors.primary}18`,
              borderColor: `${colors.primary}40`,
            },
          ]}
        >
          <Feather name="clock" size={13} color={colors.primary} />
          <Text style={[styles.timeText, { color: colors.primary }]}>New</Text>
        </Pressable>
      </View>

      {times.length > 0 && (
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Long press a time to remove
        </Text>
      )}
      {pickerVisible && (
        <DateTimePicker
          value={tempDate}
          mode="time"
          is24Hour={false}
          display={Platform.OS === "ios" ? "spinner" : "clock"}
          onValueChange={(event) => {
            handleConfirm(
              event.nativeEvent.timestamp
                ? new Date(event.nativeEvent.timestamp)
                : new Date(),
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  timesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  newChip: {
    borderStyle: "dashed",
  },
  timeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  hint: {
    fontSize: 12,
    marginTop: 2,
  },
});
