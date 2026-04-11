import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../utils/supabase";

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }) {
  const [page, setPage]                   = useState("home");
  const [currentVideo, setCurrentVideo]   = useState(null);
  const [currentScore, setCurrentScore]   = useState(null);
  const [videos, setVideos]               = useState([]);
  const [leagues, setLeagues]             = useState([]);
  const [adminAuth, setAdminAuth]         = useState(false);
  const [loading, setLoading]             = useState(true);
  const [siteSettings, setSiteSettings]   = useState({
    siteName: "LACA TV",
    tagline: "Football Highlights, Every Match.",
    tickerEnabled: true,
    maintenanceMode: false,
    allowComments: false,
  });

  // ── Fetch initial data ────────────────────────
  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    await Promise.all([fetchVideos(), fetchLeagues(), fetchSettings()]);
    setLoading(false);
  }

  async function fetchVideos() {
    const { data, error } = await supabase
      .from("videos")
      .select("*, leagues(name, flag, color)")
      .order("uploaded_at", { ascending: false });
    if (error) { console.error("fetchVideos:", error); return; }
    // Normalise to camelCase to match existing component usage
    setVideos((data || []).map(normaliseVideo));
  }

  async function fetchLeagues() {
    const { data, error } = await supabase
      .from("leagues")
      .select("*")
      .eq("active", true)
      .order("sort_order");
    if (error) { console.error("fetchLeagues:", error); return; }
    setLeagues(["All", ...(data || []).map(l => l.name)]);
  }

  async function fetchSettings() {
    const { data, error } = await supabase
      .from("site_settings")
      .select("*")
      .single();
    if (error) { console.error("fetchSettings:", error); return; }
    if (data) {
      setSiteSettings({
        siteName:        data.site_name,
        tagline:         data.tagline,
        tickerEnabled:   data.ticker_enabled,
        maintenanceMode: data.maintenance_mode,
        allowComments:   data.allow_comments,
      });
    }
  }

  // ── Realtime: videos table ────────────────────
  useEffect(() => {
    const channel = supabase
      .channel("videos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "videos" }, () => {
        fetchVideos();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  // ── Navigation ────────────────────────────────
  const navigate = (to, data = null) => {
    setPage(to);
    if (to === "player" && data) setCurrentVideo(data);
    if (to === "scores" && data) setCurrentScore(data);
    window.scrollTo(0, 0);
  };

  // ── Video CRUD ────────────────────────────────
  const addVideo = async (v) => {
    // Resolve league_id from name
    const { data: league } = await supabase
      .from("leagues")
      .select("id")
      .eq("name", v.league)
      .single();

    const { data, error } = await supabase
      .from("videos")
      .insert({
        title:       v.title,
        league_id:   league?.id || null,
        video_url:   v.videoUrl,
        duration:    v.duration,
        description: v.description,
        tags:        v.tags,
        bg_grad:     v.bgGrad,
        featured:    v.featured,
        is_new:      v.isNew,
        views:       0,
      })
      .select("*, leagues(name, flag, color)")
      .single();

    if (error) { console.error("addVideo:", error); return; }
    setVideos(prev => [normaliseVideo(data), ...prev]);
  };

  const updateVideo = async (id, updates) => {
    const dbUpdates = {};
    if (updates.title       !== undefined) dbUpdates.title       = updates.title;
    if (updates.videoUrl    !== undefined) dbUpdates.video_url   = updates.videoUrl;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.tags        !== undefined) dbUpdates.tags        = updates.tags;
    if (updates.bgGrad      !== undefined) dbUpdates.bg_grad     = updates.bgGrad;
    if (updates.featured    !== undefined) dbUpdates.featured    = updates.featured;
    if (updates.isNew       !== undefined) dbUpdates.is_new      = updates.isNew;

    const { error } = await supabase.from("videos").update(dbUpdates).eq("id", id);
    if (error) { console.error("updateVideo:", error); return; }
    setVideos(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const deleteVideo = async (id) => {
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) { console.error("deleteVideo:", error); return; }
    setVideos(prev => prev.filter(v => v.id !== id));
  };

  const toggleFeatured = async (id) => {
    // Un-feature all, then feature the selected one
    const current = videos.find(v => v.id === id);
    await supabase.from("videos").update({ featured: false }).neq("id", id);
    await supabase.from("videos").update({ featured: !current?.featured }).eq("id", id);
    setVideos(prev =>
      prev.map(v => ({ ...v, featured: v.id === id ? !current?.featured : false }))
    );
  };

  const incrementViews = async (id) => {
    await supabase.rpc("increment_views", { video_id: id }).catch(() => {
      // Fallback: direct update
      supabase.from("videos").update({ views: (videos.find(v=>v.id===id)?.views||0) + 1 }).eq("id", id);
    });
  };

  // ── Settings save ──────────────────────────────
  const saveSettings = async (settings) => {
    const { error } = await supabase
      .from("site_settings")
      .update({
        site_name:        settings.siteName,
        tagline:          settings.tagline,
        ticker_enabled:   settings.tickerEnabled,
        maintenance_mode: settings.maintenanceMode,
        allow_comments:   settings.allowComments,
      })
      .eq("id", 1);
    if (error) console.error("saveSettings:", error);
    else setSiteSettings(settings);
  };

  return (
    <AppCtx.Provider value={{
      page, navigate,
      currentVideo, setCurrentVideo,
      currentScore, setCurrentScore,
      videos, addVideo, updateVideo, deleteVideo, toggleFeatured, incrementViews,
      leagues,
      adminAuth, setAdminAuth,
      siteSettings, setSiteSettings, saveSettings,
      loading,
    }}>
      {children}
    </AppCtx.Provider>
  );
}

// ── Normalise DB row → component shape ─────────
function normaliseVideo(row) {
  return {
    id:          row.id,
    title:       row.title,
    league:      row.leagues?.name  || row.league || "",
    leagueFlag:  row.leagues?.flag  || "⚽",
    leagueColor: row.leagues?.color || "#22a050",
    videoUrl:    row.video_url,
    duration:    row.duration   || "",
    description: row.description || "",
    tags:        row.tags        || [],
    views:       row.views       || 0,
    bgGrad:      row.bg_grad     || "135deg,#0a2e18,#1a5e32",
    featured:    row.featured    || false,
    isNew:       row.is_new      || false,
    uploadedAt:  row.uploaded_at || new Date().toISOString(),
  };
}
