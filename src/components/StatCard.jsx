import React from 'react';
import { useCountUp } from '@/hooks/useCountUp';

const COLOR_MAP = {
  red:    { from: '#ef4444', to: '#dc2626', light: '#fef2f2', text: '#b91c1c', glow: '#ef444440' },
  amber:  { from: '#f59e0b', to: '#d97706', light: '#fffbeb', text: '#b45309', glow: '#f59e0b40' },
  green:  { from: '#10b981', to: '#059669', light: '#ecfdf5', text: '#047857', glow: '#10b98140' },
  blue:   { from: '#3b82f6', to: '#2563eb', light: '#eff6ff', text: '#1d4ed8', glow: '#3b82f640' },
  purple: { from: '#8b5cf6', to: '#7c3aed', light: '#f5f3ff', text: '#6d28d9', glow: '#8b5cf640' },
  cyan:   { from: '#06b6d4', to: '#0891b2', light: '#ecfeff', text: '#0e7490', glow: '#06b6d440' },
  orange: { from: '#f97316', to: '#ea580c', light: '#fff7ed', text: '#c2410c', glow: '#f9731640' },
};

export default function StatCard({ title, value, icon: Icon, color, subtext, trend }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  const animated = useCountUp(typeof value === 'number' ? value : 0);
  const display = typeof value === 'number' ? animated : value;

  return (
    <div
      className="relative rounded-2xl p-6 overflow-hidden group cursor-default
                 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl"
      style={{
        background: `linear-gradient(145deg, ${c.light} 0%, #ffffff 55%, ${c.light}80 100%)`,
        boxShadow: `0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)`,
        border: `1px solid ${c.from}20`,
      }}
    >
      {/* Thick top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
           style={{ background: `linear-gradient(90deg, ${c.from}, ${c.to})` }} />

      {/* Large primary glow blob */}
      <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full opacity-25 blur-3xl
                      transition-opacity duration-300 group-hover:opacity-45"
           style={{ background: `radial-gradient(circle, ${c.from}, transparent)` }} />

      {/* Secondary glow bottom-right */}
      <div className="absolute -bottom-8 -right-6 h-28 w-28 rounded-full opacity-15 blur-2xl
                      transition-opacity duration-300 group-hover:opacity-30"
           style={{ background: `radial-gradient(circle, ${c.to}, transparent)` }} />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            {title}
          </p>
          {/* Gradient number */}
          <h3
            className="text-4xl font-black mb-1 leading-none tabular-nums"
            style={{
              background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {display}
          </h3>
          {subtext && (
            <p className="text-xs text-slate-400 mt-2 font-medium">{subtext}</p>
          )}
        </div>

        {/* Icon with outer ring glow */}
        <div className="flex-shrink-0 relative">
          {/* Glow ring behind icon */}
          <div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md"
            style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})`, transform: 'scale(1.3)' }}
          />
          <div
            className="relative p-3.5 rounded-2xl shadow-lg transition-transform duration-300 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
              boxShadow: `0 8px 25px ${c.glow}`,
            }}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </div>

      {trend !== undefined && (
        <div className="relative mt-4 pt-3 border-t flex items-center gap-1"
             style={{ borderColor: `${c.from}20` }}>
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              trend >= 0
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-red-50 text-red-500'
            }`}
          >
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-xs text-slate-400">מהשבוע שעבר</span>
        </div>
      )}
    </div>
  );
}
