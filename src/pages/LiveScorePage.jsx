import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../utils/supabase";
import { useFootballScores } from "../hooks/useFootballScores";
import Header from "../components/Header";
import ScoresTicker from "../components/ScoresTicker";

export default function LiveScorePage() {
  const { currentScore, navigate } = useApp();
  const { scores, loading } = useFootballScores();
  const [match, setMatch] = useState(currentScore);

  // When scores refresh from API, update the current match view too
  useEffect(() => {
    if (!match?.id) return;
    const updated = scores.find(s => s.id === match.id);
    if (updated) setMatch(updated);
  }, [scores]);

  // Supabase realtime for this specific match
  useEffect(() => {
    if (!match?.id) return;
    const channel = supabase
      .channel(`match-${match.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_scores", filter: `id=eq.${match.id}` },
        (payload) => setMatch(payload.new)
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [match?.id]);

  const statusColor = (status) => {
    if (status === "live")     return "var(--green-light)";
    if (status === "ft")       return "var(--text-muted)";
    if (status === "upcoming") return "var(--gold)";
    return "var(--text-muted)";
  };

  const statusLabel = (status, minute) => {
    if (status === "live")     return `LIVE ${minute}'`;
    if (status === "ft")       return "Full Time";
    if (status === "upcoming") return "Upcoming";
    return status?.toUpperCase() || "";
  };

  const groupedScores = scores.reduce((acc, s) => {
    if (!acc[s.league]) acc[s.league] = [];
    acc[s.league].push(s);
    return acc;
  }, {});

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Header />
      <ScoresTicker />

      <div style={{ display: "flex", maxWidth: 1100, margin: "0 auto", padding: "24px 20px", gap: 24 }}>

        {/* ── Main match card ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <button
            onClick={() => navigate("home")}
            className="btn btn-ghost"
            style={{ marginBottom: 20, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
          >
            ← Back to highlights
          </button>

          {match ? (
            <div>
              {/* Match hero */}
              <div style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: "36px 28px",
                textAlign: "center",
                marginBottom: 20,
              }}>
                {/* League + Status */}
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginBottom: 28 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
                    {match.league}
                  </span>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    padding: "3px 12px", borderRadius: 20,
                    background: match.status === "live" ? "rgba(34,160,80,0.15)" : "var(--surface2)",
                    color: statusColor(match.status),
                    letterSpacing: "0.06em",
                    display: "flex", alignItems: "center", gap: 5,
                  }}>
                    {match.status === "live" && <span className="live-dot" />}
                    {statusLabel(match.status, match.minute)}
                  </span>
                </div>

                {/* Scoreline */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24, marginBottom: 28 }}>
                  {/* Home team */}
                  <div style={{ flex: 1, textAlign: "right" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em" }}>
                      {match.home_team}
                    </div>
                    {match.home_scorers?.length > 0 && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.8 }}>
                        {match.home_scorers.map((s, i) => <div key={i}>⚽ {s}</div>)}
                      </div>
                    )}
                  </div>

                  {/* Score box */}
                  <div style={{
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    padding: "18px 32px",
                    minWidth: 120,
                    flexShrink: 0,
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 48, fontWeight: 800, color: "var(--gold)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em", lineHeight: 1 }}>
                      {match.home_score} – {match.away_score}
                    </div>
                    {match.status === "live" && (
                      <div style={{ fontSize: 13, color: "var(--green-light)", marginTop: 8, fontWeight: 600 }}>
                        {match.minute}'
                      </div>
                    )}
                  </div>

                  {/* Away team */}
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em" }}>
                      {match.away_team}
                    </div>
                    {match.away_scorers?.length > 0 && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.8 }}>
                        {match.away_scorers.map((s, i) => <div key={i}>⚽ {s}</div>)}
                      </div>
                    )}
                  </div>
                </div>

                {match.status === "live" && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <span className="live-dot" />
                    Updating in real time · refreshes every 60s
                  </div>
                )}

                {match.match_date && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 12 }}>
                    {new Date(match.match_date).toLocaleDateString("en-GB", {
                      weekday: "long", day: "numeric", month: "long",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.2 }}>⚽</div>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>Select a match</div>
              <div style={{ fontSize: 13 }}>Click any match from the list on the right</div>
            </div>
          )}
        </div>

        {/* ── Sidebar — all matches grouped by league ── */}
        <div style={{ width: 290, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 14 }}>
            Today's Fixtures
          </div>

          {loading ? (
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Fetching scores...</div>
          ) : Object.keys(groupedScores).length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>
              No matches today
            </div>
          ) : (
            Object.entries(groupedScores).map(([league, matches]) => (
              <div key={league} style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)", marginBottom: 8, paddingLeft: 2 }}>
                  {league}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {matches.map(m => (
                    <div
                      key={m.id}
                      onClick={() => setMatch(m)}
                      style={{
                        background: match?.id === m.id ? "var(--surface2)" : "var(--surface)",
                        border: `1px solid ${match?.id === m.id ? "var(--green-mid)" : "var(--border)"}`,
                        borderRadius: 10,
                        padding: "9px 12px",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { if (match?.id !== m.id) e.currentTarget.style.borderColor = "var(--border-light)"; }}
                      onMouseLeave={e => { if (match?.id !== m.id) e.currentTarget.style.borderColor = "var(--border)"; }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "var(--text-sec)", fontWeight: 500, fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {m.home_team}
                        </span>
                        <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: 13, padding: "0 8px", flexShrink: 0 }}>
                          {m.home_score}–{m.away_score}
                        </span>
                        <span style={{ color: "var(--text-sec)", fontWeight: 500, fontSize: 12, flex: 1, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {m.away_team}
                        </span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
                        {m.status === "live" ? (
                          <span style={{ fontSize: 10, color: "var(--green-light)", display: "flex", alignItems: "center", gap: 3 }}>
                            <span className="live-dot" style={{ width: 5, height: 5 }} /> {m.minute}'
                          </span>
                        ) : m.status === "ft" ? (
                          <span style={{ fontSize: 10, color: "var(--text-dim)" }}>FT</span>
                        ) : (
                          <span style={{ fontSize: 10, color: "var(--gold)" }}>
                            {m.match_date ? new Date(m.match_date).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "Soon"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
