import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { HINATA_TZ, SIMONE_TZ } from "../../shared/types.js";
import { api } from "./api.js";
import type { Role } from "../../shared/types.js";
import { LangProvider, useLang } from "./lang.js";
import { CalendarPage } from "./pages/Calendar.js";
import { DayPage } from "./pages/Day.js";
import { InvitePage } from "./pages/Invite.js";
import { MonthPage } from "./pages/Month.js";
import { SettingsPage } from "./pages/Settings.js";
import { WeightPage } from "./pages/Weight.js";
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

function Shell() {
  const { t } = useLang();
  const [role, setRole] = useState<Role | null | undefined>(undefined);
  const now = useNow();
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => {
    api
      .me()
      .then((m) => setRole(m.role))
      .catch(() => setRole(null));
  }, [loc.pathname]);

  useEffect(() => {
    if (role === null && !loc.pathname.startsWith("/invite")) nav("/invite/sample");
  }, [role, loc.pathname, nav]);

  return (
    <div className="app">
      <header className="header">
        <h1>ourcalendar</h1>
        <div className="clocks">
          <span className="clock-badge">Hinata {clock(now, HINATA_TZ)}</span>
          <span className="clock-badge">Simone {clock(now, SIMONE_TZ)}</span>
        </div>
      </header>
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
    </div>
  );
}

export function App() {
  return (
    <LangProvider>
      <Shell />
    </LangProvider>
  );
}
