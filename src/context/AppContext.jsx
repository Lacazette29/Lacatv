import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "../utils/supabase";

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }) {
  const [page, setPage]                 = useState("home");
  const [currentVideo, setCurrentVideo] = useState(null);
  const [currentScore, setCurrentScore] = useState(null);
  const [videos,  setVideos]            = useState([]);
  const [leagues, setLeagues]           = useState([]);
  const [adminAuth, setAdminAuth]       = useState(false);
  const [loading,   setLoading]         = useState(true);
  const [siteSettings, setSiteSettings] = useState({
    siteName: "LACA TV",
    tagline: "Football Highlights, Every Match.",
    tickerEnabled: true,
    maintenanceMode: false,
    allowComments: false,
  });

  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setAdminAuth(true);
      setAuthChecked(true);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setAdminAuth(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Fetch functions ───────────────────────────
  const fetchVideos = useCallback(async () => {
    const { data, error } = await supabase
      .from("videos")
      .select("*, leagues(name, flag, color)")
      .order("uploaded_at", { ascending: false });
    if (error) { console.error("fetchVideos:", error); return; }
    setVideos((data || []).map(normaliseVideo));
  }, []);

  const fetchLeagues = useCallback(async () => {
    const { data, error } = await supabase
      .from("leagues").select("*").eq("active", true).order("sort_order");
    if (error) { console.error("fetchLeagues:", error); return; }
    setLeagues(["All", ...(data || []).map(l => l.name)]);
  }, []);

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from("site_settings").select("*").single();
    if (error) { console.error("fetchSettings:", error); return; }
    if (data) setSiteSettings({
      siteName:        data.site_name,
      tagline:         data.tagline,
      tickerEnabled:   data.ticker_enabled,
      maintenanceMode: data.maintenance_mode,
      allowComments:   data.allow_comments,
    });
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchVideos(), fetchLeagues(), fetchSettings()]);
    setLoading(false);
  }, [fetchVideos, fetchLeagues, fetchSettings]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Realtime: videos ──────────────────────────
  useEffect(() => {
    const ch = supabase.channel("videos-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "videos" }, () => fetchVideos())
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [fetchVideos]);

  // ── Navigation ────────────────────────────────
  const navigate = (to, data = null) => {
    setPage(to);
    if (to === "player" && data) setCurrentVideo(data);
    if (to === "scores" && data) setCurrentScore(data);
    window.scrollTo(0, 0);
  };

  // ── Admin logout ──────────────────────────────
  const adminLogout = async () => {
    await supabase.auth.signOut();
    setAdminAuth(false);
    navigate("home");
  };

  // ── Video CRUD — all saved to Supabase ────────
  const addVideo = async (v) => {
    // Look up league id
    const { data: leagueRow } = await supabase
      .from("leagues").select("id").eq("name", v.league).single();

    const { data, error } = await supabase
      .from("videos")
      .insert({
        title:       v.title,
        league_id:   leagueRow?.id || null,
        video_url:   v.videoUrl,
        duration:    v.duration    || null,
        description: v.description || null,
        tags:        v.tags        || [],
        bg_grad:     v.bgGrad      || "135deg,#0a2e18,#1a5e32",
        featured:    v.featured    || false,
        is_new:      v.isNew       !== false,
        views:       0,
      })
      .select("*, leagues(name, flag, color)")
      .single();

    if (error) {
      console.error("addVideo:", error);
      throw new Error(error.message);
    }
    setVideos(prev => [normaliseVideo(data), ...prev]);
  };

  const updateVideo = async (id, updates) => {
    const db = {};
    if (updates.title       !== undefined) db.title       = updates.title;
    if (updates.videoUrl    !== undefined) db.video_url   = updates.videoUrl;
    if (updates.description !== undefined) db.description = updates.description;
    if (updates.tags        !== undefined) db.tags        = updates.tags;
    if (updates.bgGrad      !== undefined) db.bg_grad     = updates.bgGrad;
    if (updates.featured    !== undefined) db.featured    = updates.featured;
    if (updates.isNew       !== undefined) db.is_new      = updates.isNew;
    const { error } = await supabase.from("videos").update(db).eq("id", id);
    if (error) { console.error("updateVideo:", error); return; }
    setVideos(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const deleteVideo = async (id) => {
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (error) { console.error("deleteVideo:", error); return; }
    setVideos(prev => prev.filter(v => v.id !== id));
  };

  const toggleFeatured = async (id) => {
    const current = videos.find(v => v.id === id);
    await supabase.from("videos").update({ featured: false }).neq("id", id);
    await supabase.from("videos").update({ featured: !current?.featured }).eq("id", id);
    setVideos(prev => prev.map(v => ({ ...v, featured: v.id === id ? !current?.featured : false })));
  };

  const incrementViews = async (id) => {
    const current = videos.find(v => v.id === id);
    const newViews = (current?.views || 0) + 1;
    // Update Supabase
    await supabase.from("videos").update({ views: newViews }).eq("id", id);
    // Update local state immediately so count shows without refresh
    setVideos(prev => prev.map(v => v.id === id ? { ...v, views: newViews } : v));
  };

  // ── Settings ──────────────────────────────────
  const saveSettings = async (settings) => {
    const { error } = await supabase.from("site_settings").update({
      site_name:        settings.siteName,
      tagline:          settings.tagline,
      ticker_enabled:   settings.tickerEnabled,
      maintenance_mode: settings.maintenanceMode,
      allow_comments:   settings.allowComments,
    }).eq("id", 1);
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
      adminAuth, setAdminAuth, adminLogout,
      authChecked,
      siteSettings, setSiteSettings, saveSettings,
      loading,
    }}>
      {children}
    </AppCtx.Provider>
  );
}

function normaliseVideo(row) {
  return {
    id:          row.id,
    title:       row.title,
    league:      row.leagues?.name  || "",
    leagueFlag:  row.leagues?.flag  || "⚽",
    leagueColor: row.leagues?.color || "#22a050",
    videoUrl:    row.video_url      || "",
    duration:    row.duration       || "",
    description: row.description    || "",
    tags:        row.tags           || [],
    views:       row.views          || 0,
    bgGrad:      row.bg_grad        || "135deg,#0a2e18,#1a5e32",
    featured:    row.featured       || false,
    isNew:       row.is_new         || false,
    uploadedAt:  row.uploaded_at    || new Date().toISOString(),
  };
}
