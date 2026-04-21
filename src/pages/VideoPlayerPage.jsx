import { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import Header from "../components/Header";
import ScoresTicker from "../components/ScoresTicker";
import { fmtViews, timeAgo } from "../utils/helpers";
import {
  IcThumbUp, IcBookmark, IcShare, IcArrowLeft,
  IcEye, IcClock,
} from "../components/Icons";

// ── Google AdSense slot (replace with your publisher ID) ──
function AdBanner({ slot = "horizontal" }) {
  useEffect(() => {
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {}
  }, []);

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      overflow: "hidden",
      textAlign: "center",
      marginBottom: 16,
      minHeight: slot === "horizontal" ? 90 : 250,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      {/* Replace data-ad-client and data-ad-slot with your own from AdSense */}
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-5457549513551541"
        data-ad-slot={slot === "horizontal" ? "2509457925" : "2679405359"}
        data-ad-format={slot === "horizontal" ? "square" : "horizontal"}
        data-full-width-responsive="true"
      />
      
    </div>
  );
}

// ── Betting affiliate button ──────────────────────────────
function BetButton({ video }) {
  const query = encodeURIComponent(video.title.split("—")[0].trim());
  return (
    <a
      href={`https://www.bet9ja.com/category/sports?q=${query}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 18px",
        borderRadius: 8,
        background: "linear-gradient(135deg, #006400, #009900)",
        color: "#fff",
        fontSize: 13,
        fontWeight: 600,
        textDecoration: "none",
        marginBottom: 16,
        transition: "opacity 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
      onMouseLeave={e => e.currentTarget.style.opacity = "1"}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
      Bet on Next Match — Bet9ja
    </a>
  );
}

export default function VideoPlayerPage() {
  const { currentVideo: video, videos, navigate, incrementViews } = useApp();
  const [liked,  setLiked]  = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (video?.id) incrementViews(video.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.id]);

  if (!video) { navigate("home"); return null; }

  const related = videos
    .filter(v => v.id !== video.id)
    .sort((a, b) => b.views - a.views)
    .slice(0, 8);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ActionBtn = ({ icon: Icon, label, active, activeStyle, onClick }) => (
    <button
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "7px 16px",
        borderRadius: 20,
        border: "1px solid var(--border)",
        background: "transparent",
        color: active ? "var(--text)" : "var(--text-muted)",
        fontSize: 13,
        transition: "all 0.15s",
        cursor: "pointer",
        ...(active ? activeStyle : {}),
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = "var(--surface2)"; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <Icon size={15} />
      {label}
    </button>
  );

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Header />
      <ScoresTicker />

      <div style={{ display: "flex", maxWidth: 1400, margin: "0 auto" }}>
        {/* Main player */}
        <div style={{ flex: 1, padding: "22px 24px", minWidth: 0 }}>

          {/* Top banner ad */}
          <AdBanner slot="horizontal" />

          {/* Video player */}
          <div style={{
            borderRadius: 12,
            overflow: "hidden",
            background: "#000",
            marginBottom: 16,
            aspectRatio: "16/9",
          }}>
            <video
              controls
              autoPlay
              style={{ width: "100%", height: "100%", display: "block" }}
              src={video.videoUrl}
            />
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 28,
            letterSpacing: "0.04em",
            lineHeight: 1.15,
            marginBottom: 12,
            color: "var(--text)",
          }}>
            {video.title}
          </h1>

          {/* Meta + actions */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            marginBottom: 16,
            paddingBottom: 16,
            borderBottom: "1px solid var(--border)",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              color: "var(--text-muted)",
              flexWrap: "wrap",
            }}>
              <span style={{ color: "var(--text-sec)" }}>{video.leagueFlag} {video.league}</span>
              <span style={{ color: "var(--border-light)" }}>·</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <IcEye size={13} /> {fmtViews(video.views)} views
              </span>
              <span style={{ color: "var(--border-light)" }}>·</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <IcClock size={13} /> {video.duration}
              </span>
              <span style={{ color: "var(--border-light)" }}>·</span>
              <span>{timeAgo(video.uploadedAt)}</span>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <ActionBtn
                icon={IcThumbUp}
                label={liked ? "Liked" : "Like"}
                active={liked}
                activeStyle={{ background: "rgba(34,160,80,0.15)", color: "var(--green-light)", borderColor: "rgba(34,160,80,0.3)" }}
                onClick={() => setLiked(!liked)}
              />
              <ActionBtn
                icon={IcBookmark}
                label={saved ? "Saved" : "Save"}
                active={saved}
                activeStyle={{ background: "rgba(240,180,41,0.15)", color: "var(--gold)", borderColor: "rgba(240,180,41,0.3)" }}
                onClick={() => setSaved(!saved)}
              />
              <ActionBtn
                icon={IcShare}
                label={copied ? "Copied!" : "Share"}
                active={copied}
                activeStyle={{ background: "rgba(59,130,246,0.15)", color: "#60a5fa", borderColor: "rgba(59,130,246,0.3)" }}
                onClick={handleShare}
              />
            </div>
          </div>

          {/* Bet9ja affiliate button */}
          <BetButton video={video} />

          {/* Description */}
          <div style={{
            background: "var(--surface)",
            borderRadius: 10,
            padding: 16,
            border: "1px solid var(--border)",
            marginBottom: 20,
          }}>
            <p style={{ fontSize: 13, lineHeight: 1.75, color: "var(--text-sec)", marginBottom: 12 }}>
              {video.description}
            </p>
            {video.tags?.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {video.tags.map(t => (
                  <span key={t} style={{
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-muted)",
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 20,
                  }}>
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Mid-content rectangle ad */}
          <AdBanner slot="rectangle" />

          <button className="btn btn-ghost" onClick={() => navigate("home")}>
            <IcArrowLeft size={15} /> Back to Home
          </button>
        </div>

        {/* Related videos sidebar */}
        <div style={{ width: 320, padding: "22px 24px 22px 0", flexShrink: 0 }}>
          <div className="section-title" style={{ fontSize: 16 }}>Up Next</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {related.map(v => (
              <div
                key={v.id}
                onClick={() => navigate("player", v)}
                style={{
                  display: "flex",
                  gap: 10,
                  cursor: "pointer",
                  padding: 8,
                  borderRadius: 8,
                  transition: "background 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{
                  flexShrink: 0,
                  width: 116,
                  aspectRatio: "16/9",
                  borderRadius: 6,
                  overflow: "hidden",
                  background: `linear-gradient(${v.bgGrad})`,
                  position: "relative",
                }}>
                  <span style={{
                    position: "absolute", bottom: 3, right: 4,
                    background: "rgba(0,0,0,0.82)", color: "#fff",
                    fontSize: 9, padding: "1px 4px", borderRadius: 3,
                  }}>
                    {v.duration}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 500, color: "var(--text)",
                    lineHeight: 1.4, marginBottom: 4,
                    display: "-webkit-box", WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {v.title}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{v.league}</div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{fmtViews(v.views)} views</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
