import React, { useMemo } from 'react';
import { Sparkles, Clock, CheckSquare, AlertTriangle, ArrowLeft } from 'lucide-react';

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return { text: 'בוקר טוב', emoji: '☀️', sub: 'יום פרודקטיבי לפניך', color: '#f59e0b' };
  if (h >= 12 && h < 17) return { text: 'צהריים טובים', emoji: '🌤️', sub: 'חצי יום נשאר לעשות הכל', color: '#f97316' };
  if (h >= 17 && h < 21) return { text: 'ערב טוב', emoji: '🌇', sub: 'סיכום יום מצוין', color: '#a78bfa' };
  return { text: 'לילה טוב', emoji: '🌙', sub: 'מנוחה טובה', color: '#818cf8' };
}

export default function MorningGreeting({ user, pendingAbsences = 0, pendingPurchases = 0, openTickets = 0 }) {
  const greeting = useMemo(() => getGreeting(), []);
  const total = pendingAbsences + pendingPurchases + openTickets;
  const firstName = user?.full_name?.split(' ')[0];

  return (
    <div className="relative rounded-3xl overflow-hidden animate-fade-in"
         style={{ minHeight: '120px', background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>

      {/* Animated aurora layers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-40"
             style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 65%)', filter: 'blur(40px)', animation: 'pulse 4s ease-in-out infinite' }} />
        <div className="absolute -bottom-16 -left-10 w-64 h-64 rounded-full opacity-30"
             style={{ background: 'radial-gradient(circle, #4f46e5 0%, transparent 65%)', filter: 'blur(35px)', animation: 'pulse 5s ease-in-out infinite 1s' }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-full opacity-20"
             style={{ background: 'radial-gradient(ellipse at 50% 0%, #a78bfa 0%, transparent 60%)', filter: 'blur(30px)' }} />
      </div>

      {/* Shimmer line at top */}
      <div className="absolute top-0 left-0 right-0 h-px"
           style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(167,139,250,0.8) 30%, rgba(255,255,255,0.9) 50%, rgba(167,139,250,0.8) 70%, transparent 100%)' }} />

      <div className="relative z-10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">

        {/* Left: greeting */}
        <div className="flex items-center gap-5">
          {/* Logo badge */}
          <div className="relative flex-shrink-0">
            <div className="h-16 w-16 rounded-2xl overflow-hidden"
                 style={{
                   border: '1px solid rgba(255,255,255,0.25)',
                   boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(167,139,250,0.3)',
                 }}>
              <img src="/icon.jpeg" alt="לוגו" className="h-full w-full object-cover" />
            </div>
            {/* glow dot */}
            <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-[#0f0c29]"
                 style={{ background: greeting.color, boxShadow: `0 0 8px ${greeting.color}` }} />
          </div>

          <div>
            <p className="text-xs font-medium tracking-widest uppercase mb-1"
               style={{ color: greeting.color, textShadow: `0 0 12px ${greeting.color}66` }}>
              {greeting.sub}
            </p>
            <h2 className="text-white font-black leading-none"
                style={{ fontSize: 'clamp(1.4rem, 3vw, 1.9rem)', textShadow: '0 2px 20px rgba(124,58,237,0.5)' }}>
              {greeting.text},&nbsp;
              <span style={{ background: 'linear-gradient(90deg, #c4b5fd, #fff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {firstName}!
              </span>
            </h2>
          </div>
        </div>

        {/* Right: status */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {total > 0 ? (
            <>
              {pendingAbsences > 0 && (
                <Chip icon={<Clock className="h-3.5 w-3.5" />} color="#fbbf24" label={`${pendingAbsences} היעדרויות`} />
              )}
              {pendingPurchases > 0 && (
                <Chip icon={<CheckSquare className="h-3.5 w-3.5" />} color="#34d399" label={`${pendingPurchases} רכש`} />
              )}
              {openTickets > 0 && (
                <Chip icon={<AlertTriangle className="h-3.5 w-3.5" />} color="#f87171" label={`${openTickets} תקלות`} />
              )}
              <div className="h-8 w-8 rounded-xl flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                   style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <ArrowLeft className="h-4 w-4 text-white/60" />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2.5 rounded-2xl px-5 py-3"
                 style={{
                   background: 'linear-gradient(135deg, rgba(52,211,153,0.2) 0%, rgba(16,185,129,0.1) 100%)',
                   border: '1px solid rgba(52,211,153,0.4)',
                   backdropFilter: 'blur(12px)',
                   boxShadow: '0 4px 24px rgba(52,211,153,0.15), inset 0 1px 0 rgba(255,255,255,0.15)',
                 }}>
              <Sparkles className="h-4 w-4" style={{ color: '#34d399' }} />
              <span className="font-bold text-sm text-white">הכל מסודר!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Chip({ icon, color, label }) {
  return (
    <div className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
         style={{
           background: `linear-gradient(135deg, ${color}22 0%, ${color}11 100%)`,
           border: `1px solid ${color}55`,
           backdropFilter: 'blur(12px)',
           boxShadow: `0 4px 20px ${color}22, inset 0 1px 0 rgba(255,255,255,0.1)`,
         }}>
      <span style={{ color }}>{icon}</span>
      <span className="text-white text-xs font-bold">{label}</span>
    </div>
  );
}
