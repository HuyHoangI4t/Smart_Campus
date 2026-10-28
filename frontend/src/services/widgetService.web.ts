import AsyncStorage from "@react-native-async-storage/async-storage";

const GRADES_WIDGET_KEY = "@widget_grades_data";
const SCHEDULE_WIDGET_KEY = "@widget_schedule_data";

export async function saveGradesForWidget(
  gpaSummary: any,
  studentInfo?: { name?: string; mssv?: string }
) {
  try {
    const payload = {
      gpa4: gpaSummary?.gpa4 || "3.52",
      gpa10: gpaSummary?.gpa10 || "8.20",
      totalCredits: gpaSummary?.totalCredits || 72,
      rank: gpaSummary?.rank || "Giỏi",
      rankColor: gpaSummary?.rankColor || "#10B981",
      studentName: studentInfo?.name || "Sinh viên",
      mssv: studentInfo?.mssv || "",
    };
    await AsyncStorage.setItem(GRADES_WIDGET_KEY, JSON.stringify(payload));
  } catch {}
}

export async function saveScheduleForWidget(todayClasses: any[] = []) {
  try {
    await AsyncStorage.setItem(SCHEDULE_WIDGET_KEY, JSON.stringify(todayClasses));
  } catch {}
}

export async function syncAllWidgets() {}
