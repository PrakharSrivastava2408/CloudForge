import React from 'react';
import { useNavigate } from 'react-router-dom';

export function ResourceCard({ id, title, description, icon, providerLogo, tags, color = "primary" }) {
  const navigate = useNavigate();
  
  const colorMap = {
    primary: {
      bg: "bg-primary/10",
      text: "text-primary",
      shadow: "group-hover:shadow-[0_0_20px_rgba(77,142,255,0.3)]",
    },
    tertiary: {
      bg: "bg-tertiary/10",
      text: "text-tertiary",
      shadow: "group-hover:shadow-[0_0_20px_rgba(78,222,163,0.3)]",
    }
  };

  const style = colorMap[color] || colorMap.primary;

  const handleConfigure = () => {
    navigate(`/provision?service=${id}`);
  };

  return (
    <div className="group relative bg-surface-container rounded-xl p-8 flex flex-col justify-between transition-all duration-300 hover:bg-surface-container-high hover:-translate-y-1">
      <div className="absolute top-6 right-6 opacity-40 group-hover:opacity-100 transition-opacity">
        <img 
          src={providerLogo} 
          alt="Provider Logo" 
          className="w-8 h-8 object-contain filter grayscale group-hover:grayscale-0 transition-all" 
        />
      </div>
      <div>
        <div className={`w-12 h-12 ${style.bg} rounded-lg flex items-center justify-center mb-6`}>
          <span className={`material-symbols-outlined ${style.text} text-2xl`}>{icon}</span>
        </div>
        <h3 className="text-xl font-bold text-on-surface mb-2">{title}</h3>
        <p className="text-on-surface-variant text-sm font-light leading-relaxed mb-6">
          {description}
        </p>
        <div className="flex flex-wrap gap-2 mb-8">
          {tags.map((tag, idx) => (
            <span key={idx} className="px-2 py-1 bg-surface-container-highest text-[10px] font-label font-bold tracking-widest uppercase rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <button 
        onClick={handleConfigure}
        className={`w-full bg-primary-container text-on-primary-container py-3 rounded-lg font-label text-xs font-bold tracking-widest uppercase transition-all active:scale-95 ${style.shadow}`}>
        Configure
      </button>
    </div>
  );
}
