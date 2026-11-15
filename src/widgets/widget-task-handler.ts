import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { renderWidget, WidgetName, WIDGETS } from "./widgets";

/** Android calls this, with the app open or closed, when a widget needs drawing. */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const name = props.widgetInfo.widgetName as WidgetName;
  if (!WIDGETS.some((w) => w.name === name)) return;

  // WIDGET_UPDATE fires every 30 minutes, which also rolls "today" over.
  if (
    props.widgetAction === "WIDGET_ADDED" ||
    props.widgetAction === "WIDGET_UPDATE" ||
    props.widgetAction === "WIDGET_RESIZED"
  ) {
    props.renderWidget(await renderWidget(name));
  }
}
