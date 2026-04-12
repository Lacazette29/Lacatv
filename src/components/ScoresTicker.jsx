import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../utils/supabase";

export default function ScoresTicker() {
  const { navigate, siteSettings } = useApp();
  const [scores, setScores]         = useState([]);
  const prevScoresRef               = useRef({});
  const [goalAlert, setGoalAlert]   = useState(null);

  useEffect(() => {
    fetchScores();

    // Realtime subscription — updates ticker instantly when score changes in DB
    const channel = supabase
      .channel("ticker-scores")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_scores" }, () => {
        fetchScores();
      })
      .subscribe();

    // Also poll Football API every 60s and sync to Supabase
    const pollInterval = setInterval(fetchFromAPI, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchScores() {
    const { data, error } = await supabase
      .from("live_scores")
      .select("*")
      .in("status", ["live", "ft"])
      .order("match_date", { ascending: false })
      .limit(20);

    if (error) { console.error("fetchScores:", error); return; }
    const fresh = data || [];

    // ── Goal notification detection ───────────────
    fresh.forEach(match => {
      const prev = prevScoresRef.current[match.id];
      if (prev && match.status === "live") {
        const prevTotal = (prev.home_score || 0) + (prev.away_score || 0);
        const newTotal  = (match.home_score || 0) + (match.away_score || 0);
        if (newTotal > prevTotal) {
          const scorer = match.home_score > prev.home_score
            ? `⚽ GOAL! ${match.home_team} ${match.home_score}-${match.away_score} ${match.away_team}`
            : `⚽ GOAL! ${match.home_team} ${match.home_score}-${match.away_score} ${match.away_team}`;
          setGoalAlert({ text: scorer, id: Date.now() });
          setTimeout(() => setGoalAlert(null), 5000);

          // Browser notification if permitted
          if (Notification.permission === "granted") {
            new Notification("⚽ GOAL!", { body: scorer, icon: "/favicon.png" });
          }
        }
      }
      prevScoresRef.current[match.id] = match;
    });

    setScores(fresh);
  }

  async function fetchFromAPI() {
    const API_KEY = process.env.REACT_APP_FOOTBALL_API_KEY;
    if (!API_KEY) return;

    try {
      const res  = await fetch("https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all", {
        headers: {
          "x-rapidapi-key":  API_KEY,
          "x-rapidapi-host": "api-football-v1.p.rapidapi.com",
        },
      });
      const json = await res.json();
      const fixtures = json.response || [];

      if (fixtures.length === 0) return;

      for (const f of fixtures) {
        const status = ["1H","HT","2H","ET","P","LIVE"].includes(f.fixture.status.short) ? "live"
          : ["FT","AET","PEN"].includes(f.fixture.status.short) ? "ft" : "upcoming";

        await supabase.from("live_scores").upsert({
          id:           String(f.fixture.id),
          league:       f.league.name,
          home_team:    f.teams.home.name,
          away_team:    f.teams.away.name,
          home_score:   f.goals.home  || 0,
          away_score:   f.goals.away  || 0,
          minute:       f.fixture.status.elapsed || 0,
          status,
          match_date:   f.fixture.date,
          home_scorers: (f.events||[]).filter(e=>e.type==="Goal"&&e.team.id===f.teams.home.id).map(e=>`${e.player.name} ${e.time.elapsed}'`),
          away_scorers: (f.events||[]).filter(e=>e.type==="Goal"&&e.team.id===f.teams.away.id).map(e=>`${e.player.name} ${e.time.elapsed}'`),
          updated_at:   new Date().toISOString(),
        }, { onConflict: "id" });
      }
    } catch (err) {
      console.error("API poll error:", err.message);
    }
  }

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  if (!siteSettings.tickerEnabled || scores.length === 0) return null;

  const doubled = [...scores, ...scores];

  return (
    <>
      {/* ── Goal alert toast ── */}
      {goalAlert && (
        <div style={{
          position: "fixed",
          top: 70,
          right: 20,
          background: "var(--green-dark)",
          border: "2px solid var(--gold)",
          borderRadius: 10,
          padding: "12px 20px",
          color: "var(--gold)",
          fontWeight: 700,
          fontSize: 14,
          zIndex: 9999,
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          animation: "slideIn 0.3s ease",
        }}>
          {goalAlert.text}
        </div>
      )}

      <div style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        height: 36,
        display: "flex",
        alignItems: "center",
        overflow: "hidden",
        flexShrink: 0,
      }}>
        {/* Label — clickable to go to full scores page */}
        <div
          onClick={() => navigate("scores", null)}
          style={{
            background: "var(--green)",
            color: "#fff",
            fontWeight: 600,
            fontSize: 11,
            padding: "0 14px",
            height: "100%",
            display: "flex",
            alignItems: "center",
            gap: 6,
            whiteSpace: "nowrap",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            flexShrink: 0,
            borderRight: "1px solid var(--border)",
            cursor: "pointer",
            transition: "background 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--green-light)"}
          onMouseLeave={e => e.currentTarget.style.background = "var(--green)"}
        >
          <span className="live-dot" style={{ background: "#fff" }} />
          Live Scores
        </div>

        {/* Scrolling ticker */}
        <div style={{ overflow: "hidden", flex: 1, display: "flex", alignItems: "center" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            animation: "tickerScroll 55s linear infinite",
            whiteSpace: "nowrap",
          }}>
            {doubled.map((s, i) => (
              <div
                key={i}
                onClick={() => navigate("scores", s)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0 22px",
                  borderRight: "1px solid var(--border)",
                  height: 36,
                  fontSize: 12,
                  cursor: "pointer",
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface2)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {s.league}
                </span>
                <span style={{ color: "var(--text-sec)", fontWeight: 500 }}>{s.home_team}</span>
                <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: 13, minWidth: 30, textAlign: "center" }}>
                  {s.home_score}-{s.away_score}
                </span>
                <span style={{ color: "var(--text-sec)", fontWeight: 500 }}>{s.away_team}</span>
                {s.status === "live" ? (
                  <>
                    <span className="live-dot" />
                    <span style={{ color: "var(--green-light)", fontSize: 11 }}>{s.minute}&apos;</span>
                  </>
                ) : (
                  <span style={{ color: "var(--text-dim)", fontSize: 11 }}>FT</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
