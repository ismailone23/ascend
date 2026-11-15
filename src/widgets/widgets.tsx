// The widget renderer calls these components as plain functions, so they must
// not be compiled by the React Compiler (it injects hooks).
"use no memo";

import { Colors } from "@/constants/colors";
import { initializeDatabase } from "@/db/schema";
import { goalRepository } from "@/repositories/goal.repository";
import { habitRepository } from "@/repositories/habit.repository";
import { logRepository } from "@/repositories/log.repository";
import dayjs from "dayjs";
import { Platform } from "react-native";
import {
  FlexWidget,
  HexColor,
  requestWidgetUpdate,
  TextWidget,
  WidgetRepresentation,
} from "react-native-android-widget";

/** The names here must match the widgets declared in app.json. */
export const WIDGETS = [
  { name: "TodayHabits", label: "Today's habits", icon: "checklist" },
  { name: "TodayProgress", label: "Today's progress", icon: "donut-large" },
  { name: "Streak", label: "Streak", icon: "local-fire-department" },
  { name: "Goals", label: "Goals", icon: "flag" },
] as const;
export type WidgetName = (typeof WIDGETS)[number]["name"];

type Palette = Record<keyof typeof Colors.light, HexColor>;

type WidgetData = {
  habits: { title: string; progress: number; goal: number; done: boolean }[];
  streak: number;
  goals: { title: string; done: number; total: number }[];
};

async function loadData(): Promise<WidgetData> {
  // A widget can be drawn while the app is closed, before anything else has
  // opened the database.
  await initializeDatabase();

  const today = dayjs();
  const [allHabits, logs, stats, goals] = await Promise.all([
    habitRepository.getAll(),
    logRepository.getLogsForDate(today.format("YYYY-MM-DD")),
    logRepository.getAllHabitsStats(),
    goalRepository.getAll(),
  ]);

  const weekday = today.format("ddd");
  return {
    habits: allHabits
      .filter((h) => (h.days as string[]).includes(weekday))
      .map((h) => {
        const log = logs.find((l) => l.habit_id === h.id);
        return {
          title: h.title,
          progress: Math.min(log?.progress ?? 0, h.dailyGoal),
          goal: h.dailyGoal,
          done: log?.completed === 1,
        };
      }),
    streak: Math.max(0, ...Object.values(stats).map((s) => s.currentStreak)),
    goals: goals.map((g) => ({
      title: g.title,
      done: g.steps.filter((s) => s.done).length,
      total: g.steps.length,
    })),
  };
}

// ---- building blocks ------------------------------------------------------

function Shell({ c, children }: { c: Palette; children: any }) {
  return (
    <FlexWidget
      clickAction="OPEN_APP"
      style={{
        width: "match_parent",
        height: "match_parent",
        backgroundColor: c.surface,
        borderRadius: 24,
        padding: 16,
        flexDirection: "column",
      }}
    >
      {children}
    </FlexWidget>
  );
}

function Label({ c, text }: { c: Palette; text: string }) {
  return (
    <TextWidget
      text={text}
      style={{ fontSize: 13, fontWeight: "600", color: c.textMuted }}
    />
  );
}

function Bar({ c, done, total }: { c: Palette; done: number; total: number }) {
  return (
    <FlexWidget
      style={{
        width: "match_parent",
        height: 6,
        borderRadius: 3,
        backgroundColor: c.border,
        flexDirection: "row",
        overflow: "hidden",
      }}
    >
      {done > 0 && (
        <FlexWidget
          style={{
            flex: done,
            height: 6,
            borderRadius: 3,
            backgroundColor: c.primary,
          }}
        />
      )}
      {done < total && <FlexWidget style={{ flex: total - done, height: 6 }} />}
    </FlexWidget>
  );
}

