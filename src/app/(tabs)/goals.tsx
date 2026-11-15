import GoalCard from "@/components/goals/GoalCard";
import ThemedText from "@/components/ThemedText";
import { useColors } from "@/hooks/useColors";
import { goalRepository } from "@/repositories/goal.repository";
import { Goal } from "@/types/goal";
import { refreshWidgets } from "@/widgets/widgets";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Goals() {
  const colors = useColors();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const reload = useCallback(async () => {
    try {
      setGoals(await goalRepository.getAll());
    } catch (error) {
      if (__DEV__) console.warn("[Goals]", error);
    }
  }, []);

  // On focus, not just on mount, so a backup restored in Settings shows up.
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const run = useCallback(
    async (op: Promise<unknown>) => {
      try {
        await op;
      } catch (error) {
        if (__DEV__) console.warn("[Goals]", error);
      }
      await reload();
      refreshWidgets();
    },
    [reload],
  );

  const addGoal = async () => {
    const title = draft.trim();
    if (!title) return;
    setDraft("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Open the new goal straight away: the next thing to do is add its steps.
    await run(goalRepository.create(title).then(setOpenId));
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.header}>
          <ThemedText accessibilityRole="header" style={styles.title}>
            Goals
          </ThemedText>
          <ThemedText variant="muted" style={styles.subtitle}>
            Pick a skill, map the steps, tick them off.
          </ThemedText>
        </View>

        <View
          style={[
            styles.newGoal,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <MaterialIcons name="add" size={22} color={colors.icon} />
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={addGoal}
            placeholder="What do you want to learn?"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            maxLength={80}
            accessibilityLabel="New goal"
            style={[styles.input, { color: colors.text }]}
          />
        </View>

        {goals.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcons name="flag" size={56} color={colors.icon} />
            <ThemedText style={styles.emptyTitle}>No goals yet</ThemedText>
            <ThemedText variant="muted" style={styles.emptyText}>
              Name a skill above, like “Learn Spanish”, then break it into a
              roadmap of small steps.
            </ThemedText>
          </View>
        ) : (
          goals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              open={openId === goal.id}
              onToggle={() => setOpenId(openId === goal.id ? null : goal.id)}
              run={run}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 12,
  },
  header: {
    marginBottom: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 15,
    marginTop: 4,
  },
  newGoal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  empty: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 72,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.3,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8,
  },
});
