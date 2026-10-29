// Tự động đăng ký Widget Task Handler an toàn cho Android Native (Không gây lỗi trên Expo Go)
import Constants, { ExecutionEnvironment } from "expo-constants";

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (!isExpoGo) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { registerWidgetTaskHandler } = require("react-native-android-widget");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { widgetTaskHandler } = require("./widgetTaskHandler");
    if (typeof registerWidgetTaskHandler === "function") {
      registerWidgetTaskHandler(widgetTaskHandler);
      console.log("⚡ [Widget] Đã đăng ký registerWidgetTaskHandler thành công!");
    }
  } catch (err) {
    console.warn("Lỗi đăng ký Widget Task Handler:", err);
  }
}
