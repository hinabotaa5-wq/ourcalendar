import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { HINATA_TZ, SIMONE_TZ } from "../../shared/types.js";
import { api } from "./api.js";
import type { Role } from "../../shared/types.js";
import { GameProvider, useGame } from "./game.js";
import { LangProvider, useLang } from "./lang.js";
import { CalendarPage } from "./pages/Calendar.js";
import { DayPage } from "./pages/Day.js";
import { InvitePage } from "./pages/Invite.js";
import { MonthPage } from "./pages/Month.js";
import { SettingsPage } from "./pages/Settings.js";
import { WeightPage } from "./pages/Weight.js";
import { ChestSprite, SunflowerSprite } from "./sprites.js";
import "./styles.css";

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 10000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function clock(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(date);
}

function questTextKey(kind: string): "qClearAll" | "qJogOnce" | "qDoneCount" | "qWeekdayOnce" {
  if (kind === "jog_once") return "qJogOnce";
  if (kind === "done_count") return "qDoneCount";
  if (kind === "weekday_once") return "qWeekdayOnce";
  return "qClearAll";
}

function QuestWindow() {
  const { t } = useLang();
  const { game } = useGame();
  if (!game?.quest) {
    return (
      <div className="card rpg quest">
        <p className="muted" style={{ margin: 0 }}>
          {t("questTitle")}: {t("noQuest")}
        </p>
      </div>
    );
  }
  const q = game.quest;
  const minis =
    q.kind === "clear_all"
      ? q.progress.perEvent
      : Array.from({ length: q.progress.target }, (_, i) => ({
          id: `slot-${i}`,
          state: (i < q.progress.done ? "flower" : "sprout") as "flower" | "sprout",
        }));
  return (
    <div className="card rpg quest">
      <div className="quest-row">
        <ChestSprite open={q.progress.achieved} />
        <div>
          <strong>{t("questTitle")}</strong>
          <p style={{ margin: "4px 0" }}>{t(questTextKey(q.kind), { n: q.progress.target })}</p>
          <div className="qminis">
            {minis.map((m) => (
              <span
                key={m.id}
                className={`qmini ${m.state === "flower" ? "flower" : m.state === "zzz" ? "zzz" : ""}`}
                title={m.state}
              >
                {m.state === "flower" ? "✿" : m.state === "zzz" ? "z" : ""}
              </span>
            ))}
          </div>
          {q.progress.achieved && (
            <p style={{ margin: "4px 0 0" }}>
              <strong>
                {t("questComplete")} {q.bonusAwarded ? t("questBonus") : ""}
              </strong>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function LevelUpVeil() {
  const { t } = useLang();
  const { leveledUp, dismissLevelUp } = useGame();
  if (!leveledUp) return null;
  return (
    <div className="lvup-veil" onClick={dismissLevelUp}>
      <div className="rpg lvup-box">
        <SunflowerSprite />
        <h2 style={{ margin: 0 }}>{t("levelUpTitle")}</h2>
        <button className="gbtn accent" onClick={dismissLevelUp}>
          OK
        </button>
      </div>
    </div>
  );
}

function Shell() {
  const { t, lang } = useLang();
  const { game, refresh } = useGame();
  const [role, setRole] = useState<Role | null | undefined>(undefined);
  const now = useNow();
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => {
    document.documentElement.dataset.lang = lang;
  }, [lang]);

  useEffect(() => {
    api
      .me()
      .then((m) => setRole(m.role))
      .catch(() => setRole(null));
    refresh();
  }, [loc.pathname, refresh]);

  useEffect(() => {
    if (role === null && !loc.pathname.startsWith("/invite")) nav("/invite/sample");
  }, [role, loc.pathname, nav]);

  const lvl = game?.level;
  const segs = 10;
  const span = lvl ? lvl.nextAt - lvl.baseXp : 1;
  const filled = lvl ? Math.round(((lvl.nextAt - lvl.remaining - lvl.baseXp) / (span || 1)) * segs) : 0;

  return (
    <div className="app">
      <header className="header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <h1>ourcalendar</h1>
          <div className="clocks">
            <span className="clock-badge">
              {t("timeLabelHinata")} {clock(now, HINATA_TZ)}
            </span>
            <span className="clock-badge">
              {t("timeLabelSimone")} {clock(now, SIMONE_TZ)}
            </span>
          </div>
        </div>
        {role && (
          <div style={{ marginTop: 8 }}>
            <span className="clock-badge">{t("loggedInAs", { name: role === "hinata" ? "Hinata" : "Simone" })}</span>
          </div>
        )}
        {lvl && (
          <div style={{ marginTop: 10 }}>
            <div className="xpline">
              <strong>
                XP {game?.totalXp ?? 0} · {t("levelName")} {lvl.level}
              </strong>
              <span>{t("xpToNext", { n: lvl.remaining })}</span>
            </div>
            <div className="xpbar">
              {Array.from({ length: segs }, (_, i) => (
                <span key={i} className={`seg${i < filled ? " full" : ""}`} />
              ))}
            </div>
          </div>
        )}
      </header>
      {role && <QuestWindow />}
      {role && (
        <nav className="nav">
          <Link to="/" className={loc.pathname === "/" ? "active" : ""}>
            {t("navMonth")}
          </Link>
          <Link to="/week" className={loc.pathname === "/week" ? "active" : ""}>
            {t("navWeek")}
          </Link>
          <Link to="/weight" className={loc.pathname === "/weight" ? "active" : ""}>
            {t("navWeight")}
          </Link>
          <Link to="/settings" className={loc.pathname === "/settings" ? "active" : ""}>
            {t("navSettings")}
          </Link>
        </nav>
      )}
      <Routes>
        <Route path="/" element={<MonthPage />} />
        <Route path="/week" element={<CalendarPage role={role ?? null} />} />
        <Route path="/day/:date" element={<DayPage role={role ?? null} />} />
        <Route path="/weight" element={<WeightPage role={role ?? null} />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/invite/:token" element={<InvitePage onDone={(r) => setRole(r)} />} />
      </Routes>
      <LevelUpVeil />
    </div>
  );
}

export function App() {
  return (
    <LangProvider>
      <GameProvider>
        <Shell />
      </GameProvider>
    </LangProvider>
  );
}
