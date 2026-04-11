import { useApp } from "../context/AppContext";
import { IcSearch, IcX, IcBall } from "./Icons";

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
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <div style={{
          width: 30,
          height: 30,
          background: "var(--gold)",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--green-dark)",
        }}>
          <IcBall size={16} stroke="var(--green-dark)" strokeWidth={2} />
        </div>
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
              fontFamily: "'DM Sans', sans-serif",
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

      {/* Search — only on public side */}
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
        }}
          onFocus={e => e.currentTarget.style.borderColor = "var(--green-light)"}
          onBlur={e => e.currentTarget.style.borderColor = "var(--green-mid)"}
        >
          <IcSearch size={14} stroke="var(--text-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search teams, matches, competitions..."
            style={{
              background: "transparent",
              border: "none",
              outline: "none",
              color: "var(--text)",
              width: "100%",
              fontSize: 13,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{ background: "none", border: "none", color: "var(--text-muted)", padding: 0, display: "flex" }}
            >
              <IcX size={14} />
            </button>
          )}
        </div>
      )}

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginLeft: "auto" }}>
        {isAdmin ? (
          <>
            <button
              onClick={() => navigate("home")}
              className="btn btn-ghost"
              style={{ fontSize: 12 }}
            >
              View Site
            </button>
          </>
        ) : (
          <div style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "var(--gold)",
            color: "var(--green-dark)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 13,
          }}>
            LA
          </div>
        )}
      </div>
    </div>
  );
}
