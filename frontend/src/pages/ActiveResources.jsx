import React, { useState, useEffect } from 'react';

export function ActiveResources() {
  const [resources, setResources] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchResources = () => {
    fetch('http://localhost:3000/api/resources')
      .then(res => res.json())
      .then(json => {
        setResources(json.resources || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load resources:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchResources();
    
    // Poll to keep resources updated automatically, assuming provision happens 
    const interval = setInterval(fetchResources, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = (id) => {
    setDeletingId(id);
    
    // Optimistically update the UI to instantly start "destroying" or vanishing it
    // Meanwhile tell Backend to delete it
    fetch(`http://localhost:3000/api/resources/${id}`, { method: 'DELETE' })
      .then(() => {
          setTimeout(() => {
              setResources(prev => prev.filter(r => r.id !== id));
              setDeletingId(null);
          }, 600);
      })
      .catch((err) => {
          console.error("Delete failed", err);
          setDeletingId(null);
          fetchResources(); // Revert
      });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) return <div className="p-12 text-on-surface">Loading resources...</div>;

  return (
    <div className="max-w-7xl mx-auto w-full animate-in fade-in duration-500">
      <header className="mb-12 flex items-end justify-between">
        <div>
          <h2 className="text-5xl font-black tracking-tighter text-on-surface mb-2 font-headline">Active Resources ({resources.length})</h2>
          <p className="text-slate-500 font-label tracking-wide uppercase text-sm">Fleet Status: Operational • Region: us-east-1</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-surface-container-high rounded-lg font-label text-sm font-medium hover:bg-surface-container-highest transition-colors">
            <span className="material-symbols-outlined text-sm">filter_list</span>
            Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-container text-on-primary-container rounded-lg font-label text-sm font-bold hover:opacity-90 transition-opacity">
            <span className="material-symbols-outlined text-sm">download</span>
            Export List
          </button>
        </div>
      </header>

      {/* Resource Table Container */}
      <div className="bg-surface-container rounded-xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-high/50 border-b border-outline-variant/10">
              <th className="px-6 py-4 font-label text-xs uppercase tracking-widest text-slate-400 font-semibold">Name</th>
              <th className="px-6 py-4 font-label text-xs uppercase tracking-widest text-slate-400 font-semibold">Type</th>
              <th className="px-6 py-4 font-label text-xs uppercase tracking-widest text-slate-400 font-semibold">Status</th>
              <th className="px-6 py-4 font-label text-xs uppercase tracking-widest text-slate-400 font-semibold">IP/DNS Address</th>
              <th className="px-6 py-4 font-label text-xs uppercase tracking-widest text-slate-400 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/5">
            {resources.map((res) => (
              <tr 
                key={res.id} 
                className={`hover:bg-surface-container-highest/30 transition-all duration-300 group ${deletingId === res.id ? 'opacity-30 grayscale pointer-events-none' : ''}`}
              >
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="font-bold text-on-surface">{res.name}</span>
                    <span className="text-xs text-slate-500 font-label">uuid: {res.id.split('-').slice(0, 2).join('-')}***</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="px-2 py-1 bg-surface-container-lowest border border-outline-variant/20 rounded text-[10px] font-bold font-label uppercase text-[#adc6ff]">
                    {res.type}
                  </span>
                </td>
                <td className="px-6 py-5">
                  {res.status === 'Active' ? (
                    <div className="flex items-center gap-2 text-tertiary">
                      <span className="w-2 h-2 rounded-full bg-tertiary status-pulse"></span>
                      <span className="text-xs font-bold font-label uppercase tracking-tight">Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-400">
                      <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                      <span className="text-xs font-bold font-label uppercase tracking-tight">{res.status}</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2 group/copy">
                    <code className="text-xs font-mono text-slate-300 bg-surface-container-lowest px-2 py-1 rounded">
                      {res.ip}
                    </code>
                    <button 
                      onClick={() => copyToClipboard(res.ip)}
                      title="Copy to clipboard"
                      className="opacity-0 group-hover/copy:opacity-100 p-1 hover:bg-surface-container-highest rounded transition-all"
                    >
                      <span className="material-symbols-outlined text-sm">content_copy</span>
                    </button>
                  </div>
                </td>
                <td className="px-6 py-5 text-right relative">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                            className="px-3 py-1 bg-surface-container-highest hover:bg-surface-bright text-xs font-label uppercase text-on-surface rounded transition-colors"
                        >
                            Restart
                        </button>
                        <button 
                            onClick={() => handleDelete(res.id)}
                            className="px-3 py-1 bg-error/10 hover:bg-error/20 text-error text-xs font-label uppercase rounded transition-colors"
                        >
                            Destroy
                        </button>
                    </div>
                </td>
              </tr>
            ))}
            {resources.length === 0 && (
                <tr><td colSpan="5" className="text-center py-8 text-on-surface-variant">No active resources found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Dashboard Stats Bento Grid */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 hover:border-outline-variant/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="material-symbols-outlined text-primary">bolt</span>
            <span className="text-xs font-label uppercase text-slate-400">Total CPU</span>
          </div>
          <div className="text-3xl font-black text-on-surface">428 vCPUs</div>
          <div className="w-full bg-surface-container-lowest h-1 rounded-full mt-4 overflow-hidden">
            <div className="bg-primary h-full w-3/4 rounded-full"></div>
          </div>
        </div>
        <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 hover:border-outline-variant/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="material-symbols-outlined text-tertiary">account_balance_wallet</span>
            <span className="text-xs font-label uppercase text-slate-400">Daily Spend</span>
          </div>
          <div className="text-3xl font-black text-on-surface">$1,240.50</div>
          <p className="text-xs text-tertiary mt-2 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">trending_up</span>
            4.2% from yesterday
          </p>
        </div>
        <div className="bg-surface-container p-6 rounded-xl border border-outline-variant/10 hover:border-outline-variant/30 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="material-symbols-outlined text-error">error</span>
            <span className="text-xs font-label uppercase text-slate-400">Alerts</span>
          </div>
          <div className="text-3xl font-black text-on-surface">2 Critical</div>
          <p className="text-xs text-slate-500 mt-2">Latency threshold exceeded in us-west-2</p>
        </div>
      </div>
    </div>
  );
}
