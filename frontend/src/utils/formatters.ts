/**
 * Utility Formatting Functions
 */

/**
 * Định dạng ngày theo chuẩn Việt Nam (DD/MM/YYYY)
 */
export const formatDateVN = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Định dạng điểm số hệ 10 và 4
 */
export const formatScore = (score: number | string | null | undefined): string => {
  if (score === null || score === undefined || score === '') return '-';
  const num = Number(score);
  return isNaN(num) ? String(score) : num.toFixed(2);
};

/**
 * Cắt ngắn văn bản nếu quá dài
 */
export const truncateText = (text: string, maxLength: number = 80): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};
