import { useEffect, useState } from "react";
import type { Role, WeightEntry } from "../../../shared/types.js";
import { api } from "../api.js";
import { useLang } from "../lang.js";

export function WeightPage({ role }: { role: Role | null }) {
  const { t } = useLang();
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
        <h3>{t("weightTitle")}</h3>
        <p className="muted">{t("weightOnlySimone")}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>{t("saturdayCheckin")}</h3>
        <p className="muted">{t("saturdayPrompt")}</p>
        <label>
          {t("fieldWeightKg")}
          <input type="number" step="0.1" value={value} onChange={(e) => setValue(e.target.value)} />
        </label>
        <button className="gbtn accent" onClick={() => void add()}>
          {t("save")}
        </button>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>{t("historySimone")}</h3>
        {weights?.map((w) => (
          <p key={w.id}>
            {w.recordedAtUtc.slice(0, 10)} — <strong>{w.valueKg} kg</strong>
          </p>
        )) ?? <p className="muted">{t("loading")}</p>}
      </div>
    </div>
  );
}
