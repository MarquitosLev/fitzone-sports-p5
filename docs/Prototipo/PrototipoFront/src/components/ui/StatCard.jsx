import React from 'react';

export function StatCard({ title, value, change, changeType = 'positive', subtitle, icon: Icon, badge, color = 'navy' }) {
  const colorMap = {
    navy: 'bg-[#1B2A55] text-white',
    coral: 'bg-[#F26D6D] text-white',
    green: 'bg-[#2E9E5B] text-white',
    gold: 'bg-[#F0B429] text-[#1B2A55]',
    white: 'bg-white text-[#1B2A55] border border-slate-200/80',
  };

  const isDark = color === 'navy' || color === 'coral' || color === 'green';

  return (
    <div className={`rounded-2xl p-5 shadow-card transition-all hover:shadow-card-hover ${colorMap[color] || colorMap.white}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className={`text-xs font-bold tracking-wider uppercase ${isDark ? 'text-white/70' : 'text-slate-500'}`}>
            {title}
          </span>
          <div className="flex items-baseline gap-2">
            <h3 className={`text-2xl lg:text-3xl font-black font-outfit ${isDark ? 'text-white' : 'text-[#1B2A55]'}`}>
              {value}
            </h3>
            {badge && <div>{badge}</div>}
          </div>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl shrink-0 ${isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-[#1B2A55]'}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(change || subtitle) && (
        <div className="mt-3 pt-3 border-t border-slate-100/10 flex items-center justify-between text-xs">
          {change && (
            <span className={`font-bold ${
              changeType === 'positive' 
                ? (isDark ? 'text-emerald-300' : 'text-[#2E9E5B]') 
                : (isDark ? 'text-rose-300' : 'text-[#E5484D]')
            }`}>
              {change}
            </span>
          )}
          {subtitle && (
            <span className={isDark ? 'text-white/60' : 'text-slate-400'}>
              {subtitle}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
