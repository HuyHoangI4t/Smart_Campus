import { apiClient } from './apiClient';
import { GradeData, ScheduleData } from '../types/student.types';

export const studentService = {
  async getGrades(params?: { mssv?: string; semester?: string; year?: string }): Promise<GradeData> {
    const query = new URLSearchParams();
    if (params?.mssv) query.append('mssv', params.mssv);
    if (params?.semester) query.append('semester', params.semester);
    if (params?.year) query.append('year', params.year);
    
    const qs = query.toString() ? `?${query.toString()}` : '';
    return await apiClient.get<GradeData>(`/student/grades${qs}`);
  },

  async getSchedule(params?: { mssv?: string; week?: number; semester?: string; year?: string }): Promise<ScheduleData> {
    const query = new URLSearchParams();
    if (params?.mssv) query.append('mssv', params.mssv);
    if (params?.week) query.append('week', String(params.week));
    if (params?.semester) query.append('semester', params.semester);
    if (params?.year) query.append('year', params.year);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return await apiClient.get<ScheduleData>(`/student/schedule${qs}`);
  },

  async syncTTN(mssv: string): Promise<any> {
    return await apiClient.post('/student/sync-ttn', { mssv });
  }
};
