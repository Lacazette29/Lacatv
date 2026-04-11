import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { supabase } from "../utils/supabase";
import Header from "../components/Header";
import ScoresTicker from "../components/ScoresTicker";

export default function LiveScorePage() {
  const { currentScore, navigate } = useApp();
  const [match, setMatch] = useState(currentScore);
  const [allMatches, setAllMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Fetch all today's matches for sidebar ─────
  useEffect(() => {
    fetchAllMatches();
  }, []);

  async function fetchAllMatches() {
    const { data } = await supabase
      .from("live_scores")
      .select("*")
      .order("match_date", { ascending: true });
    setAllMatches(data || []);
    setLoading(false);
  }

  // ── Subscribe to realtime updates for this match
  useEffect(() => {
    if (!match?.id) return;

    const channel = supabase
      .channel(`match-${match.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "live_scores", filter: `id=eq.${match.id}` },
        (payload) => {
          setMatch(payload.new);
          // Also update in the all matches list
          setAllMatches(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
        }
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
    return status;
  };

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Header />
      <ScoresTicker />

      <div style={{ display: "flex", maxWidth: 1100, margin: "0 auto", padding: "24px 20px", gap: 24 }}>

        {/* Main match card */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {match ? (
            <div>
              {/* Back button */}
              <button
                onClick={() => navigate("home")}
                className="btn btn-ghost"
                style={{ marginBottom: 20, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
              >
                ← Back to highlights
              </button>

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
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginBottom: 24 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)" }}>
                    {match.league}
                  </span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 20,
                    background: match.status === "live" ? "rgba(34,160,80,0.15)" : "var(--surface2)",
                    color: statusColor(match.status),
                    letterSpacing: "0.06em",
                  }}>
                    {match.status === "live" && <span className="live-dot" style={{ marginRight: 5 }} />}
                    {statusLabel(match.status, match.minute)}
                  </span>
                </div>

                {/* Scoreline */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 32, marginBottom: 28 }}>
                  <div style={{ flex: 1, textAlign: "right" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em" }}>
                      {match.home_team}
                    </div>
                    {match.home_scorers?.length > 0 && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.6 }}>
                        {match.home_scorers.map((s, i) => <div key={i}>⚽ {s}</div>)}
                      </div>
                    )}
                  </div>

                  <div style={{
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: "16px 28px",
                    minWidth: 110,
                    flexShrink: 0,
                  }}>
                    <div style={{ fontSize: 42, fontWeight: 800, color: "var(--gold)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.05em", lineHeight: 1 }}>
                      {match.home_score} – {match.away_score}
                    </div>
                    {match.status === "live" && (
                      <div style={{ fontSize: 12, color: "var(--green-light)", marginTop: 6, fontWeight: 600 }}>
                        {match.minute}'
                      </div>
                    )}
                  </div>

                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: "0.04em" }}>
                      {match.away_team}
                    </div>
                    {match.away_scorers?.length > 0 && (
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, lineHeight: 1.6 }}>
                        {match.away_scorers.map((s, i) => <div key={i}>⚽ {s}</div>)}
                      </div>
                    )}
                  </div>
                </div>

                {match.status === "live" && (
                  <div style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    <span className="live-dot" />
                    Updating in real time
                  </div>
                )}
              </div>

              {/* Match date */}
              {match.match_date && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                  {new Date(match.match_date).toLocaleDateString("en-GB", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric",
                    hour: "2-digit", minute: "2-digit"
                  })}
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: 48, marginBottom: 14, opacity: 0.3 }}>⚽</div>
              <div style={{ fontSize: 16, fontWeight: 500 }}>Select a match from the sidebar</div>
            </div>
          )}
        </div>

        {/* Sidebar — all matches */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 12 }}>
            All Matches
          </div>
          {loading ? (
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>Loading...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {allMatches.map(m => (
                <div
                  key={m.id}
                  onClick={() => setMatch(m)}
                  style={{
                    background: match?.id === m.id ? "var(--surface2)" : "var(--surface)",
                    border: `1px solid ${match?.id === m.id ? "var(--green-mid)" : "var(--border)"}`,
                    borderRadius: 10,
                    padding: "10px 14px",
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (match?.id !== m.id) e.currentTarget.style.borderColor = "var(--border-light)"; }}
                  onMouseLeave={e => { if (match?.id !== m.id) e.currentTarget.style.borderColor = "var(--border)"; }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)" }}>
                      {m.league}
                    </span>
                    <span style={{ fontSize: 10, color: statusColor(m.status), fontWeight: 600 }}>
                      {m.status === "live" ? `${m.minute}'` : m.status === "ft" ? "FT" : ""}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                    <span style={{ color: "var(--text-sec)", fontWeight: 500, flex: 1 }}>{m.home_team}</span>
                    <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: 13, padding: "0 8px" }}>
                      {m.home_score}–{m.away_score}
                    </span>
                    <span style={{ color: "var(--text-sec)", fontWeight: 500, flex: 1, textAlign: "right" }}>{m.away_team}</span>
                  </div>
                  {m.status === "live" && (
                    <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                      <span className="live-dot" style={{ width: 5, height: 5 }} />
                      <span style={{ fontSize: 10, color: "var(--green-light)" }}>Live</span>
                    </div>
                  )}
                </div>
              ))}
              {allMatches.length === 0 && (
                <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center", padding: "20px 0" }}>
                  No matches today
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
