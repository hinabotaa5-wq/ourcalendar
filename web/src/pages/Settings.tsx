import { useState } from "react";
import { api, urlBase64ToU8 } from "../api.js";
import { langOptions, useLang } from "../lang.js";

export function SettingsPage() {
  const { lang, setLang, t } = useLang();
  const [msg, setMsg] = useState("");

  const enablePush = async () => {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setMsg(t("pushDenied"));
        return;
      }
      const { publicKey } = await api.vapidKey();
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToU8(publicKey).buffer as ArrayBuffer,
      });
      await api.subscribePush(sub.toJSON());
      setMsg(t("pushEnabled"));
    } catch (e) {
      setMsg(`${t("pushFailed")} ${(e as Error).message}`);
    }
  };

  const testPush = async () => {
    const r = await api.testPush();
    setMsg(t("testSent", { sent: r.sent, targets: r.targets }));
  };

  return (
    <div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>{t("language")}</h3>
        <label>
          {t("language")}
          <select value={lang} onChange={(e) => setLang(e.target.value as typeof lang)}>
            {langOptions().map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>{t("notifications")}</h3>
        <div className="row">
          <button className="gbtn" onClick={() => void enablePush()}>
            {t("enablePush")}
          </button>
          <button className="gbtn accent" onClick={() => void testPush()}>
            {t("sendTest")}
          </button>
        </div>
        {msg && <p className="muted">{msg}</p>}
      </div>
    </div>
  );
}
