import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import Header from "../components/Header";
import ScoresTicker from "../components/ScoresTicker";
import { fmtViews, timeAgo } from "../utils/helpers";
import {
  IcThumbUp, IcBookmark, IcShare, IcArrowLeft,
  IcEye, IcClock,
} from "../components/Icons";

// ── Detect video type and render appropriately ──
function VideoPlayer({ url, title }) {
  const [error, setError] = useState(false);

  if (!url) return (
    <div style={{ width:"100%", aspectRatio:"16/9", background:"#000", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:12 }}>
      <div style={{ textAlign:"center", color:"rgba(255,255,255,0.4)" }}>
        <div style={{ fontSize:48, marginBottom:8 }}>🎬</div>
        <div style={{ fontSize:14 }}>No video source</div>
      </div>
    </div>
  );

  // YouTube URL detection
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    const videoId = ytMatch[1];
    return (
      <div style={{ width:"100%", aspectRatio:"16/9", borderRadius:12, overflow:"hidden", background:"#000" }}>
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ display:"block", width:"100%", height:"100%" }}
        />
      </div>
    );
  }

  // Direct video file (MP4, Supabase storage, etc.)
  if (!error) return (
    <div style={{ width:"100%", aspectRatio:"16/9", borderRadius:12, overflow:"hidden", background:"#000" }}>
      <video
        controls
        autoPlay
        playsInline
        preload="metadata"
        onError={() => setError(true)}
        style={{ width:"100%", height:"100%", display:"block", objectFit:"contain" }}
      >
        <source src={url} type="video/mp4" />
        <source src={url} type="video/webm" />
        <source src={url} type="video/ogg" />
        Your browser does not support video playback.
      </video>
    </div>
  );

  // Error fallback
  return (
    <div style={{ width:"100%", aspectRatio:"16/9", background:"#0a0a0a", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:12, border:"1px solid var(--border)" }}>
      <div style={{ textAlign:"center", color:"rgba(255,255,255,0.5)", padding:20 }}>
        <div style={{ fontSize:48, marginBottom:12 }}>⚠️</div>
        <div style={{ fontSize:15, fontWeight:500, marginBottom:8 }}>Video could not be loaded</div>
        <div style={{ fontSize:12, marginBottom:16, opacity:0.7 }}>The file may still be processing or the URL is invalid</div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color:"var(--gold)", fontSize:13, textDecoration:"underline" }}
        >
          Open video directly ↗
        </a>
      </div>
    </div>
  );
}

