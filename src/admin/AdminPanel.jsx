// LACA TV Admin Panel v3 - fixed upload
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
  { id: "upload",    Icon: IcUpload,   label: "Upload"    },
  { id: "videos",    Icon: IcFilm,     label: "Videos"    },
  { id: "analytics", Icon: IcBarChart, label: "Analytics" },
  { id: "settings",  Icon: IcSettings, label: "Settings"  },
];

// ── UPLOAD TAB ────────────────────────────────
function UploadTab() {
  const { addVideo } = useApp();
  const [msg,       setMsg]       = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoSource, setVideoSource] = useState("url"); // "url" | "file"
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "", league: "Premier League", duration: "",
    videoUrl: "", description: "", tags: "",
    isNew: true, featured: false,
    bgGrad: "135deg,#0a2e18,#1a5e32",
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const set    = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const notify = (type, text) => { setMsg({ type, text }); setTimeout(() => setMsg(null), 5000); };

  // ── Extract YouTube video ID ──────────────────
  const getYouTubeId = (url) => {
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  };

  const getYouTubeThumbnail = (url) => {
    const id = getYouTubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("video/")) { notify("error", "Please select a video file."); return; }
    if (file.size > 50 * 1024 * 1024) {
      notify("error", "File too large (max 50MB on free plan). Use YouTube URL for longer videos.");
      return;
    }
    setSelectedFile(file);
    const vid = document.createElement("video");
    vid.preload = "metadata";
    vid.onloadedmetadata = () => {
      const m = Math.floor(vid.duration / 60);
      const s = Math.floor(vid.duration % 60);
      set("duration", `${m}:${s.toString().padStart(2,"0")}`);
    };
    vid.src = URL.createObjectURL(file);
  };

  const uploadFileToSupabase = async (file) => {
    const ext      = file.name.split(".").pop().toLowerCase();
    const filePath = `highlights/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    setUploadProgress(5);
    let fakeP = 5;
    const timer = setInterval(() => {
      const inc = fakeP < 40 ? 8 : fakeP < 60 ? 5 : fakeP < 70 ? 2 : 0;
      fakeP = Math.min(fakeP + inc, 72);
      setUploadProgress(fakeP);
    }, 600);

    try {
      const { error } = await supabase.storage
        .from("videos")
        .upload(filePath, file, { cacheControl:"3600", upsert:false, contentType: file.type||"video/mp4" });
      clearInterval(timer);
      if (error) {
        setUploadProgress(0);
        if (error.message.includes("Bucket")) throw new Error("Storage bucket missing — create a public bucket named \'videos\' in Supabase Storage.");
        if (error.message.includes("security")||error.message.includes("policy")||error.message.includes("Unauthorized")) throw new Error("Storage permission denied — run the storage policy SQL in Supabase.");
        throw new Error(error.message);
      }
      setUploadProgress(95);
      const { data } = supabase.storage.from("videos").getPublicUrl(filePath);
      setUploadProgress(100);
      return data.publicUrl;
    } catch (err) {
      clearInterval(timer);
      setUploadProgress(0);
      throw err;
    }
  };

  const publish = async () => {
    if (!form.title.trim()) return notify("error", "Title is required.");
    if (videoSource === "file" && !selectedFile) return notify("error", "Please select a video file.");
    if (videoSource === "url"  && !form.videoUrl.trim()) return notify("error", "Please enter a YouTube URL or video link.");

    setUploading(true);
    setUploadProgress(0);
    try {
      let finalUrl = form.videoUrl.trim();
      if (videoSource === "file" && selectedFile) {
        finalUrl = await uploadFileToSupabase(selectedFile);
      }
      await addVideo({
        ...form,
        videoUrl: finalUrl,
        tags: form.tags.split(",").map(t=>t.trim()).filter(Boolean),
        leagueFlag: "⚽",
      });
      notify("success", "Video published successfully!");
      setForm({ title:"", league:"Premier League", duration:"", videoUrl:"", description:"", tags:"", isNew:true, featured:false, bgGrad:"135deg,#0a2e18,#1a5e32" });
      setSelectedFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch(err) {
      notify("error", err.message);
    } finally {
      setUploading(false);
    }
  };

  const ytThumb = videoSource === "url" && form.videoUrl ? getYouTubeThumbnail(form.videoUrl) : null;
  const ytId    = videoSource === "url" && form.videoUrl ? getYouTubeId(form.videoUrl) : null;

  return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:28 }}>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:"0.05em", marginBottom:22 }}>
        Upload New Highlight
      </div>

      {msg && (
        <div className={`toast toast-${msg.type}`} style={{ marginBottom:18 }}>
          {msg.type==="success"&&<IcCheck size={14}/>} {msg.text}
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
        {/* Title */}
        <div style={{ gridColumn:"1/-1" }}>
          <label className="label">Video Title *</label>
          <input className="input" placeholder="e.g. Arsenal 3-1 Chelsea — Premier League Highlights" value={form.title} onChange={e=>set("title",e.target.value)} />
        </div>

        {/* League + Duration */}
        <div>
          <label className="label">League *</label>
          <select style={inp} value={form.league} onChange={e=>set("league",e.target.value)}>
            {LEAGUES.filter(l=>l!=="All").map(l=><option key={l}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Duration (e.g. 8:24)</label>
          <input className="input" placeholder="8:24" value={form.duration} onChange={e=>set("duration",e.target.value)} />
        </div>

        {/* Video source toggle */}
        <div style={{ gridColumn:"1/-1" }}>
          <label className="label">Video Source</label>
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            {[
              { id:"url",  icon:"▶️", label:"YouTube / URL", desc:"Paste a YouTube or MP4 link" },
              { id:"file", icon:"📁", label:"Upload File",   desc:"Upload small clips (max 50MB)" },
            ].map(opt=>(
              <button key={opt.id} onClick={()=>setVideoSource(opt.id)} style={{
                flex:1, padding:"12px 16px", borderRadius:10, fontSize:13, fontWeight:500,
                border:`1.5px solid ${videoSource===opt.id?"var(--green-light)":"var(--border)"}`,
                background: videoSource===opt.id ? "rgba(34,160,80,0.1)" : "var(--surface2)",
                color: videoSource===opt.id ? "var(--green-light)" : "var(--text-muted)",
                cursor:"pointer", transition:"all 0.15s", textAlign:"left",
              }}>
                <div style={{ fontSize:18, marginBottom:4 }}>{opt.icon}</div>
                <div style={{ fontWeight:600 }}>{opt.label}</div>
                <div style={{ fontSize:11, opacity:0.7, marginTop:2 }}>{opt.desc}</div>
              </button>
            ))}
          </div>

          {/* YouTube / URL input */}
          {videoSource === "url" && (
            <div>
              <input
                className="input"
                placeholder="https://www.youtube.com/watch?v=... or https://cdn.example.com/video.mp4"
                value={form.videoUrl}
                onChange={e=>set("videoUrl",e.target.value)}
                style={{ marginBottom: ytThumb ? 12 : 0 }}
              />
              {/* YouTube preview */}
              {ytThumb && (
                <div style={{ display:"flex", gap:12, alignItems:"center", padding:"12px", background:"var(--surface2)", borderRadius:8, border:"1px solid var(--border)" }}>
                  <img src={ytThumb} alt="thumbnail" style={{ width:120, borderRadius:6, objectFit:"cover" }} />
                  <div>
                    <div style={{ fontSize:12, color:"var(--green-light)", fontWeight:600, marginBottom:4 }}>✅ YouTube video detected</div>
                    <div style={{ fontSize:11, color:"var(--text-muted)" }}>ID: {ytId}</div>
                    <div style={{ fontSize:11, color:"var(--text-dim)", marginTop:4 }}>Thumbnail auto-loaded. Fill in title and publish.</div>
                  </div>
                </div>
              )}
              {form.videoUrl && !ytThumb && !form.videoUrl.includes("youtube") && (
                <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:6 }}>
                  Direct MP4/video URL detected — will play in browser player
                </div>
              )}
            </div>
          )}

          {/* File upload */}
          {videoSource === "file" && (
            <div>
              <div
                onClick={()=>fileInputRef.current?.click()}
                style={{
                  border:"2px dashed var(--border)", borderRadius:10, padding:"24px 20px",
                  textAlign:"center", cursor:"pointer", transition:"all 0.15s",
                  background: selectedFile ? "rgba(34,160,80,0.06)" : "var(--surface2)",
                  borderColor: selectedFile ? "var(--green-light)" : "var(--border)",
                }}
                onMouseEnter={e=>e.currentTarget.style.borderColor="var(--green-light)"}
                onMouseLeave={e=>e.currentTarget.style.borderColor=selectedFile?"var(--green-light)":"var(--border)"}
              >
                <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} style={{ display:"none" }} />
                {selectedFile ? (
                  <div>
                    <div style={{ fontSize:24, marginBottom:6 }}>✅</div>
                    <div style={{ fontSize:13, fontWeight:600, color:"var(--green-light)", marginBottom:2 }}>{selectedFile.name}</div>
                    <div style={{ fontSize:11, color:"var(--text-muted)" }}>{(selectedFile.size/1024/1024).toFixed(1)} MB</div>
                    <button onClick={e=>{e.stopPropagation();setSelectedFile(null);if(fileInputRef.current)fileInputRef.current.value="";}} style={{ marginTop:6, fontSize:11, color:"var(--red)", background:"none", border:"none", cursor:"pointer" }}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize:32, marginBottom:8 }}>📁</div>
                    <div style={{ fontSize:13, fontWeight:500, color:"var(--text-sec)", marginBottom:4 }}>Click to select video from device</div>
                    <div style={{ fontSize:11, color:"var(--text-muted)" }}>MP4, MOV, AVI — max 50MB (free plan limit)</div>
                  </div>
                )}
              </div>
              <div style={{ marginTop:10, padding:"10px 14px", background:"rgba(240,180,41,0.08)", border:"1px solid rgba(240,180,41,0.2)", borderRadius:8, fontSize:12, color:"var(--amber)" }}>
                💡 For full match highlights (usually 200MB+), use YouTube URL instead. Upload files are best for short clips under 50MB.
              </div>
            </div>
          )}
        </div>

        {/* Upload progress */}
        {uploading && uploadProgress > 0 && videoSource === "file" && (
          <div style={{ gridColumn:"1/-1" }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"var(--text-muted)", marginBottom:6 }}>
              <span>Uploading to Supabase Storage...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div style={{ height:6, background:"var(--surface3)", borderRadius:3, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${uploadProgress}%`, background:"var(--green-light)", borderRadius:3, transition:"width 0.3s ease" }}/>
            </div>
          </div>
        )}
        {uploading && videoSource === "url" && (
          <div style={{ gridColumn:"1/-1" }}>
            <div style={{ fontSize:12, color:"var(--text-muted)", display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:14, height:14, border:"2px solid var(--border)", borderTopColor:"var(--green-light)", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
              Saving video to database...
            </div>
          </div>
        )}

        {/* Description */}
        <div style={{ gridColumn:"1/-1" }}>
          <label className="label">Description</label>
          <textarea className="input" style={{ height:80, resize:"vertical" }} placeholder="Match summary, key moments, goalscorers..." value={form.description} onChange={e=>set("description",e.target.value)} />
        </div>

        {/* Tags + Color */}
        <div>
          <label className="label">Tags (comma-separated)</label>
          <input className="input" placeholder="Arsenal, Chelsea, Premier League" value={form.tags} onChange={e=>set("tags",e.target.value)} />
        </div>
        <div>
          <label className="label">Card Colour Theme</label>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginTop:6 }}>
            {BG_GRADS.map(g=>(
              <div key={g.value} title={g.label} onClick={()=>set("bgGrad",g.value)} style={{
                width:30, height:30, borderRadius:6,
                background:`linear-gradient(${g.value})`,
                cursor:"pointer",
                border: form.bgGrad===g.value ? "2.5px solid var(--gold)" : "2.5px solid transparent",
                boxSizing:"border-box", transition:"border-color 0.1s",
              }}/>
            ))}
          </div>
        </div>

        {/* Checkboxes */}
        <div style={{ gridColumn:"1/-1", display:"flex", gap:24 }}>
          {[
            { key:"isNew",    label:"Mark as NEW"              },
            { key:"featured", label:"Feature on Homepage Hero" },
          ].map(({key,label})=>(
            <label key={key} style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer", fontSize:13, color:"var(--text-sec)" }}>
              <div style={{
                width:18, height:18, borderRadius:4,
                border:`1.5px solid ${form[key]?"var(--green-light)":"var(--border)"}`,
                background: form[key]?"var(--green-light)":"transparent",
                display:"flex", alignItems:"center", justifyContent:"center",
                transition:"all 0.15s", flexShrink:0,
              }}>
                {form[key]&&<IcCheck size={11} stroke="#fff" strokeWidth={3}/>}
              </div>
              <input type="checkbox" checked={form[key]} onChange={e=>set(key,e.target.checked)} style={{ display:"none" }}/>
              {label}
            </label>
          ))}
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={publish}
        disabled={uploading}
        style={{ marginTop:22, padding:"11px 28px", fontSize:14, opacity:uploading?0.7:1 }}
      >
        {uploading && videoSource==="url" ? "Publishing..." : uploading ? `Uploading ${uploadProgress}%...` : <><IcUpload size={15}/> Publish Video</>}
      </button>
      <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
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
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16, gap:12 }}>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:"0.05em" }}>All Videos ({videos.length})</div>
        <input className="input" placeholder="Search videos..." value={search} onChange={e=>setSearch(e.target.value)} style={{ maxWidth:220 }}/>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {list.map(v=>(
          <div key={v.id} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"center", gap:14 }}>
            <div style={{ width:72, height:46, borderRadius:6, background:`linear-gradient(${v.bgGrad})`, flexShrink:0 }}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:500, color:"var(--text)", marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.title}</div>
              <div style={{ fontSize:11, color:"var(--text-muted)", display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
                <span>{v.league}</span>
                <span>·</span>
                <span style={{ display:"flex", alignItems:"center", gap:3 }}><IcEye size={11}/> {fmtViews(v.views)}</span>
                <span>·</span>
                <span style={{ display:"flex", alignItems:"center", gap:3 }}><IcClock size={11}/> {timeAgo(v.uploadedAt)}</span>
                {v.isNew&&<span className="badge badge-new">New</span>}
                {v.featured&&<span className="badge badge-feat">Featured</span>}
              </div>
            </div>
            <div style={{ display:"flex", gap:6, flexShrink:0 }}>
              <button title={v.featured?"Remove featured":"Set featured"} onClick={()=>toggleFeatured(v.id)} className="btn btn-ghost" style={{ padding:"5px 10px", color:v.featured?"var(--gold)":"var(--text-muted)" }}>
                <IcStar size={14} fill={v.featured?"var(--gold)":"none"}/>
              </button>
              <button onClick={()=>deleteVideo(v.id)} className="btn btn-danger" style={{ padding:"5px 12px", fontSize:12 }}>
                <IcTrash size={14}/> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {list.length===0&&<div style={{ textAlign:"center", padding:"40px 20px", color:"var(--text-muted)" }}>No videos found</div>}
    </div>
  );
}

