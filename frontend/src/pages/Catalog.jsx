import React, { useState, useEffect } from 'react';
import { ResourceCard } from '../components/ResourceCard';

export function Catalog() {
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:3000/api/catalog')
      .then(res => res.json())
      .then(json => {
        setCatalog(json.catalog);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load catalog data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-12 text-on-surface">Loading catalog...</div>;

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Hero Header Section */}
      <div className="mb-16">
        <p className="text-primary font-label text-sm font-bold tracking-[0.3em] uppercase mb-4">Internal Developer Platform</p>
        <h2 className="text-5xl lg:text-6xl font-headline font-black text-on-surface tracking-tighter leading-tight max-w-3xl">
          Service Catalog
        </h2>
        <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <p className="text-on-surface-variant text-xl font-light">Select a resource to provision into your current workspace.</p>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 bg-surface-container px-4 py-2 rounded-lg border border-outline-variant/10 hover:bg-surface-container-highest transition-colors font-label text-xs font-bold tracking-widest uppercase">
              <span className="material-symbols-outlined text-sm">filter_list</span>
              Filter
            </button>
            <button className="flex items-center gap-2 bg-surface-container px-4 py-2 rounded-lg border border-outline-variant/10 hover:bg-surface-container-highest transition-colors font-label text-xs font-bold tracking-widest uppercase">
              <span className="material-symbols-outlined text-sm">sort</span>
              Recently Added
            </button>
          </div>
        </div>
      </div>

      {/* Bento-style Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {catalog.map(item => (
            <ResourceCard 
                key={item.id}
                id={item.id}
                title={item.title}
                description={item.description}
                icon={item.icon}
                providerLogo={item.providerLogo}
                tags={item.tags}
                color={item.color}
            />
        ))}

        {/* Custom Template Request (Bento Variant) */}
        <div className="group relative bg-surface-container-low border border-dashed border-outline-variant/30 rounded-xl p-8 flex flex-col justify-center items-center text-center transition-all duration-300 hover:border-primary/50">
          <div className="w-16 h-16 rounded-full border border-dashed border-outline-variant/50 flex items-center justify-center mb-6 text-slate-500 group-hover:text-primary group-hover:border-primary transition-colors">
            <span className="material-symbols-outlined text-3xl">add</span>
          </div>
          <h3 className="text-lg font-bold text-slate-400 group-hover:text-on-surface">Missing something?</h3>
          <p className="text-slate-500 text-sm font-light max-w-[200px] mt-2">Request a custom Terraform module for your specific infrastructure needs.</p>
          <button className="mt-8 text-xs font-label font-bold tracking-[0.2em] uppercase text-primary hover:underline transition-all">
            Request Template
          </button>
        </div>
      </div>

      {/* Promotion / Announcement Banner */}
      <div className="mt-16 bg-gradient-to-r from-surface-container to-surface-container-low rounded-2xl p-10 flex flex-col md:flex-row items-center gap-10 border border-outline-variant/5">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-tertiary/10 text-tertiary rounded-full text-[10px] font-label font-black tracking-widest uppercase mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
            </span>
            New Cluster Strategy
          </div>
          <h4 className="text-3xl font-headline font-bold mb-4">Multi-region EKS Support</h4>
          <p className="text-on-surface-variant font-light leading-relaxed max-w-xl">
            Provision redundant Kubernetes clusters across US-East and EU-West with a single configuration click. Compliance and networking are handled automatically by the Orchestrator.
          </p>
        </div>
        <div className="flex-shrink-0 bg-surface-container-highest/50 backdrop-blur rounded-xl p-6 border border-outline-variant/10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 rounded-lg bg-surface-bright flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">hub</span>
            </div>
            <div>
              <p className="text-xs font-label font-bold text-on-surface uppercase">Connectivity</p>
              <p className="text-[10px] font-label text-slate-500 uppercase">Transit Gateway Enabled</p>
            </div>
          </div>
          <button className="bg-surface-bright hover:bg-primary hover:text-on-primary text-on-surface py-2 px-6 rounded-lg font-label text-[10px] font-black tracking-widest uppercase transition-all">
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}
