import { Feather } from "@expo/vector-icons";

export interface ChatAction {
  type: "NONE" | "OPEN_MAP_3D" | "OPEN_SCHEDULE" | "OPEN_TUITION" | "CONTACT_SUPPORT";
  target_id: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  action?: ChatAction;
  suggested_questions?: string[];
  engine?: string;
  timestamp: string;
}

export interface ChatSuggestion {
  id: string;
  text: string;
  icon: string;
}

export interface StudentChatContext {
  mssv?: string;
  name?: string;
  todaySchedule?: {
    time?: string;
    course?: string;
    subject?: string;
    room?: string;
    lecturer?: string;
  }[];
  hasCheckedSchedule?: boolean;
  gpaSummary?: {
    gpa10?: string;
    gpa4?: string;
    totalCredits?: number | string;
    rank?: string;
  };
  recentGrades?: {
    name?: string;
    course?: string;
    grade10?: number;
    total?: number;
    gradeLetter?: string;
    letter?: string;
  }[];
}

export interface ChatbotResponse {
  success: boolean;
  intent?: string;
  reply: string;
  action?: ChatAction;
  suggested_questions?: string[];
  engine?: string;
  error?: string;
}

export interface WelcomeCategory {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  questions: string[];
}
