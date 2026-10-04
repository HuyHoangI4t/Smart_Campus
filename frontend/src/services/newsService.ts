import { apiClient } from './apiClient';
import { NewsItem, NotificationItem } from '../types/news.types';

export const newsService = {
  async getNews(): Promise<NewsItem[]> {
    const res = await apiClient.get<any>('/news/ttn');
    return res.data || res || [];
  },

  async getNotifications(): Promise<NotificationItem[]> {
    const res = await apiClient.get<any>('/campus/notifications');
    return res.data || res || [];
  }
};
