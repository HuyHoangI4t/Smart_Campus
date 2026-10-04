/**
 * Student Types (Grades & Schedules)
 */

export interface SubjectGrade {
  stt?: number | string;
  courseCode?: string;
  courseName: string;
  credits: number;
  attendanceScore?: number | string;
  midtermScore?: number | string;
  examScore?: number | string;
  finalScoreNumber?: number | string;
  finalScoreText?: string;
  passed?: boolean;
}

export interface GradeSummary {
  gpa10?: number | string;
  gpa4?: number | string;
  accumulatedCredits?: number | string;
  classification?: string;
}

export interface StudentInfo {
  mssv: string;
  fullName: string;
  className?: string;
  faculty?: string;
  academicYear?: string;
}

export interface GradeData {
  studentInfo?: StudentInfo;
  subjects: SubjectGrade[];
  summary?: GradeSummary;
  source?: 'online' | 'database';
  semester?: string;
  academicYear?: string;
}

export interface ScheduleItem {
  id?: string;
  courseCode?: string;
  courseName: string;
  dayOfWeek: string;
  date?: string;
  periods?: string;
  room?: string;
  lecturer?: string;
  notes?: string;
}

export interface ScheduleData {
  studentInfo?: StudentInfo;
  schedule: ScheduleItem[];
  source?: 'online' | 'database';
  week?: number;
  semester?: string;
  academicYear?: string;
}
