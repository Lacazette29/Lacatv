import "./styles/globals.css";
import { AppProvider, useApp } from "./context/AppContext";
import HomePage from "./pages/HomePage";
import VideoPlayerPage from "./pages/VideoPlayerPage";
import LiveScorePage from "./pages/LiveScorePage";
import AdminPanel from "./admin/AdminPanel";

function Router() {
  const { page } = useApp();

  const isAdminRoute =
    window.location.hostname.startsWith("admin.") ||
    window.location.pathname.startsWith("/admin");

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