// ── ANALYTICS TAB ─────────────────────────────
function AnalyticsTab() {
  const { videos } = useApp();
  const [liveVisitors, setLiveVisitors] = useState(1);
  const [totalToday,   setTotalToday]   = useState(0);
  const [deviceStats,  setDeviceStats]  = useState({ mobile:0, desktop:0 });
  const presenceRef = useRef(null);

  useEffect(()=>{
    fetchAnalytics();
    setupPresence();
    const iv = setInterval(fetchAnalytics, 30000);
    return ()=>{
      clearInterval(iv);
      if (presenceRef.current) supabase.removeChannel(presenceRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);

  async function setupPresence() {
    presenceRef.current = supabase.channel("site-presence", { config:{ presence:{ key:"v" } } });
    presenceRef.current
      .on("presence",{ event:"sync" },()=>{
        const n = Object.keys(presenceRef.current.presenceState()).length;
        setLiveVisitors(Math.max(n,1));
      })
      .subscribe(async(s)=>{ if(s==="SUBSCRIBED") await presenceRef.current.track({ t: Date.now() }); });
  }

  async function fetchAnalytics() {
    const today = new Date().toISOString().split("T")[0];
    const week  = new Date(Date.now()-7*86400000).toISOString();

    const { count } = await supabase.from("page_views").select("*",{count:"exact",head:true}).gte("created_at",today);
    setTotalToday(count||0);

    const { data:dev } = await supabase.from("page_views").select("device").gte("created_at",week);
    if (dev) {
      const mob  = dev.filter(d=>d.device==="mobile").length;
      setDeviceStats({ mobile:mob, desktop:dev.length-mob });
    }
  }

  const totalViews  = videos.reduce((s,v)=>s+v.views,0);
  const leagueStats = Object.entries(videos.reduce((acc,v)=>{ acc[v.league]=(acc[v.league]||0)+v.views; return acc; },{})).sort((a,b)=>b[1]-a[1]);
  const maxViews    = leagueStats[0]?.[1]||1;
  const topVideo    = [...videos].sort((a,b)=>b.views-a.views)[0];
  const totalDev    = deviceStats.mobile+deviceStats.desktop||1;

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
        <span className="live-dot"/>
        <span style={{ fontSize:13, color:"var(--green-light)", fontWeight:500 }}>Live dashboard</span>
        <span style={{ fontSize:12, color:"var(--text-muted)" }}>· refreshes every 30s</span>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:14, marginBottom:26 }}>
        {[
          { Icon:IcRadio,  label:"Live Now",    val:liveVisitors,         color:"var(--green-light)" },
          { Icon:IcEye,    label:"Views Today", val:totalToday,           color:"var(--gold)"        },
          { Icon:IcEye,    label:"Total Views", val:fmtViews(totalViews), color:"var(--text)"        },
          { Icon:IcFilm,   label:"Videos",      val:videos.length,        color:"var(--text)"        },
          { Icon:IcStar,   label:"Featured",    val:videos.filter(v=>v.featured).length, color:"var(--gold)" },
        ].map(({Icon,label,val,color})=>(
          <div key={label} className="stat-card">
            <Icon size={18} stroke="var(--green-light)"/>
            <div className="stat-value" style={{ color }}>{val}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:18, marginBottom:18 }}>
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:20 }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:"0.05em", marginBottom:16 }}>Views by League</div>
          {leagueStats.length===0
            ? <div style={{ fontSize:12, color:"var(--text-muted)" }}>No data yet</div>
            : leagueStats.map(([league,views])=>(
              <div key={league} style={{ marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4, fontSize:12 }}>
                  <span style={{ color:"var(--text-sec)" }}>{league}</span>
                  <span style={{ color:"var(--text-muted)" }}>{fmtViews(views)}</span>
                </div>
                <div style={{ height:5, background:"var(--surface3)", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${(views/maxViews)*100}%`, background:"var(--green-light)", borderRadius:3, transition:"width 0.6s" }}/>
                </div>
              </div>
            ))
          }
        </div>

        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:20 }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:"0.05em", marginBottom:16 }}>Devices (7 days)</div>
          {[
            { label:"Mobile",  val:deviceStats.mobile,  color:"var(--green-light)" },
            { label:"Desktop", val:deviceStats.desktop, color:"var(--gold)" },
          ].map(({label,val,color})=>(
            <div key={label} style={{ marginBottom:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5, fontSize:12 }}>
                <span style={{ color:"var(--text-sec)" }}>{label}</span>
                <span style={{ color:"var(--text-muted)" }}>{val} ({Math.round((val/totalDev)*100)}%)</span>
              </div>
              <div style={{ height:6, background:"var(--surface3)", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${(val/totalDev)*100}%`, background:color, borderRadius:3, transition:"width 0.6s" }}/>
              </div>
            </div>
          ))}
        </div>
      </div>

      {topVideo&&(
        <div style={{ background:"var(--surface)", border:"1px solid var(--green-mid)", borderRadius:14, padding:20 }}>
          <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"var(--green-light)", marginBottom:8 }}>Most Viewed</div>
          <div style={{ fontSize:15, fontWeight:500, color:"var(--text)", marginBottom:4 }}>{topVideo.title}</div>
          <div style={{ fontSize:12, color:"var(--text-muted)" }}>{fmtViews(topVideo.views)} views · {topVideo.league} · {fmtDate(topVideo.uploadedAt)}</div>
        </div>
      )}
    </div>
  );
}

