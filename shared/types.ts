export const HINATA_TZ = "Asia/Tokyo";
export const SIMONE_TZ = "Europe/Berlin";

export const HINATA_LABEL = "Hinata's time";
export const SIMONE_LABEL = "Simone's time";

export type Role = "hinata" | "simone";

export type EventCategory = "Workout" | "Jogging" | "General";
export type EventStatus = "scheduled" | "done" | "rested" | "moved";

export type Lang = "en" | "ja" | "pl";
export const LANGS: Lang[] = ["en", "ja", "pl"];

export function isLang(v: unknown): v is Lang {
  return v === "en" || v === "ja" || v === "pl";
}

export interface CalEvent {
  id: string;
  title: string;
  category: EventCategory;
  startsAtUtc: string;
  durationMin: number;
  notes: string;
  videoUrl: string;
  status: EventStatus;
  movedToUtc: string | null;
  createdBy: Role;
  updatedAtUtc: string;
}

export interface WeightEntry {
  id: string;
  recordedAtUtc: string;
  valueKg: number;
}

export function roleLabel(role: Role): string {
  return role === "hinata" ? "Hinata" : "Simone";
}
