import { useState } from "react";
import { useApp } from "../context/AppContext";
import AdminLogin from "./AdminLogin";
import Header from "../components/Header";
import { fmtViews, timeAgo, fmtDate } from "../utils/helpers";
import { BG_GRADS, LEAGUES } from "../utils/data";
import {
  IcUpload, IcFilm, IcSettings, IcTrash, IcEdit,
  IcBarChart, IcStar, IcCheck, IcLogOut, IcPlusCircle,
  IcGlobe, IcEye, IcClock, IcRadio, IcLock,
} from "../components/Icons";

// ── Shared input styles ───────────────────────
const inp = {
  background: "var(--surface2)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "10px 14px",
  color: "var(--text)",
  width: "100%",
  fontSize: 13,
  outline: "none",
};

const TABS = [
  { id: "upload",  Icon: IcUpload,   label: "Upload"    },
  { id: "videos",  Icon: IcFilm,     label: "Videos"    },
  { id: "analytics", Icon: IcBarChart, label: "Analytics" },
  { id: "settings", Icon: IcSettings, label: "Settings"  },
];

// ── UPLOAD TAB ────────────────────────────────
function UploadTab() {
  const { addVideo } = useApp();
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({
    title: "", league: "Premier League", duration: "",
    videoUrl: "", description: "", tags: "",
    isNew: true, featured: false,
    bgGrad: "135deg,#0a2e18,#1a5e32",
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const notify = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000); };

  const publish = () => {
    if (!form.title.trim()) return notify("error", "Title is required.");
    if (!form.videoUrl.trim()) return notify("error", "Video URL is required.");
    addVideo({
      ...form,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      leagueFlag: LEAGUES.find(l => l === form.league) ? "🏆" : "⚽",
    });
    notify("success", "Video published successfully!");
    setForm({ title: "", league: "Premier League", duration: "", videoUrl: "", description: "", tags: "", isNew: true, featured: false, bgGrad: "135deg,#0a2e18,#1a5e32" });
  };

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 28 }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: "0.05em", marginBottom: 22 }}>
        Upload New Highlight
      </div>

      {msg && (
        <div className={`toast toast-${msg.type}`} style={{ marginBottom: 18 }}>
          {msg.type === "success" ? <IcCheck size={14} /> : null} {msg.text}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <label className="label">Video Title *</label>
          <input className="input" placeholder="e.g. Arsenal 3-1 Chelsea — Premier League Highlights" value={form.title} onChange={e => set("title", e.target.value)} />
        </div>

        <div>
          <label className="label">League *</label>
          <select style={inp} value={form.league} onChange={e => set("league", e.target.value)}>
            {["Premier League","La Liga","Bundesliga","Serie A","Champions League","NPFL","AFCON","Ligue 1","Europa League","World Cup"].map(l => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Duration (e.g. 8:24)</label>
          <input className="input" placeholder="8:24" value={form.duration} onChange={e => set("duration", e.target.value)} />
        </div>

        <div style={{ gridColumn: "1/-1" }}>
          <label className="label">Video URL * (MP4, YouTube embed, CDN link)</label>
          <input className="input" placeholder="https://..." value={form.videoUrl} onChange={e => set("videoUrl", e.target.value)} />
        </div>

        <div style={{ gridColumn: "1/-1" }}>
          <label className="label">Description</label>
          <textarea className="input" style={{ height: 80, resize: "vertical" }} placeholder="Match summary, key moments, goalscorers..." value={form.description} onChange={e => set("description", e.target.value)} />
        </div>

        <div>
          <label className="label">Tags (comma-separated)</label>
          <input className="input" placeholder="Arsenal, Chelsea, Premier League" value={form.tags} onChange={e => set("tags", e.target.value)} />
        </div>

        <div>
          <label className="label">Card Colour Theme</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
            {BG_GRADS.map(g => (
              <div
                key={g.value}
                title={g.label}
                onClick={() => set("bgGrad", g.value)}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  background: `linear-gradient(${g.value})`,
                  cursor: "pointer",
                  border: form.bgGrad === g.value ? "2.5px solid var(--gold)" : "2.5px solid transparent",
                  boxSizing: "border-box",
                  transition: "border-color 0.1s",
                }}
              />
            ))}
          </div>
        </div>

        <div style={{ gridColumn: "1/-1", display: "flex", gap: 24 }}>
          {[
            { key: "isNew",    label: "Mark as NEW"              },
            { key: "featured", label: "Feature on Homepage Hero" },
          ].map(({ key, label }) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--text-sec)" }}>
              <div style={{
                width: 18, height: 18,
                borderRadius: 4,
                border: `1.5px solid ${form[key] ? "var(--green-light)" : "var(--border)"}`,
                background: form[key] ? "var(--green-light)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.15s", flexShrink: 0,
              }}>
                {form[key] && <IcCheck size={11} stroke="#fff" strokeWidth={3} />}
              </div>
              <input type="checkbox" checked={form[key]} onChange={e => set(key, e.target.checked)} style={{ display: "none" }} />
              {label}
            </label>
          ))}
        </div>
      </div>

      <button className="btn btn-primary" onClick={publish} style={{ marginTop: 22, padding: "11px 28px", fontSize: 14 }}>
        <IcUpload size={15} /> Publish Video
      </button>
    </div>
  );
}