// ── SETTINGS TAB ─────────────────────────────
function SettingsTab() {
  const { siteSettings, saveSettings } = useApp();
  const [local, setLocal] = useState(siteSettings);
  const [saved, setSaved] = useState(false);
  const set  = (k,v) => setLocal(p=>({...p,[k]:v}));
  const save = async()=>{ await saveSettings(local); setSaved(true); setTimeout(()=>setSaved(false),2500); };

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      {saved&&<div className="toast toast-success"><IcCheck size={14}/> Settings saved</div>}

      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
          <IcGlobe size={16} stroke="var(--green-light)"/>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:"0.05em" }}>Site Identity</div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          <div><label className="label">Site Name</label><input className="input" value={local.siteName} onChange={e=>set("siteName",e.target.value)}/></div>
          <div><label className="label">Tagline</label><input className="input" value={local.tagline} onChange={e=>set("tagline",e.target.value)}/></div>
        </div>
      </div>

      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
          <IcSettings size={16} stroke="var(--green-light)"/>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:"0.05em" }}>Features</div>
        </div>
        {[
          { key:"tickerEnabled",   label:"Live Scores Ticker",   desc:"Show live score ticker at top of site"       },
          { key:"maintenanceMode", label:"Maintenance Mode",     desc:"Show maintenance page to visitors"           },
          { key:"allowComments",   label:"Comments",             desc:"Allow comments on video pages (coming soon)" },
        ].map(({key,label,desc})=>(
          <div key={key} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 0", borderBottom:"1px solid var(--border)" }}>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:"var(--text)", marginBottom:2 }}>{label}</div>
              <div style={{ fontSize:11, color:"var(--text-muted)" }}>{desc}</div>
            </div>
            <div onClick={()=>set(key,!local[key])} style={{ width:44, height:24, borderRadius:12, background:local[key]?"var(--green-light)":"var(--surface3)", border:"1px solid var(--border)", position:"relative", cursor:"pointer", transition:"background 0.2s", flexShrink:0 }}>
              <div style={{ position:"absolute", top:2, left:local[key]?22:2, width:18, height:18, borderRadius:"50%", background:"#fff", transition:"left 0.2s" }}/>
            </div>
          </div>
        ))}
      </div>

      <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:16 }}>
          <IcLock size={16} stroke="var(--green-light)"/>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:"0.05em" }}>Security</div>
        </div>
        <p style={{ fontSize:12, color:"var(--text-muted)", lineHeight:1.6 }}>
          To change your admin password go to <strong>Supabase Dashboard → Authentication → Users → your email → Send password reset</strong>. Check your Gmail inbox for the reset link.
        </p>
      </div>

      <button className="btn btn-primary" onClick={save} style={{ alignSelf:"flex-start", padding:"10px 28px" }}>
        <IcCheck size={14}/> Save Settings
      </button>
    </div>
  );
}

