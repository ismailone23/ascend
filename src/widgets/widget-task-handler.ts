import { initializeDatabase } from "@/db/schema";
import { nextProgress } from "@/lib/habit-utils";
import { goalRepository } from "@/repositories/goal.repository";
import { habitRepository } from "@/repositories/habit.repository";
import { logRepository } from "@/repositories/log.repository";
import dayjs from "dayjs";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import {
  COMPLETE_STEP,
  forgetWidget,
  LOG_HABIT,
  redrawWidgets,
  renderWidget,
  WidgetName,
  WIDGETS,
} from "./widgets";

/** Logs one more of a habit for today, the same way its card in the app does. */
async function logHabit(id: string) {
  const habit = (await habitRepository.getAll()).find((h) => h.id === id);
  if (!habit) return;
  const today = dayjs().format("YYYY-MM-DD");
  const log = (await logRepository.getLogsForDate(today)).find(
    (l) => l.habit_id === id,
  );
  const next = nextProgress(
    log?.progress ?? 0,
    log?.completed === 1,
    habit.dailyGoal,
  );
  if (next.progress <= 0) await logRepository.deleteHabitLog(id, today);
  else
    await logRepository.saveProgress(
      id,
      today,
      next.progress,
      next.isCompleted,
    );
}

/** Android calls this, with the app open or closed, when a widget needs drawing. */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const name = props.widgetInfo.widgetName as WidgetName;
  if (!WIDGETS.some((w) => w.name === name)) return;

  if (props.widgetAction === "WIDGET_CLICK") {
    const id = props.clickActionData?.id;
    if (typeof id !== "string") return;
    try {
      await initializeDatabase();
      if (props.clickAction === LOG_HABIT) await logHabit(id);
      else if (props.clickAction === COMPLETE_STEP)
        await goalRepository.setStepDone(id, true);
      else return;
    } catch (error) {
      if (__DEV__) console.warn("[Widgets]", error);
    }
    props.renderWidget(await renderWidget(props.widgetInfo));
    redrawWidgets(); // progress and streak widgets change too
    return;
  }

  if (props.widgetAction === "WIDGET_DELETED") {
    await forgetWidget(props.widgetInfo.widgetId).catch(() => {});
    return;
  }

  // WIDGET_UPDATE fires every 30 minutes, which also rolls "today" over.
  if (
    props.widgetAction === "WIDGET_ADDED" ||
    props.widgetAction === "WIDGET_UPDATE" ||
    props.widgetAction === "WIDGET_RESIZED"
  ) {
    props.renderWidget(await renderWidget(props.widgetInfo));
  }
}
