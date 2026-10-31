import { io, Socket } from 'socket.io-client';
import { getApiBaseUrl } from './get_IPv4';

let socketInstance: Socket | null = null;
const listenersMap: Map<string, Set<(data: any) => void>> = new Map();

/**
 * Lấy URL của Socket.IO Server (Cổng 5000)
 */
export const getSocketServerUrl = (): string => {
  const apiUrl = getApiBaseUrl();
  return apiUrl.replace(/\/api\/?$/, '');
};

/**
 * Khởi tạo hoặc lấy kết nối Socket.IO hiện có
 */
export const initSocket = (): Socket => {
  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.connect();
    return socketInstance;
  }

  const serverUrl = getSocketServerUrl();

  socketInstance = io(serverUrl, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    autoConnect: true,
  });

  socketInstance.on('connect', () => {
  });

  socketInstance.on('disconnect', (reason) => {
  });

  socketInstance.on('connect_error', (error) => {
  });

  // Đăng ký bộ lắng nghe sự kiện trung tâm và điều phối tới listenersMap
  const events = [
    'sos_status_changed',
    'sos_deleted',
    'new_sos',
    'feedback_status_changed',
    'feedback_deleted',
    'new_feedback',
    'notifications_changed',
    'notification_created',
    'notification_updated',
    'notification_deleted',
    'stats_update',
  ];

  events.forEach((eventName) => {
    socketInstance?.on(eventName, (data) => {
      const callbacks = listenersMap.get(eventName);
      if (callbacks) {
        callbacks.forEach((cb) => {
          try {
            cb(data);
          } catch (err) {
            console.error(`Lỗi thực thi callback cho [${eventName}]:`, err);
          }
        });
      }
    });
  });

  return socketInstance;
};

export const isSocketConnected = (): boolean => {
  return Boolean(socketInstance && socketInstance.connected);
};

/**
 * Đăng ký lắng nghe sự kiện từ Socket.IO
 * Trả về hàm hủy đăng ký (unsubscribe)
 */
export const subscribeSocketEvent = (eventName: string, callback: (data: any) => void): (() => void) => {
  initSocket();

  if (!listenersMap.has(eventName)) {
    listenersMap.set(eventName, new Set());
  }
  listenersMap.get(eventName)!.add(callback);

  return () => {
    const set = listenersMap.get(eventName);
    if (set) {
      set.delete(callback);
    }
  };
};

/**
 * Lắng nghe có tín hiệu SOS khẩn cấp mới từ sinh viên khác
 */
export const onNewSos = (callback: (data: any) => void) => {
  return subscribeSocketEvent('new_sos', callback);
};

/**
 * Lắng nghe cập nhật trạng thái SOS từ bảo vệ / ban quản trị
 */
export const onSosStatusChanged = (callback: (data: { id: number; status: string; alert?: any; mssv?: string }) => void) => {
  return subscribeSocketEvent('sos_status_changed', callback);
};

/**
 * Lắng nghe cập nhật trạng thái ý kiến phản hồi
 */
export const onFeedbackStatusChanged = (callback: (data: { id: number; status: string; feedback?: any; mssv?: string }) => void) => {
  return subscribeSocketEvent('feedback_status_changed', callback);
};

/**
 * Lắng nghe có thông báo mới / cập nhật thông báo trường
 */
export const onNotificationsChanged = (callback: (data?: any) => void) => {
  const unsub1 = subscribeSocketEvent('notifications_changed', callback);
  const unsub2 = subscribeSocketEvent('notification_created', callback);
  const unsub3 = subscribeSocketEvent('notification_updated', callback);
  const unsub4 = subscribeSocketEvent('notification_deleted', callback);
  return () => {
    unsub1();
    unsub2();
    unsub3();
    unsub4();
  };
};

/**
 * Ngắt kết nối socket
 */
export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
  listenersMap.clear();
};

// Định danh phiên làm việc độc nhất của thiết bị để tránh tự báo động chính mình
export const DEVICE_CLIENT_ID = 'client_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);

// Bộ nhớ RAM lưu trữ các ID SOS do chính thiết bị này gửi đi
const selfSentSosIds = new Set<string | number>();

export function markSosAsSelfSent(sosId: string | number) {
  if (sosId !== undefined && sosId !== null) {
    selfSentSosIds.add(String(sosId));
  }
}

export function isSelfSentSos(alertData: any): boolean {
  if (!alertData) return false;
  if (alertData.id && selfSentSosIds.has(String(alertData.id))) return true;
  if (alertData.client_id && alertData.client_id === DEVICE_CLIENT_ID) return true;
  return false;
}
