import { useEffect, useMemo, useState } from "react";
import { dualTime, formatInZone } from "../../../shared/time.js";
import { HINATA_TZ, SIMONE_TZ } from "../../../shared/types.js";
import type { CalEvent, EventCategory, Role } from "../../../shared/types.js";
import { api } from "../api.js";

function weekRange(offset: number): { from: string; to: string; label: string } {
  const now = new Date();
  const day = (now.getDay() + 6) % 7;
  const monday = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() - day + offset * 7));
  const sunday = new Date(monday.getTime() + 7 * 86400000);
  const iso = (d: Date) => d.toISOString();
  return { from: iso(monday), to: iso(sunday), label: monday.toISOString().slice(0, 10) };
}

const CATS: EventCategory[] = ["Workout", "Jogging", "General"];

function EventCard({ e, role, onChange }: { e: CalEvent; role: Role | null; onChange: () => void }) {
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
      <span className="badge">{e.status}</span>
      <h3 style={{ margin: "8px 0" }}>{e.title}</h3>
      {dt && (
        <div className="dual">
          <span className="mine">
            {dt.mine.time} <small className="muted">{dt.mine.label}</small>
          </span>
          <span className="theirs">
            {dt.theirs.time} {dt.theirs.label}
          </span>
          {dt.dayOffsetNote && <span className="day-note">{dt.dayOffsetNote}</span>}
        </div>
      )}
      <p className="muted">
        {e.durationMin} min{e.notes ? ` · ${e.notes}` : ""}
      </p>
      {e.videoUrl && (
        <p>
          <a href={e.videoUrl} target="_blank" rel="noreferrer">
            Reference video
          </a>
        </p>
      )}
      <div className="row">
        <button className="pill-btn" onClick={() => void act("done")}>
          Done
        </button>
        <button className="pill-btn ghost" onClick={() => void act("rest")}>
          Rest today
        </button>
        <button className="pill-btn ghost" onClick={() => setMoving((v) => !v)}>
          Move
        </button>
        <button
          className="pill-btn danger"
          onClick={() => void api.deleteEvent(e.id).then(onChange)}
        >
          Delete
        </button>
      </div>
      {moving && (
        <div style={{ marginTop: 8 }}>
          <label>
            Move to
            <input type="datetime-local" value={moveTo} onChange={(ev) => setMoveTo(ev.target.value)} />
          </label>
          <button className="pill-btn accent" disabled={!moveTo} onClick={() => void act("move")}>
            Confirm move
          </button>
        </div>
      )}
    </div>
  );
}

export function CalendarPage({ role }: { role: Role | null }) {
  const [offset, setOffset] = useState(0);
  const range = useMemo(() => weekRange(offset), [offset]);
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState<EventCategory>("Workout");
  const [when, setWhen] = useState("");
  const [dur, setDur] = useState(45);
  const [notes, setNotes] = useState("");
  const [video, setVideo] = useState("");

  const load = () => {
    api.events(range.from, range.to).then((r) => setEvents(r.events)).catch(() => {});
  };
  useEffect(load, [range.from, range.to]);

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
    setWhen("");
    setNotes("");
    setVideo("");
    load();
  };

  const byDay = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const e of events) {
      const key = formatInZone(e.startsAtUtc, SIMONE_TZ).date;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(e);
    }
    void HINATA_TZ;
    return [...m.entries()].sort();
  }, [events]);

  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <button className="pill-btn ghost" onClick={() => setOffset((o) => o - 1)}>
          ← Prev week
        </button>
        <span className="muted" style={{ alignSelf: "center" }}>
          week of {range.label}
        </span>
        <button className="pill-btn ghost" onClick={() => setOffset((o) => o + 1)}>
          Next week →
        </button>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>New event</h3>
        <label>
          Title
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Home workout" />
        </label>
        <label>
          Category
          <select value={cat} onChange={(e) => setCat(e.target.value as EventCategory)}>
            {CATS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date & time (your device time)
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </label>
        <label>
          Duration (min)
          <input type="number" value={dur} onChange={(e) => setDur(Number(e.target.value))} />
        </label>
        <label>
          How-to notes
          <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="3 sets ..." />
        </label>
        <label>
          Reference video URL
          <input value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://..." />
        </label>
        <button className="pill-btn accent" onClick={() => void create()}>
          Add event
        </button>
      </div>
      {byDay.map(([day, list]) => (
        <div key={day}>
          <h3>{day}</h3>
          {list.map((e) => (
            <EventCard key={e.id} e={e} role={role} onChange={load} />
          ))}
        </div>
      ))}
      {events.length === 0 && <p className="muted">No events this week yet.</p>}
    </div>
  );
}
