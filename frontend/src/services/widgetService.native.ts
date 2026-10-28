import React from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { GradesWidget, GradesWidgetData } from "../widgets/GradesWidget";
import { ScheduleWidget, ScheduleWidgetData } from "../widgets/ScheduleWidget";
import { SosWidget } from "../widgets/SosWidget";

const GRADES_WIDGET_KEY = "@widget_grades_data";
const SCHEDULE_WIDGET_KEY = "@widget_schedule_data";

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let requestWidgetUpdate: any = null;
if (!isExpoGo) {
  try {
    const pkg = require("react-native-android-widget");
    requestWidgetUpdate = pkg.requestWidgetUpdate;
  } catch (err) {
    console.warn("react-native-android-widget not loaded:", err);
  }
}

/**
 * Lưu dữ liệu điểm và cập nhật Widget Điểm Số & Tín Chỉ
 */
export async function saveGradesForWidget(
  gpaSummary: {
    gpa4?: string;
    gpa10?: string;
    totalCredits?: number;
    rank?: string;
    rankColor?: string;
  } | null,
  studentInfo?: { name?: string; mssv?: string }
) {
  try {
    const payload: GradesWidgetData = {
      gpa4: gpaSummary?.gpa4 || "3.52",
      gpa10: gpaSummary?.gpa10 || "8.20",
      totalCredits: gpaSummary?.totalCredits || 72,
      rank: gpaSummary?.rank || "Giỏi",
      rankColor: gpaSummary?.rankColor || "#10B981",
      studentName: studentInfo?.name || "Sinh viên",
      mssv: studentInfo?.mssv || "",
    };

    await AsyncStorage.setItem(GRADES_WIDGET_KEY, JSON.stringify(payload));

    // Yêu cầu Android cập nhật giao diện widget ngay lập tức (chỉ chạy khi đã build APK)
    if (requestWidgetUpdate) {
      await requestWidgetUpdate({
        widgetName: "GradesWidget",
        renderWidget: () => React.createElement(GradesWidget, { data: payload }),
      });
    }
  } catch (err) {
    console.warn("Lỗi cập nhật GradesWidget:", err);
  }
}

/**
 * Lưu dữ liệu thời khóa biểu và cập nhật Widget Lịch Học Hôm Nay
 */
export async function saveScheduleForWidget(
  todayClasses: any[] = []
) {
  try {
    const now = new Date();
    const dayNames = ["CHỦ NHẬT", "THỨ HAI", "THỨ BA", "THỨ TƯ", "THỨ NĂM", "THỨ SÁU", "THỨ BẢY"];
    const dateStr = `${dayNames[now.getDay()]} • ${now.getDate()}/${now.getMonth() + 1}`;

    let payload: ScheduleWidgetData;

    if (Array.isArray(todayClasses) && todayClasses.length > 0) {
      const first = todayClasses[0];
      payload = {
        hasClasses: true,
        subjectName: first.ten_hoc_phan || first.ten_hp || first.subject || "Học phần chưa đặt tên",
        courseName: first.ten_hoc_phan || first.ten_hp || first.subject || "Học phần chưa đặt tên",
        room: first.phong || first.room || "Phòng học",
        periodText: first.tiet ? `Tiết ${first.tiet}` : "Theo TKB",
        lecturer: first.giang_vien || first.lecturer || "",
        dateStr,
        remainingCount: todayClasses.length - 1,
      };
    } else {
      payload = {
        hasClasses: false,
        dateStr,
      };
    }

    await AsyncStorage.setItem(SCHEDULE_WIDGET_KEY, JSON.stringify(payload));

    if (requestWidgetUpdate) {
      await requestWidgetUpdate({
        widgetName: "ScheduleWidget",
        renderWidget: () => React.createElement(ScheduleWidget, { data: payload }),
      });
    }
  } catch (err) {
    console.warn("Lỗi cập nhật ScheduleWidget:", err);
  }
}

/**
 * Đồng bộ tất cả widget màn hình chính cùng lúc
 */
export async function syncAllWidgets() {
  if (!requestWidgetUpdate) return;
  try {
    // 1. Grades Widget
    const rawGrades = await AsyncStorage.getItem(GRADES_WIDGET_KEY);
    const gradesData: GradesWidgetData | null = rawGrades ? JSON.parse(rawGrades) : null;
    await requestWidgetUpdate({
      widgetName: "GradesWidget",
      renderWidget: () => React.createElement(GradesWidget, { data: gradesData }),
    });

    // 2. Schedule Widget
    const rawSched = await AsyncStorage.getItem(SCHEDULE_WIDGET_KEY);
    const schedData: ScheduleWidgetData | null = rawSched ? JSON.parse(rawSched) : null;
    await requestWidgetUpdate({
      widgetName: "ScheduleWidget",
      renderWidget: () => React.createElement(ScheduleWidget, { data: schedData }),
    });

    // 3. SOS Widget
    await requestWidgetUpdate({
      widgetName: "SosWidget",
      renderWidget: () => React.createElement(SosWidget, null),
    });
  } catch (err) {
    console.warn("Lỗi đồng bộ syncAllWidgets:", err);
  }
}
