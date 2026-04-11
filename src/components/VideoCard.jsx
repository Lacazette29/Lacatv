import { useState } from "react";
import { fmtViews, timeAgo } from "../utils/helpers";
import { IcPlay, IcEye } from "./Icons";

export default function VideoCard({ video, onClick }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      className="card fade-in"
      onClick={() => onClick(video)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ cursor: "pointer" }}
    >
      {/* Thumbnail */}
      <div style={{
        position: "relative",
        aspectRatio: "16/9",
        background: "var(--surface2)",
        overflow: "hidden",
      }}>
        {/* Gradient bg (replace with real thumbnail img) */}
        <div style={{
          width: "100%",
          height: "100%",
          background: `linear-gradient(${video.bgGrad})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.3s ease",
          transform: hov ? "scale(1.04)" : "scale(1)",
        }}>
          {/* Pitch pattern overlay */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06 }} viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">
            <line x1="160" y1="0" x2="160" y2="180" stroke="white" strokeWidth="1" />
            <circle cx="160" cy="90" r="30" stroke="white" strokeWidth="1" fill="none" />
            <rect x="0" y="55" width="40" height="70" stroke="white" strokeWidth="1" fill="none" />
            <rect x="280" y="55" width="40" height="70" stroke="white" strokeWidth="1" fill="none" />
          </svg>
        </div>

        {/* Play overlay on hover */}
        {hov && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: "fadeIn 0.12s ease",
          }}>
            <div style={{
              width: 46,
              height: 46,
              background: "rgba(255,255,255,0.92)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--green-dark)",
            }}>
              <IcPlay size={18} fill="var(--green-dark)" stroke="none" />
            </div>
          </div>
        )}

        {/* Badges */}
        {video.isNew && (
          <span className="badge badge-new" style={{ position: "absolute", top: 8, left: 8 }}>New</span>
        )}
        {video.featured && (
          <span className="badge badge-feat" style={{ position: "absolute", top: 8, left: video.isNew ? 52 : 8 }}>Featured</span>
        )}

        {/* Duration */}
        {video.duration && (
          <span style={{
            position: "absolute",
            bottom: 7,
            right: 8,
            background: "rgba(0,0,0,0.82)",
            color: "#fff",
            fontSize: 11,
            fontWeight: 500,
            padding: "2px 6px",
            borderRadius: 4,
          }}>
            {video.duration}
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "10px 12px 12px" }}>
        <span className="badge badge-league" style={{ marginBottom: 6 }}>
          {video.leagueFlag} {video.league}
        </span>

        <div style={{
          fontSize: 13,
          fontWeight: 500,
          lineHeight: 1.45,
          color: "var(--text)",
          marginBottom: 6,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {video.title}
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 11,
          color: "var(--text-muted)",
        }}>
          <IcEye size={12} />
          <span>{fmtViews(video.views)}</span>
          <span style={{ color: "var(--border-light)" }}>·</span>
          <span>{timeAgo(video.uploadedAt)}</span>
        </div>
      </div>
    </div>
  );
}
