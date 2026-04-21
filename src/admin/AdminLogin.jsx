import { useState } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../utils/supabase";

function LacaLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a3d1f"/>
          <stop offset="100%" stopColor="#051a0d"/>
        </linearGradient>
        <linearGradient id="gg2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5c842"/>
          <stop offset="100%" stopColor="#d4a017"/>
        </linearGradient>
      </defs>
      <path d="M100 8 L180 40 L180 110 Q180 160 100 192 Q20 160 20 110 L20 40 Z" fill="url(#sg2)" stroke="url(#gg2)" strokeWidth="4"/>
      <circle cx="100" cy="58" r="22" fill="none" stroke="url(#gg2)" strokeWidth="2.5"/>
      <circle cx="100" cy="58" r="7" fill="url(#gg2)"/>
      <text x="100" y="118" fontFamily="'Arial Black',sans-serif" fontSize="32" fontWeight="900" fill="url(#gg2)" textAnchor="middle" letterSpacing="4">LACA</text>
      <text x="100" y="145" fontFamily="'Arial Black',sans-serif" fontSize="20" fontWeight="900" fill="#ffffff" textAnchor="middle" letterSpacing="8">TV</text>
    </svg>
  );
}

export default function AdminLogin() {
  const { setAdminAuth } = useApp();
  const [email,   setEmail]   = useState("");
  const [pw,      setPw]      = useState("");
  const [err,     setErr]     = useState("");
  const [loading, setLoading] = useState(false);

  const attempt = async () => {
    if (!email || !pw) return;
    setLoading(true);
    setErr("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: pw,
    });

    if (error || !data?.user) {
      setErr("Incorrect email or password. Please try again.");
      setPw("");
      setLoading(false);
      return;
    }

    setAdminAuth(true);
    setLoading(false);
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
      }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginBottom:8 }}>
          <LacaLogo size={44} />
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:34, color:"var(--gold)", letterSpacing:"0.08em", lineHeight:1 }}>
            LACA TV
          </span>
        </div>
        <div style={{ fontSize:13, color:"var(--text-muted)", marginBottom:30 }}>
          Admin Portal — Restricted Access
        </div>

        {/* Email */}
        <div style={{
          background:"var(--surface2)", border:"1px solid var(--border)",
          borderRadius:10, padding:"10px 14px",
          display:"flex", alignItems:"center", gap:10, marginBottom:10,
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); setErr(""); }}
            onKeyDown={e => e.key==="Enter" && attempt()}
            placeholder="Admin email"
            autoFocus
            style={{ background:"transparent", border:"none", outline:"none", color:"var(--text)", width:"100%", fontSize:14 }}
          />
        </div>

        {/* Password */}
        <div style={{
          background:"var(--surface2)",
          border:`1px solid ${err ? "var(--red)" : "var(--border)"}`,
          borderRadius:10, padding:"10px 14px",
          display:"flex", alignItems:"center", gap:10,
          marginBottom: err ? 10 : 16,
          transition:"border-color 0.15s",
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <input
            type="password"
            value={pw}
            onChange={e => { setPw(e.target.value); setErr(""); }}
            onKeyDown={e => e.key==="Enter" && attempt()}
            placeholder="Password"
            style={{ background:"transparent", border:"none", outline:"none", color:"var(--text)", width:"100%", fontSize:14 }}
          />
        </div>

        {err && (
          <div style={{ background:"var(--red-bg)", border:"1px solid var(--red-border)", borderRadius:8, padding:"8px 12px", fontSize:12, color:"#ff6b68", marginBottom:14, textAlign:"left" }}>
            {err}
          </div>
        )}

        <button
          onClick={attempt}
          disabled={loading || !email || !pw}
          style={{
            width:"100%",
            background: (!email||!pw) ? "var(--green-mid)" : "var(--green-light)",
            color:"#fff", border:"none", borderRadius:10,
            padding:"12px", fontSize:14, fontWeight:600,
            cursor: (!email||!pw||loading) ? "default" : "pointer",
            transition:"background 0.15s",
            opacity: (!email||!pw) ? 0.6 : 1,
          }}
        >
          {loading ? "Authenticating..." : "Access Admin Panel"}
        </button>

        <p style={{ marginTop:20, fontSize:11, color:"var(--text-dim)", lineHeight:1.6 }}>
          Use your Supabase admin credentials.<br/>
          Login: <span style={{ color:"var(--gold-dark)" }}>Markethub92@gmail.com</span>
        </p>
      </div>
    </div>
  );
}
