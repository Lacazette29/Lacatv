import { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "../context/AppContext";
import Header from "../components/Header";

const API_KEY  = process.env.REACT_APP_FOOTBALL_API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";
const TODAY    = new Date().toISOString().split("T")[0];

// Top 5 leagues + popular competitions
const TOP_LEAGUES = [
  { id: 39,  name: "Premier League",   flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  { id: 140, name: "La Liga",          flag: "🇪🇸" },
  { id: 78,  name: "Bundesliga",       flag: "🇩🇪" },
  { id: 135, name: "Serie A",          flag: "🇮🇹" },
  { id: 61,  name: "Ligue 1",          flag: "🇫🇷" },
];

const ALL_FILTER  = { id: "all",  name: "All Leagues", flag: "🌍" };
const TABS        = [
  { id: "live",     label: "Live Now"  },
  { id: "fixtures", label: "Fixtures"  },
  { id: "results",  label: "Results"   },
];

function getStatus(short) {
  if (["1H","HT","2H","ET","BT","P","LIVE"].includes(short)) return "live";
  if (["FT","AET","PEN"].includes(short))                    return "ft";
  return "upcoming";
}

function formatTime(d) {
  return new Date(d).toLocaleTimeString("en-GB", { hour:"2-digit", minute:"2-digit" });
}

function normalise(f) {
  const hid = f.teams.home.id;
  return {
    id:          f.fixture.id,
    leagueId:    f.league.id,
    league:      f.league.name,
    country:     f.league.country,
    leagueLogo:  f.league.logo,
    homeName:    f.teams.home.name,
    awayName:    f.teams.away.name,
    homeLogo:    f.teams.home.logo,
    awayLogo:    f.teams.away.logo,
    homeScore:   f.goals.home,
    awayScore:   f.goals.away,
    minute:      f.fixture.status.elapsed,
    statusShort: f.fixture.status.short,
    status:      getStatus(f.fixture.status.short),
    kickoff:     f.fixture.date,
    events:      f.events || [],
    homeScorers: (f.events||[]).filter(e=>e.type==="Goal"&&e.team?.id===hid).map(e=>`${e.player?.name} ${e.time?.elapsed}'`),
    awayScorers: (f.events||[]).filter(e=>e.type==="Goal"&&e.team?.id!==hid).map(e=>`${e.player?.name} ${e.time?.elapsed}'`),
  };
}

// ── League filter pill ────────────────────────
function LeaguePill({ league, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display:"flex", alignItems:"center", gap:6,
        padding:"6px 14px", borderRadius:20,
        border: active ? "none" : "1px solid var(--border)",
        background: active ? "var(--green-light)" : "var(--surface2)",
        color: active ? "#fff" : "var(--text-muted)",
        fontSize:12, fontWeight: active ? 600 : 400,
        cursor:"pointer", transition:"all 0.15s", whiteSpace:"nowrap",
      }}
    >
      <span style={{ fontSize:14 }}>{league.flag}</span>
      {league.name}
    </button>
  );
}

