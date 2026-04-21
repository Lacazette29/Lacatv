import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import './styles/index.css';

import Login from './pages/Login';
import AcceptInvite from './pages/AcceptInvite';
import ResetPassword from './pages/ResetPassword';
import VALayout from './pages/va/VALayout';
import ManagerLayout from './pages/manager/ManagerLayout';
import AdminLayout from './pages/admin/AdminLayout';

function LoadingScreen({ timedOut, onRetry }) {
  return (
    <div className="min-h-screen bg-surface-bg flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-orange to-brand-amber flex items-center justify-center text-white text-2xl font-extrabold mx-auto mb-4 shadow-lg">A</div>
        {timedOut ? (
          <>
            <p className="text-gray-500 text-sm mb-3">Taking longer than expected...</p>
            <button onClick={onRetry} className="px-4 py-2 bg-brand-orange text-white rounded-lg text-sm font-semibold hover:opacity-90 transition">
              Retry
            </button>
          </>
        ) : (
          <>
            <div className="w-5 h-5 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading VEA Hub...</p>
          </>
        )}
      </div>
    </div>
  );
}

function useTimedOut(loading) {
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    if (!loading) { setTimedOut(false); return; }
    const t = setTimeout(() => setTimedOut(true), 10000);
    return () => clearTimeout(t);
  }, [loading]);
  return timedOut;
}

function ProtectedRoute({ children, allowedRoles }) {
  const { profile, loading } = useAuth();
  const timedOut = useTimedOut(loading);

  if (loading) return <LoadingScreen timedOut={timedOut} onRetry={() => window.location.reload()} />;
  if (!profile) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    const r = { vea: '/va', manager: '/manager', super_manager: '/admin', owner: '/admin' };
    return <Navigate to={r[profile.role] || '/login'} replace />;
  }
  return children;
}

function RoleRouter() {
  const { profile, loading } = useAuth();
  const timedOut = useTimedOut(loading);

  if (loading) return <LoadingScreen timedOut={timedOut} onRetry={() => window.location.reload()} />;
  if (!profile) return <Navigate to="/login" replace />;

  const r = { vea: '/va', manager: '/manager', super_manager: '/admin', owner: '/admin' };
  return <Navigate to={r[profile.role] || '/login'} replace />;
}

// Show loading screen while session restores — never flash login page
function PublicRoute({ children }) {
  const { profile, loading } = useAuth();
  const timedOut = useTimedOut(loading);

  if (loading) return <LoadingScreen timedOut={timedOut} onRetry={() => window.location.reload()} />;
  if (profile) {
    const r = { vea: '/va', manager: '/manager', super_manager: '/admin', owner: '/admin' };
    return <Navigate to={r[profile.role] || '/'} replace />;
  }
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { fontFamily: 'Outfit, sans-serif', fontSize: '13px' },
            success: { iconTheme: { primary: '#059669', secondary: '#fff' } },
            error: { iconTheme: { primary: '#DC2626', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/invite/:token" element={<AcceptInvite />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/va/*" element={<ProtectedRoute allowedRoles={['vea']}><VALayout /></ProtectedRoute>} />
          <Route path="/manager/*" element={<ProtectedRoute allowedRoles={['manager']}><ManagerLayout /></ProtectedRoute>} />
          <Route path="/admin/*" element={<ProtectedRoute allowedRoles={['owner', 'super_manager']}><AdminLayout /></ProtectedRoute>} />
          <Route path="/" element={<RoleRouter />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
