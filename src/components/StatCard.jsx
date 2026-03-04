import React from 'react';
import { useCountUp } from '@/hooks/useCountUp';

const COLOR_MAP = {
  red:    { from: '#ef4444', to: '#dc2626', light: '#fef2f2', text: '#b91c1c', glow: '#ef444430' },
  amber:  { from: '#f59e0b', to: '#d97706', light: '#fffbeb', text: '#b45309', glow: '#f59e0b30' },
  green:  { from: '#10b981', to: '#059669', light: '#ecfdf5', text: '#047857', glow: '#10b98130' },
  blue:   { from: '#3b82f6', to: '#2563eb', light: '#eff6ff', text: '#1d4ed8', glow: '#3b82f630' },
  purple: { from: '#8b5cf6', to: '#7c3aed', light: '#f5f3ff', text: '#6d28d9', glow: '#8b5cf630' },
  cyan:   { from: '#06b6d4', to: '#0891b2', light: '#ecfeff', text: '#0e7490', glow: '#06b6d430' },
  orange: { from: '#f97316', to: '#ea580c', light: '#fff7ed', text: '#c2410c', glow: '#f9731630' },
};

export default function StatCard({ title, value, icon: Icon, color, subtext, trend }) {
  const c = COLOR_MAP[color] || COLOR_MAP.blue;
  const animated = useCountUp(typeof value === 'number' ? value : 0);
  const display = typeof value === 'number' ? animated : value;

  return (
    <div
      className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 overflow-hidden group cursor-default
                 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{ boxShadow: `0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)` }}
    >
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
           style={{ background: `linear-gradient(90deg, ${c.from}, ${c.to})` }} />

      {/* Background glow blob */}
      <div className="absolute -top-6 -left-6 h-24 w-24 rounded-full opacity-20 blur-2xl transition-opacity duration-300 group-hover:opacity-30"
           style={{ background: `radial-gradient(circle, ${c.from}, transparent)` }} />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{title}</p>
          <h3 className="text-4xl font-black mb-1 leading-none tabular-nums"
              style={{ color: c.text }}>{display}</h3>
          {subtext && (
            <p className="text-xs text-slate-400 mt-2 font-medium">{subtext}</p>
          )}
        </div>

        <div className="flex-shrink-0 p-3 rounded-2xl shadow-md"
             style={{
               background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
               boxShadow: `0 4px 15px ${c.glow}`
             }}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>

      {trend !== undefined && (
        <div className="relative mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-1">
          <span className={`text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
          <span className="text-xs text-slate-400">מהשבוע שעבר</span>
        </div>
      )}
    </div>
  );
}