function StatusBadge({ match }) {
  if (match.status === "live") return (
    <div style={{ display:"flex", alignItems:"center", gap:4, color:"#22c55e", fontSize:11, fontWeight:700, minWidth:50, justifyContent:"center" }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 5px #22c55e", flexShrink:0 }} />
      {match.statusShort === "HT" ? "HT" : `${match.minute}'`}
    </div>
  );
  if (match.status === "ft") return (
    <div style={{ color:"var(--text-muted)", fontSize:11, fontWeight:600, minWidth:50, textAlign:"center" }}>FT</div>
  );
  return <div style={{ color:"var(--text-dim)", fontSize:11, minWidth:50, textAlign:"center" }}>{formatTime(match.kickoff)}</div>;
}

function MatchRow({ match, onClick, selected }) {
  const live = match.status === "live";
  return (
    <div
      onClick={() => onClick(match)}
      style={{
        display:"grid", gridTemplateColumns:"1fr 90px 1fr",
        alignItems:"center", gap:8, padding:"9px 16px",
        borderBottom:"1px solid var(--border)",
        background: selected ? "rgba(34,160,80,0.08)" : "transparent",
        borderLeft: selected ? "2px solid var(--green-light)" : "2px solid transparent",
        cursor:"pointer", transition:"background 0.1s",
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background="var(--surface)"; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background="transparent"; }}
    >
      <div style={{ display:"flex", alignItems:"center", gap:6, justifyContent:"flex-end" }}>
        <span style={{ fontSize:13, color:"var(--text)", fontWeight: live?600:400, textAlign:"right" }}>{match.homeName}</span>
        {match.homeLogo && <img src={match.homeLogo} alt="" width={16} height={16} style={{ objectFit:"contain", flexShrink:0 }} onError={e=>e.target.style.display="none"} />}
      </div>
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:1 }}>
        {match.status !== "upcoming"
          ? <span style={{ fontSize:15, fontWeight:800, color:live?"var(--gold)":"var(--text)", letterSpacing:"0.04em" }}>{match.homeScore??0} – {match.awayScore??0}</span>
          : <span style={{ fontSize:13, color:"var(--text-muted)", fontWeight:500 }}>vs</span>
        }
        <StatusBadge match={match} />
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
        {match.awayLogo && <img src={match.awayLogo} alt="" width={16} height={16} style={{ objectFit:"contain", flexShrink:0 }} onError={e=>e.target.style.display="none"} />}
        <span style={{ fontSize:13, color:"var(--text)", fontWeight: live?600:400 }}>{match.awayName}</span>
      </div>
    </div>
  );
}

function LeagueGroup({ country, league, leagueLogo, matches, onSelect, selectedId }) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <div onClick={() => setOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 16px", background:"var(--surface2)", borderBottom:"1px solid var(--border)", cursor:"pointer", userSelect:"none" }}>
        {leagueLogo && <img src={leagueLogo} alt="" width={14} height={14} style={{ objectFit:"contain" }} onError={e=>e.target.style.display="none"} />}
        <span style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.06em", flex:1 }}>{country} · {league}</span>
        <span style={{ fontSize:10, color:"var(--text-dim)" }}>{open?"▾":"▸"}</span>
      </div>
      {open && matches.map(m => <MatchRow key={m.id} match={m} onClick={onSelect} selected={selectedId===m.id} />)}
    </div>
  );
}

