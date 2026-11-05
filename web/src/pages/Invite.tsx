import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Role } from "../../../shared/types.js";
import { api } from "../api.js";

export function InvitePage({ onDone }: { onDone: (r: Role) => void }) {
  const { token } = useParams();
  const nav = useNavigate();
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!token || token === "sample") return;
    api
      .redeemInvite(token)
      .then((r) => {
        onDone(r.role);
        nav("/");
      })
      .catch((e) => setErr((e as Error).message));
  }, [token, nav, onDone]);

  if (token === "sample" || !token) {
    return (
      <div className="card">
        <h3>You're not signed in</h3>
        <p className="muted">Open your personal invite link on this device to join. Each link works once.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>Joining…</h3>
      {err ? <p className="muted">Invite failed: {err}</p> : <p className="muted">Redeeming your invite link…</p>}
    </div>
  );
}
