import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const [data, setData] = useState({ stats: null, activity: [] });
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard data
    fetch('http://localhost:3000/api/dashboard')
      .then(res => res.json())
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load dashboard data:", err);
        setLoading(false);
      });
    
    // Fetch health status
    fetch('http://localhost:3000/api/health')
      .then(res => res.json())
      .then(json => setHealth(json))
      .catch(err => console.error("Failed to load health:", err));
  }, []);

  if (loading || !data.stats) return <div className="p-12 text-on-surface">Loading data...</div>;

  return (
    <div className="animate-in fade-in duration-500">
      {/* Hero Section */}
      <header className="mb-16">
        <h2 className="text-[3.5rem] font-black tracking-tighter text-on-surface leading-none mb-4 font-headline">
          System Overview
        </h2>
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className={`pulse-ring absolute inline-flex h-full w-full rounded-full ${health?.status === 'healthy' ? 'bg-tertiary' : 'bg-error'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${health?.status === 'healthy' ? 'bg-tertiary' : 'bg-error'}`}></span>
          </div>
          <span className={`font-label text-sm tracking-widest ${health?.status === 'healthy' ? 'text-tertiary' : 'text-error'} uppercase font-bold`}>
            {health?.status === 'healthy' ? 'All systems operational' : 'System issues detected'}
          </span>
          {health?.checks?.aws?.accountId && (
            <span className="text-xs text-slate-500 font-mono ml-2">
              AWS: {health.checks.aws.accountId}
            </span>
          )}
        </div>
      </header>

      {/* Bento Grid Stats */}
      <div className="grid grid-cols-12 gap-6 mb-12">
        {/* Stat Card 1 */}
        <div className="col-span-12 md:col-span-4 bg-surface-container rounded-xl p-8 flex flex-col justify-between group hover:bg-surface-container-highest transition-all duration-300">
          <div>
            <span className="font-label text-xs uppercase tracking-[0.2em] text-outline">Total Resources Active</span>
            <div className="text-5xl font-bold mt-4 text-primary tracking-tight">{data.stats.totalResources}</div>
          </div>
          <div className="mt-8 flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-label">{data.stats.totalResourcesDelta}</span>
            <span className="material-symbols-outlined text-primary/40 group-hover:text-primary transition-colors">bolt</span>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="col-span-12 md:col-span-4 bg-surface-container rounded-xl p-8 flex flex-col justify-between group hover:bg-surface-container-highest transition-all duration-300">
          <div>
            <span className="font-label text-xs uppercase tracking-[0.2em] text-outline">Estimated Monthly Cost</span>
            <div className="text-5xl font-bold mt-4 text-on-surface tracking-tight">{data.stats.monthlyCost}</div>
          </div>
          <div className="mt-8 flex items-center justify-between">
            <span className="text-xs text-error font-label">{data.stats.monthlyCostDelta}</span>
            <span className="material-symbols-outlined text-outline/40 group-hover:text-on-surface transition-colors">payments</span>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="col-span-12 md:col-span-4 bg-surface-container rounded-xl p-8 flex flex-col justify-between group hover:bg-surface-container-highest transition-all duration-300">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-label text-xs uppercase tracking-[0.2em] text-outline">System Health</span>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
                </span>
                <span className="text-xs font-label text-tertiary uppercase font-bold">Healthy</span>
              </div>
            </div>
            <div className="text-5xl font-bold mt-4 text-on-surface tracking-tight">{data.stats.systemHealth}</div>
          </div>
          <div className="mt-8 flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-label">Uptime across 3 regions</span>
            <span className="material-symbols-outlined text-tertiary/40 group-hover:text-tertiary transition-colors">security</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Activity Feed */}
        <section className="col-span-12 lg:col-span-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-headline text-xl font-bold tracking-tight text-on-surface">Recent Activity Feed</h3>
            <button className="text-xs font-label uppercase tracking-widest text-primary hover:underline">View All Logs</button>
          </div>
          
          <div className="bg-surface-container rounded-xl overflow-hidden">
            {data.activity.map(act => (
                <div key={act.id} className="p-5 flex items-start gap-4 hover:bg-surface-container-high transition-colors border-b border-outline-variant/5">
                <div className={`mt-1 h-8 w-8 rounded-full bg-${act.colorClass}-container/20 flex items-center justify-center`}>
                  <span className={`material-symbols-outlined text-${act.colorClass} text-sm`}>{act.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-on-surface text-sm">
                    {act.user !== 'System' && <span className="font-bold">{act.user}</span>} {act.user === 'System' ? 'System ' : ''}
                    {act.action} <code className={`font-mono text-xs bg-surface-container-lowest px-1.5 py-0.5 rounded border border-outline-variant/20 text-${act.colorClass}`}>{act.resourceName}</code>
                    {act.targetState && <span> {act.targetState}</span>}
                  </p>
                  <span className="text-[10px] uppercase font-label tracking-widest text-outline mt-1 block">{act.time} • {act.type}</span>
                </div>
                {act.status && <span className="text-[10px] font-label text-outline bg-outline-variant/10 px-2 py-0.5 rounded">{act.status}</span>}
                {act.link && <span className="material-symbols-outlined text-outline text-sm cursor-pointer hover:text-on-surface transition-colors">open_in_new</span>}
              </div>
            ))}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="col-span-12 lg:col-span-4 space-y-6">
          <h3 className="font-headline text-xl font-bold tracking-tight text-on-surface mb-8">Quick Actions</h3>
          
          <Link to="/catalog" className="w-full relative group overflow-hidden bg-primary-container text-on-primary-container p-8 rounded-xl flex flex-col items-start gap-4 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 active:scale-[0.98]">
            <div className="absolute -right-4 -top-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined text-[120px]">rocket_launch</span>
            </div>
            <span className="material-symbols-outlined text-3xl">add_box</span>
            <div className="text-left relative z-10">
              <span className="font-headline text-2xl font-bold block">Deploy New Service</span>
              <span className="font-label text-xs uppercase tracking-widest opacity-70 mt-1 block">Initialize from template</span>
            </div>
          </Link>

          <button className="w-full relative group overflow-hidden bg-surface-container text-on-surface p-8 rounded-xl flex flex-col items-start gap-4 transition-all duration-300 border border-outline-variant/10 hover:border-primary/30 active:scale-[0.98]">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
              <span className="material-symbols-outlined text-[120px]">terminal</span>
            </div>
            <span className="material-symbols-outlined text-3xl text-primary">monitoring</span>
            <div className="text-left relative z-10">
              <span className="font-headline text-2xl font-bold block text-[#adc6ff]">View Cloud Logs</span>
              <span className="font-label text-xs uppercase tracking-widest text-outline mt-1 block">Real-time telemetry stream</span>
            </div>
          </button>

          <div className="bg-surface-container-lowest p-6 rounded-xl border border-dashed border-outline-variant/30 relative overflow-hidden">
            <p className="text-outline text-xs leading-relaxed italic relative z-10">
              "Developer productivity is a function of silence and precision."
            </p>
            <div className="mt-4 flex items-center gap-2 relative z-10">
              <div className="h-1 w-8 bg-primary/20 rounded-full"></div>
              <span className="text-[10px] font-label text-outline/50 uppercase tracking-[0.2em]">Platform Manifesto</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
