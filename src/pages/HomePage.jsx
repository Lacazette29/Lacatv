import { useState } from "react";
import { useApp } from "../context/AppContext";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ScoresTicker from "../components/ScoresTicker";
import Hero from "../components/Hero";
import VideoCard from "../components/VideoCard";
import { LEAGUES } from "../utils/data";

export default function HomePage() {
  const { videos, navigate } = useApp();
  const [league, setLeague] = useState("All");
  const [nav, setNav]       = useState("home");
  const [search, setSearch] = useState("");

  const featured = videos.find(v => v.featured) || videos[0];

  const filtered = videos
    .filter(v => {
      const ml = league === "All" || v.league === league;
      const ms = !search || [v.title, ...(v.tags || [])].join(" ").toLowerCase().includes(search.toLowerCase());
      if (nav === "trending") return ml && ms && v.views > 50000;
      return ml && ms;
    })
    .sort((a, b) =>
      nav === "trending"
        ? b.views - a.views
        : new Date(b.uploadedAt) - new Date(a.uploadedAt)
    );

  const sectionLabel =
    search        ? `Results for "${search}"` :
    nav === "trending" ? "Trending Today" :
    league !== "All"   ? `${league} Highlights` :
    "Latest Highlights";

  const sectionSub = search
    ? `${filtered.length} match${filtered.length !== 1 ? "es" : ""}`
    : "updated frequently";

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Header search={search} setSearch={setSearch} />
      <ScoresTicker />

      <div style={{ display: "flex" }}>
        <Sidebar
          activeLeague={league}
          setActiveLeague={setLeague}
          activeNav={nav}
          setActiveNav={setNav}
        />

        <main style={{ flex: 1, padding: "22px 26px", minWidth: 0, overflowX: "hidden" }}>
          {/* Hero */}
          {!search && nav === "home" && league === "All" && (
            <Hero video={featured} onClick={v => navigate("player", v)} />
          )}

          {/* League filter tabs */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
            {LEAGUES.map(l => (
              <button
                key={l}
                onClick={() => { setLeague(l); setNav(null); }}
                style={{
                  padding: "5px 15px",
                  borderRadius: 20,
                  border: "1px solid var(--border)",
                  background: league === l ? "var(--green-light)" : "transparent",
                  color: league === l ? "#fff" : "var(--text-muted)",
                  fontSize: 12,
                  fontWeight: league === l ? 500 : 400,
                  transition: "all 0.15s",
                }}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Section title */}
          <div className="section-title">
            {nav === "trending" ? "🔥 " : ""}
            {sectionLabel}
            <span>{sectionSub}</span>
          </div>

          {/* Video grid */}
          {filtered.length > 0 ? (
            <div className="video-grid">
              {filtered.map(v => (
                <VideoCard key={v.id} video={v} onClick={v => navigate("player", v)} />
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: "center",
              padding: "60px 20px",
              color: "var(--text-muted)",
            }}>
              <div style={{ fontSize: 48, marginBottom: 14, opacity: 0.3 }}>⚽</div>
              <div style={{ fontSize: 16, fontWeight: 500, marginBottom: 6 }}>No highlights found</div>
              <div style={{ fontSize: 13 }}>
                {search ? "Try a different search" : "Check back soon for new uploads"}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
