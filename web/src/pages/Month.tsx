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
import { CakeSprite, FlowerSprite, HinataSprite, RunnerSprite, SimoneSprite, SproutSprite, StarSprite, ZzzSprite } from "../sprites.js";
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
      .then((r) => setEvents(visibleEvents([...r.events, ...birthdayEventsForRange(from, to, lang)])))
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
      <div className="monthbar">
        <button className="navbtn chevbtn" onClick={() => setYm((v) => shiftMonth(v.year, v.month, -1))}>
          ‹
        </button>
        <div className="mname pix">{title}</div>
        <button className="navbtn chevbtn" onClick={() => setYm((v) => shiftMonth(v.year, v.month, 1))}>
          ›
        </button>
        <button
          className="navbtn todaybtn"
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
        {grid.flat().map((c, i) => {
          const list = byDay.get(c.date) ?? [];
          const birthday = list.some((e) => e.id.startsWith("birthday-"));
          const allDone = list.length > 0 && list.every((e) => e.status === "done" || e.status === "rested");
          const hasJogging = list.some((e) => e.category === "Jogging");
          const hasRested = list.some((e) => e.status === "rested");
          const hasOpen = list.some((e) => e.status === "scheduled");
          return (
            <Link
              key={c.date}
              to={`/day/${c.date}`}
              className={`mcell grass-${i % 2 === Math.floor(i / 7) % 2 ? "a" : "b"}${c.inMonth ? "" : " out"}${c.isToday ? " today" : ""}`}
            >
              <span className="dnum">{Number(c.date.slice(8))}</span>
              {c.isToday && (
                <span className="mchars">
                  <HinataSprite scale={3} />
                  <SimoneSprite scale={3} />
                </span>
              )}
              <span className="spr">
                {birthday && <CakeSprite w={30} />}
                {allDone && (
                  <>
                    <FlowerSprite scale={3} />
                    <StarSprite scale={2} />
                  </>
                )}
                {!allDone && hasJogging && <RunnerSprite scale={3} />}
                {!allDone && hasRested && <ZzzSprite scale={2} />}
                {!allDone && hasOpen && !hasJogging && <SproutSprite scale={3} />}
              </span>
              {list.length > 2 && <span className="mtitle">+{list.length - 2}</span>}
            </Link>
          );
        })}
      </div>
      <div className="legend">
        <span className="litem">
          <SproutSprite scale={2} />
          {t("legendPlanned")}
        </span>
        <span className="litem">
          <RunnerSprite scale={2} />
          {t("legendJogging")}
        </span>
        <span className="litem">
          <FlowerSprite scale={2} />
          <StarSprite scale={1} />
          {t("legendAllDone")}
        </span>
        <span className="litem">
          <ZzzSprite scale={1} />
          {t("legendRest")}
        </span>
      </div>
    </div>
  );
}
