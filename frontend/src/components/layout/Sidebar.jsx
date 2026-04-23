import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard', icon: 'dashboard' },
  { path: '/catalog', label: 'Service Catalog', icon: 'inventory_2' },
  { path: '/resources', label: 'Active Resources', icon: 'memory' },
  { path: '/billing', label: 'Billing', icon: 'payments' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

export function Sidebar({ className = "" }) {
  return (
    <aside className={`h-screen w-72 flex-col fixed left-0 top-0 border-r-0 bg-[#0b1326] flex py-8 px-4 gap-y-6 z-50 ${className}`}>
      <div className="px-4 mb-4">
        <h1 className="text-[#adc6ff] font-bold tracking-tighter text-xl font-['Space_Grotesk'] uppercase">Cloud Operator</h1>
        <p className="text-slate-500 text-[10px] font-['Space_Grotesk'] tracking-[0.2em] mt-1 uppercase">Quota: 85% Used</p>
      </div>

      <nav className="flex flex-col gap-y-1 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `px-4 py-2 flex items-center gap-3 font-['Inter'] text-sm tracking-tight font-['Space_Grotesk'] uppercase label-md transition-all duration-200 ease-in-out ${
                isActive
                  ? "text-[#adc6ff] bg-[#2d3449] rounded-lg font-bold border-l-4 border-[#adc6ff] scale-[0.98] active:opacity-80"
                  : "text-slate-400 hover:text-white hover:bg-[#2d3449] rounded-lg"
              }`
            }
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-white/5 flex flex-col gap-y-1">
        <NavLink 
            to="/provision"
            className="w-full bg-primary-container text-on-primary-container py-3 rounded-lg font-label text-xs font-bold tracking-widest uppercase hover:opacity-90 active:scale-95 transition-all text-center mb-4 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Deploy New Service
        </NavLink>
        <a className="text-slate-400 hover:text-white px-4 py-2 flex items-center gap-3 font-['Inter'] text-sm tracking-tight font-['Space_Grotesk'] uppercase label-md hover:bg-[#2d3449] rounded-lg transition-all duration-200 ease-in-out" href="#">
          <span className="material-symbols-outlined">menu_book</span>
          Documentation
        </a>
        <a className="text-slate-400 hover:text-white px-4 py-2 flex items-center gap-3 font-['Inter'] text-sm tracking-tight font-['Space_Grotesk'] uppercase label-md hover:bg-[#2d3449] rounded-lg transition-all duration-200 ease-in-out" href="#">
          <span className="material-symbols-outlined">contact_support</span>
          Support
        </a>
      </div>
    </aside>
  );
}
