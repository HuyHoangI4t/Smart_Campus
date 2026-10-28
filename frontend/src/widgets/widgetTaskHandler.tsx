import React from "react";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GradesWidget, GradesWidgetData } from "./GradesWidget";
import { ScheduleWidget, ScheduleWidgetData } from "./ScheduleWidget";
import { SosWidget } from "./SosWidget";

/**
 * Headless Task Handler phục vụ hiển thị & cập nhật Widget Android ngay cả khi App đang tắt
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const { widgetInfo, renderWidget } = props;

  switch (widgetInfo.widgetName) {
    case "GradesWidget": {
      try {
        const raw = await AsyncStorage.getItem("@widget_grades_data");
        const data: GradesWidgetData | null = raw ? JSON.parse(raw) : null;
        renderWidget(<GradesWidget data={data} />);
      } catch {
        renderWidget(<GradesWidget data={null} />);
      }
      break;
    }

    case "ScheduleWidget": {
      try {
        const raw = await AsyncStorage.getItem("@widget_schedule_data");
        const data: ScheduleWidgetData | null = raw ? JSON.parse(raw) : null;
        renderWidget(<ScheduleWidget data={data} />);
      } catch {
        renderWidget(<ScheduleWidget data={null} />);
      }
      break;
    }

    case "SosWidget": {
      renderWidget(<SosWidget />);
      break;
    }

    default:
      break;
  }
}

