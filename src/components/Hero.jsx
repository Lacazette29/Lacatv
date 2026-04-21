import { fmtViews, timeAgo } from "../utils/helpers";
import { IcPlay, IcRadio } from "./Icons";

export default function Hero({ video, onClick }) {
  if (!video) return null;

  return (
    <div
      onClick={() => onClick(video)}
      style={{
        position: "relative",
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 24,
        aspectRatio: "21/8",
        cursor: "pointer",
        minHeight: 180,
      }}
    >
      {/* Background */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(${video.bgGrad})`,
      }} />

      {/* Pitch SVG */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.05 }}
        viewBox="0 0 800 300"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect x="20" y="20" width="760" height="260" stroke="white" strokeWidth="1.5" fill="none" />
        <line x1="400" y1="20" x2="400" y2="280" stroke="white" strokeWidth="1.5" />
        <circle cx="400" cy="150" r="60" stroke="white" strokeWidth="1.5" fill="none" />
        <circle cx="400" cy="150" r="5" fill="white" />
        <rect x="20" y="95" width="100" height="110" stroke="white" strokeWidth="1.5" fill="none" />
        <rect x="680" y="95" width="100" height="110" stroke="white" strokeWidth="1.5" fill="none" />
        <rect x="20" y="115" width="50" height="70" stroke="white" strokeWidth="1.5" fill="none" />
        <rect x="730" y="115" width="50" height="70" stroke="white" strokeWidth="1.5" fill="none" />
      </svg>

      {/* Gradient overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(90deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.1) 100%)",
      }} />

      {/* Content */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        padding: "24px 32px",
      }}>
        <div style={{ maxWidth: 520 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 10,
          }}>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--gold)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}>
              {video.leagueFlag} {video.league}
            </span>
            <span style={{
              background: "rgba(240,180,41,0.15)",
              color: "var(--gold)",
              border: "1px solid rgba(240,180,41,0.3)",
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 4,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}>
              Featured
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(22px, 3vw, 36px)",
            letterSpacing: "0.04em",
            lineHeight: 1.1,
            color: "#fff",
            marginBottom: 10,
          }}>
            {video.title}
          </h1>

          <p style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.55)",
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}>
            <span>{fmtViews(video.views)} views</span>
            <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
            <span>{timeAgo(video.uploadedAt)}</span>
            <span style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
            <span>{video.duration}</span>
          </p>

          <button
            className="btn btn-gold"
            style={{ borderRadius: 24, padding: "10px 24px", fontSize: 14 }}
          >
            <IcPlay size={14} fill="var(--green-dark)" stroke="none" />
            Watch Now
          </button>
        </div>
      </div>

      {/* Hover play indicator */}
      <div style={{
        position: "absolute",
        bottom: 14,
        right: 20,
        display: "flex",
        alignItems: "center",
        gap: 6,
        color: "rgba(255,255,255,0.5)",
        fontSize: 12,
      }}>
        <IcRadio size={14} />
        <span>Click to watch</span>
      </div>
    </div>
  );
}
