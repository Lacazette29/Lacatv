import { IcHome, IcTrending, IcClock, IcBookmark, IcTrophy, IcSettings } from "./Icons";

const NAV_ITEMS = [
  { id: "home",     Icon: IcHome,     label: "Home"     },
  { id: "trending", Icon: IcTrending, label: "Trending" },
  { id: "recent",   Icon: IcClock,    label: "Recent"   },
  { id: "saved",    Icon: IcBookmark, label: "Saved"    },
];

const LEAGUE_ITEMS = [
  { id: "Champions League", flag: "🏆" },
  { id: "Premier League",   flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: "La Liga",          flag: "🇪🇸" },
  { id: "Bundesliga",       flag: "🇩🇪" },
  { id: "Serie A",          flag: "🇮🇹" },
  { id: "NPFL",             flag: "🇳🇬" },
  { id: "AFCON",            flag: "🌍" },
  { id: "Ligue 1",          flag: "🇫🇷" },
];

export default function Sidebar({ activeLeague, setActiveLeague, activeNav, setActiveNav }) {
  const Row = ({ active, onClick, children }) => (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "8px 16px",
        margin: "1px 8px",
        borderRadius: 8,
        color: active ? "var(--text)" : "var(--text-muted)",
        background: active ? "var(--surface2)" : "transparent",
        borderLeft: active ? "2px solid var(--green-light)" : "2px solid transparent",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: active ? 500 : 400,
        transition: "all 0.15s",
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--surface)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      {children}
    </div>
  );

  const SectionLabel = ({ children }) => (
    <div style={{
      padding: "12px 18px 5px",
      fontSize: 10,
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.1em",
      color: "var(--text-dim)",
    }}>
      {children}
    </div>
  );

  return (
    <div className="sidebar" style={{
      width: 200,
      background: "var(--surface)",
      borderRight: "1px solid var(--border)",
      padding: "12px 0",
      flexShrink: 0,
      minHeight: "calc(100vh - 92px)",
      overflowY: "auto",
    }}>
      {NAV_ITEMS.map(({ id, Icon, label }) => (
        <Row
          key={id}
          active={activeNav === id}
          onClick={() => { setActiveNav(id); setActiveLeague("All"); }}
        >
          <Icon size={16} stroke={activeNav === id ? "var(--green-light)" : "currentColor"} />
          {label}
        </Row>
      ))}

      <SectionLabel>Leagues</SectionLabel>

      {LEAGUE_ITEMS.map(({ id, flag }) => (
        <Row
          key={id}
          active={activeLeague === id}
          onClick={() => { setActiveLeague(id); setActiveNav(null); }}
        >
          <span style={{ fontSize: 15, width: 18, textAlign: "center" }}>{flag}</span>
          <span style={{ fontSize: 12 }}>{id}</span>
        </Row>
      ))}

      <div style={{ borderTop: "1px solid var(--border)", margin: "10px 16px" }} />

      <Row active={false} onClick={() => {}}>
        <IcSettings size={16} />
        <span style={{ fontSize: 12 }}>Settings</span>
      </Row>
    </div>
  );
}
