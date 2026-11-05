import { useEffect, useState } from "react";
import type { Role, WeightEntry } from "../../../shared/types.js";
import { api } from "../api.js";
import { useLang } from "../lang.js";
import {
  buildWeightGraph,
  formatMD,
  GRAPH_H,
  GRAPH_W,
  PAD_L,
  PAD_R,
  type GraphPoint,
} from "./weightGraph.js";

const GREEN = "#2f9e5f";
const DARK_GREEN = "#1e6b3e";
const MUTED = "#5a7263";

function WeightHistoryChart({ weights }: { weights: WeightEntry[] }) {
  const graph = buildWeightGraph(weights);
  if (!graph) return null;
  const { points, min, max } = graph;
  const latest = points[points.length - 1];
  const first = points[0];
  const line = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <svg
      viewBox={`0 0 ${GRAPH_W} ${GRAPH_H}`}
      style={{ width: "100%", height: "auto", display: "block" }}
      role="img"
      aria-label={`weight history: ${min} to ${max} kg`}
    >
      <text x={PAD_L} y={GRAPH_H - 6} fontSize={10} fill={MUTED} textAnchor="start">
        {formatMD(first.entry.recordedAtUtc)}
      </text>
      {points.length > 1 && (
        <text x={GRAPH_W - PAD_R} y={GRAPH_H - 6} fontSize={10} fill={MUTED} textAnchor="end">
          {formatMD(latest.entry.recordedAtUtc)}
        </text>
      )}
      {min === max ? (
        <text x={PAD_L - 4} y={yOf(points, min) + 3} fontSize={10} fill={MUTED} textAnchor="end">
          {min}
        </text>
      ) : (
        <>
          <text x={PAD_L - 4} y={yOf(points, min) + 3} fontSize={10} fill={MUTED} textAnchor="end">
            {min}
          </text>
          <text x={PAD_L - 4} y={yOf(points, max) + 3} fontSize={10} fill={MUTED} textAnchor="end">
            {max}
          </text>
        </>
      )}
      {points.length > 1 && (
        <polyline points={line} fill="none" stroke={GREEN} strokeWidth={2} strokeLinecap="square" />
      )}
      {points.map((p, i) =>
        i === points.length - 1 ? (
          <g key={p.entry.id}>
            <rect x={p.x - 4.5} y={p.y - 4.5} width={9} height={9} fill={DARK_GREEN} stroke="#fff" strokeWidth={1} />
            <text
              x={points.length === 1 ? p.x : p.x + 9}
              y={points.length === 1 ? p.y - 10 : p.y + 4}
              fontSize={11}
              fontWeight={700}
              fill={DARK_GREEN}
              textAnchor={points.length === 1 ? "middle" : "start"}
            >
              {points.length === 1 ? `${p.entry.valueKg} kg` : p.entry.valueKg}
            </text>
          </g>
        ) : (
          <rect
            key={p.entry.id}
            x={p.x - 3.5}
            y={p.y - 3.5}
            width={7}
            height={7}
            fill={GREEN}
            stroke="#fff"
            strokeWidth={1}
          />
        ),
      )}
      {points.length === 1 && (
        <text x={points[0].x} y={GRAPH_H - 6} fontSize={10} fill={MUTED} textAnchor="middle">
          {formatMD(points[0].entry.recordedAtUtc)}
        </text>
      )}
    </svg>
  );
}

function yOf(points: GraphPoint[], value: number): number {
  return points.find((p) => p.entry.valueKg === value)?.y ?? 0;
}

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
        {weights === null ? (
          <p className="muted">{t("loading")}</p>
        ) : weights.length === 0 ? (
          <p className="muted">{t("noWeights")}</p>
        ) : (
          <WeightHistoryChart weights={weights} />
        )}
      </div>
    </div>
  );
}
