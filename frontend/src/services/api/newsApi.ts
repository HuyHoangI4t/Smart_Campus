import {
  API_BASE_URL,
  fetchWithTimeout,
  handleResponse,
  saveLocalCache,
  readLocalCache,
  getTtlCache,
  setTtlCache,
  deduplicateRequest,
} from './client';

export const CAMPUS_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=80',
];

export function getNewsImageUrl(imageUrl?: string | null, fallbackIndex = 0): string {
  if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
    return CAMPUS_FALLBACK_IMAGES[Math.abs(fallbackIndex) % CAMPUS_FALLBACK_IMAGES.length];
  }

  const trimmed = imageUrl.trim();

  // Nếu đã là link proxy rồi hoặc ảnh unsplash thì giữ nguyên, không bọc proxy thêm lần nữa
  if (trimmed.includes('/image-proxy') || trimmed.includes('unsplash.com')) {
    return trimmed;
  }

  // Nếu là ảnh từ ttn.edu.vn hoặc đường dẫn tương đối từ ttn, điều hướng qua proxy của backend
  if (trimmed.includes('ttn.edu.vn') || trimmed.startsWith('/images/') || !trimmed.startsWith('http')) {
    let rawUrl = trimmed;
    if (!rawUrl.startsWith('http')) {
      rawUrl = `https://www.ttn.edu.vn${rawUrl.startsWith('/') ? '' : '/'}${rawUrl}`;
    }
    return `${API_BASE_URL}/news/image-proxy?url=${encodeURIComponent(rawUrl)}`;
  }

  return trimmed;
}

export interface ArticleContentBlock {
  type: 'text' | 'image';
  text?: string;
  url?: string;
  caption?: string;
}

export interface ArticleDetailResponse {
  url: string;
  images: string[];
  paragraphs: string[];
  contentBlocks?: ArticleContentBlock[];
  attachments?: {
    title: string;
    url: string;
    size?: string;
    isPdf?: boolean;
  }[];
  fullContent: string;
}

export async function apiGetArticleDetail(url: string): Promise<{ success: boolean; data?: ArticleDetailResponse; message?: string; isOfflineCache?: boolean }> {
  try {
    if (!url) return { success: false, message: 'Thiếu url bài viết' };

    const cacheKey = `@offline_article_${encodeURIComponent(url).slice(-70)}`;
    const ttlKey = `article_${url}`;
    const cached = getTtlCache<any>(ttlKey);
    if (cached) return cached;

    return deduplicateRequest(ttlKey, async () => {
      try {
        const response = await fetchWithTimeout(`${API_BASE_URL}/news/article-detail?url=${encodeURIComponent(url)}`, {}, 6000);
        const result = await handleResponse(response);
        if (result && result.success) {
          const payload = { ...result, isOfflineCache: false };
          setTtlCache(ttlKey, payload, 300000); // 5 mins cache for article content
          await saveLocalCache(cacheKey, result);
          return payload;
        }
        const local = await readLocalCache(cacheKey);
        if (local && local.data) return { ...local.data, isOfflineCache: true };
        return result;
      } catch {
        const local = await readLocalCache(cacheKey);
        if (local && local.data) return { ...local.data, isOfflineCache: true };
        return { success: false, message: 'Thiết bị đang ngoại tuyến. Vui lòng kết nối Internet để đọc bài viết này.', isOfflineCache: true };
      }
    });
  } catch (e: any) {
    return { success: false, message: e.message || 'Không thể tải chi tiết bài viết' };
  }
}

export function getAttachmentDownloadUrl(fileUrl: string): string {
  if (!fileUrl) return '';
  if (fileUrl.includes('/download-attachment')) return fileUrl;
  return `${API_BASE_URL}/news/download-attachment?url=${encodeURIComponent(fileUrl)}`;
}

export interface NewsOrAnnouncementItem {
  id: string | number;
  type: 'news' | 'announcement';
  source: string;
  sourceName: string;
  badge: string;
  badgeColor?: string;
  title: string;
  summary?: string;
  content?: string;
  date: string;
  timeAgo?: string;
  link: string;
  imageUrl?: string;
  sender?: string;
  author?: string;
  category?: string;
  attachments?: {
    title: string;
    url: string;
    isPdf?: boolean;
  }[];
  likes?: number;
  comments?: number;
  shares?: number;
  tags?: string[];
  isFallback?: boolean;
}

export async function apiGetNews(type?: 'all' | 'news' | 'announcement', limit?: number, reload = false) {
  const cacheKey = `@offline_news_${type || 'all'}`;
  const ttlKey = `news_${type || 'all'}_${limit || 0}`;

  if (!reload) {
    const memoryHit = getTtlCache<any>(ttlKey);
    if (memoryHit) return memoryHit;
  }

  return deduplicateRequest(ttlKey, async () => {
    try {
      const params = new URLSearchParams();
      if (type && type !== 'all') params.append('type', type);
      if (limit) params.append('limit', String(limit));
      if (reload) params.append('reload', 'true');
      const qs = params.toString() ? `?${params.toString()}` : '';
      const response = await fetchWithTimeout(`${API_BASE_URL}/news${qs}`);
      const result = await handleResponse(response);

      if (result && result.success) {
        const payload = { ...result, isOfflineCache: false };
        setTtlCache(ttlKey, payload, 60000); // 1 min TTL
        await saveLocalCache(cacheKey, result);
        return payload;
      }

      const cached = await readLocalCache(cacheKey);
      if (cached && cached.data) {
        return { ...cached.data, isOfflineCache: true, cachedAt: cached.savedAt };
      }
      return result;
    } catch {
      const cached = await readLocalCache(cacheKey);
      if (cached && cached.data) {
        return { ...cached.data, isOfflineCache: true, cachedAt: cached.savedAt };
      }
      return { success: false, data: [], isOfflineCache: true };
    }
  });
}

