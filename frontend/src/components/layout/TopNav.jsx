import React from 'react';

export function TopNav() {
  return (
    <header className="w-full sticky top-0 z-40 bg-[#0b1326]/80 backdrop-blur-md flex items-center justify-between px-8 py-3 border-b border-transparent bg-[#060e20]">
      <div className="flex items-center gap-8">
        <span className="text-[#adc6ff] font-black text-lg tracking-widest font-['Space_Grotesk']">ORCHESTRATOR</span>
        <div className="relative group hidden md:block">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-500 text-sm">search</span>
          <input 
            type="text" 
            placeholder="Search clusters..." 
            className="bg-surface-container-low border-none focus:ring-1 focus:ring-primary text-sm rounded-lg pl-10 pr-4 py-1.5 w-64 transition-all text-on-surface"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <nav className="hidden md:flex items-center gap-6 font-['Inter'] text-sm font-medium font-['Space_Grotesk'] tracking-widest">
          <a href="#" className="text-slate-400 hover:text-[#adc6ff] transition-opacity cursor-pointer">Infra</a>
          <a href="#" className="text-[#adc6ff] border-b-2 border-[#adc6ff] pb-1 font-['Space_Grotesk'] transition-opacity cursor-pointer">Clusters</a>
          <a href="#" className="text-slate-400 hover:text-[#adc6ff] transition-opacity cursor-pointer">Security</a>
        </nav>

        <div className="flex items-center gap-4 text-slate-400">
          <button className="material-symbols-outlined hover:text-[#adc6ff] transition-all">dark_mode</button>
          <button className="relative material-symbols-outlined hover:text-[#adc6ff] transition-all">
            notifications
            <span className="absolute top-0 right-0 w-2 h-2 bg-tertiary rounded-full border-2 border-background"></span>
          </button>
          <button className="material-symbols-outlined hover:text-[#adc6ff] transition-all">help_outline</button>
          
          <div className="h-8 w-8 ml-2 rounded-full bg-surface-container-highest border border-outline-variant/30 flex items-center justify-center overflow-hidden cursor-pointer">
            <img 
              data-alt="User settings profile avatar" 
              className="w-full h-full object-cover" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuApOG7FYD0KfGPewtLq-V3zUPQD_Rm2ExpwlAdZD2RcqEnS1lgZYm9oKA8fkqrgnhG6GIaRi4z4MJETih_FcuQmejcgK0M2NtiAt1IANBDIRDS21NTJQW-BiltJ8nGRsNBBfDjV4rFKAy3omI4Nqen0N8Dq1SamIeZo-4SrRUMGA5B3Wx1fkHQjEGxcfN_eVgWMTFjUsDRIGWIaKE9WyzchcZvu5d8YKJ1JHByy6MwMXiRT00N90zkEqMNf0UgGZKTjx8fiN7UuDu2s" 
              alt="Avatar"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