// ── Betting affiliate banner ──────────────────
function BetBanner({ video }) {
  const query = encodeURIComponent((video.title || "").split("—")[0].trim());
  return (
    <a
      href={`https://www.bet9ja.com/category/sports?q=${query}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"12px 18px", borderRadius:10,
        background:"linear-gradient(135deg, rgba(0,100,0,0.3), rgba(0,80,0,0.2))",
        border:"1px solid rgba(0,160,0,0.3)",
        textDecoration:"none", marginBottom:16,
        transition:"all 0.15s",
      }}
      onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(0,200,0,0.5)"}
      onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(0,160,0,0.3)"}
    >
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <span style={{ fontSize:20 }}>🎰</span>
        <div>
          <div style={{ fontSize:13, fontWeight:600, color:"#22c55e" }}>Bet on the next match</div>
          <div style={{ fontSize:11, color:"var(--text-muted)" }}>Best odds on Bet9ja · 18+</div>
        </div>
      </div>
      <span style={{ fontSize:12, color:"var(--gold)", fontWeight:600 }}>Bet Now →</span>
    </a>
  );
}

export default function VideoPlayerPage() {
  const { currentVideo: video, videos, navigate, incrementViews } = useApp();
  const [liked,  setLiked]  = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [copied, setCopied] = useState(false);
  const viewTracked = useRef(false);

  useEffect(() => {
    if (video?.id && !viewTracked.current) {
      viewTracked.current = true;
      incrementViews(video.id);
    }
  }, [video?.id, incrementViews]);

  if (!video) { navigate("home"); return null; }

  const related = videos
    .filter(v => v.id !== video.id && (v.league === video.league || v.tags?.some(t => video.tags?.includes(t))))
    .sort((a, b) => b.views - a.views)
    .slice(0, 6)
    .concat(
      videos.filter(v => v.id !== video.id && v.league !== video.league)
        .sort((a,b) => b.views - a.views)
        .slice(0, 4)
    )
    .slice(0, 8);

  const handleShare = () => {
    const shareUrl = `${window.location.origin}?v=${video.id}`;
    navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const ActionBtn = ({ icon: Icon, label, active, activeStyle, onClick }) => (
    <button
      onClick={onClick}
      style={{
        display:"inline-flex", alignItems:"center", gap:7,
        padding:"7px 16px", borderRadius:20,
        border:"1px solid var(--border)", background:"transparent",
        color: active ? "var(--text)" : "var(--text-muted)",
        fontSize:13, transition:"all 0.15s", cursor:"pointer",
        ...(active ? activeStyle : {}),
      }}
      onMouseEnter={e=>{ if(!active) e.currentTarget.style.background="var(--surface2)"; }}
      onMouseLeave={e=>{ if(!active) e.currentTarget.style.background="transparent"; }}
    >
      <Icon size={15}/> {label}
    </button>
  );

  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh" }}>
      <Header />
      <ScoresTicker />

      <div style={{ display:"flex", maxWidth:1400, margin:"0 auto" }}>
        {/* Main player column */}
        <div style={{ flex:1, padding:"20px 24px", minWidth:0 }}>

          {/* Video player */}
          <VideoPlayer url={video.videoUrl} title={video.title} />

          {/* Title */}
          <h1 style={{
            fontFamily:"'Bebas Neue',sans-serif",
            fontSize:28, letterSpacing:"0.04em",
            lineHeight:1.15, margin:"16px 0 12px",
            color:"var(--text)",
          }}>
            {video.title}
          </h1>

          {/* Meta + actions */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            flexWrap:"wrap", gap:12, marginBottom:16,
            paddingBottom:16, borderBottom:"1px solid var(--border)",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:10, fontSize:13, color:"var(--text-muted)", flexWrap:"wrap" }}>
              <span style={{ background:"var(--surface2)", border:"1px solid var(--border)", padding:"3px 10px", borderRadius:20, fontSize:12, color:"var(--text-sec)", fontWeight:500 }}>
                {video.leagueFlag} {video.league}
              </span>
              <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                <IcEye size={13}/> {fmtViews(video.views)} views
              </span>
              {video.duration && (
                <span style={{ display:"flex", alignItems:"center", gap:4 }}>
                  <IcClock size={13}/> {video.duration}
                </span>
              )}
              <span>{timeAgo(video.uploadedAt)}</span>
            </div>

            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              <ActionBtn icon={IcThumbUp} label={liked?"Liked":"Like"} active={liked}
                activeStyle={{ background:"rgba(34,160,80,0.15)", color:"var(--green-light)", borderColor:"rgba(34,160,80,0.3)" }}
                onClick={()=>setLiked(!liked)} />
              <ActionBtn icon={IcBookmark} label={saved?"Saved":"Save"} active={saved}
                activeStyle={{ background:"rgba(240,180,41,0.15)", color:"var(--gold)", borderColor:"rgba(240,180,41,0.3)" }}
                onClick={()=>setSaved(!saved)} />
              <ActionBtn icon={IcShare} label={copied?"Copied!":"Share"} active={copied}
                activeStyle={{ background:"rgba(59,130,246,0.15)", color:"#60a5fa", borderColor:"rgba(59,130,246,0.3)" }}
                onClick={handleShare} />
            </div>
          </div>

          {/* Bet9ja affiliate */}
          <BetBanner video={video} />

          {/* Description */}
          {video.description && (
            <div style={{ background:"var(--surface)", borderRadius:10, padding:"14px 16px", border:"1px solid var(--border)", marginBottom:16 }}>
              <p style={{ fontSize:13, lineHeight:1.75, color:"var(--text-sec)", marginBottom: video.tags?.length ? 12 : 0 }}>
                {video.description}
              </p>
              {video.tags?.length > 0 && (
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {video.tags.map(t=>(
                    <span key={t} style={{ background:"var(--surface2)", border:"1px solid var(--border)", color:"var(--text-muted)", fontSize:11, padding:"3px 10px", borderRadius:20 }}>
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <button className="btn btn-ghost" onClick={()=>navigate("home")} style={{ fontSize:13 }}>
            <IcArrowLeft size={15}/> Back to Home
          </button>
        </div>

        {/* Related videos sidebar */}
        <div style={{ width:300, padding:"20px 20px 20px 0", flexShrink:0 }}>
          <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--text-muted)", marginBottom:14 }}>
            Up Next
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {related.map(v=>(
              <div
                key={v.id}
                onClick={()=>navigate("player",v)}
                style={{
                  display:"flex", gap:10, cursor:"pointer",
                  padding:8, borderRadius:8, transition:"background 0.15s",
                  border:"1px solid transparent",
                }}
                onMouseEnter={e=>{ e.currentTarget.style.background="var(--surface)"; e.currentTarget.style.borderColor="var(--border)"; }}
                onMouseLeave={e=>{ e.currentTarget.style.background="transparent"; e.currentTarget.style.borderColor="transparent"; }}
              >
                {/* Thumbnail */}
                <div style={{
                  flexShrink:0, width:120, aspectRatio:"16/9",
                  borderRadius:6, overflow:"hidden",
                  background:`linear-gradient(${v.bgGrad})`,
                  position:"relative",
                }}>
                  {/* Play icon overlay */}
                  <div style={{
                    position:"absolute", inset:0,
                    display:"flex", alignItems:"center", justifyContent:"center",
                  }}>
                    <div style={{
                      width:28, height:28, borderRadius:"50%",
                      background:"rgba(0,0,0,0.55)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                    }}>
                      <svg width="10" height="12" viewBox="0 0 10 12" fill="white">
                        <path d="M0 0L10 6L0 12V0Z"/>
                      </svg>
                    </div>
                  </div>
                  {/* Duration badge */}
                  {v.duration && (
                    <span style={{
                      position:"absolute", bottom:3, right:4,
                      background:"rgba(0,0,0,0.85)", color:"#fff",
                      fontSize:9, padding:"1px 4px", borderRadius:3,
                    }}>
                      {v.duration}
                    </span>
                  )}
                  {/* NEW badge */}
                  {v.isNew && (
                    <span style={{
                      position:"absolute", top:3, left:4,
                      background:"var(--green-light)", color:"#fff",
                      fontSize:8, padding:"1px 5px", borderRadius:3, fontWeight:700,
                    }}>
                      NEW
                    </span>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{
                    fontSize:12, fontWeight:500, color:"var(--text)",
                    lineHeight:1.4, marginBottom:4,
                    display:"-webkit-box", WebkitLineClamp:2,
                    WebkitBoxOrient:"vertical", overflow:"hidden",
                  }}>
                    {v.title}
                  </div>
                  <div style={{ fontSize:11, color:"var(--text-muted)", marginBottom:2 }}>
                    {v.leagueFlag} {v.league}
                  </div>
                  <div style={{ fontSize:11, color:"var(--text-dim)" }}>
                    {fmtViews(v.views)} views
                  </div>
                </div>
              </div>
            ))}

            {related.length === 0 && (
              <div style={{ fontSize:12, color:"var(--text-muted)", textAlign:"center", padding:"20px 0" }}>
                More videos coming soon
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
