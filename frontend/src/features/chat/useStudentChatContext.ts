import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { readLocalCache } from "../../services/api";
import { StudentChatContext } from "./types";

export function useStudentChatContext() {
  const [studentContext, setStudentContext] = useState<StudentChatContext | undefined>(undefined);

  useEffect(() => {
    async function loadStudentContext() {
      try {
        const userStr = await AsyncStorage.getItem("@auth_user");
        let mssv = "";
        let name = "Sinh viên";
        if (userStr) {
          const u = JSON.parse(userStr);
          mssv = u.mssv || u.masv || "";
          name = u.ho_ten || u.fullName || "Sinh viên";
        }

        const isRealAccount = Boolean(mssv && mssv !== "guest");
        let todayClasses: any[] = [];
        let gpaSummary: any = undefined;
        let recentGrades: any[] = [];

        if (isRealAccount) {
          const scheduleCache = await readLocalCache<any>(`@offline_schedule_${mssv}`);
          if (scheduleCache?.data?.schedules && Array.isArray(scheduleCache.data.schedules)) {
            const todayDayNum = new Date().getDay() + 1;
            todayClasses = scheduleCache.data.schedules.filter((s: any) => s.dayNum === todayDayNum);
          }

          const gradesCache = await readLocalCache<any>(`@offline_grades_${mssv}`);
          if (gradesCache?.data) {
            if (gradesCache.data.summary) {
              gpaSummary = {
                gpa10: gradesCache.data.summary.gpa10 || "0.00",
                gpa4: gradesCache.data.summary.gpa4 || "0.00",
                totalCredits: gradesCache.data.summary.accumulatedCredits || gradesCache.data.summary.totalCredits || 0,
                rank: gradesCache.data.summary.academicRank?.label || "Khá",
              };
            }
            if (Array.isArray(gradesCache.data.data)) {
              recentGrades = gradesCache.data.data.slice(0, 10);
            }
          }
        }

        setStudentContext({
          mssv: isRealAccount ? mssv : undefined,
          name,
          todaySchedule: todayClasses,
          hasCheckedSchedule: isRealAccount,
          gpaSummary,
          recentGrades,
        });
      } catch (err) {
        console.warn("Lỗi chuẩn bị ngữ cảnh RAG:", err);
      }
    }

    loadStudentContext();
  }, []);

  return studentContext;
}
