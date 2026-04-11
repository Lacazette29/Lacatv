import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import { useApp } from "../context/AppContext";

export default function ScoresTicker() {
  const { navigate, siteSettings } = useApp();
  const [scores, setScores] = useState([]);

  // ── Fetch scores from Supabase ────────────────
  useEffect(() => {
    fetchScores();

    // Realtime subscription
    const channel = supabase
      .channel("live-scores-ticker")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_scores" }, () => {
        fetchScores();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchScores() {
    const { data, error } = await supabase
      .from("live_scores")
      .select("*")
      .in("status", ["live", "ft"])
      .order("match_date", { ascending: false })
      .limit(20);
    if (error) { console.error("fetchScores:", error); return; }
    setScores(data || []);
  }

  // Don't render if ticker is disabled in settings or no scores
  if (!siteSettings.tickerEnabled || scores.length === 0) return null;

  const doubled = [...scores, ...scores];

  return (
    <div style={{
      background: "var(--surface)",
      borderBottom: "1px solid var(--border)",
      height: 36,
      display: "flex",
      alignItems: "center",
      overflow: "hidden",
      flexShrink: 0,
    }}>
      {/* Label */}
      <div style={{
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
      }}>
        <span className="live-dot" style={{ background: "#fff" }} />
        Scores
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
  );
}
