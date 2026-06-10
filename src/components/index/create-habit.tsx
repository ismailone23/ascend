import { useColors } from "@/hooks/useColors";
import { useHabitStore } from "@/store/habit.store";
import { CreateHabitInput } from "@/types/habit";
import * as Crypto from "expo-crypto";
import { useState } from "react";
import { Modal, Pressable, TextInput, View } from "react-native";
import ThemedText from "../ThemedText";
import ThemedView from "../ThemedView";

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function CreateHabitModal({ visible, onClose }: Props) {
  const colors = useColors();

  const addHabit = useHabitStore((state) => state.addHabit);

  const [title, setTitle] = useState("");

  const handleSave = async () => {
    if (!title.trim()) return;

    const habit: CreateHabitInput = {
      id: Crypto.randomUUID(),
      title,
      comment: "",
      icon: "menu-book",
      frequency: "daily",
      streakTarget: 10,
    };

    await addHabit(habit);

    setTitle("");

    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View
        style={{
          flex: 1,
          justifyContent: "flex-end",

          backgroundColor: "rgba(0,0,0,0.4)",
        }}
      >
        <ThemedView
          style={{
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,

            padding: 24,
          }}
        >
          <ThemedText
            style={{
              fontSize: 24,
              fontWeight: "700",
            }}
          >
            New Habit
          </ThemedText>

          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Habit title"
            placeholderTextColor={colors.textMuted}
            style={{
              marginTop: 20,

              borderWidth: 1,
              borderColor: colors.border,

              borderRadius: 16,

              padding: 16,

              color: colors.text,
            }}
          />

          <Pressable
            onPress={handleSave}
            disabled={!title}
            style={{
              marginTop: 20,
              height: 56,
              borderRadius: 16,
              backgroundColor: colors.primary,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <ThemedText style={{ fontSize: 18, color: colors.text }}>
              Save
            </ThemedText>
          </Pressable>
        </ThemedView>
      </View>
    </Modal>
  );
}
