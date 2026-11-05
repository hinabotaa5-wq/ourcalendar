import { useEffect, useState } from "react";
import type { Role, WeightEntry } from "../../../shared/types.js";
import { api } from "../api.js";

export function WeightPage({ role }: { role: Role | null }) {
  const [weights, setWeights] = useState<WeightEntry[] | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [value, setValue] = useState("");

  useEffect(() => {
    if (role !== "simone") {
      setBlocked(true);
      return;
    }
    api
      .weights()
      .then((r) => setWeights(r.weights))
      .catch(() => setBlocked(true));
  }, [role]);

  const add = async () => {
    const v = Number(value);
    if (!v) return;
    await api.addWeight(v);
    setValue("");
    const r = await api.weights();
    setWeights(r.weights);
  };

  if (blocked || role !== "simone") {
    return (
      <div className="card">
        <h3>Weight</h3>
        <p className="muted">Only Simone can view weight entries. Ask Simone to open this page on her device.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Saturday check-in</h3>
        <p className="muted">Simone enters her weight every Saturday at 19:00 (her time).</p>
        <label>
          Weight (kg)
          <input type="number" step="0.1" value={value} onChange={(e) => setValue(e.target.value)} placeholder="52.0" />
        </label>
        <button className="pill-btn accent" onClick={() => void add()}>
          Save
        </button>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>History (Simone only)</h3>
        {weights?.map((w) => (
          <p key={w.id}>
            {w.recordedAtUtc.slice(0, 10)} — <strong>{w.valueKg} kg</strong>
          </p>
        )) ?? <p className="muted">Loading…</p>}
      </div>
    </div>
  );
}
