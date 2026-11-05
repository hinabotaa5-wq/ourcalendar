import { useEffect, useState } from "react";
import type { Role } from "../../../shared/types.js";
import { api, urlBase64ToU8 } from "../api.js";

export function SettingsPage() {
  const [sessions, setSessions] = useState<{ id: string; role: Role; createdAt: string; lastSeenAt: string }[]>([]);
  const [msg, setMsg] = useState("");

  const load = () => {
    api.sessions().then((r) => setSessions(r.sessions)).catch(() => {});
  };
  useEffect(load, []);

  const enablePush = async () => {
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setMsg("Notification permission denied.");
        return;
      }
      const { publicKey } = await api.vapidKey();
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToU8(publicKey).buffer as ArrayBuffer,
      });
      await api.subscribePush(sub.toJSON());
      setMsg("Push enabled on this device.");
    } catch (e) {
      setMsg(`Push setup failed: ${(e as Error).message}`);
    }
  };

  const testPush = async () => {
    const r = await api.testPush();
    setMsg(`Test sent to ${r.sent}/${r.targets} subscription(s).`);
  };

  return (
    <div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Notifications</h3>
        <div className="row">
          <button className="pill-btn" onClick={() => void enablePush()}>
            Enable push
          </button>
          <button className="pill-btn accent" onClick={() => void testPush()}>
            Send test
          </button>
        </div>
        {msg && <p className="muted">{msg}</p>}
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Sessions</h3>
        <p className="muted">Revoke any session (including the other device) here.</p>
        {sessions.map((s) => (
          <p key={s.id}>
            {s.role} · {s.id.slice(0, 8)}…{" "}
            <button
              className="pill-btn danger"
              onClick={() =>
                void api.revokeSession(s.id).then(() => {
                  setMsg("Session revoked.");
                  load();
                })
              }
            >
              Revoke
            </button>
          </p>
        ))}
      </div>
    </div>
  );
}