function MatchDetail({ match, onClose }) {
  if (!match) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 20px", color:"var(--text-muted)", gap:12 }}>
      <span style={{ fontSize:52, opacity:0.12 }}>⚽</span>
      <span style={{ fontSize:14 }}>Click any match to see details</span>
    </div>
  );
  const live = match.status === "live";
  return (
    <div>
      <button onClick={onClose} className="btn btn-ghost" style={{ margin:"12px 16px 0", fontSize:12 }}>← Back</button>
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 16px", borderBottom:"1px solid var(--border)" }}>
        {match.leagueLogo && <img src={match.leagueLogo} alt="" width={18} height={18} style={{ objectFit:"contain" }} onError={e=>e.target.style.display="none"} />}
        <span style={{ fontSize:12, color:"var(--text-muted)", fontWeight:600 }}>{match.country} — {match.league}</span>
      </div>
      <div style={{ padding:"28px 20px 20px", textAlign:"center", borderBottom:"1px solid var(--border)" }}>
        <div style={{ marginBottom:16 }}>
          {live ? (
            <span style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(34,160,80,0.15)", color:"#22c55e", fontSize:12, fontWeight:700, padding:"4px 14px", borderRadius:20 }}>
              <span style={{ width:7, height:7, borderRadius:"50%", background:"#22c55e", boxShadow:"0 0 6px #22c55e" }} />
              LIVE {match.statusShort==="HT" ? "· Half Time" : `${match.minute}'`}
            </span>
          ) : match.status==="ft" ? (
            <span style={{ color:"var(--text-muted)", fontSize:12, fontWeight:600 }}>Full Time</span>
          ) : (
            <span style={{ color:"var(--text-muted)", fontSize:12 }}>
              {new Date(match.kickoff).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})} · {formatTime(match.kickoff)}
            </span>
          )}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr auto 1fr", alignItems:"center", gap:12 }}>
          <div style={{ textAlign:"right" }}>
            {match.homeLogo && <img src={match.homeLogo} alt="" width={52} height={52} style={{ objectFit:"contain", marginBottom:8, marginLeft:"auto", display:"block" }} onError={e=>e.target.style.display="none"} />}
            <div style={{ fontSize:15, fontWeight:700, color:"var(--text)" }}>{match.homeName}</div>
            {match.homeScorers?.map((s,i)=><div key={i} style={{ fontSize:11, color:"var(--text-muted)", marginTop:3 }}>⚽ {s}</div>)}
          </div>
          <div style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:12, padding:"14px 18px", minWidth:90, textAlign:"center" }}>
            {match.status==="upcoming"
              ? <div style={{ fontSize:20, fontWeight:700, color:"var(--text-muted)" }}>vs</div>
              : <div style={{ fontSize:38, fontWeight:900, color:"var(--gold)", letterSpacing:"0.04em", lineHeight:1 }}>{match.homeScore??0} – {match.awayScore??0}</div>
            }
          </div>
          <div style={{ textAlign:"left" }}>
            {match.awayLogo && <img src={match.awayLogo} alt="" width={52} height={52} style={{ objectFit:"contain", marginBottom:8, display:"block" }} onError={e=>e.target.style.display="none"} />}
            <div style={{ fontSize:15, fontWeight:700, color:"var(--text)" }}>{match.awayName}</div>
            {match.awayScorers?.map((s,i)=><div key={i} style={{ fontSize:11, color:"var(--text-muted)", marginTop:3 }}>⚽ {s}</div>)}
          </div>
        </div>
      </div>
      {match.events?.filter(e=>["Goal","Card","subst"].includes(e.type)).length > 0 && (
        <div style={{ padding:"16px" }}>
          <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color:"var(--text-muted)", marginBottom:12 }}>Match Events</div>
          {match.events.filter(e=>["Goal","Card","subst"].includes(e.type)).map((e,i)=>{
            const isHome = e.team?.name===match.homeName;
            const icon   = e.type==="Goal"?"⚽":e.type==="Card"?(e.detail?.includes("Red")?"🟥":"🟨"):"🔄";
            return (
              <div key={i} style={{ display:"grid", gridTemplateColumns:"1fr 40px 1fr", alignItems:"center", gap:6, fontSize:12, marginBottom:8 }}>
                <div style={{ textAlign:"right", color:"var(--text-sec)" }}>{isHome?`${e.player?.name} ${icon}`:""}</div>
                <div style={{ textAlign:"center", color:"var(--text-dim)", fontSize:11 }}>{e.time?.elapsed}'</div>
                <div style={{ color:"var(--text-sec)" }}>{!isHome?`${icon} ${e.player?.name}`:""}</div>
              </div>
            );
          })}
        </div>
      )}
      {live && (
        <div style={{ margin:"0 16px 16px", padding:"10px 14px", background:"rgba(34,160,80,0.08)", border:"1px solid rgba(34,160,80,0.2)", borderRadius:8, fontSize:12, color:"var(--green-light)", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e", flexShrink:0 }} />
          Auto-refreshing every 30 seconds
        </div>
      )}
    </div>
  );
}

