import { useColors } from "@/hooks/useColors";
import { ScrollView, StyleSheet, View } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import ThemedText from "../ThemedText";

const WEEKS = 52;
const CELL_SIZE = 12;
const CELL_GAP = 3;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

/** Format Date as YYYY-MM-DD */
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type OverallHeatmapProps = {
  logs: Record<string, number>; // date -> count
};

export function OverallHeatmap({ logs }: OverallHeatmapProps) {
  const colors = useColors();
  const today = new Date();
  today.setHours(12, 0, 0, 0); // Avoid DST skips
  const todayStr = toLocalDateStr(today);
  const grid: { date: string; count: number }[][] = [];

  // Find the Sunday of the CURRENT week
  const currentDayOfWeek = today.getDay(); // 0=Sun
  const currentSunday = new Date(today);
  currentSunday.setDate(today.getDate() - currentDayOfWeek);

  // The start date is exactly WEEKS - 1 weeks before the current Sunday
  const startDate = new Date(currentSunday);
  startDate.setDate(currentSunday.getDate() - (WEEKS - 1) * 7);

  const cursor = new Date(startDate);
  for (let w = 0; w < WEEKS; w++) {
    const week: { date: string; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = toLocalDateStr(cursor);
      const isFuture = dateStr > todayStr;
      week.push({
        date: dateStr,
        count: isFuture ? 0 : logs[dateStr] || 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    grid.push(week);
  }

  const labelWidth = 28;
  const svgWidth = labelWidth + WEEKS * (CELL_SIZE + CELL_GAP);
  const svgHeight = 7 * (CELL_SIZE + CELL_GAP) + 20;

  const monthLabels: { text: string; x: number }[] = [];
  let lastMonth = -1;
  for (let w = 0; w < WEEKS; w++) {
    const firstDayOfWeek = new Date(grid[w][0].date + "T00:00:00");
    const month = firstDayOfWeek.getMonth();
    if (month !== lastMonth) {
      monthLabels.push({
        text: firstDayOfWeek.toLocaleDateString("en-US", { month: "short" }),
        x: labelWidth + w * (CELL_SIZE + CELL_GAP),
      });
      lastMonth = month;
    }
  }

  const getCellColor = (count: number) => {
    if (count === 0) return { fill: colors.border, fillOpacity: 0.35 };
    if (count === 1) return { fill: colors.primary, fillOpacity: 0.3 };
    if (count === 2) return { fill: colors.primary, fillOpacity: 0.6 };
    if (count === 3) return { fill: colors.primary, fillOpacity: 0.85 };
    return { fill: colors.primary, fillOpacity: 1 }; // 4+
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Contribution Graph</ThemedText>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <Svg width={svgWidth} height={svgHeight}>
          {monthLabels.map((m, i) => (
            <SvgText
              key={i}
              x={m.x}
              y={10}
              fontSize={10}
              fill={colors.textMuted}
            >
              {m.text}
            </SvgText>
          ))}

          {DAY_LABELS.map((label, d) =>
            label ? (
              <SvgText
                key={d}
                x={0}
                y={20 + d * (CELL_SIZE + CELL_GAP) + CELL_SIZE / 1.5}
                fontSize={10}
                fill={colors.textMuted}
              >
                {label}
              </SvgText>
            ) : null,
          )}

          {grid.map((week, w) =>
            week.map((day, d) => {
              const x = labelWidth + w * (CELL_SIZE + CELL_GAP);
              const y = 20 + d * (CELL_SIZE + CELL_GAP);
              const colorStyle = getCellColor(day.count);
              return (
                <Rect
                  key={`${w}-${d}`}
                  x={x}
                  y={y}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  rx={3}
                  ry={3}
                  fill={colorStyle.fill}
                  fillOpacity={colorStyle.fillOpacity}
                />
              );
            }),
          )}
        </Svg>
      </ScrollView>

      <View style={styles.legend}>
        <ThemedText variant="muted" style={styles.legendText}>
          Less
        </ThemedText>
        {[0, 1, 2, 3, 4].map((count) => {
          const colorStyle = getCellColor(count);
          return (
            <View
              key={count}
              style={[
                styles.legendBox,
                {
                  backgroundColor: colorStyle.fill,
                  opacity: colorStyle.fillOpacity,
                },
              ]}
            />
          );
        })}
        <ThemedText variant="muted" style={styles.legendText}>
          More
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 12,
    gap: 4,
  },
  legendText: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
});
