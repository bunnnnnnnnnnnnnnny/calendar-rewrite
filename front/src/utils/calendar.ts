import { DayInfo } from '../types/calendar';

const ROWS = 5;
const COLS = 7;
export const CELLS = ROWS * COLS;

/**
 * @param month `0-11`
 * @param year `YYYY`
 */
export function daysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * @param month `0-11`
 * @param year `YYYY`
 */
export function calculateGrid(month: number, year: number): DayInfo[] {
  const days: DayInfo[] = [];

  const firstDayOfMonth = new Date(year, month, 1);
  const totalDays = daysInMonth(month, year);

  // previous month
  for (let i = firstDayOfMonth.getDay() - 1; i >= 0; i--) {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthDays = daysInMonth(prevMonth, prevYear);
    days.push({ day: prevMonthDays - i, isCurrent: false });
  }

  // current month
  for (let i = 1; i <= totalDays; i++) {
    days.push({ day: i, isCurrent: true });
  }

  // next month
  const start = days.length;
  for (let i = days.length; i < CELLS; i++) {
    days.push({ day: i - start + 1, isCurrent: false });
  }

  return days;
}

export function apiUrl(path: string): URL {
  const baseUrl = import.meta.env.VITE_API_URL;

  if (baseUrl == null) {
    throw new Error('VITE_API_URL is not defined');
  }

  return new URL(path, baseUrl);
}
