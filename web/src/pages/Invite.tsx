import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Role } from "../../../shared/types.js";
import { api } from "../api.js";
import { useLang } from "../lang.js";

function errorKey(message: string): "wrongPassword" | "inviteLocked" | "passwordNotSet" | null {
  if (message === "locked") return "inviteLocked";
  if (message === "password_not_set") return "passwordNotSet";
  if (message === "wrong_password" || message === "invalid invite") return "wrongPassword";
  return null;
}

export function InvitePage({ onDone }: { onDone: (r: Role) => void }) {
  const { t } = useLang();
  const { token } = useParams();
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (token === "sample" || !token) {
    return (
      <div className="card">
        <h3>{t("notSignedIn")}</h3>
        <p className="muted">{t("inviteHint")}</p>
      </div>
    );
  }

  const submit = () => {
    if (busy || !password) return;
    setBusy(true);
    setErr("");
    api
      .redeemInvite(token, password)
      .then((r) => {
        onDone(r.role);
        nav("/");
      })
      .catch((e) => {
        const key = errorKey((e as Error).message);
        setErr(key ? t(key) : `${t("inviteFailed")} ${(e as Error).message}`);
      })
      .finally(() => setBusy(false));
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>{t("joining")}</h3>
      <label>
        {t("passwordLabel")}
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
      </label>
      <button className="gbtn accent" disabled={busy || !password} onClick={submit}>
        {t("loginButton")}
      </button>
      {err && <p className="muted">{err}</p>}
    </div>
  );
}
