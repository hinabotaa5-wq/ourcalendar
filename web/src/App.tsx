import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import { HINATA_TZ, SIMONE_TZ } from "../../shared/types.js";
import { api } from "./api.js";
import type { Role } from "../../shared/types.js";
import { GameProvider, useGame } from "./game.js";
import { LangProvider, useLang } from "./lang.js";
import { CalendarPage } from "./pages/Calendar.js";
import { DayPage } from "./pages/Day.js";
import { InvitePage } from "./pages/Invite.js";
import { PasswordLoginForm } from "./pages/PasswordLoginForm.js";
import { MonthPage } from "./pages/Month.js";
import { SettingsPage } from "./pages/Settings.js";
import { WeightPage } from "./pages/Weight.js";
import { ChestSprite, PixMap, SunflowerSprite } from "./sprites.js";
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

function Mini({ state }: { state: "flower" | "zzz" | "sprout" }) {
  const name = state === "flower" ? "flower" : state === "zzz" ? "zzz" : "sprout";
  return <PixMap name={name} scale={2} label={state} />;
}

function QuestWindow() {
  const { t } = useLang();
  const { game } = useGame();
  if (!game?.quest) {
    return (
      <div className="window quest">
        <ChestSprite open={false} scale={3} />
        <div className="qtext">
          <div className="qtitle pix">{t("questTitle")}</div>
          <div className="qbody">{t("noQuest")}</div>
        </div>
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
    <div className="window quest">
      <ChestSprite open={q.progress.achieved} scale={3} />
      <div className="qtext">
        <div className="qtitle pix">{t("questTitle")}</div>
        <div className="qbody">{t(questTextKey(q.kind), { n: q.progress.target })}</div>
        <div className="qprog">
          {q.progress.done} / {q.progress.target}
          {q.progress.achieved ? ` — ${t("questComplete")}${q.bonusAwarded ? ` ${t("questBonus")}` : ""}` : ""}
        </div>
        <div className="qpips">
          {minis.map((m) => (
            <span key={m.id} className={`pip${m.state === "flower" ? " clear" : ""}`} title={m.state}>
              <Mini state={m.state} />
            </span>
          ))}
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
      <div className="lvup-card">
        <div className="sunrow">
          <SunflowerSprite scale={5} />
        </div>
        <div className="big pix">{t("levelUpTitle")}</div>
        <button className="pbtn done" onClick={dismissLevelUp}>
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

  const lvl = game?.level;
  const segs = 10;
  const span = lvl ? lvl.nextAt - lvl.baseXp : 1;
  const filled = lvl ? Math.round(((lvl.nextAt - lvl.remaining - lvl.baseXp) / (span || 1)) * segs) : 0;

  return (
    <div className="app">
      <header>
        <div className="logo pix">
          our<span>calendar</span>
        </div>
        <div className="clocks">
          <div className="clock">
            <span className="cname">{t("timeLabelHinata")}</span>
            <b>{clock(now, HINATA_TZ)}</b>
          </div>
          <div className="clock">
            <span className="cname">{t("timeLabelSimone")}</span>
            <b>{clock(now, SIMONE_TZ)}</b>
          </div>
        </div>
      </header>
      {lvl && (
        <div className="stats">
          <div className="lvbadge pix">Lv.{lvl.level}</div>
          <div className="xpwrap">
            <div className="xpbar">
              {Array.from({ length: segs }, (_, i) => (
                <i key={i} className={i < filled ? "on" : ""} />
              ))}
            </div>
            <div className="xpnum">
              XP {game?.totalXp ?? 0} · {t("levelName")} {lvl.level} · {t("xpToNext", { n: lvl.remaining })}
            </div>
          </div>
        </div>
      )}
      {role && <QuestWindow />}
      {role && (
        <nav className="nav">
          <Link to="/" className={`navbtn${loc.pathname === "/" ? " active" : ""}`}>
            {t("navMonth")}
          </Link>
          <Link to="/week" className={`navbtn${loc.pathname === "/week" ? " active" : ""}`}>
            {t("navWeek")}
          </Link>
          <Link to="/weight" className={`navbtn${loc.pathname === "/weight" ? " active" : ""}`}>
            {t("navWeight")}
          </Link>
          <Link to="/settings" className={`navbtn${loc.pathname === "/settings" ? " active" : ""}`}>
            {t("navSettings")}
          </Link>
        </nav>
      )}
      {role === undefined && !loc.pathname.startsWith("/invite") ? (
        <p className="muted">{t("loading")}</p>
      ) : role === null && !loc.pathname.startsWith("/invite") ? (
        <PasswordLoginForm
          title={t("joining")}
          submit={(password) => api.login(password)}
          onDone={(r) => {
            setRole(r);
            refresh();
          }}
        />
      ) : (
        <Routes>
          <Route path="/" element={<MonthPage />} />
          <Route path="/week" element={<CalendarPage role={role ?? null} />} />
          <Route path="/day/:date" element={<DayPage role={role ?? null} />} />
          <Route path="/weight" element={<WeightPage role={role ?? null} />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/invite/:token" element={<InvitePage onDone={(r) => setRole(r)} />} />
        </Routes>
      )}
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
