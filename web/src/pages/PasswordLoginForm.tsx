import { useState } from "react";
import type { Role } from "../../../shared/types.js";
import { useLang } from "../lang.js";

function errorKey(message: string): "wrongPassword" | "inviteLocked" | "passwordNotSet" | null {
  if (message === "locked") return "inviteLocked";
  if (message === "password_not_set") return "passwordNotSet";
  if (message === "wrong_password" || message === "invalid invite") return "wrongPassword";
  return null;
}

export function PasswordLoginForm({
  title,
  submit,
  onDone,
}: {
  title: string;
  submit: (password: string) => Promise<{ role: Role }>;
  onDone: (r: Role) => void;
}) {
  const { t } = useLang();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const go = () => {
    if (busy || !password) return;
    setBusy(true);
    setErr("");
    submit(password)
      .then((r) => onDone(r.role))
      .catch((e) => {
        const key = errorKey((e as Error).message);
        setErr(key ? t(key) : `${t("inviteFailed")} ${(e as Error).message}`);
      })
      .finally(() => setBusy(false));
  };

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <label>
        {t("passwordLabel")}
        <input
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") go();
          }}
        />
      </label>
      <button className="gbtn accent" disabled={busy || !password} onClick={go}>
        {t("loginButton")}
      </button>
      {err && <p className="muted">{err}</p>}
    </div>
  );
}
