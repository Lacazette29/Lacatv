// ─── Format helpers ───────────────────────────

export const fmtViews = (n) => {
  if (n >= 1_000_000) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1_000)     return Math.round(n / 1000) + "K";
  return String(n);
};

export const timeAgo = (iso) => {
  const s = (Date.now() - new Date(iso)) / 1000;
  if (s < 60)    return "just now";
  if (s < 3600)  return Math.round(s / 60) + "m ago";
  if (s < 86400) return Math.round(s / 3600) + "h ago";
  if (s < 604800)return Math.round(s / 86400) + "d ago";
  return new Date(iso).toLocaleDateString("en-GB", { day:"numeric", month:"short" });
};

export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" });

export const fmtNumber = (n) => n.toLocaleString();

// ─── Admin routing ────────────────────────────
export const isAdminSubdomain = () => {
  const host = window.location.hostname;
  return host.startsWith("admin.") || window.location.pathname.startsWith("/admin");
};
