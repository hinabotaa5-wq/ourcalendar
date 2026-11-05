import { useEffect, useMemo, useState } from "react";
import { birthdayEventsForRange } from "../../../shared/birthdays.js";
import { formatInZone } from "../../../shared/time.js";
import { SIMONE_TZ } from "../../../shared/types.js";
import type { CalEvent, Role } from "../../../shared/types.js";
import { api } from "../api.js";
import { useLang } from "../lang.js";
import { EventCard, NewEventForm, visibleEvents } from "./events.js";

function weekRange(offset: number): { from: string; to: string; label: string } {
  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  const monday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - day + offset * 7));
  const sunday = new Date(monday.getTime() + 7 * 86400000);
  const iso = (d: Date) => d.toISOString();
  return { from: iso(monday), to: iso(sunday), label: monday.toISOString().slice(0, 10) };
}

export function CalendarPage({ role }: { role: Role | null }) {
  const { lang, t } = useLang();
  const [offset, setOffset] = useState(0);
  const range = useMemo(() => weekRange(offset), [offset]);
  const [events, setEvents] = useState<CalEvent[]>([]);

  const load = () => {
    api
      .events(range.from, range.to)
      .then((r) => setEvents(visibleEvents([...r.events, ...birthdayEventsForRange(range.from, range.to, lang)])))
      .catch(() => {});
  };
  useEffect(load, [range.from, range.to]);

  const byDay = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const e of events) {
      const key = formatInZone(e.startsAtUtc, SIMONE_TZ).date;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(e);
    }
    return [...m.entries()].sort();
  }, [events]);

  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className="pill-btn ghost" onClick={() => setOffset((o) => o - 1)}>
          {t("prevWeek")}
        </button>
        <span className="muted" style={{ alignSelf: "center" }}>
          {t("weekOf", { date: range.label })}
        </span>
        <button className="pill-btn ghost" onClick={() => setOffset((o) => o + 1)}>
          {t("nextWeek")}
        </button>
      </div>
      <NewEventForm onDone={load} />
      {byDay.map(([day, list]) => (
        <div key={day}>
          <h3>{day}</h3>
          {list.map((e) => (
            <EventCard key={e.id} e={e} role={role} onChange={load} />
          ))}
        </div>
      ))}
      {events.length === 0 && <p className="muted">{t("noEventsWeek")}</p>}
    </div>
  );
}
