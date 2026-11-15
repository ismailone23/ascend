// Entry file: the app itself, plus the handler Android uses to draw home-screen
// widgets while the app is closed.
import "expo-router/entry";

import { registerWidgetTaskHandler } from "react-native-android-widget";
import { widgetTaskHandler } from "./src/widgets/widget-task-handler";

registerWidgetTaskHandler(widgetTaskHandler);
