import { useState } from "react";
import { ALL_DAY_MINUTES } from "../../../shared/birthdays.js";
import { dualTime } from "../../../shared/time.js";
import type { CalEvent, EventCategory, Role } from "../../../shared/types.js";
import { api } from "../api.js";
import { useLang } from "../lang.js";

export const CATS: EventCategory[] = ["Workout", "Jogging", "General"];

// Day and week views hide moved-away history rows. Data stays in the DB.
export function visibleEvents(events: CalEvent[]): CalEvent[] {
  return events.filter((e) => e.status !== "moved");
}

function statusKey(status: CalEvent["status"]): "statusScheduled" | "statusDone" | "statusRested" | "statusMoved" {
  if (status === "done") return "statusDone";
  if (status === "rested") return "statusRested";
  if (status === "moved") return "statusMoved";
  return "statusScheduled";
}

export function EventCard({ e, role, onChange }: { e: CalEvent; role: Role | null; onChange: () => void }) {
  const { t } = useLang();
  const dt = role ? dualTime(e.startsAtUtc, role) : null;
  const [moving, setMoving] = useState(false);
  const [moveTo, setMoveTo] = useState("");

  const act = async (action: "done" | "rest" | "move") => {
    await api.eventAction(e.id, action, action === "move" ? new Date(moveTo).toISOString() : undefined);
    onChange();
  };

  return (
    <div className="card">
      <span className={`badge ${e.category === "Jogging" ? "jogging" : e.category === "General" ? "general" : ""}`}>
        {e.category}
      </span>{" "}
      <span className="badge">{t(statusKey(e.status))}</span>
      <h3 style={{ margin: "8px 0" }}>{e.title}</h3>
      {e.durationMin >= ALL_DAY_MINUTES ? (
        <p>
          <span className="badge">{t("allDay")}</span> <span className="muted">{dt?.mine.date}</span>
        </p>
      ) : (
        dt && (
          <div className="dual">
            <span className="mine">
              {dt.mine.time} <small className="muted">{dt.mine.label}</small>
            </span>
            <span className="theirs">
              {dt.theirs.time} {dt.theirs.label}
            </span>
            {dt.dayOffsetNote && <span className="day-note">{dt.dayOffsetNote}</span>}
          </div>
        )
      )}
      <p className="muted">
        {e.durationMin >= ALL_DAY_MINUTES ? t("allDay") : `${e.durationMin} ${t("minUnit")}`}
        {e.notes ? ` · ${e.notes}` : ""}
      </p>
      {e.videoUrl && (
        <p>
          <a href={e.videoUrl} target="_blank" rel="noreferrer">
            {t("referenceVideo")}
          </a>
        </p>
      )}
      <div className="row">
        <button className="pill-btn" onClick={() => void act("done")}>
          {t("done")}
        </button>
        <button className="pill-btn ghost" onClick={() => void act("rest")}>
          {t("restToday")}
        </button>
        <button className="pill-btn ghost" onClick={() => setMoving((v) => !v)}>
          {t("move")}
        </button>
        <button className="pill-btn danger" onClick={() => void api.deleteEvent(e.id).then(onChange)}>
          {t("delete")}
        </button>
      </div>
      {moving && (
        <div style={{ marginTop: 8 }}>
          <label>
            {t("moveTo")}
            <input type="datetime-local" value={moveTo} onChange={(ev) => setMoveTo(ev.target.value)} />
          </label>
          <button className="pill-btn accent" disabled={!moveTo} onClick={() => void act("move")}>
            {t("confirmMove")}
          </button>
        </div>
      )}
    </div>
  );
}

export function NewEventForm({ initialDate, onDone }: { initialDate?: string; onDone: () => void }) {
  const { t } = useLang();
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState<EventCategory>("Workout");
  const [when, setWhen] = useState(initialDate ? `${initialDate}T18:00` : "");
  const [dur, setDur] = useState(45);
  const [notes, setNotes] = useState("");
  const [video, setVideo] = useState("");

  const create = async () => {
    if (!title || !when) return;
    await api.createEvent({
      title,
      category: cat,
      startsAtUtc: new Date(when).toISOString(),
      durationMin: dur,
      notes,
      videoUrl: video,
    });
    setTitle("");
    setWhen(initialDate ? `${initialDate}T18:00` : "");
    setNotes("");
    setVideo("");
    onDone();
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>{t("newEvent")}</h3>
      <label>
        {t("fieldTitle")}
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Home workout" />
      </label>
      <label>
        {t("fieldCategory")}
        <select value={cat} onChange={(e) => setCat(e.target.value as EventCategory)}>
          {CATS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("fieldWhen")}
        <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
      </label>
      <label>
        {t("fieldDuration")}
        <input type="number" value={dur} onChange={(e) => setDur(Number(e.target.value))} />
      </label>
      <label>
        {t("fieldNotes")}
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="3 sets ..." />
      </label>
      <label>
        {t("fieldVideo")}
        <input value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://..." />
      </label>
      <button className="pill-btn accent" onClick={() => void create()}>
        {t("addEvent")}
      </button>
    </div>
  );
}
