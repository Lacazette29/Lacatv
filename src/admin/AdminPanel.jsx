import { useState, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import AdminLogin from "./AdminLogin";
import Header from "../components/Header";
import { supabase } from "../utils/supabase";
import { fmtViews, timeAgo, fmtDate } from "../utils/helpers";
import { BG_GRADS, LEAGUES } from "../utils/data";
import {
  IcUpload, IcFilm, IcSettings, IcTrash,
  IcBarChart, IcStar, IcCheck, IcLogOut,
  IcGlobe, IcEye, IcClock, IcRadio, IcLock,
} from "../components/Icons";

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
  { id: "analytics", Icon: IcBarChart, label: "Analytics"  },
  { id: "upload",    Icon: IcUpload,   label: "Upload"     },
  { id: "videos",    Icon: IcFilm,     label: "Videos"     },
  { id: "settings",  Icon: IcSettings, label: "Settings"   },
];

// ── REALTIME ANALYTICS TAB ────────────────────
function AnalyticsTab() {
  const { videos } = useApp();
  const [liveVisitors, setLiveVisitors] = useState(0);
  const [totalToday,   setTotalToday]   = useState(0);
  const [topCountries, setTopCountries] = useState([]);
  const [deviceStats,  setDeviceStats]  = useState({ mobile: 0, desktop: 0 });
  const presenceChannel = useRef(null);

  useEffect(() => {
    trackPageView("admin");
    setupPresence();
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => {
      clearInterval(interval);
      if (presenceChannel.current) supabase.removeChannel(presenceChannel.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setupPresence() {
    presenceChannel.current = supabase.channel("site-presence", {
      config: { presence: { key: "visitors" } },
    });
    presenceChannel.current
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.current.presenceState();
        setLiveVisitors(Math.max(Object.keys(state).length, 1));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.current.track({ online_at: new Date().toISOString() });
        }
      });
  }

  async function trackPageView(page) {
    const device = /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop";
    await supabase.from("page_views").insert({ page, device, referrer: document.referrer || "direct" }).catch(() => {});
  }

  async function fetchAnalytics() {
    const today = new Date().toISOString().split("T")[0];
    const week  = new Date(Date.now() - 7 * 86400000).toISOString();

    const { count } = await supabase
      .from("page_views")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today);
    setTotalToday(count || 0);

    const { data: devData } = await supabase
      .from("page_views")
      .select("device")
      .gte("created_at", week);
    if (devData) {
      const mobile  = devData.filter(d => d.device === "mobile").length;
      const desktop = devData.length - mobile;
      setDeviceStats({ mobile, desktop });
    }

    const { data: countryData } = await supabase
      .from("page_views")
      .select("country")
      .gte("created_at", week)
      .not("country", "is", null);
    if (countryData) {
      const counts = countryData.reduce((acc, r) => {
        if (r.country) acc[r.country] = (acc[r.country] || 0) + 1;
        return acc;
      }, {});
      setTopCountries(Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5));
    }
  }

  const totalViews  = videos.reduce((s, v) => s + v.views, 0);
  const totalVideos = videos.length;
  const leagueCount = [...new Set(videos.map(v => v.league))].length;
  const topVideo    = [...videos].sort((a, b) => b.views - a.views)[0];

  const leagueStats = Object.entries(
    videos.reduce((acc, v) => {
      acc[v.league] = (acc[v.league] || 0) + v.views;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const maxLeagueViews = leagueStats[0]?.[1] || 1;
  const totalDevices   = deviceStats.mobile + deviceStats.desktop || 1;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
        <span className="live-dot" />
        <span style={{ fontSize: 13, color: "var(--green-light)", fontWeight: 500 }}>Live dashboard</span>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>· updates every 30s</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14, marginBottom: 26 }}>
        {[
          { Icon: IcRadio, label: "Live Now",      val: liveVisitors,         color: "var(--green-light)" },
          { Icon: IcEye,   label: "Views Today",   val: totalToday,           color: "var(--gold)"        },
          { Icon: IcEye,   label: "Total Views",   val: fmtViews(totalViews), color: "var(--text)"        },
          { Icon: IcFilm,  label: "Videos",        val: totalVideos,          color: "var(--text)"        },
          { Icon: IcGlobe, label: "Leagues",       val: leagueCount,          color: "var(--text)"        },
          { Icon: IcStar,  label: "Featured",      val: videos.filter(v => v.featured).length, color: "var(--gold)" },
        ].map(({ Icon, label, val, color }) => (
          <div key={label} className="stat-card">
            <Icon size={18} stroke="var(--green-light)" />
            <div className="stat-value" style={{ color }}>{val}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: "0.05em", marginBottom: 16 }}>Views by League</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {leagueStats.map(([league, views]) => (
              <div key={league}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                  <span style={{ color: "var(--text-sec)" }}>{league}</span>
                  <span style={{ color: "var(--text-muted)" }}>{fmtViews(views)}</span>
                </div>
                <div style={{ height: 5, background: "var(--surface3)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(views / maxLeagueViews) * 100}%`, background: "var(--green-light)", borderRadius: 3, transition: "width 0.6s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 20 }}>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 16, letterSpacing: "0.05em", marginBottom: 16 }}>Devices (7 days)</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Mobile",  val: deviceStats.mobile,  color: "var(--green-light)" },
              { label: "Desktop", val: deviceStats.desktop, color: "var(--gold)"        },
            ].map(({ label, val, color }) => (
              <div key={label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12 }}>
                  <span style={{ color: "var(--text-sec)" }}>{label}</span>
                  <span style={{ color: "var(--text-muted)" }}>{val} ({Math.round((val / totalDevices) * 100)}%)</span>
                </div>
                <div style={{ height: 6, background: "var(--surface3)", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(val / totalDevices) * 100}%`, background: color, borderRadius: 3, transition: "width 0.6s ease" }} />
                </div>
              </div>
            ))}
          </div>

          {topCountries.length > 0 && (
            <>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: "0.05em", margin: "20px 0 10px" }}>Top Countries</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {topCountries.map(([country, count]) => (
                  <div key={country} style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--text-sec)" }}>{country}</span>
                    <span style={{ color: "var(--text-muted)" }}>{count} visits</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {topVideo && (
        <div style={{ background: "var(--surface)", border: "1px solid var(--green-mid)", borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--green-light)", marginBottom: 8 }}>Most Viewed</div>
          <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text)", marginBottom: 4 }}>{topVideo.title}</div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{fmtViews(topVideo.views)} views · {topVideo.league} · {fmtDate(topVideo.uploadedAt)}</div>
        </div>
      )}
    </div>
  );
}

// ── UPLOAD TAB ────────────────────────────────
function UploadTab() {
  const { addVideo } = useApp();
  const [msg,  setMsg]  = useState(null);
  const [form, setForm] = useState({
    title: "", league: "Premier League", duration: "",
    videoUrl: "", description: "", tags: "",
    isNew: true, featured: false,
    bgGrad: "135deg,#0a2e18,#1a5e32",
  });

  const set    = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const notify = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 4000); };

  const publish = () => {
    if (!form.title.trim())    return notify("error", "Title is required.");
    if (!form.videoUrl.trim()) return notify("error", "Video URL is required.");
    addVideo({
      ...form,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      leagueFlag: "⚽",
    });
    notify("success", "Video published successfully!");
    setForm({ title: "", league: "Premier League", duration: "", videoUrl: "", description: "", tags: "", isNew: true, featured: false, bgGrad: "135deg,#0a2e18,#1a5e32" });
  };

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 28 }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: "0.05em", marginBottom: 22 }}>Upload New Highlight</div>

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
            {LEAGUES.filter(l => l !== "All").map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Duration (e.g. 8:24)</label>
          <input className="input" placeholder="8:24" value={form.duration} onChange={e => set("duration", e.target.value)} />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label className="label">Video URL *</label>
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
              <div key={g.value} title={g.label} onClick={() => set("bgGrad", g.value)} style={{
                width: 30, height: 30, borderRadius: 6,
                background: `linear-gradient(${g.value})`,
                cursor: "pointer",
                border: form.bgGrad === g.value ? "2.5px solid var(--gold)" : "2.5px solid transparent",
                boxSizing: "border-box", transition: "border-color 0.1s",
              }} />
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
                width: 18, height: 18, borderRadius: 4,
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
  const { videos, deleteVideo, toggleFeatured } = useApp();
  const [search, setSearch] = useState("");

  const list = videos.filter(v =>
    !search || v.title.toLowerCase().includes(search.toLowerCase()) || v.league.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: "0.05em" }}>All Videos ({videos.length})</div>
        <input className="input" placeholder="Search videos..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 220 }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map(v => (
          <div key={v.id} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 10, padding: "12px 16px",
            display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{ width: 72, height: 46, borderRadius: 6, background: `linear-gradient(${v.bgGrad})`, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.title}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span>{v.league}</span>
                <span>·</span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><IcEye size={11} /> {fmtViews(v.views)}</span>
                <span>·</span>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><IcClock size={11} /> {timeAgo(v.uploadedAt)}</span>
                {v.isNew && <span className="badge badge-new">New</span>}
                {v.featured && <span className="badge badge-feat">Featured</span>}
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
              <button title={v.featured ? "Remove featured" : "Set featured"} onClick={() => toggleFeatured(v.id)} className="btn btn-ghost" style={{ padding: "5px 10px", color: v.featured ? "var(--gold)" : "var(--text-muted)" }}>
                <IcStar size={14} fill={v.featured ? "var(--gold)" : "none"} />
              </button>
              <button onClick={() => deleteVideo(v.id)} className="btn btn-danger" style={{ padding: "5px 12px", fontSize: 12 }}>
                <IcTrash size={14} /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {list.length === 0 && <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>No videos match your search</div>}
    </div>
  );
}

// ── SETTINGS TAB ─────────────────────────────
function SettingsTab() {
  const { siteSettings, saveSettings } = useApp();
  const [local, setLocal] = useState(siteSettings);
  const [saved, setSaved] = useState(false);

  const set  = (k, v) => setLocal(p => ({ ...p, [k]: v }));
  const save = async () => { await saveSettings(local); setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {saved && <div className="toast toast-success"><IcCheck size={14} /> Settings saved</div>}

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <IcGlobe size={16} stroke="var(--green-light)" />
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, letterSpacing: "0.05em" }}>Site Identity</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div><label className="label">Site Name</label><input className="input" value={local.siteName} onChange={e => set("siteName", e.target.value)} /></div>
          <div><label className="label">Tagline</label><input className="input" value={local.tagline} onChange={e => set("tagline", e.target.value)} /></div>
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <IcSettings size={16} stroke="var(--green-light)" />
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, letterSpacing: "0.05em" }}>Features</div>
        </div>
        {[
          { key: "tickerEnabled",   label: "Live Scores Ticker",   desc: "Show live score ticker at top of site"       },
          { key: "maintenanceMode", label: "Maintenance Mode",     desc: "Show maintenance page to visitors"           },
          { key: "allowComments",   label: "Comments",             desc: "Allow comments on video pages (coming soon)" },
        ].map(({ key, label, desc }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{desc}</div>
            </div>
            <div onClick={() => set(key, !local[key])} style={{ width: 44, height: 24, borderRadius: 12, background: local[key] ? "var(--green-light)" : "var(--surface3)", border: "1px solid var(--border)", position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
              <div style={{ position: "absolute", top: 2, left: local[key] ? 22 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <IcLock size={16} stroke="var(--green-light)" />
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 17, letterSpacing: "0.05em" }}>Security</div>
        </div>
        <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.6 }}>
          Admin authentication is handled by <strong>Supabase Auth</strong>. To change your password, go to Supabase dashboard → Authentication → Users → find your email → Reset password.
        </p>
      </div>

      <button className="btn btn-primary" onClick={save} style={{ alignSelf: "flex-start", padding: "10px 28px" }}>
        <IcCheck size={14} /> Save Settings
      </button>
    </div>
  );
}

// ── MAIN ADMIN PANEL ──────────────────────────
export default function AdminPanel() {
  const { adminAuth, adminLogout, videos } = useApp();
  const [tab, setTab] = useState("analytics");

  if (!adminAuth) return <AdminLogin />;

  const totalViews = videos.reduce((s, v) => s + v.views, 0);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Header isAdmin={true} />

      <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 48 }}>
        <div style={{ display: "flex", gap: 2 }}>
          {TABS.map(({ id, Icon, label }) => (
            <button key={id} onClick={() => setTab(id)} style={{
              display: "flex", alignItems: "center", gap: 7,
              padding: "8px 16px", borderRadius: 6, border: "none",
              background: tab === id ? "var(--surface2)" : "transparent",
              color: tab === id ? "var(--text)" : "var(--text-muted)",
              fontSize: 13, fontWeight: tab === id ? 500 : 400,
              borderBottom: tab === id ? "2px solid var(--green-light)" : "2px solid transparent",
              transition: "all 0.15s",
            }}>
              <Icon size={14} stroke={tab === id ? "var(--green-light)" : "currentColor"} />
              {label}
            </button>
          ))}
        </div>
        <button onClick={adminLogout} className="btn btn-ghost" style={{ fontSize: 12, color: "var(--red)" }}>
          <IcLogOut size={13} /> Logout
        </button>
      </div>

      <div style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)", padding: "10px 24px", display: "flex", gap: 28, fontSize: 12, color: "var(--text-muted)" }}>
        {[
          { label: "Videos",      val: videos.length },
          { label: "Total Views", val: fmtViews(totalViews) },
          { label: "New",         val: videos.filter(v => v.isNew).length },
          { label: "Leagues",     val: [...new Set(videos.map(v => v.league))].length },
        ].map(({ label, val }) => (
          <div key={label} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <span style={{ color: "var(--gold)", fontWeight: 700, fontSize: 14 }}>{val}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "26px 24px" }}>
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "upload"    && <UploadTab />}
        {tab === "videos"    && <VideosTab />}
        {tab === "settings"  && <SettingsTab />}
      </div>
    </div>
  );
}
