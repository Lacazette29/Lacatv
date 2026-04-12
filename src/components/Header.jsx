import { useApp } from "../context/AppContext";
import { IcSearch, IcX } from "./Icons";

// ── Inline SVG Logo ───────────────────────────
function LacaLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a3d1f"/>
          <stop offset="100%" stopColor="#051a0d"/>
        </linearGradient>
        <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5c842"/>
          <stop offset="100%" stopColor="#d4a017"/>
        </linearGradient>
      </defs>
      <path d="M100 8 L180 40 L180 110 Q180 160 100 192 Q20 160 20 110 L20 40 Z" fill="url(#sg)" stroke="url(#gg)" strokeWidth="4"/>
      <path d="M100 22 L168 50 L168 110 Q168 152 100 180 Q32 152 32 110 L32 50 Z" fill="none" stroke="#f5c842" strokeWidth="1" opacity="0.3"/>
      <circle cx="100" cy="58" r="22" fill="none" stroke="url(#gg)" strokeWidth="2.5"/>
      <circle cx="100" cy="58" r="7" fill="url(#gg)"/>
      <path d="M100 36 L100 44 M84 47 L90 52 M116 47 L110 52 M88 70 L94 65 M112 70 L106 65" stroke="url(#gg)" strokeWidth="1.5" strokeLinecap="round"/>
      <text x="100" y="118" fontFamily="'Arial Black',sans-serif" fontSize="32" fontWeight="900" fill="url(#gg)" textAnchor="middle" letterSpacing="4">LACA</text>
      <text x="100" y="145" fontFamily="'Arial Black',sans-serif" fontSize="20" fontWeight="900" fill="#ffffff" textAnchor="middle" letterSpacing="8">TV</text>
      <rect x="55" y="152" width="90" height="3" rx="1.5" fill="url(#gg)" opacity="0.8"/>
    </svg>
  );
}

export default function Header({ search, setSearch, isAdmin = false }) {
  const { navigate, siteSettings } = useApp();

  return (
    <div style={{
      background: "var(--green-dark)",
      borderBottom: "1.5px solid var(--green-mid)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 20px",
      height: 56,
      position: "sticky",
      top: 0,
      zIndex: 100,
      gap: 16,
    }}>
      {/* Logo */}
      <div
        onClick={() => navigate("home")}
        style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", flexShrink: 0 }}
      >
        <LacaLogo size={36} />
        <span style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 26,
          color: "var(--gold)",
          letterSpacing: "0.08em",
          lineHeight: 1,
        }}>
          {siteSettings.siteName}
          {isAdmin && (
            <span style={{
              fontFamily: "sans-serif",
              fontSize: 11,
              color: "var(--green-light)",
              fontWeight: 600,
              letterSpacing: "0.04em",
              marginLeft: 8,
              verticalAlign: "middle",
            }}>
              ADMIN
            </span>
          )}
        </span>
        <span style={{
          background: "var(--green-light)",
          color: "#fff",
          fontSize: 9,
          fontWeight: 700,
          padding: "2px 6px",
          borderRadius: 4,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}>
          LIVE
        </span>
      </div>

      {/* Search — public side only */}
      {!isAdmin && setSearch && (
        <div style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid var(--green-mid)",
          borderRadius: 22,
          padding: "0 14px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          flex: 1,
          maxWidth: 340,
          height: 36,
          transition: "border-color 0.15s",
        }}>
          <IcSearch size={14} stroke="var(--text-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search teams, matches, competitions..."
            style={{
              background: "transparent", border: "none", outline: "none",
              color: "var(--text)", width: "100%", fontSize: 13,
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", color: "var(--text-muted)", padding: 0, display: "flex" }}>
              <IcX size={14} />
            </button>
          )}
        </div>
      )}

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
        {isAdmin ? (
          <button onClick={() => navigate("home")} className="btn btn-ghost" style={{ fontSize: 12 }}>
            View Site
          </button>
        ) : (
          <>
            {/* ⚽ Live Scores button */}
            <button
              onClick={() => navigate("scores", null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 20,
                border: "1px solid rgba(245,200,66,0.4)",
                background: "rgba(245,200,66,0.1)",
                color: "var(--gold)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
                letterSpacing: "0.03em",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(245,200,66,0.2)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(245,200,66,0.1)"}
            >
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 6px #22c55e",
                animation: "pulse 1.5s ease-in-out infinite",
                flexShrink: 0,
              }} />
              Live Scores
            </button>

            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "var(--gold)", color: "var(--green-dark)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, fontSize: 13,
            }}>
              LA
            </div>
          </>
        )}
      </div>
    </div>
  );
}
