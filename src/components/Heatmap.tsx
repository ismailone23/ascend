import ThemedText from "@/components/ThemedText";
import { useColors } from "@/hooks/useColors";
import { useMemo, useRef, useCallback } from "react";
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";
import { toLocalDate } from "@/lib/date";

const WEEKS = 52;
const CELL_SIZE = 12;
const CELL_GAP = 3;
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

interface HeatmapProps {
  /** Map of date (YYYY-MM-DD) to numeric value, or a Set of completed dates */
  data: Record<string, number> | Set<string>;
  /** Optional function to compute fill color and opacity for a given value */
  getCellColor?: (
    value: number,
    colors: ReturnType<typeof useColors>,
  ) => { fill: string; fillOpacity: number };
  /** Array of values to display in the legend. e.g. [0, 1] or [0, 1, 2, 3, 4] */
  legendValues?: number[];
  /** Optional title to display above the heatmap */
  title?: string;
  /** Optional loading state */
  loading?: boolean;
  /** Custom container style to override defaults */
  containerStyle?: StyleProp<ViewStyle>;
  /** Optional: whether to scroll to the end (current date) on mount. Default: true */
  scrollToEnd?: boolean;
}

export default function Heatmap({
  data,
  getCellColor,
  legendValues = [0, 1],
  title,
  loading = false,
  containerStyle,
  scrollToEnd = true,
}: HeatmapProps) {
  const colors = useColors();
  const heatmapScrollRef = useRef<ScrollView>(null);

  // Normalize data to a Record<string, number>
  const normalizedData = useMemo(() => {
    if (data instanceof Set) {
      const record: Record<string, number> = {};
      data.forEach((date) => {
        record[date] = 1;
      });
      return record;
    }
    return data;
  }, [data]);

  // Color resolver
  const defaultGetCellColor = useCallback((
    val: number,
    themeColors: ReturnType<typeof useColors>,
  ) => {
    if (getCellColor) {
      return getCellColor(val, themeColors);
    }
    // Handle empty
    if (!val || val === 0) {
      return { fill: themeColors.border, fillOpacity: 0.12 };
    }

    // If value is a fractional ratio (0..1), map to opacity
    if (val > 0 && val <= 1) {
      const opacity = 0.2 + 0.8 * val; // 0.2..1.0
      return { fill: themeColors.primary, fillOpacity: opacity };
    }

    // If legendValues uses multiple integer steps, map integers to preset opacities
    if (legendValues.length > 2) {
      if (val === 1) return { fill: themeColors.primary, fillOpacity: 0.3 };
      if (val === 2) return { fill: themeColors.primary, fillOpacity: 0.6 };
      if (val === 3) return { fill: themeColors.primary, fillOpacity: 0.85 };
      return { fill: themeColors.primary, fillOpacity: 1 };
    }

    // Fallback: treat any positive number as full
    return { fill: themeColors.primary, fillOpacity: 1 };
  }, [getCellColor, legendValues]);

  const { grid, todayStr } = useMemo(() => {
    const today = new Date();
    today.setHours(12, 0, 0, 0); // Avoid DST skips
    const todayStr = toLocalDate(today);
    const computedGrid: { date: string; count: number }[][] = [];

    const currentDayOfWeek = today.getDay();
    const currentSunday = new Date(today);
    currentSunday.setDate(today.getDate() - currentDayOfWeek);

    const startDate = new Date(currentSunday);
    startDate.setDate(currentSunday.getDate() - (WEEKS - 1) * 7);

    const cursor = new Date(startDate);
    for (let w = 0; w < WEEKS; w++) {
      const week: { date: string; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = toLocalDate(cursor);
        const isFuture = dateStr > todayStr;
        week.push({
          date: dateStr,
          count: isFuture ? 0 : normalizedData[dateStr] || 0,
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      computedGrid.push(week);
    }
    return { grid: computedGrid, todayStr };
  }, [normalizedData]);

  const labelWidth = 28;
  const svgWidth = labelWidth + WEEKS * (CELL_SIZE + CELL_GAP);
  const svgHeight = 7 * (CELL_SIZE + CELL_GAP) + 20; // +20 for month labels

  const monthLabels = useMemo(() => {
    const labels: { text: string; x: number }[] = [];
    let lastMonth = -1;
    for (let w = 0; w < WEEKS; w++) {
      if (!grid[w] || grid[w].length === 0) continue;
      const firstDayOfWeek = new Date(grid[w][0].date + "T00:00:00");
      const month = firstDayOfWeek.getMonth();
      if (month !== lastMonth) {
        labels.push({
          text: firstDayOfWeek.toLocaleDateString("en-US", { month: "short" }),
          x: labelWidth + w * (CELL_SIZE + CELL_GAP),
        });
        lastMonth = month;
      }
    }
    return labels;
  }, [grid]);

  return (
    <View style={[styles.container, containerStyle]}>
      {title ? (
        <ThemedText accessibilityRole="header" style={styles.title}>
          {title}
        </ThemedText>
      ) : null}

      {loading ? (
        <ThemedText
          variant="muted"
          style={{ textAlign: "center", paddingVertical: 20 }}
        >
          Loading…
        </ThemedText>
      ) : (
        <ScrollView
          ref={heatmapScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 8 }}
          onLayout={() => {
            if (scrollToEnd) {
              heatmapScrollRef.current?.scrollToEnd({ animated: false });
            }
          }}
          onContentSizeChange={() => {
            if (scrollToEnd) {
              heatmapScrollRef.current?.scrollToEnd({ animated: false });
            }
          }}
        >
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

            {/* Day labels */}
            {DAY_LABELS.map((label, d) =>
              label ? (
                <SvgText
                  key={`day-${d}`}
                  x={0}
                  y={18 + d * (CELL_SIZE + CELL_GAP) + CELL_SIZE - 2}
                  fontSize={9}
                  fill={colors.textMuted}
                >
                  {label}
                </SvgText>
              ) : null,
            )}

            {/* Grid cells */}
            {grid.map((week, w) =>
              week.map((day, d) => {
                const isFuture = day.date > todayStr;
                const cellColor = defaultGetCellColor(day.count, colors);
                let fillColor = cellColor.fill;
                let fillOpacity = cellColor.fillOpacity;

                if (isFuture) {
                  fillColor = colors.border;
                  fillOpacity = 0.12;
                }

                return (
                  <Rect
                    key={`${w}-${d}`}
                    x={labelWidth + w * (CELL_SIZE + CELL_GAP)}
                    y={18 + d * (CELL_SIZE + CELL_GAP)}
                    width={CELL_SIZE}
                    height={CELL_SIZE}
                    rx={3}
                    ry={3}
                    fill={fillColor}
                    fillOpacity={fillOpacity}
                  />
                );
              }),
            )}
          </Svg>
        </ScrollView>
      )}

      {/* Legend */}
      <View style={styles.legendRow}>
        <ThemedText variant="muted" style={styles.legendText}>
          Less
        </ThemedText>
        {legendValues.map((val) => {
          const cellColor = defaultGetCellColor(val, colors);
          return (
            <View
              key={val}
              style={[
                styles.legendCell,
                {
                  backgroundColor: cellColor.fill,
                  opacity: cellColor.fillOpacity,
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
  container: {},
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 8,
  },
  legendText: {
    fontSize: 10,
    marginHorizontal: 4,
  },
  legendCell: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
});