// ── VIDEOS TAB ────────────────────────────────
function VideosTab() {
  const { videos, deleteVideo, toggleFeatured, updateVideo } = useApp();
  const [search, setSearch] = useState("");
  const [editId, setEditId] = useState(null);

  const list = videos.filter(v =>
    !search || v.title.toLowerCase().includes(search.toLowerCase()) || v.league.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: "0.05em" }}>
          All Videos ({videos.length})
        </div>
        <input
          className="input"
          placeholder="Search videos..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 220 }}
        />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map(v => (
          <div key={v.id} style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 14,
            transition: "border-color 0.15s",
          }}>
            {/* Thumb */}
            <div style={{
              width: 72,
              height: 46,
              borderRadius: 6,
              background: `linear-gradient(${v.bgGrad})`,
              flexShrink: 0,
              position: "relative",
              overflow: "hidden",
            }}>
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.08 }} viewBox="0 0 72 46">
                <line x1="36" y1="0" x2="36" y2="46" stroke="white" strokeWidth="0.6" />
                <circle cx="36" cy="23" r="10" stroke="white" strokeWidth="0.6" fill="none" />
              </svg>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {v.title}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span>{v.league}</span>
                <span style={{ color: "var(--border-light)" }}>·</span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><IcEye size={11} /> {fmtViews(v.views)}</span>
                <span style={{ color: "var(--border-light)" }}>·</span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><IcClock size={11} /> {timeAgo(v.uploadedAt)}</span>
                {v.isNew && <span className="badge badge-new">New</span>}
                {v.featured && <span className="badge badge-feat">Featured</span>}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button
                title={v.featured ? "Remove from featured" : "Set as featured"}
                onClick={() => toggleFeatured(v.id)}
                className="btn btn-ghost"
                style={{ padding: "5px 10px", color: v.featured ? "var(--gold)" : "var(--text-muted)" }}
              >
                <IcStar size={14} fill={v.featured ? "var(--gold)" : "none"} />
              </button>
              <button
                onClick={() => deleteVideo(v.id)}
                className="btn btn-danger"
                style={{ padding: "5px 12px", fontSize: 12 }}
              >
                <IcTrash size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {list.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
          No videos match your search
        </div>
      )}
    </div>
  );
}

