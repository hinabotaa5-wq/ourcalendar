import { HINATA_LABEL, HINATA_TZ, SIMONE_LABEL, SIMONE_TZ, type Role } from "./types.js";

export const TIME_ZONES: Record<Role, string> = {
  hinata: HINATA_TZ,
  simone: SIMONE_TZ,
};

export const TIME_LABELS: Record<Role, string> = {
  hinata: HINATA_LABEL,
  simone: SIMONE_LABEL,
};

function partsInZone(date: Date, timeZone: string): { y: number; m: number; d: number; hh: number; mm: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? "0");
  return { y: get("year"), m: get("month"), d: get("day"), hh: get("hour"), mm: get("minute") };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function formatInZone(isoUtc: string, timeZone: string): { date: string; time: string } {
  const d = new Date(isoUtc);
  const p = partsInZone(d, timeZone);
  return { date: `${p.y}-${pad(p.m)}-${pad(p.d)}`, time: `${pad(p.hh)}:${pad(p.mm)}` };
}

export interface DualTime {
  mine: { date: string; time: string; label: string };
  theirs: { date: string; time: string; label: string };
  dayOffsetNote: string | null;
}

export function dayDiff(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00Z`).getTime();
  const db = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((da - db) / 86400000);
}

export function formatDayOffset(days: number): string | null {
  if (days === 0) return null;
  return days > 0 ? `+${days} day${days === 1 ? "" : "s"}` : `${days} day${days === -1 ? "" : "s"}`;
}

export function dualTime(isoUtc: string, viewer: Role): DualTime {
  const partner: Role = viewer === "hinata" ? "simone" : "hinata";
  const mine = formatInZone(isoUtc, TIME_ZONES[viewer]);
  const theirs = formatInZone(isoUtc, TIME_ZONES[partner]);
  const diff = dayDiff(theirs.date, mine.date);
  return {
    mine: { ...mine, label: TIME_LABELS[viewer] },
    theirs: { ...theirs, label: TIME_LABELS[partner] },
    dayOffsetNote: formatDayOffset(diff),
  };
}

export function zonedDateKey(isoUtc: string, timeZone: string): string {
  return formatInZone(isoUtc, timeZone).date;
}

export function zonedDateOf(isoUtc: string, role: Role): string {
  return zonedDateKey(isoUtc, TIME_ZONES[role]);
}

export function isSimoneReminderMinute(nowUtc: Date): boolean {
  const p = partsInZone(nowUtc, SIMONE_TZ);
  return p.hh === 15;
}

export function isSimoneWeightMinute(nowUtc: Date): boolean {
  const p = partsInZone(nowUtc, SIMONE_TZ);
  if (p.hh !== 19) return false;
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: SIMONE_TZ, weekday: "short" }).format(nowUtc);
  return weekday === "Sat";
}
