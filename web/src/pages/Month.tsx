import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { birthdayEventsForRange } from "../../../shared/birthdays.js";
import { LOCALES } from "../../../shared/i18n.js";
import { monthGrid, shiftMonth } from "../../../shared/month.js";
import { zonedDateKey } from "../../../shared/time.js";
import { SIMONE_TZ } from "../../../shared/types.js";
import type { CalEvent } from "../../../shared/types.js";
import { api } from "../api.js";
import { useLang } from "../lang.js";
import { visibleEvents } from "./events.js";

const SUNDAY = Date.UTC(2026, 10, 1);

function weekdayNames(locale: string, weekStart: 0 | 1): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: "short" });
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(SUNDAY + (i + weekStart) * 86400000)));
}

function localTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function MonthPage() {
  const { lang, t } = useLang();
  const now = new Date();
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [events, setEvents] = useState<CalEvent[]>([]);
  const weekStart = LOCALES[lang].weekStart;
  const locale = LOCALES[lang].intl;

  const grid = useMemo(() => monthGrid(ym.year, ym.month, weekStart, localTodayKey()), [ym, weekStart]);

  useEffect(() => {
    const from = `${grid[0][0].date}T00:00:00.000Z`;
    const last = grid[5][6].date;
    const to = new Date(new Date(`${last}T00:00:00.000Z`).getTime() + 86400000).toISOString();
    api
      .events(from, to)
      .then((r) => setEvents(visibleEvents([...r.events, ...birthdayEventsForRange(from, to)])))
      .catch(() => {});
  }, [grid]);

  const byDay = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const e of events) {
      const key = zonedDateKey(e.startsAtUtc, SIMONE_TZ);
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(e);
    }
    return m;
  }, [events]);

  const title = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(
    new Date(Date.UTC(ym.year, ym.month - 1, 1)),
  );

  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className="pill-btn ghost" onClick={() => setYm((v) => shiftMonth(v.year, v.month, -1))}>
          ←
        </button>
        <span style={{ alignSelf: "center", fontWeight: 800 }}>{title}</span>
        <button className="pill-btn ghost" onClick={() => setYm((v) => shiftMonth(v.year, v.month, 1))}>
          →
        </button>
        <button
          className="pill-btn accent"
          onClick={() => {
            const d = new Date();
            setYm({ year: d.getFullYear(), month: d.getMonth() + 1 });
          }}
        >
          {t("today")}
        </button>
      </div>
      <div className="mgrid">
        {weekdayNames(locale, weekStart).map((w) => (
          <div key={w} className="mhead">
            {w}
          </div>
        ))}
        {grid.flat().map((c) => {
          const list = byDay.get(c.date) ?? [];
          const cats = [...new Set(list.map((e) => e.category))];
          const birthday = list.some((e) => e.id.startsWith("birthday-"));
          return (
            <Link key={c.date} to={`/day/${c.date}`} className={`mcell${c.inMonth ? "" : " out"}${c.isToday ? " today" : ""}`}>
              <span className="mnum">{Number(c.date.slice(8))}</span>
              <span className="mdots">
                {birthday && <span>🎂</span>}
                {cats.map((cat) => (
                  <span
                    key={cat}
                    className={`mdot ${cat === "Jogging" ? "jog" : cat === "General" ? "gen" : ""}`}
                    title={cat}
                  />
                ))}
              </span>
              {list.slice(0, 2).map((e) => (
                <span key={e.id} className="mtitle">
                  {e.title}
                </span>
              ))}
              {list.length > 2 && <span className="mtitle">+{list.length - 2}</span>}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
