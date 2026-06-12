import Heatmap from "@/components/Heatmap";
import { useColors } from "@/hooks/useColors";
import { StyleSheet } from "react-native";

interface CompletionHeatmapProps {
  // map of date -> progress value (0..dailyGoal) or normalized ratio (0..1)
  data: Record<string, number>;
  loading: boolean;
}

export default function CompletionHeatmap({
  data,
  loading,
}: CompletionHeatmapProps) {
  const colors = useColors();

  // Provide legend steps from empty -> full
  const legend = [0, 0.25, 0.5, 0.75, 1];

  return (
    <Heatmap
      data={data}
      loading={loading}
      legendValues={legend}
      containerStyle={[
        styles.heatmapCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  heatmapCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 24,
  },
});
