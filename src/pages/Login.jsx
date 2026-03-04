import React, { useState, useEffect } from 'react';
import {
  Sparkles, ChevronLeft, Bell, Calendar, CalendarDays,
  CheckSquare, Clock, Users, UserPlus, Printer, Settings,
  Shield, Home, Files, Heart, BarChart2, HelpCircle, LayoutDashboard
} from 'lucide-react';

const MODULES = [
  { icon: LayoutDashboard, label: 'לוח בקרה',       color: '#6366f1' },
  { icon: Bell,            label: 'התראות',           color: '#f59e0b' },
  { icon: Calendar,        label: 'יומן בית הספר',   color: '#10b981' },
  { icon: CalendarDays,    label: 'לוח זמנים',        color: '#3b82f6' },
  { icon: CheckSquare,     label: 'משימות ואישורים',  color: '#8b5cf6' },
  { icon: Clock,           label: 'היעדרויות',        color: '#ef4444' },
  { icon: Users,           label: 'ניהול צוות',       color: '#f97316' },
  { icon: UserPlus,        label: 'קליטת עובדים',     color: '#14b8a6' },
  { icon: Printer,         label: 'מרכז צילומים',     color: '#06b6d4' },
  { icon: Settings,        label: 'תפעול ורכש',       color: '#64748b' },
  { icon: Shield,          label: 'ניהול תורנויות',   color: '#ec4899' },
  { icon: Home,            label: 'ניהול חדרים',      color: '#84cc16' },
  { icon: Files,           label: 'ניהול קבצים',      color: '#0ea5e9' },
  { icon: Heart,           label: 'קהילה והווי',      color: '#f43f5e' },
  { icon: BarChart2,       label: 'אנליטיקס',         color: '#a855f7' },
  { icon: HelpCircle,      label: 'מרכז עזרה',        color: '#475569' },
];

export default function Login({ onLogin }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}
      dir="rtl"
    >
      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
             style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
             style={{ background: 'radial-gradient(circle, #4f46e5, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full opacity-5 blur-3xl"
             style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
        {[...Array(14)].map((_, i) => (
          <div key={i} className="absolute rounded-full opacity-20"
               style={{
                 width: `${4 + (i % 4) * 3}px`, height: `${4 + (i % 4) * 3}px`,
                 top: `${10 + (i * 7.5) % 80}%`, left: `${5 + (i * 8.3) % 90}%`,
                 background: i % 2 === 0 ? '#6366f1' : '#8b5cf6',
                 animation: `float-dot ${2 + (i % 3)}s infinite alternate`,
               }} />
        ))}
      </div>

      {/* Main layout - side by side on desktop */}
      <div className={`relative z-10 w-full max-w-5xl transition-all duration-700 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}>
        <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-stretch">

          {/* ── Left panel: modules grid ── */}
          <div className="w-full lg:w-[55%] rounded-3xl border border-white/10 p-6 shadow-2xl backdrop-blur-sm"
               style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)' }}>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest mb-4 text-center">
              מודולים במערכת
            </p>
            <div className="grid grid-cols-4 gap-2.5">
              {MODULES.map(({ icon: Icon, label, color }) => (
                <div key={label}
                     className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl border border-white/5 transition-all hover:border-white/15 hover:bg-white/5 cursor-default"
                     style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md"
                       style={{
                         background: `linear-gradient(135deg, ${color}33, ${color}22)`,
                         border: `1px solid ${color}40`,
                       }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <p className="text-[10px] text-slate-400 text-center leading-tight font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right panel: login ── */}
          <div className="w-full lg:w-[45%] flex flex-col">

            {/* Brand */}
            <div className="text-center mb-6">
              <div className="relative mx-auto mb-4 h-20 w-20">
                <div className="absolute inset-0 rounded-2xl opacity-40 blur-xl"
                     style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }} />
                <div className="relative h-20 w-20 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl"
                     style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #4f46e5 100%)' }}>
                  <div className="absolute inset-0 opacity-30"
                       style={{ background: 'radial-gradient(circle at 30% 30%, #fff, transparent 60%)' }} />
                  <img src="/logo.svg" alt="SMART BASE" className="h-10 w-10 relative z-10 drop-shadow" />
                </div>
              </div>
              <h1 className="text-3xl font-black text-white tracking-widest mb-1">SMART BASE</h1>
              <p className="text-slate-400 text-sm">מערכת ניהול חכמה לבית הספר</p>
            </div>

            {/* Login card */}
            <div className="flex-1 rounded-3xl border border-white/10 p-8 shadow-2xl backdrop-blur-sm flex flex-col justify-center"
                 style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)' }}>

              <h2 className="text-xl font-bold text-white text-center mb-2">ברוכים הבאים</h2>
              <p className="text-slate-400 text-sm text-center mb-8">
                התחברו כדי לגשת למערכת
              </p>

              {/* Highlights */}
              <div className="space-y-2.5 mb-8">
                {[
                  { color: '#10b981', text: '16 מודולים לניהול מלא של בית הספר' },
                  { color: '#6366f1', text: 'ממשק מותאם לכל תפקיד בצוות' },
                  { color: '#f59e0b', text: 'עברית מלאה עם תמיכה ב-RTL' },
                  { color: '#3b82f6', text: 'גישה ממובייל, טאבלט ומחשב' },
                ].map(({ color, text }) => (
                  <div key={text} className="flex items-center gap-3 px-3 py-2 rounded-xl"
                       style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: color }} />
                    <span className="text-slate-300 text-xs">{text}</span>
                  </div>
                ))}
              </div>

              {/* Login button */}
              <button
                onClick={onLogin}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-bold text-base transition-all duration-200 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] shadow-lg group"
                style={{
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #4f46e5 100%)',
                  boxShadow: '0 8px 30px #6366f140',
                }}
              >
                <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                כניסה למערכת
                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              </button>

              <p className="text-center text-slate-500 text-xs mt-5">
                גישה מורשית לצוות בית הספר בלבד
              </p>
            </div>

            <p className="text-center text-slate-600 text-[11px] mt-4">
              © {new Date().getFullYear()} Smart Base · מערכת ניהול חכמה
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float-dot {
          from { opacity: 0.1; transform: scale(1) translateY(0); }
          to   { opacity: 0.3; transform: scale(1.4) translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
