// The widget renderer calls these components as plain functions, so they must
// not be compiled by the React Compiler (it injects hooks).
"use no memo";

import { Colors } from "@/constants/colors";
import { widgetItemsKey } from "@/constants/storagekeys";
import { initializeDatabase } from "@/db/schema";
import { goalRepository } from "@/repositories/goal.repository";
import { habitRepository } from "@/repositories/habit.repository";
import { logRepository } from "@/repositories/log.repository";
import AsyncStorage from "@react-native-async-storage/async-storage";
import dayjs from "dayjs";
import { Platform } from "react-native";
import {
  FlexWidget,
  HexColor,
  requestWidgetUpdate,
  TextWidget,
  WidgetInfo,
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
  habits: {
    id: string;
    title: string;
    progress: number;
    goal: number;
    done: boolean;
  }[];
  streak: number;
  goals: {
    title: string;
    done: number;
    total: number;
    /** The first step not done yet, and the one after it. */
    current?: { id: string; title: string };
    next?: string;
  }[];
};

/**
 * The habits or goals a widget was set up to show, or null for a widget that
 * was never set up (added before this existed): it shows them all.
 */
export async function loadWidgetItems(widgetId: number) {
  try {
    const ids = JSON.parse(
      (await AsyncStorage.getItem(widgetItemsKey + widgetId)) ?? "null",
    );
    return Array.isArray(ids) ? (ids as string[]) : null;
  } catch {
    return null;
  }
}

export async function saveWidgetItems(widgetId: number, ids: string[]) {
  await AsyncStorage.setItem(widgetItemsKey + widgetId, JSON.stringify(ids));
}

export async function forgetWidget(widgetId: number) {
  await AsyncStorage.removeItem(widgetItemsKey + widgetId);
}

async function loadData(chosen: string[] | null): Promise<WidgetData> {
  // A widget can be drawn while the app is closed, before anything else has
  // opened the database.
  await initializeDatabase();

  const today = dayjs();
  const [allHabits, logs, stats, allGoals] = await Promise.all([
    habitRepository.getAll(),
    logRepository.getLogsForDate(today.format("YYYY-MM-DD")),
    logRepository.getAllHabitsStats(),
    goalRepository.getAll(),
  ]);
  const picked = (id: string) => chosen === null || chosen.includes(id);
  const shown = allHabits.filter((h) => picked(h.id));
  const goals = allGoals.filter((g) => picked(g.id));

  const weekday = today.format("ddd");
  return {
    habits: shown
      .filter((h) => (h.days as string[]).includes(weekday))
      .map((h) => {
        const log = logs.find((l) => l.habit_id === h.id);
        return {
          id: h.id,
          title: h.title,
          progress: Math.min(log?.progress ?? 0, h.dailyGoal),
          goal: h.dailyGoal,
          done: log?.completed === 1,
        };
      }),
    streak: Math.max(0, ...shown.map((h) => stats[h.id]?.currentStreak ?? 0)),
    goals: goals.map((g) => {
      const left = g.steps.filter((s) => !s.done);
      return {
        title: g.title,
        done: g.steps.length - left.length,
        total: g.steps.length,
        current: left[0] && { id: left[0].id, title: left[0].title },
        next: left[1]?.title,
      };
    }),
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
  onTap,
}: {
  c: Palette;
  title: string;
  value: string;
  done: number;
  total: number;
  /** A widget click action for the whole row, instead of opening the app. */
  onTap?: { action: string; data: Record<string, unknown> };
}) {
  return (
    <FlexWidget
      clickAction={onTap?.action}
      clickActionData={onTap?.data}
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
// A goal takes three lines (title, current step, next step).
const MAX_GOALS = 2;

/** Click actions the widget task handler answers. */
export const LOG_HABIT = "LOG_HABIT";
export const COMPLETE_STEP = "COMPLETE_STEP";

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
      <Label
        c={c}
        text={`Today · ${dayjs().format("ddd D MMM")} · tap to log`}
      />
      {habits.length === 0 && <Empty c={c} text="Nothing scheduled today" />}
      {habits.slice(0, MAX_ROWS).map((h, i) => (
        <Row
          key={i}
          c={c}
          title={h.title}
          value={h.done ? "Done" : `${h.progress}/${h.goal}`}
          done={h.progress}
          total={h.goal}
          onTap={{ action: LOG_HABIT, data: { id: h.id } }}
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
      {goals.slice(0, MAX_GOALS).map((g, i) => (
        <FlexWidget
          key={i}
          style={{
            width: "match_parent",
            flexDirection: "column",
            marginTop: 10,
          }}
        >
          <FlexWidget
            style={{
              width: "match_parent",
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <TextWidget
              text={g.title}
              maxLines={1}
              truncate="END"
              style={{ fontSize: 14, fontWeight: "600", color: c.text }}
            />
            <TextWidget
              text={g.total ? `${g.done} of ${g.total}` : "No steps"}
              style={{ fontSize: 13, color: c.textMuted }}
            />
          </FlexWidget>
          {g.current ? (
            // Tapping the current step ticks it off.
            <FlexWidget
              clickAction={COMPLETE_STEP}
              clickActionData={{ id: g.current.id }}
              style={{
                width: "match_parent",
                flexDirection: "row",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <FlexWidget
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: c.primary,
                  marginRight: 8,
                }}
              />
              <TextWidget
                text={g.current.title}
                maxLines={1}
                truncate="END"
                style={{ fontSize: 13, color: c.text }}
              />
            </FlexWidget>
          ) : (
            g.total > 0 && (
              <TextWidget
                text="All steps done"
                style={{ fontSize: 13, color: c.textMuted, marginTop: 4 }}
              />
            )
          )}
          {g.next && (
            <TextWidget
              text={`Next: ${g.next}`}
              maxLines={1}
              truncate="END"
              style={{
                fontSize: 12,
                color: c.textMuted,
                marginTop: 2,
                marginLeft: 24,
              }}
            />
          )}
        </FlexWidget>
      ))}
      {goals.length > MAX_GOALS && (
        <Empty c={c} text={`+${goals.length - MAX_GOALS} more`} />
      )}
    </Shell>
  ),
};

/** Draws one widget from the current data, in both system themes. */
export async function renderWidget(
  info: Pick<WidgetInfo, "widgetName" | "widgetId">,
): Promise<WidgetRepresentation> {
  let data: WidgetData = { habits: [], streak: 0, goals: [] };
  try {
    data = await loadData(await loadWidgetItems(info.widgetId));
  } catch (error) {
    if (__DEV__) console.warn("[Widgets]", error);
  }
  const render = RENDERERS[info.widgetName as WidgetName];
  return {
    light: render(Colors.light as Palette, data),
    dark: render(Colors.dark as Palette, data),
  };
}

let refreshQueued = false;

/**
 * Redraws every widget on the home screen. Call after the data changes. A
 * burst of calls (one tap updates the store twice) redraws them once.
 */
export function refreshWidgets() {
  if (Platform.OS !== "android" || refreshQueued) return;
  refreshQueued = true;
  setTimeout(redrawWidgets, 500);
}

/** Redraws every widget now, for code that may not live long enough to wait. */
export function redrawWidgets() {
  refreshQueued = false;
  for (const { name } of WIDGETS) {
    requestWidgetUpdate({
      widgetName: name,
      renderWidget: (info) => renderWidget(info),
    }).catch((error) => {
      if (__DEV__) console.warn("[Widgets]", error);
    });
  }
}
