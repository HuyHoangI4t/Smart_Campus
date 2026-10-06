/**
 * API Configuration Constants
 */

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;
export const API_TIMEOUT = 15000;

export const ENDPOINTS = {
  // Auth
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_VERIFY_OTP: '/auth/verify-registration-otp',
  AUTH_FORGOT_PASSWORD: '/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/auth/reset-password',

  // Student
  STUDENT_GRADES: '/student/grades',
  STUDENT_SCHEDULE: '/student/schedule',
  SYNC_TTN: '/student/sync-ttn',

  // News & Notifications
  NEWS_TTN: '/news/ttn',
  NOTIFICATIONS: '/campus/notifications',

  // Campus
  LOCATIONS: '/campus/locations',
  FEEDBACK: '/campus/feedback',
  SOS: '/campus/sos-alert',
};
