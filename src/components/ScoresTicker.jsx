import { useState, useEffect } from "react";
import { INIT_SCORES } from "../utils/data";

export default function ScoresTicker() {
  const [scores, setScores] = useState(INIT_SCORES);

  // Simulate live score updates
  useEffect(() => {
    const iv = setInterval(() => {
      setScores((prev) =>
        prev.map((s) => {
          if (!s.live) return s;
          const m = Math.min(90, s.minute + 1);
          let sc = s.score;
          if (Math.random() < 0.06) {
            const [h, a] = s.score.split("-").map(Number);
            sc = Math.random() < 0.5 ? `${h + 1}-${a}` : `${h}-${a + 1}`;
          }
          return { ...s, minute: m, score: sc, live: m < 90 };
        })
      );
    }, 9000);
    return () => clearInterval(iv);
  }, []);

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
            <div key={i} style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "0 22px",
              borderRight: "1px solid var(--border)",
              height: 36,
              fontSize: 12,
            }}>
              <span style={{ color: "var(--text-muted)", fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {s.league}
              </span>
              <span style={{ color: "var(--text-sec)", fontWeight: 500 }}>{s.home}</span>
              <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: 13, minWidth: 30, textAlign: "center" }}>
                {s.score}
              </span>
              <span style={{ color: "var(--text-sec)", fontWeight: 500 }}>{s.away}</span>
              {s.live ? (
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
