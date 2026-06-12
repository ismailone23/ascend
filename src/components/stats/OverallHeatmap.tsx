import { useColors } from "@/hooks/useColors";
import { StyleSheet } from "react-native";
import Heatmap from "@/components/Heatmap";

type OverallHeatmapProps = {
  logs: Record<string, number>; // date -> count
};

export function OverallHeatmap({ logs }: OverallHeatmapProps) {
  return (
    <Heatmap
      title="Contribution Graph"
      data={logs}
      legendValues={[0, 1, 2, 3, 4]}
      containerStyle={styles.container}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
});