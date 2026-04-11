import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import {
  Home, CheckSquare, FileText, Clock, MessageSquare,
  BookOpen, ClipboardList, Settings, LogOut, Bell, Flame
} from 'lucide-react';

import VADashboard from './VADashboard';
import VATasks from './VATasks';
import VADaily from './VADaily';
import VAHub from './VAHub';
import VATime from './VATime';
import VAComms from './VAComms';
import VASettings from './VASettings';

const NAV_ITEMS = [
  { path: '', icon: Home, label: 'Dashboard', exact: true },
  { path: 'tasks', icon: CheckSquare, label: 'Tasks' },
  { path: 'daily', icon: ClipboardList, label: 'G.I.C.T.P.L.S.' },
  { path: 'hub', icon: BookOpen, label: 'Knowledge Base' },
  { path: 'time', icon: Clock, label: 'Time Tracker' },
  { path: 'comms', icon: MessageSquare, label: 'Comm Log' },
  { path: 'settings', icon: Settings, label: 'Settings' },
];

export default function VALayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [clients, setClients] = useState([]);
  const [activeClient, setActiveClient] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [streak, setStreak] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);

  useEffect(() => {
    if (profile?.id) loadClients();
  }, [profile?.id]);

  async function loadClients() {
    setLoadingClients(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('vea_id', profile.id)
      .eq('status', 'active')
      .order('created_at');

    if (error) {
      toast.error('Error loading clients');
      setLoadingClients(false);
      return;
    }

    const clientList = data || [];
    setClients(clientList);

    if (clientList.length > 0) {
      setActiveClient(clientList[0]);
    }

    // Load unread alerts
    const { data: alertData } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(10);
    setAlerts(alertData || []);

    // Load streak
    const { data: streakData } = await supabase
      .from('va_streaks')
      .select('streak_days')
      .eq('vea_id', profile.id)
      .maybeSingle();
    setStreak(streakData?.streak_days || 0);

    setLoadingClients(false);
  }

  async function handleSignOut() {
    await signOut();
    navigate('/login');
  }

  function isActive(path) {
    const fullPath = `/va${path ? '/' + path : ''}`;
    if (path === '') {
      return location.pathname === '/va' || location.pathname === '/va/';
    }
    return location.pathname.startsWith(fullPath);
  }

  function navigateTo(path) {
    navigate(`/va${path ? '/' + path : ''}`);
  }

  if (!profile) return null;

  // Pages that don't need a client selected
  const clientFreePages = ['settings'];
  const currentPage = location.pathname.replace('/va/', '').replace('/va', '') || '';
  const needsClient = !clientFreePages.includes(currentPage);

  return (
    <div className="min-h-screen bg-surface-bg flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-16'} bg-white border-r border-surface-border flex flex-col transition-all duration-200 min-h-screen flex-shrink-0`}>
        {/* Logo */}
        <div className="p-4 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-brand-orange to-brand-amber flex items-center justify-center text-white text-base font-extrabold shadow-sm flex-shrink-0">A</div>
            {sidebarOpen && (
              <div>
                <div className="font-display text-sm font-extrabold text-brand-dark leading-tight">VEA Hub</div>
                <div className="text-[10px] text-gray-400 truncate max-w-[110px]">{profile.name}</div>
              </div>
            )}
          </div>
        </div>

        {/* Client Switcher */}
        {sidebarOpen && (
          <div className="px-3 py-2 border-b border-surface-border">
            {loadingClients ? (
              <div className="h-8 bg-gray-100 rounded-lg animate-pulse" />
            ) : clients.length === 0 ? (
              <p className="text-[10px] text-gray-400 py-1 text-center">No clients yet</p>
            ) : (
              <select
                value={activeClient?.id || ''}
                onChange={e => setActiveClient(clients.find(c => c.id === e.target.value))}
                className="w-full px-2 py-1.5 bg-surface-muted border border-surface-border rounded-lg text-xs font-medium outline-none focus:border-brand-orange"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.client_name}</option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 py-2 px-2">
          {NAV_ITEMS.map(item => {
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigateTo(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm font-medium transition mb-0.5
                  ${active
                    ? 'bg-orange-50 text-brand-orange'
                    : 'text-gray-500 hover:bg-surface-hover hover:text-brand-dark'
                  }`}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {sidebarOpen && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-surface-border">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-surface-border px-5 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-400 hover:text-brand-dark transition">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            {activeClient && (
              <div className="text-sm">
                <span className="font-semibold text-brand-dark">{activeClient.client_name}</span>
                {activeClient.timezone && <span className="text-gray-400 ml-2 text-xs">({activeClient.timezone})</span>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {streak > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 border border-amber-200 rounded-md">
                <Flame size={14} className="text-amber-500" />
                <span className="text-xs font-semibold text-amber-600">{streak}d</span>
              </div>
            )}
            <button className="relative p-1.5 rounded-lg hover:bg-surface-hover transition">
              <Bell size={18} className="text-gray-400" />
              {alerts.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                  {alerts.length > 9 ? '9+' : alerts.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 overflow-y-auto">
          {/* Settings page never needs a client */}
          {currentPage === 'settings' ? (
            <VASettings clients={clients} setClients={setClients} profile={profile} />
          ) : clients.length === 0 && !loadingClients ? (
            /* No clients yet — prompt to add one */
            <div className="bg-white rounded-xl border border-surface-border p-12 text-center">
              <div className="text-4xl mb-3">👋</div>
              <h2 className="text-lg font-bold text-brand-dark mb-2">Welcome to VEA Hub, {profile.name}!</h2>
              <p className="text-gray-500 text-sm mb-4">Let's add your first client to get started.</p>
              <button
                onClick={() => navigateTo('settings')}
                className="px-5 py-2 bg-gradient-to-r from-brand-orange to-brand-amber text-white rounded-lg text-sm font-semibold hover:opacity-90 transition"
              >
                + Add First Client
              </button>
            </div>
          ) : loadingClients ? (
            <div className="flex items-center justify-center p-12">
              <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Routes>
              <Route index element={<VADashboard client={activeClient} profile={profile} />} />
              <Route path="tasks" element={<VATasks client={activeClient} profile={profile} />} />
              <Route path="daily" element={<VADaily client={activeClient} profile={profile} />} />
              <Route path="hub/*" element={<VAHub client={activeClient} profile={profile} />} />
              <Route path="time" element={<VATime client={activeClient} profile={profile} />} />
              <Route path="comms" element={<VAComms client={activeClient} profile={profile} />} />
              <Route path="settings" element={<VASettings clients={clients} setClients={setClients} profile={profile} />} />
            </Routes>
          )}
        </main>
      </div>
    </div>
  );
}
