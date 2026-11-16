// Entry file: the app itself, plus the handler Android uses to draw home-screen
// widgets while the app is closed.
import "expo-router/entry";

import {
  registerWidgetConfigurationScreen,
  registerWidgetTaskHandler,
} from "react-native-android-widget";
import { WidgetConfigScreen } from "./src/widgets/widget-config-screen";
import { widgetTaskHandler } from "./src/widgets/widget-task-handler";

registerWidgetTaskHandler(widgetTaskHandler);
registerWidgetConfigurationScreen(WidgetConfigScreen);
