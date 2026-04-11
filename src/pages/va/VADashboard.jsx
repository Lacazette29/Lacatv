import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Card, StatCard, Badge, SectionHeader, CompletionRing, ProgressBar,
  priorityColors, priorityLabels, statusColors, statusLabels,
  feedbackColors, feedbackLabels
} from '../../components/ui';

export default function VADashboard({ client, profile }) {
  const [allTasks, setAllTasks] = useState([]);
  const [daily, setDaily] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (profile?.id) loadDashboard();
  }, [profile?.id, client?.id]);

  async function loadDashboard() {
    setLoading(true);
    setError(null);
    try {
      // Load all active tasks assigned to this VA across all clients
      const { data: taskData, error: taskError } = await supabase
        .from('tasks')
        .select('*, clients(client_name)')
        .eq('assigned_to', profile.id)
        .not('status', 'in', '("done","cancelled")')
        .order('due_date', { ascending: true, nullsFirst: false });

      if (taskError) throw taskError;
      setAllTasks(taskData || []);

      // Load today's checklist for active client
      const today = new Date().toISOString().split('T')[0];
      if (client?.id) {
        const { data: dailyData } = await supabase
          .from('daily_checklists')
          .select('*')
          .eq('vea_id', profile.id)
          .eq('client_id', client.id)
          .eq('check_date', today)
          .maybeSingle();
        setDaily(dailyData);

        // Load recent feedback for this client
        const { data: fbData } = await supabase
          .from('feedback')
          .select('*')
          .eq('vea_id', profile.id)
          .eq('client_id', client.id)
          .order('created_at', { ascending: false })
          .limit(5);
        setFeedback(fbData || []);
      }

      // Load all clients with hub completion data
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*, hub_tabs(tab_number, completion_pct)')
        .eq('vea_id', profile.id)
        .eq('status', 'active');

      if (clientError) throw clientError;
      setClients(clientData || []);

    } catch (err) {
      console.error('Dashboard load error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const now = new Date();
  const overdue = allTasks.filter(t => t.due_date && new Date(t.due_date) < now && new Date(t.due_date).toDateString() !== now.toDateString());
  const dueToday = allTasks.filter(t => t.due_date && new Date(t.due_date).toDateString() === now.toDateString());
  const inProgress = allTasks.filter(t => t.status === 'in_progress');
  const dailyKeys = ['goals', 'inbox', 'calendar', 'tasks', 'proactive', 'learning', 'summary'];
  const dailyDone = daily ? dailyKeys.filter(k => daily[k]).length : 0;

  function hubPct(c) {
    if (!c.hub_tabs?.length) return 0;
    return Math.round(c.hub_tabs.reduce((s, t) => s + (t.completion_pct || 0), 0) / c.hub_tabs.length);
  }

  if (loading) return (
    <div className="flex items-center justify-center p-12">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Loading your dashboard...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <p className="text-red-600 text-sm font-medium">Error loading dashboard</p>
      <p className="text-red-400 text-xs mt-1">{error}</p>
      <button onClick={loadDashboard} className="mt-3 text-xs text-red-600 underline">Try again</button>
    </div>
  );

  return (
    <div>
      {/* Stats row */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <StatCard label="Overdue" value={overdue.length} color="#DC2626" icon="⚠️" />
        <StatCard label="Due Today" value={dueToday.length} color="#D97706" icon="📅" />
        <StatCard label="In Progress" value={inProgress.length} color="#2563EB" icon="🔄" />
        <StatCard label="Daily Done" value={`${dailyDone}/7`} color="#059669" icon="⚡" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tasks panel */}
        <div className="lg:col-span-2">
          <Card>
            <SectionHeader
              title="All Tasks"
              accent="Across Clients"
              subtitle={allTasks.length === 0 ? 'No active tasks' : `${allTasks.length} active`}
            />
            {allTasks.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-3xl mb-2">🎉</div>
                <p className="text-gray-400 text-sm">No active tasks — you're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-surface-border">
                {allTasks
                  .sort((a, b) => {
                    const p = { urgent: 0, high: 1, medium: 2, low: 3 };
                    return (p[a.priority] || 3) - (p[b.priority] || 3);
                  })
                  .slice(0, 10)
                  .map(t => {
                    const isOver = t.due_date && new Date(t.due_date) < now &&
                      new Date(t.due_date).toDateString() !== now.toDateString();
                    return (
                      <div key={t.id} className={`flex items-center gap-3 py-3 ${isOver ? 'bg-red-50/50 -mx-5 px-5' : ''}`}>
                        <Badge color={priorityColors[t.priority]}>{priorityLabels[t.priority]}</Badge>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-brand-dark truncate">{t.title}</div>
                          <div className="text-[10px] text-gray-500">
                            {t.clients?.client_name} · due {t.due_date
                              ? new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                              : 'No date'}
                          </div>
                        </div>
                        <Badge color={statusColors[t.status]}>{statusLabels[t.status]}</Badge>
                        {isOver && <span className="text-[9px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">OVERDUE</span>}
                      </div>
                    );
                  })}
              </div>
            )}
          </Card>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* Daily checklist */}
          <Card>
            <div className="text-sm font-bold mb-3">⚡ Today's G.I.C.T.P.L.S.</div>
            <div className="flex gap-1.5 mb-3">
              {'GICTPLS'.split('').map((l, i) => {
                const done = daily && daily[dailyKeys[i]];
                return (
                  <div key={i}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold"
                    style={{
                      background: done ? '#059669' : '#E8724A15',
                      color: done ? '#fff' : '#E8724A',
                      border: done ? 'none' : '2px solid #E8724A30',
                    }}>
                    {done ? '✓' : l}
                  </div>
                );
              })}
            </div>
            <ProgressBar value={(dailyDone / 7) * 100} color={dailyDone === 7 ? '#059669' : '#E8724A'} />
            <div className="text-[10px] text-gray-500 mt-1">
              {dailyDone}/7 — {dailyDone === 7 ? 'All done! 🎉' : `${7 - dailyDone} remaining`}
            </div>
          </Card>

          {/* Clients hub completion */}
          <Card>
            <div className="text-sm font-bold mb-3">👥 My Clients</div>
            {clients.length === 0 ? (
              <p className="text-gray-400 text-xs py-2 text-center">No clients yet</p>
            ) : (
              clients.map(c => (
                <div key={c.id} className="flex items-center gap-3 py-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
                    style={{ background: '#E8724A15', color: '#E8724A' }}>
                    {c.client_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold truncate">{c.client_name}</div>
                    <div className="text-[10px] text-gray-400">{c.timezone || 'No timezone'}</div>
                  </div>
                  <CompletionRing value={hubPct(c)} size={32} />
                </div>
              ))
            )}
          </Card>

          {/* Manager feedback */}
          {feedback.length > 0 && (
            <Card>
              <div className="text-sm font-bold mb-3">📝 Manager Feedback</div>
              {feedback.slice(0, 3).map(f => (
                <div key={f.id} className="mb-2 p-2 rounded-lg bg-surface-muted"
                  style={{ borderLeft: `3px solid ${feedbackColors[f.feedback_type]}` }}>
                  <Badge color={feedbackColors[f.feedback_type]}>{feedbackLabels[f.feedback_type]}</Badge>
                  <div className="text-xs text-gray-600 mt-1">{f.message}</div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
