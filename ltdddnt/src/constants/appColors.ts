export const AppColors = {
  // Theme & Brand (Xanh Trí Tuệ & Indigo Công Nghệ Hiện Đại)
  primary: '#0F2C59',        // Xanh Navy hoàng gia sâu lắng, sang trọng
  primaryLight: '#1E40AF',   // Xanh dương tươi sáng cho Header & Nút
  primaryHover: '#172554',   // Xanh đậm khi tương tác
  accent: '#4F46E5',         // Indigo công nghệ hiện đại làm điểm nhấn CTA
  accentLight: '#818CF8',    // Indigo sáng cho link/icon
  accentSoft: '#EEF2FF',     // Nền mềm màu tím nhạt cho Chip/Badge
  
  // Surfaces & Backgrounds
  background: '#F8FAFC',     // Nền ứng dụng màu Slate 50 sạch tinh khiết, dịu mắt
  cardBg: '#FFFFFF',         // Nền thẻ Card màu trắng tinh khiết
  surface: '#FFFFFF',        // Bề mặt nổi
  muted: '#F1F5F9',          // Nền phụ, phân cách (Slate 100)
  mutedLight: '#F8FAFC',     // Nền phụ siêu nhẹ
  border: '#E2E8F0',         // Viền kẻ mảnh thanh lịch (Slate 200)
  cardBorder: '#EDF2F7',     // Viền thẻ card mềm mại, không gây rối mắt

  // Text Colors (Tương phản cao chuẩn Accessibility)
  textForeground: '#0F172A', // Chữ đậm chính (Slate 900)
  text: '#0F172A',           // Chữ chính
  textSecondary: '#475569',  // Chữ phụ / mô tả (Slate 600)
  textMuted: '#64748B',      // Chữ mờ / chú thích phụ (Slate 500)
  textSubtle: '#94A3B8',     // Chữ rất mờ (Slate 400)
  textLight: '#93C5FD',      // Chữ xanh sáng trên nền tối (Blue 300)
  textWhite: '#FFFFFF',      // Chữ trắng tinh

  // Status & Functional Alerts
  success: '#10B981',        // Xanh ngọc Emerald thành công
  successSoft: '#ECFDF5',    // Nền thông báo thành công
  successBorder: '#A7F3D0',  // Viền thông báo thành công
  
  warning: '#F59E0B',        // Vàng cam hổ phách cảnh báo
  warningSoft: '#FFFBEB',    // Nền cảnh báo
  warningBorder: '#FDE68A',  // Viền cảnh báo
  
  danger: '#EF4444',         // Đỏ Rose khẩn cấp / SOS
  dangerSoft: '#FEF2F2',     // Nền đỏ nhạt
  dangerBorder: '#FECACA',   // Viền đỏ nhạt
  error: '#EF4444',          // Lỗi
  
  info: '#0284C7',           // Xanh lam thông tin
  infoSoft: '#F0F9FF',       // Nền xanh lam nhạt
  infoBorder: '#BAE6FD',     // Viền xanh lam nhạt
  
  purple: '#8B5CF6',         // Tím Violet tiện ích
  purpleSoft: '#F5F3FF',     // Nền tím nhạt

  // Gradients
  primaryGradient: ['#0F2C59', '#1E3E8F', '#2563EB'] as const,
  accentGradient: ['#4F46E5', '#6366F1', '#818CF8'] as const,
  cardGradient: ['#FFFFFF', '#F8FAFC'] as const,
  dangerGradient: ['#DC2626', '#EF4444'] as const,
};

export default AppColors;