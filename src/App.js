import "./styles/globals.css";
import { AppProvider, useApp } from "./context/AppContext";
import HomePage from "./pages/HomePage";
import VideoPlayerPage from "./pages/VideoPlayerPage";
import LiveScorePage from "./pages/LiveScorePage";
import AdminPanel from "./admin/AdminPanel";

function Router() {
  const { page, authChecked } = useApp();

  const isAdminRoute =
    window.location.hostname.startsWith("admin.") ||
    window.location.pathname.startsWith("/admin");

  // Wait for Supabase session check before rendering admin
  // This prevents the login flash when you paste /admin URL in same tab
  if (isAdminRoute && !authChecked) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "var(--bg)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
        fontSize: 14,
        gap: 12,
      }}>
        <div style={{
          width: 20, height: 20,
          border: "2px solid var(--border)",
          borderTopColor: "var(--green-light)",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        Loading...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isAdminRoute)      return <AdminPanel />;
  if (page === "player") return <VideoPlayerPage />;
  if (page === "admin")  return <AdminPanel />;
  if (page === "scores") return <LiveScorePage />;
  return <HomePage />;
}

export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
