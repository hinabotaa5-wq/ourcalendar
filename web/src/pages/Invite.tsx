import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { Role } from "../../../shared/types.js";
import { api } from "../api.js";
import { useLang } from "../lang.js";

export function InvitePage({ onDone }: { onDone: (r: Role) => void }) {
  const { t } = useLang();
  const { token } = useParams();
  const nav = useNavigate();
  const [err, setErr] = useState("");
  // Redeem exactly once per token: parent re-renders must not refire the POST,
  // or the second call fails with "invalid invite" after the first consumed it.
  const fired = useRef<string | null>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!token || token === "sample" || fired.current === token) return;
    fired.current = token;
    api
      .redeemInvite(token)
      .then((r) => {
        onDoneRef.current(r.role);
        nav("/");
      })
      .catch((e) => setErr((e as Error).message));
  }, [token, nav]);

  if (token === "sample" || !token) {
    return (
      <div className="card">
        <h3>{t("notSignedIn")}</h3>
        <p className="muted">{t("inviteHint")}</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>{t("joining")}</h3>
      {err ? (
        <p className="muted">
          {t("inviteFailed")} {err}
        </p>
      ) : (
        <p className="muted">{t("redeeming")}</p>
      )}
    </div>
  );
}


