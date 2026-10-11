export const getTodayDayNum = (): number => {
  const jsDay = new Date().getDay();
  return jsDay === 0 ? 1 : jsDay + 1; // 1: CN, 2: T2, 3: T3, 4: T4...
};

export function parseWeekRangeDates(rangeText: string) {
  if (!rangeText) return { startDate: null, endDate: null };
  const match = rangeText.match(/Từ ngày\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\s+đến ngày\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  if (!match) return { startDate: null, endDate: null };
  const [, sD, sM, sY, eD, eM, eY] = match;
  const startDate = new Date(Number(sY), Number(sM) - 1, Number(sD), 0, 0, 0);
  const endDate = new Date(Number(eY), Number(eM) - 1, Number(eD), 23, 59, 59, 999);
  return { startDate, endDate };
}

export function formatDateVN(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function formatDateShort(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

export function parseDateVN(str: string): Date | null {
  if (!str) return null;
  const s = str.trim();
  const m1 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m1) {
    return new Date(Number(m1[3]), Number(m1[2]) - 1, Number(m1[1]), 12, 0, 0);
  }
  const m2 = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m2) {
    return new Date(Number(m2[1]), Number(m2[2]) - 1, Number(m2[3]), 12, 0, 0);
  }
  return null;
}

export function getDayNumFromDate(d: Date): number {
  const jsDay = d.getDay();
  return jsDay === 0 ? 1 : jsDay + 1; // 1: CN, 2: T2, 3: T3, ... 7: T7
}

export function getDayLabelFromDate(d: Date): string {
  const num = getDayNumFromDate(d);
  return num === 1 ? "Chủ nhật" : `Thứ ${num}`;
}

export function getWeekRangeFromDate(d: Date): string {
  const jsDay = d.getDay();
  const distToMon = (jsDay + 6) % 7;
  const mon = new Date(d);
  mon.setDate(d.getDate() - distToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return `Từ ngày ${formatDateVN(mon)} đến ngày ${formatDateVN(sun)}`;
}

