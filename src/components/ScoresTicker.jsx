import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";

// ── Uses dashboard.api-football.com (not RapidAPI) ──
const API_KEY  = process.env.REACT_APP_FOOTBALL_API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

export default function ScoresTicker() {
  const { navigate, siteSettings } = useApp();
  const [scores,    setScores]    = useState([]);
  const [hasData,   setHasData]   = useState(false);
  const [goalFlash, setGoalFlash] = useState(null);
  const prevRef = useRef({});

  const fetchScores = async () => {
    if (!API_KEY) return;
    try {
      // Try live fixtures first
      let res  = await fetch(`${BASE_URL}/fixtures?live=all`, {
        headers: { "x-apisports-key": API_KEY },
      });
      let json = await res.json();
      let data = json.response || [];

      // If no live games, show today's finished results
      if (data.length === 0) {
        const today = new Date().toISOString().split("T")[0];
        res  = await fetch(`${BASE_URL}/fixtures?date=${today}&status=FT-AET-PEN`, {
          headers: { "x-apisports-key": API_KEY },
        });
        json = await res.json();
        data = json.response || [];
      }

      const normalised = data.map(f => {
        const s      = f.fixture.status.short;
        const isLive = ["1H","HT","2H","ET","BT","P","LIVE"].includes(s);
        return {
          id:        f.fixture.id,
          league:    f.league.name,
          homeName:  f.teams.home.name,
          awayName:  f.teams.away.name,
          homeScore: f.goals.home ?? 0,
          awayScore: f.goals.away ?? 0,
          minute:    f.fixture.status.elapsed || 0,
          status:    isLive ? "live" : "ft",
        };
      });

      // Goal flash notifications
      normalised.forEach(m => {
        const prev = prevRef.current[m.id];
        if (prev && m.status === "live") {
          const was = (prev.homeScore||0) + (prev.awayScore||0);
          const now = (m.homeScore||0)  + (m.awayScore||0);
          if (now > was) {
            const text = `⚽ GOAL! ${m.homeName} ${m.homeScore}–${m.awayScore} ${m.awayName}`;
            setGoalFlash(text);
            setTimeout(() => setGoalFlash(null), 6000);
            if (Notification.permission === "granted") {
              new Notification("⚽ GOAL!", { body: text, icon: "/logo.svg" });
            }
          }
        }
        prevRef.current[m.id] = m;
      });

      if (normalised.length > 0) {
        setScores(normalised);
        setHasData(true);
      }
    } catch (err) {
      console.error("Ticker error:", err.message);
    }
  };

  useEffect(() => {
    fetchScores();
    const iv = setInterval(fetchScores, 60000);
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    return () => clearInterval(iv);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!siteSettings.tickerEnabled || !hasData || scores.length === 0) return null;

  const doubled = [...scores, ...scores];

  return (
    <>
      {goalFlash && (
        <div style={{
          position:"fixed", top:64, right:16, zIndex:9999,
          background:"var(--green-dark)", border:"2px solid var(--gold)",
          borderRadius:10, padding:"12px 18px",
          color:"var(--gold)", fontWeight:700, fontSize:14,
          boxShadow:"0 4px 24px rgba(0,0,0,0.6)",
        }}>
          {goalFlash}
        </div>
      )}

      <div style={{
        background:"var(--surface)", borderBottom:"1px solid var(--border)",
        height:36, display:"flex", alignItems:"center",
        overflow:"hidden", flexShrink:0,
      }}>
        <div
          onClick={() => navigate("scores", null)}
          style={{
            background:"var(--green)", color:"#fff",
            fontWeight:600, fontSize:11, padding:"0 14px",
            height:"100%", display:"flex", alignItems:"center", gap:6,
            whiteSpace:"nowrap", letterSpacing:"0.08em", textTransform:"uppercase",
            flexShrink:0, borderRight:"1px solid var(--border)", cursor:"pointer",
          }}
          onMouseEnter={e => e.currentTarget.style.background="var(--green-light)"}
          onMouseLeave={e => e.currentTarget.style.background="var(--green)"}
        >
          <span className="live-dot" style={{ background:"#fff" }} />
          Live Scores
        </div>

        <div style={{ overflow:"hidden", flex:1, display:"flex", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", animation:"tickerScroll 60s linear infinite", whiteSpace:"nowrap" }}>
            {doubled.map((s, i) => (
              <div
                key={i}
                onClick={() => navigate("scores", s)}
                style={{
                  display:"inline-flex", alignItems:"center", gap:8,
                  padding:"0 20px", borderRight:"1px solid var(--border)",
                  height:36, fontSize:12, cursor:"pointer",
                }}
                onMouseEnter={e => e.currentTarget.style.background="var(--surface2)"}
                onMouseLeave={e => e.currentTarget.style.background="transparent"}
              >
                <span style={{ color:"var(--text-muted)", fontSize:10, fontWeight:600, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                  {s.league.length > 12 ? s.league.slice(0,12)+"…" : s.league}
                </span>
                <span style={{ color:"var(--text-sec)", fontWeight:500 }}>{s.homeName}</span>
                <span style={{ color:"var(--gold)", fontWeight:800, fontSize:13, minWidth:34, textAlign:"center" }}>
                  {s.homeScore}–{s.awayScore}
                </span>
                <span style={{ color:"var(--text-sec)", fontWeight:500 }}>{s.awayName}</span>
                {s.status === "live"
                  ? <><span className="live-dot"/><span style={{ color:"var(--green-light)", fontSize:11 }}>{s.minute}'</span></>
                  : <span style={{ color:"var(--text-dim)", fontSize:11 }}>FT</span>
                }
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
