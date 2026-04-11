import { createContext, useContext, useState } from "react";
import { MOCK_VIDEOS } from "../utils/data";

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }) {
  const [page, setPage]           = useState("home");
  const [currentVideo, setCurrentVideo] = useState(null);
  const [videos, setVideos]       = useState(MOCK_VIDEOS);
  const [adminAuth, setAdminAuth] = useState(false);
  const [siteSettings, setSiteSettings] = useState({
    siteName: "LACA TV",
    tagline: "Football Highlights, Every Match.",
    accentColor: "#22a050",
    tickerEnabled: true,
    maintenanceMode: false,
    allowComments: false,
  });

  const navigate = (to, v = null) => {
    setPage(to);
    if (v) setCurrentVideo(v);
    window.scrollTo(0, 0);
  };

  const addVideo = (v) =>
    setVideos((prev) => [
      { ...v, id: Date.now(), views: 0, uploadedAt: new Date().toISOString() },
      ...prev,
    ]);

  const updateVideo = (id, updates) =>
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, ...updates } : v)));

  const deleteVideo = (id) =>
    setVideos((prev) => prev.filter((v) => v.id !== id));

  const toggleFeatured = (id) =>
    setVideos((prev) =>
      prev.map((v) => ({ ...v, featured: v.id === id ? !v.featured : false }))
    );

  return (
    <AppCtx.Provider value={{
      page, navigate,
      currentVideo, setCurrentVideo,
      videos, addVideo, updateVideo, deleteVideo, toggleFeatured,
      adminAuth, setAdminAuth,
      siteSettings, setSiteSettings,
    }}>
      {children}
    </AppCtx.Provider>
  );
}