/** A title on the left, a short value on the right, and a bar under both. */
function Row({
  c,
  title,
  value,
  done,
  total,
}: {
  c: Palette;
  title: string;
  value: string;
  done: number;
  total: number;
}) {
  return (
    <FlexWidget
      style={{ width: "match_parent", flexDirection: "column", marginTop: 10 }}
    >
      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: 4,
        }}
      >
        <TextWidget
          text={title}
          maxLines={1}
          truncate="END"
          style={{ fontSize: 14, fontWeight: "600", color: c.text }}
        />
        <TextWidget text={value} style={{ fontSize: 13, color: c.textMuted }} />
      </FlexWidget>
      <Bar c={c} done={done} total={total} />
    </FlexWidget>
  );
}

function Empty({ c, text }: { c: Palette; text: string }) {
  return (
    <TextWidget
      text={text}
      style={{ fontSize: 13, color: c.textMuted, marginTop: 8 }}
    />
  );
}

// ---- the four widgets -----------------------------------------------------

// Rows that fit a 4x2 widget; the rest are summarised as "+N more".
const MAX_ROWS = 3;

function more(c: Palette, count: number) {
  return count > MAX_ROWS ? (
    <Empty c={c} text={`+${count - MAX_ROWS} more`} />
  ) : null;
}

const RENDERERS: Record<
  WidgetName,
  (c: Palette, data: WidgetData) => React.JSX.Element
> = {
  TodayHabits: (c, { habits }) => (
    <Shell c={c}>
      <Label c={c} text={`Today · ${dayjs().format("ddd D MMM")}`} />
      {habits.length === 0 && <Empty c={c} text="Nothing scheduled today" />}
      {habits.slice(0, MAX_ROWS).map((h, i) => (
        <Row
          key={i}
          c={c}
          title={h.title}
          value={h.done ? "Done" : `${h.progress}/${h.goal}`}
          done={h.progress}
          total={h.goal}
        />
      ))}
      {more(c, habits.length)}
    </Shell>
  ),

  TodayProgress: (c, { habits }) => {
    const done = habits.filter((h) => h.done).length;
    return (
      <Shell c={c}>
        <Label c={c} text="Today" />
        <TextWidget
          text={`${done}/${habits.length}`}
          style={{ fontSize: 34, fontWeight: "700", color: c.text }}
        />
        <TextWidget
          text="habits done"
          style={{ fontSize: 13, color: c.textMuted, marginBottom: 10 }}
        />
        <Bar c={c} done={done} total={Math.max(habits.length, 1)} />
      </Shell>
    );
  },

  Streak: (c, { streak }) => (
    <Shell c={c}>
      <Label c={c} text="Streak" />
      <TextWidget
        text={String(streak)}
        style={{ fontSize: 40, fontWeight: "700", color: c.primary }}
      />
      <TextWidget
        text={streak === 1 ? "day in a row" : "days in a row"}
        style={{ fontSize: 13, color: c.textMuted }}
      />
    </Shell>
  ),

  Goals: (c, { goals }) => (
    <Shell c={c}>
      <Label c={c} text="Goals" />
      {goals.length === 0 && <Empty c={c} text="No goals yet" />}
      {goals.slice(0, MAX_ROWS).map((g, i) => (
        <Row
          key={i}
          c={c}
          title={g.title}
          value={g.total ? `${g.done} of ${g.total}` : "No steps"}
          done={g.done}
          total={Math.max(g.total, 1)}
        />
      ))}
      {more(c, goals.length)}
    </Shell>
  ),
};

/** Draws one widget from the current data, in both system themes. */
export async function renderWidget(
  name: WidgetName,
): Promise<WidgetRepresentation> {
  let data: WidgetData = { habits: [], streak: 0, goals: [] };
  try {
    data = await loadData();
  } catch (error) {
    if (__DEV__) console.warn("[Widgets]", error);
  }
  const render = RENDERERS[name];
  return {
    light: render(Colors.light as Palette, data),
    dark: render(Colors.dark as Palette, data),
  };
}

/** Redraws every widget on the home screen. Call after the data changes. */
export function refreshWidgets() {
  if (Platform.OS !== "android") return;
  for (const { name } of WIDGETS) {
    requestWidgetUpdate({
      widgetName: name,
      renderWidget: () => renderWidget(name),
    }).catch((error) => {
      if (__DEV__) console.warn("[Widgets]", error);
    });
  }
}