// ── ANALYTICS TAB ─────────────────────────────
function AnalyticsTab() {
  const { videos } = useApp();

  const totalViews    = videos.reduce((s, v) => s + v.views, 0);
  const totalVideos   = videos.length;
  const leagueCount   = [...new Set(videos.map(v => v.league))].length;
  const topVideo      = [...videos].sort((a, b) => b.views - a.views)[0];
  const recentUploads = [...videos].sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)).slice(0, 5);

  const leagueStats = Object.entries(
    videos.reduce((acc, v) => {
      acc[v.league] = (acc[v.league] || 0) + v.views;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const maxLeagueViews = leagueStats[0]?.[1] || 1;

  return (
    <div>
      {/* Stat cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 14, marginBottom: 26 }}>
        {[
          { Icon: IcEye,    label: "Total Views",     val: fmtViews(totalViews) },
          { Icon: IcFilm,   label: "Videos",          val: totalVideos           },
          { Icon: IcRadio,  label: "Leagues",         val: leagueCount           },
          { Icon: IcStar,   label: "Featured",        val: videos.filter(v=>v.featured).length },
        ].map(({ Icon, label, val }) => (
          <div key={label} className="stat-card">
            <Icon size={18} stroke="var(--green-light)" />
            <div className="stat-value">{val}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Views by league */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: "0.05em", marginBottom: 16 }}>
            Views by League
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {leagueStats.map(([league, views]) => (
              <div key={league}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                  <span style={{ color: "var(--text-sec)" }}>{league}</span>
                  <span style={{ color: "var(--text-muted)" }}>{fmtViews(views)}</span>
                </div>
                <div style={{ height: 5, background: "var(--surface3)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%",
                    width: `${(views / maxLeagueViews) * 100}%`,
                    background: "var(--green-light)",
                    borderRadius: 3,
                    transition: "width 0.6s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent activity */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: "0.05em", marginBottom: 16 }}>
            Recent Uploads
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recentUploads.map(v => (
              <div key={v.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{
                  width: 44,
                  height: 28,
                  borderRadius: 4,
                  background: `linear-gradient(${v.bgGrad})`,
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text)" }}>
                    {v.title}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{timeAgo(v.uploadedAt)}</div>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{fmtViews(v.views)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top video */}
      {topVideo && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--green-mid)", borderRadius: 14, padding: 20, marginTop: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--green-light)", marginBottom: 8 }}>
            Most Viewed
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text)", marginBottom: 4 }}>{topVideo.title}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {fmtViews(topVideo.views)} views · {topVideo.league} · {fmtDate(topVideo.uploadedAt)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── SETTINGS TAB ──────────────────────────────
function SettingsTab() {
  const { siteSettings, setSiteSettings } = useApp();
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setSiteSettings(p => ({ ...p, [k]: v }));

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {saved && (
        <div className="toast toast-success">
          <IcCheck size={14} /> Settings saved successfully
        </div>
      )}

      {/* Site identity */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <IcGlobe size={16} stroke="var(--green-light)" />
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, letterSpacing: "0.05em" }}>Site Identity</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div>
            <label className="label">Site Name</label>
            <input className="input" value={siteSettings.siteName} onChange={e => set("siteName", e.target.value)} />
          </div>
          <div>
            <label className="label">Tagline</label>
            <input className="input" value={siteSettings.tagline} onChange={e => set("tagline", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <IcSettings size={16} stroke="var(--green-light)" />
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, letterSpacing: "0.05em" }}>Features</div>
        </div>
        {[
          { key: "tickerEnabled",    label: "Live Scores Ticker",    desc: "Show live score ticker at top of site" },
          { key: "maintenanceMode",  label: "Maintenance Mode",      desc: "Show maintenance page to visitors" },
          { key: "allowComments",    label: "Comments",              desc: "Allow comments on video pages (coming soon)" },
        ].map(({ key, label, desc }) => (
          <div key={key} style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 0",
            borderBottom: "1px solid var(--border)",
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{desc}</div>
            </div>
            {/* Toggle */}
            <div
              onClick={() => set(key, !siteSettings[key])}
              style={{
                width: 44,
                height: 24,
                borderRadius: 12,
                background: siteSettings[key] ? "var(--green-light)" : "var(--surface3)",
                border: "1px solid var(--border)",
                position: "relative",
                cursor: "pointer",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
            >
              <div style={{
                position: "absolute",
                top: 2,
                left: siteSettings[key] ? 22 : 2,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: "#fff",
                transition: "left 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
              }} />
            </div>
          </div>
        ))}
      </div>

      {/* Admin password */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <IcLock size={16} stroke="var(--green-light)" />
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, letterSpacing: "0.05em" }}>Security</div>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.6 }}>
          Admin password is set in <code style={{ color: "var(--gold-dark)", background: "var(--surface2)", padding: "2px 6px", borderRadius: 4 }}>src/utils/data.js</code> — update the <code style={{ color: "var(--gold-dark)", background: "var(--surface2)", padding: "2px 6px", borderRadius: 4 }}>ADMIN_PASSWORD</code> constant before deploying. For production, replace with Supabase Auth.
        </p>
        <div style={{ display: "flex", gap: 8, padding: "10px 14px", background: "var(--surface2)", borderRadius: 8, border: "1px solid var(--border)", fontSize: 12, color: "var(--text-muted)" }}>
          <IcLock size={14} stroke="var(--text-muted)" />
          Current: <code style={{ color: "var(--gold-dark)" }}>lacatv2026</code> — change before going live
        </div>
      </div>

      <button className="btn btn-primary" onClick={save} style={{ alignSelf: "flex-start", padding: "10px 28px" }}>
        <IcCheck size={14} /> Save Settings
      </button>
    </div>
  );
}

// ── IMPORT in SettingsTab ─────────────────────

// ── MAIN ADMIN PANEL ──────────────────────────
export default function AdminPanel() {
  const { adminAuth, setAdminAuth, navigate, videos } = useApp();
  const [tab, setTab] = useState("upload");

  if (!adminAuth) return <AdminLogin />;

  const totalViews = videos.reduce((s, v) => s + v.views, 0);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Header isAdmin={true} />

      {/* Admin sub-header */}
      <div style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "0 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 48,
      }}>
        <div style={{ display: "flex", gap: 2 }}>
          {TABS.map(({ id, Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 16px",
                borderRadius: 6,
                border: "none",
                background: tab === id ? "var(--surface2)" : "transparent",
                color: tab === id ? "var(--text)" : "var(--text-muted)",
                fontSize: 13,
                fontWeight: tab === id ? 500 : 400,
                borderBottom: tab === id ? "2px solid var(--green-light)" : "2px solid transparent",
                transition: "all 0.15s",
              }}
            >
              <Icon size={14} stroke={tab === id ? "var(--green-light)" : "currentColor"} />
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={() => { setAdminAuth(false); navigate("home"); }}
          className="btn btn-ghost"
          style={{ fontSize: 12, color: "var(--red)" }}
        >
          <IcLogOut size={13} /> Logout
        </button>
      </div>

      {/* Quick stats bar */}
      <div style={{
        background: "var(--bg-elevated)",
        borderBottom: "1px solid var(--border)",
        padding: "10px 24px",
        display: "flex",
        gap: 28,
        fontSize: 12,
        color: "var(--text-muted)",
      }}>
        {[
          { label: "Videos", val: videos.length },
          { label: "Total Views", val: fmtViews(totalViews) },
          { label: "New", val: videos.filter(v => v.isNew).length },
          { label: "Leagues", val: [...new Set(videos.map(v => v.league))].length },
        ].map(({ label, val }) => (
          <div key={label} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: 14 }}>{val}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "26px 24px" }}>
        {tab === "upload"    && <UploadTab />}
        {tab === "videos"    && <VideosTab />}
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "settings"  && <SettingsTab />}
      </div>
    </div>
  );
}
