export interface MonthCell {
  date: string;
  inMonth: boolean;
  isToday: boolean;
}

function toKey(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Weeks of a month grid. weekStart 0 = Sunday, 1 = Monday. Always 6 rows. */
export function monthGrid(year: number, month: number, weekStart: 0 | 1, todayKey?: string): MonthCell[][] {
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const lead = (firstWeekday - weekStart + 7) % 7;
  const start = new Date(Date.UTC(year, month - 1, 1 - lead));
  const weeks: MonthCell[][] = [];
  for (let w = 0; w < 6; w++) {
    const row: MonthCell[] = [];
    for (let d = 0; d < 7; d++) {
      const t = new Date(start.getTime() + (w * 7 + d) * 86400000);
      const date = toKey(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
      row.push({
        date,
        inMonth: t.getUTCFullYear() === year && t.getUTCMonth() + 1 === month,
        isToday: date === todayKey,
      });
    }
    weeks.push(row);
  }
  return weeks;
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const t = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1 };
}
