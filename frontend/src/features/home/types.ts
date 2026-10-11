export interface StudentInfo {
  mssv?: string;
  ho_ten?: string;
  fullName?: string;
  email?: string;
  lop?: string;
  khoa?: string;
  avatar?: string;
}

export interface NextClassInfo {
  subject: string;
  room: string;
  time: string;
  lecturer?: string;
  dayText: string;
  status: 'IN_PROGRESS' | 'UPCOMING_TODAY' | 'NEXT_DAY';
  statusLabel: string;
  statusBadgeColor: string;
}

export interface GpaSummary {
  gpa4: string;
  gpa10: string;
  totalCredits: number;
  rank: string;
  rankColor: string;
}

export interface NotificationAlertItem {
  id: string;
  type: "feedback" | "sos" | "school_notice";
  variant: "success" | "warning" | "info";
  icon: "check" | "alert-triangle" | "info";
  title: string;
  subtitle?: string;
  date: string;
  status: string;
  content: string;
  sender?: string;
  actionScreen?: string;
}

