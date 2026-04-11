import { useState } from "react";
import { useApp } from "../context/AppContext";
import { ADMIN_PASSWORD } from "../utils/data";
import { IcLock, IcBall } from "../components/Icons";

export default function AdminLogin() {
  const { setAdminAuth } = useApp();
  const [pw, setPw]     = useState("");
  const [err, setErr]   = useState("");
  const [loading, setLoading] = useState(false);

  const attempt = () => {
    if (!pw) return;
    setLoading(true);
    // Simulate a brief delay (replace with real auth API call)
    setTimeout(() => {
      if (pw === ADMIN_PASSWORD) {
        setAdminAuth(true);
      } else {
        setErr("Incorrect password. Try again.");
        setPw("");
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--bg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        padding: "40px 36px",
        width: "100%",
        maxWidth: 380,
        textAlign: "center",
        boxShadow: "var(--shadow-lg)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 6 }}>
          <div style={{
            width: 36,
            height: 36,
            background: "var(--gold)",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <IcBall size={20} stroke="var(--green-dark)" strokeWidth={2} />
          </div>
          <span style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 30,
            color: "var(--gold)",
            letterSpacing: "0.08em",
          }}>
            LACA TV
          </span>
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 30 }}>
          Admin Portal — Restricted Access
        </div>

        {/* Password field */}
        <div style={{
          background: "var(--surface2)",
          border: `1px solid ${err ? "var(--red)" : "var(--border)"}`,
          borderRadius: 10,
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: err ? 10 : 16,
          transition: "border-color 0.15s",
        }}>
          <IcLock size={15} stroke="var(--text-muted)" />
          <input
            type="password"
            value={pw}
            onChange={e => { setPw(e.target.value); setErr(""); }}
            onKeyDown={e => e.key === "Enter" && attempt()}
            placeholder="Enter admin password"
            autoFocus
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text)",
              width: "100%",
              fontSize: 14,
            }}
          />
        </div>

        {err && (
          <div className="toast toast-error" style={{ marginBottom: 14, textAlign: "left" }}>
            {err}
          </div>
        )}

        <button
          onClick={attempt}
          disabled={loading || !pw}
          style={{
            width: "100%",
            background: loading ? "var(--green-mid)" : "var(--green-light)",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "12px",
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? "default" : "pointer",
            transition: "background 0.15s",
            opacity: !pw ? 0.6 : 1,
          }}
        >
          {loading ? "Authenticating..." : "Access Admin Panel"}
        </button>

        <p style={{ marginTop: 16, fontSize: 11, color: "var(--text-dim)" }}>
          Default: <code style={{ color: "var(--gold-dark)", background: "var(--surface2)", padding: "2px 6px", borderRadius: 4 }}>lacatv2026</code>
        </p>
      </div>
    </div>
  );
}
