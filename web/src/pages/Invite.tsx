import { useParams } from "react-router-dom";
import type { Role } from "../../../shared/types.js";
import { api } from "../api.js";
import { useLang } from "../lang.js";
import { PasswordLoginForm } from "./PasswordLoginForm.js";

export function InvitePage({ onDone }: { onDone: (r: Role) => void }) {
  const { t } = useLang();
  const { token } = useParams();

  if (token === "sample" || !token) {
    return (
      <div className="card">
        <h3>{t("notSignedIn")}</h3>
        <p className="muted">{t("inviteHint")}</p>
      </div>
    );
  }

  return (
    <PasswordLoginForm title={t("joining")} submit={(password) => api.redeemInvite(token, password)} onDone={onDone} />
  );
}
