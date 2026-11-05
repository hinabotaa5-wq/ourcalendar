import type { CalEvent } from "./types.js";

export interface Birthday {
  month: number;
  day: number;
  title: string;
}

export const BIRTHDAYS: Birthday[] = [
  { month: 5, day: 6, title: "Hinata's birthday" },
  { month: 2, day: 11, title: "Simone's birthday" },
];

export const ALL_DAY_MINUTES = 1440;

function birthdayEvent(b: Birthday, year: number): CalEvent {
  const date = `${year}-${String(b.month).padStart(2, "0")}-${String(b.day).padStart(2, "0")}`;
  return {
    id: `birthday-${b.title.split("'")[0].toLowerCase()}-${year}`,
    title: b.title,
    category: "General",
    startsAtUtc: `${date}T00:00:00.000Z`,
    durationMin: ALL_DAY_MINUTES,
    notes: "",
    videoUrl: "",
    status: "scheduled",
    movedToUtc: null,
    createdBy: "hinata",
    updatedAtUtc: `${date}T00:00:00.000Z`,
  };
}

/** Yearly birthdays whose date falls in [fromIso, toIso). Pure; no DB writes. */
export function birthdayEventsForRange(fromIso: string, toIso: string): CalEvent[] {
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  const years = new Set([new Date(fromIso).getUTCFullYear(), new Date(toIso).getUTCFullYear()]);
  const out: CalEvent[] = [];
  for (const year of years) {
    for (const b of BIRTHDAYS) {
      const e = birthdayEvent(b, year);
      const t = new Date(e.startsAtUtc).getTime();
      if (t >= from && t < to) out.push(e);
    }
  }
  return out.sort((a, b) => (a.startsAtUtc < b.startsAtUtc ? -1 : 1));
}