// ── MAIN ADMIN PANEL ──────────────────────────
export default function AdminPanel() {
  const { adminAuth, adminLogout, videos } = useApp();
  const [tab, setTab] = useState("upload");

  if (!adminAuth) return <AdminLogin/>;

  const totalViews = videos.reduce((s,v)=>s+v.views,0);

  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh" }}>
      <Header isAdmin={true}/>

      <div style={{ background:"var(--surface)", borderBottom:"1px solid var(--border)", padding:"0 24px", display:"flex", alignItems:"center", justifyContent:"space-between", height:48 }}>
        <div style={{ display:"flex", gap:2 }}>
          {TABS.map(({id,Icon,label})=>(
            <button key={id} onClick={()=>setTab(id)} style={{
              display:"flex", alignItems:"center", gap:7,
              padding:"8px 16px", borderRadius:6, border:"none",
              background: tab===id?"var(--surface2)":"transparent",
              color: tab===id?"var(--text)":"var(--text-muted)",
              fontSize:13, fontWeight: tab===id?500:400,
              borderBottom: tab===id?"2px solid var(--green-light)":"2px solid transparent",
              transition:"all 0.15s",
            }}>
              <Icon size={14} stroke={tab===id?"var(--green-light)":"currentColor"}/>
              {label}
            </button>
          ))}
        </div>
        <button onClick={adminLogout} className="btn btn-ghost" style={{ fontSize:12, color:"var(--red)" }}>
          <IcLogOut size={13}/> Logout
        </button>
      </div>

      <div style={{ background:"var(--bg-elevated)", borderBottom:"1px solid var(--border)", padding:"10px 24px", display:"flex", gap:28, fontSize:12, color:"var(--text-muted)" }}>
        {[
          { label:"Videos",      val:videos.length },
          { label:"Total Views", val:fmtViews(totalViews) },
          { label:"New",         val:videos.filter(v=>v.isNew).length },
          { label:"Leagues",     val:[...new Set(videos.map(v=>v.league))].length },
        ].map(({label,val})=>(
          <div key={label} style={{ display:"flex", gap:6, alignItems:"center" }}>
            <span style={{ color:"var(--gold)", fontWeight:700, fontSize:14 }}>{val}</span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ maxWidth:960, margin:"0 auto", padding:"26px 24px" }}>
        {tab==="upload"    &&<UploadTab/>}
        {tab==="videos"    &&<VideosTab/>}
        {tab==="analytics" &&<AnalyticsTab/>}
        {tab==="settings"  &&<SettingsTab/>}
      </div>
    </div>
  );
}
