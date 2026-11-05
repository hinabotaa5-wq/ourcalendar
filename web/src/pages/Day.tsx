import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { birthdayEventsForRange } from "../../../shared/birthdays.js";
import { LOCALES } from "../../../shared/i18n.js";
import { zonedDateKey } from "../../../shared/time.js";
import { SIMONE_TZ } from "../../../shared/types.js";
import type { CalEvent, Role } from "../../../shared/types.js";
import { api } from "../api.js";
import { useLang } from "../lang.js";
import { EventCard, NewEventForm, visibleEvents } from "./events.js";

export function DayPage({ role }: { role: Role | null }) {
  const { lang, t } = useLang();
  const { date } = useParams();
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(date ?? "");
  const [events, setEvents] = useState<CalEvent[]>([]);

  const load = () => {
    if (!valid) return;
    const base = new Date(`${date}T00:00:00.000Z`).getTime();
    const from = new Date(base - 86400000).toISOString();
    const to = new Date(base + 2 * 86400000).toISOString();
    api
      .events(from, to)
      .then((r) =>
        setEvents(
          visibleEvents([...r.events, ...birthdayEventsForRange(from, to)]).filter(
            (e) => zonedDateKey(e.startsAtUtc, SIMONE_TZ) === date,
          ),
        ),
      )
      .catch(() => {});
  };
  useEffect(load, [date]);

  if (!valid) return <p className="muted">{t("noEventsDay")}</p>;

  const title = new Intl.DateTimeFormat(LOCALES[lang].intl, {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(new Date(`${date}T00:00:00.000Z`));

  return (
    <div>
      <p>
        <Link to="/">← {t("navMonth")}</Link>
      </p>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      {events.map((e) => (
        <EventCard key={e.id} e={e} role={role} onChange={load} />
      ))}
      {events.length === 0 && <p className="muted">{t("noEventsDay")}</p>}
      <NewEventForm initialDate={date!} onDone={load} />
    </div>
  );
}
