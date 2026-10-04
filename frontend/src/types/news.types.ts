/**
 * News and Notification Types
 */

export interface NewsItem {
  id: string | number;
  title: string;
  link: string;
  pubDate: string;
  description: string;
  content?: string;
  author?: string;
  category?: string;
  imageUrl?: string | null;
  guid?: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  content: string;
  type: 'general' | 'academic' | 'urgent' | 'event';
  target_role: string;
  created_at: string;
  read?: boolean;
}
