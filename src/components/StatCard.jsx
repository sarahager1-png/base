import React from 'react';
import { useCountUp } from '@/hooks/useCountUp';

const COLOR_MAP = {
  blue:   {
    accentBar: 'bg-blue-500',
    iconBg:    'bg-blue-600',
    iconText:  'text-white',
    numText:   'text-blue-600',
    hoverGlow: 'hover:shadow-blue-100',
    hoverBorder: 'hover:border-blue-200',
  },
  green:  {
    accentBar: 'bg-emerald-500',
    iconBg:    'bg-emerald-600',
    iconText:  'text-white',
    numText:   'text-emerald-600',
    hoverGlow: 'hover:shadow-emerald-100',
    hoverBorder: 'hover:border-emerald-200',
  },
  yellow: {
    accentBar: 'bg-amber-400',
    iconBg:    'bg-amber-500',
    iconText:  'text-white',
    numText:   'text-amber-600',
    hoverGlow: 'hover:shadow-amber-100',
    hoverBorder: 'hover:border-amber-200',
  },
  red:    {
    accentBar: 'bg-red-500',
    iconBg:    'bg-red-500',
    iconText:  'text-white',
    numText:   'text-red-600',
    hoverGlow: 'hover:shadow-red-100',
    hoverBorder: 'hover:border-red-200',
  },
  amber:  {
    accentBar: 'bg-amber-400',
    iconBg:    'bg-amber-500',
    iconText:  'text-white',
    numText:   'text-amber-600',
    hoverGlow: 'hover:shadow-amber-100',
    hoverBorder: 'hover:border-amber-200',
  },
  orange: {
    accentBar: 'bg-orange-500',
    iconBg:    'bg-orange-500',
    iconText:  'text-white',
    numText:   'text-orange-600',
    hoverGlow: 'hover:shadow-orange-100',
    hoverBorder: 'hover:border-orange-200',
  },
  purple: {
    accentBar: 'bg-violet-500',
    iconBg:    'bg-violet-600',
    iconText:  'text-white',
    numText:   'text-violet-600',
    hoverGlow: 'hover:shadow-violet-100',
    hoverBorder: 'hover:border-violet-200',
  },
  cyan:   {
    accentBar: 'bg-cyan-500',
    iconBg:    'bg-cyan-600',
    iconText:  'text-white',
    numText:   'text-cyan-600',
    hoverGlow: 'hover:shadow-cyan-100',
    hoverBorder: 'hover:border-cyan-200',
  },
  indigo: {
    accentBar: 'bg-indigo-500',
    iconBg:    'bg-indigo-600',
    iconText:  'text-white',
    numText:   'text-indigo-600',
    hoverGlow: 'hover:shadow-indigo-100',
    hoverBorder: 'hover:border-indigo-200',
  },
};

export default function StatCard({ title, value, icon: Icon, color, subtext, trend, onClick }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  const animated = useCountUp(typeof value === 'number' ? value : 0);
  const display = typeof value === 'number' ? animated : value;

  return (
    <div
      onClick={onClick}
      className={`
        group relative bg-white rounded-2xl border border-slate-200 p-5 overflow-hidden
        transition-all duration-200
        hover:-translate-y-1 hover:shadow-xl ${c.hoverGlow} ${c.hoverBorder}
        ${onClick ? 'cursor-pointer' : 'cursor-default'}
      `}
    >
      {/* Top accent bar */}
      <div className={`absolute inset-x-0 top-0 h-[3px] ${c.accentBar} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />

      {/* Icon + trend */}
      <div className="flex items-start justify-between mb-4">
        <div className={`
          p-2.5 rounded-xl ${c.iconBg}
          shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all duration-200
        `}>
          <Icon className={`h-5 w-5 ${c.iconText}`} />
        </div>
        {trend !== undefined && (
          <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${
            trend >= 0
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
              : 'bg-red-50 text-red-500 border border-red-100'
          }`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
      </div>

      {/* Number */}
      <p className={`text-4xl font-black tabular-nums leading-none mb-1.5 tracking-tight ${c.numText}`}>
        {display}
      </p>

      {/* Label */}
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-tight">
        {title}
      </p>

      {subtext && (
        <p className="text-[11px] text-slate-400 mt-2.5 pt-2.5 border-t border-slate-100">
          {subtext}
        </p>
      )}
    </div>
  );
}
