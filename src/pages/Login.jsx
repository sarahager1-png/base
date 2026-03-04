import React, { useState, useEffect } from 'react';
import { Sparkles, GraduationCap, Shield, Users, CalendarDays, ChevronLeft } from 'lucide-react';

const FEATURES = [
  { icon: CalendarDays, label: 'יומן בית הספר', desc: 'ניהול לוחות זמנים ואירועים' },
  { icon: Users,        label: 'ניהול צוות',    desc: 'HR, תורנויות ומשימות' },
  { icon: Shield,       label: 'נוכחות ודיווח', desc: 'היעדרויות ואישורים בקליק' },
  { icon: GraduationCap, label: 'מרכז הוראה',  desc: 'מערכת שעות ופעילויות' },
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
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
             style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-10 blur-3xl"
             style={{ background: 'radial-gradient(circle, #4f46e5, transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5 blur-3xl"
             style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />

        {/* Floating dots */}
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-20"
            style={{
              width: `${4 + (i % 4) * 3}px`,
              height: `${4 + (i % 4) * 3}px`,
              top: `${10 + (i * 7.5) % 80}%`,
              left: `${5 + (i * 8.3) % 90}%`,
              background: i % 2 === 0 ? '#6366f1' : '#8b5cf6',
              animation: `pulse ${2 + (i % 3)}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* Main card */}
      <div
        className={`relative z-10 w-full max-w-md transition-all duration-700 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
        }`}
      >
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <div className="relative mx-auto mb-4 h-20 w-20">
            <div className="absolute inset-0 rounded-2xl opacity-40 blur-xl"
                 style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }} />
            <div className="relative h-20 w-20 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl"
                 style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #4f46e5 100%)' }}>
              <div className="absolute inset-0 opacity-30"
                   style={{ background: 'radial-gradient(circle at 30% 30%, #fff, transparent 60%)' }} />
              <Sparkles className="h-10 w-10 text-white relative z-10" />
            </div>
          </div>

          <h1 className="text-3xl font-black text-white tracking-widest mb-1">SMART BASE</h1>
          <p className="text-slate-400 text-sm">מערכת ניהול חכמה לבית הספר</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 p-8 shadow-2xl backdrop-blur-sm"
             style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)' }}>

          <h2 className="text-xl font-bold text-white text-center mb-2">ברוכים הבאים</h2>
          <p className="text-slate-400 text-sm text-center mb-8">
            התחברו כדי לגשת למערכת ניהול בית הספר
          </p>

          {/* Feature list */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="rounded-xl p-3 border border-white/8 transition-colors hover:border-indigo-500/30"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="p-1.5 rounded-lg w-fit mb-2"
                     style={{ background: 'linear-gradient(135deg, #6366f122, #4f46e522)' }}>
                  <Icon className="h-4 w-4 text-indigo-400" />
                </div>
                <p className="text-white text-xs font-bold leading-tight">{label}</p>
                <p className="text-slate-500 text-[10px] mt-0.5 leading-tight">{desc}</p>
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

        {/* Footer */}
        <p className="text-center text-slate-600 text-[11px] mt-6">
          © {new Date().getFullYear()} Smart Base · מערכת ניהול חכמה
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          from { opacity: 0.1; transform: scale(1); }
          to   { opacity: 0.3; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
