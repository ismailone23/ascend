import Heatmap from "@/components/Heatmap";

type OverallHeatmapProps = {
  logs: Record<string, number>; // date -> habits completed that day
  habitCount: number;
};

export function OverallHeatmap({ logs, habitCount }: OverallHeatmapProps) {
  // Shade each day by the share of habits completed (0..1), so one habit out
  // of five reads lighter than five out of five.
  const shares: Record<string, number> = {};
  for (const [date, count] of Object.entries(logs)) {
    shares[date] = Math.min(count / Math.max(habitCount, 1), 1);
  }

  return (
    <Heatmap
      title="Last 12 months"
      data={shares}
      legendValues={[0, 0.25, 0.5, 0.75, 1]}
    />
  );
}
