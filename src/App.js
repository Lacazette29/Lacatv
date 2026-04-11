import "./styles/globals.css";
import { AppProvider, useApp } from "./context/AppContext";
import HomePage from "./pages/HomePage";
import VideoPlayerPage from "./pages/VideoPlayerPage";
import AdminPanel from "./admin/AdminPanel";
import AdminLogin from "./admin/AdminLogin";

// ── Router ─────────────────────────────────────
function Router() {
  const { page } = useApp();

  // Admin subdomain / path detection
  const isAdminRoute =
    window.location.hostname.startsWith("admin.") ||
    window.location.pathname.startsWith("/admin");

  if (isAdminRoute) return <AdminPanel />;

  if (page === "player") return <VideoPlayerPage />;
  if (page === "admin")  return <AdminPanel />;
  return <HomePage />;
}

// ── Root ───────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <Router />
    </AppProvider>
  );
}
