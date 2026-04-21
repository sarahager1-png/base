import React from 'react';
import { Clock, Check, Printer, CheckCircle, FileText } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';

const STATS = [
  { key: 'pending',     label: 'ממתינים',     icon: Clock,        from: '#f59e0b', to: '#d97706', light: '#fffbeb', glow: '#f59e0b30' },
  { key: 'approved',    label: 'מאושרים',    icon: Check,        from: '#10b981', to: '#059669', light: '#ecfdf5', glow: '#10b98130' },
  { key: 'printing',   label: 'בהדפסה',      icon: Printer,      from: '#3b82f6', to: '#2563eb', light: '#eff6ff', glow: '#3b82f630' },
  { key: 'completed',  label: 'הושלמו',      icon: CheckCircle,  from: '#2563eb', to: '#1d4ed8', light: '#eef2ff', glow: '#2563eb30' },
  { key: 'totalPages', label: 'דפים סה״כ',   icon: FileText,     from: '#eab308', to: '#ca8a04', light: '#f5f3ff', glow: '#eab30830' },
];

function StatPill({ stat, value }) {
  const animated = useCountUp(value);
  const Icon = stat.icon;
  return (
    <div
      className="relative rounded-2xl p-5 overflow-hidden group transition-all duration-300 hover:-translate-y-1.5"
      style={{
        background: `linear-gradient(145deg, ${stat.light} 0%, #ffffff 55%, ${stat.light}90 100%)`,
        border: `1px solid ${stat.from}22`,
        boxShadow: `0 2px 8px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)`,
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
           style={{ background: `linear-gradient(90deg, ${stat.from}, ${stat.to})` }} />
      {/* Glow blob */}
      <div className="absolute -top-8 -left-8 h-32 w-32 rounded-full opacity-20 blur-3xl transition-opacity group-hover:opacity-40"
           style={{ background: `radial-gradient(circle, ${stat.from}, transparent)` }} />

      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">{stat.label}</p>
          <p className="text-3xl font-black leading-none tabular-nums"
             style={{ background: `linear-gradient(135deg, ${stat.from}, ${stat.to})`,
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {animated}
          </p>
        </div>
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity blur-md scale-125"
               style={{ background: `linear-gradient(135deg, ${stat.from}, ${stat.to})` }} />
          <div className="relative p-3 rounded-xl transition-transform duration-200 group-hover:scale-110"
               style={{ background: `linear-gradient(135deg, ${stat.from}, ${stat.to})`,
                        boxShadow: `0 6px 18px ${stat.glow}` }}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PrintStats({ pending, approved, printing, completed, totalPages }) {
  const values = { pending, approved, printing, completed, totalPages };
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {STATS.map(stat => (
        <StatPill key={stat.key} stat={stat} value={values[stat.key] || 0} />
      ))}
    </div>
  );
}