export default function LiveScorePage() {
  const { navigate }               = useApp();
  const [tab,        setTab]       = useState("live");
  const [leagueFilter, setLeagueFilter] = useState("all");
  const [allMatches, setAllMatches]= useState([]);
  const [loading,    setLoading]   = useState(true);
  const [error,      setError]     = useState(null);
  const [selected,   setSelected]  = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const intervalRef = useRef(null);
  const prevRef     = useRef({});

  const fetchMatches = useCallback(async (activeTab) => {
    if (!API_KEY) { setError("API key missing."); setLoading(false); return; }
    try {
      const url = activeTab==="live"
        ? `${BASE_URL}/fixtures?live=all`
        : `${BASE_URL}/fixtures?date=${TODAY}`;

      const res  = await fetch(url, { headers: { "x-apisports-key": API_KEY } });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const json = await res.json();
      let data   = (json.response||[]).map(normalise);

      if (activeTab==="fixtures") data = data.filter(m=>m.status==="upcoming");
      if (activeTab==="results")  data = data.filter(m=>m.status==="ft");

      data.sort((a,b)=>a.country.localeCompare(b.country)||a.league.localeCompare(b.league));

      // Goal notifications
      data.forEach(m=>{
        const prev=prevRef.current[m.id];
        if (prev&&m.status==="live") {
          const was=(prev.homeScore||0)+(prev.awayScore||0);
          const now=(m.homeScore||0)+(m.awayScore||0);
          if (now>was&&Notification.permission==="granted") {
            new Notification("⚽ GOAL!",{ body:`${m.homeName} ${m.homeScore}-${m.awayScore} ${m.awayName}`, icon:"/logo.svg" });
          }
        }
        prevRef.current[m.id]=m;
      });

      if (selected) {
        const upd=data.find(m=>m.id===selected.id);
        if (upd) setSelected(upd);
      }

      setAllMatches(data);
      setLastRefresh(new Date());
      setError(null);
    } catch(err) {
      setError("Could not load scores. Please try again.");
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(()=>{
    setLoading(true); setAllMatches([]); setSelected(null);
    fetchMatches(tab);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(()=>fetchMatches(tab), tab==="live"?30000:120000);
    return ()=>clearInterval(intervalRef.current);
  },[tab, fetchMatches]);

  useEffect(()=>{
    if ("Notification" in window&&Notification.permission==="default") Notification.requestPermission();
  },[]);

  // Apply league filter
  const matches = leagueFilter === "all"
    ? allMatches
    : allMatches.filter(m => m.leagueId === leagueFilter);

  const grouped = matches.reduce((acc,m)=>{
    const k=`${m.country}__${m.league}`;
    if (!acc[k]) acc[k]={ country:m.country, league:m.league, leagueLogo:m.leagueLogo, matches:[] };
    acc[k].matches.push(m);
    return acc;
  },{});

  const liveCount = allMatches.filter(m=>m.status==="live").length;

  // Count per top league for badges
  const leagueCounts = TOP_LEAGUES.reduce((acc,l)=>{
    acc[l.id] = allMatches.filter(m=>m.leagueId===l.id).length;
    return acc;
  },{});

  return (
    <div style={{ background:"var(--bg)", minHeight:"100vh", display:"flex", flexDirection:"column" }}>
      <Header />

      {/* Top bar */}
      <div style={{ background:"var(--surface)", borderBottom:"1px solid var(--border)", padding:"10px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={()=>navigate("home")} className="btn btn-ghost" style={{ fontSize:12 }}>← Home</button>
          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:"0.05em" }}>Live Scores</span>
          {liveCount>0 && <span style={{ background:"rgba(34,160,80,0.15)", color:"#22c55e", fontSize:11, fontWeight:700, padding:"2px 10px", borderRadius:20 }}>{liveCount} live now</span>}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {lastRefresh && <span style={{ fontSize:11, color:"var(--text-dim)" }}>Updated {lastRefresh.toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit",second:"2-digit"})}</span>}
          <button onClick={()=>{setLoading(true);fetchMatches(tab);}} className="btn btn-ghost" style={{ fontSize:12 }}>↻ Refresh</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background:"var(--surface)", borderBottom:"1px solid var(--border)", padding:"0 20px", display:"flex" }}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>{ setTab(t.id); setSelected(null); }} style={{
            padding:"11px 20px", border:"none", background:"transparent",
            color: tab===t.id?"var(--green-light)":"var(--text-muted)",
            fontSize:13, fontWeight: tab===t.id?600:400,
            borderBottom: tab===t.id?"2px solid var(--green-light)":"2px solid transparent",
            transition:"all 0.15s", cursor:"pointer",
            display:"flex", alignItems:"center", gap:6,
          }}>
            {t.id==="live"&&liveCount>0&&<span style={{ width:6,height:6,borderRadius:"50%",background:"#22c55e",boxShadow:"0 0 6px #22c55e" }}/>}
            {t.label}
          </button>
        ))}
      </div>

      {/* League filters — Top 5 + All */}
      <div style={{ background:"var(--bg)", borderBottom:"1px solid var(--border)", padding:"10px 20px", display:"flex", gap:8, overflowX:"auto" }}>
        <LeaguePill league={ALL_FILTER} active={leagueFilter==="all"} onClick={()=>setLeagueFilter("all")} />
        {TOP_LEAGUES.map(l=>(
          <div key={l.id} style={{ position:"relative", flexShrink:0 }}>
            <LeaguePill league={l} active={leagueFilter===l.id} onClick={()=>setLeagueFilter(l.id)} />
            {leagueCounts[l.id] > 0 && (
              <span style={{
                position:"absolute", top:-4, right:-4,
                background:"var(--green-light)", color:"#fff",
                fontSize:9, fontWeight:700,
                width:16, height:16, borderRadius:"50%",
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                {leagueCounts[l.id]}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        <div style={{ flex: selected?"0 0 55%":"1", overflowY:"auto", maxHeight:"calc(100vh - 200px)", borderRight: selected?"1px solid var(--border)":"none" }}>
          {loading ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"80px 20px", gap:16, color:"var(--text-muted)" }}>
              <div style={{ width:32, height:32, border:"3px solid var(--border)", borderTopColor:"var(--green-light)", borderRadius:"50%", animation:"spin 0.8s linear infinite" }}/>
              <span style={{ fontSize:13 }}>Fetching scores...</span>
            </div>
          ) : error ? (
            <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--text-muted)" }}>
              <div style={{ fontSize:36, marginBottom:12, opacity:0.2 }}>⚠️</div>
              <div style={{ fontSize:14, marginBottom:6 }}>{error}</div>
            </div>
          ) : matches.length===0 ? (
            <div style={{ textAlign:"center", padding:"80px 20px", color:"var(--text-muted)" }}>
              <div style={{ fontSize:52, marginBottom:16, opacity:0.12 }}>⚽</div>
              <div style={{ fontSize:15, fontWeight:500, marginBottom:8 }}>
                {tab==="live" ? "No matches live right now" : tab==="fixtures" ? "No upcoming fixtures today" : "No results yet today"}
              </div>
              <div style={{ fontSize:12, color:"var(--text-dim)" }}>
                {tab==="live" ? "Most matches kick off evenings & weekends. Check Fixtures tab for today's schedule." : "Try another tab or league filter above"}
              </div>
            </div>
          ) : (
            Object.values(grouped).map((g,i)=>(
              <LeagueGroup key={i} country={g.country} league={g.league} leagueLogo={g.leagueLogo} matches={g.matches} onSelect={setSelected} selectedId={selected?.id} />
            ))
          )}
        </div>

        {selected && (
          <div style={{ flex:1, overflowY:"auto", maxHeight:"calc(100vh - 200px)" }}>
            <MatchDetail match={selected} onClose={()=>setSelected(null)} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin  { to { transform:rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
}
