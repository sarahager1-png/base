import React, { useMemo } from 'react';
import { Sparkles, Clock, CheckSquare, AlertTriangle } from 'lucide-react';

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return { text: 'בוקר טוב', emoji: '☀️', sub: 'יום פרודקטיבי לפניך' };
  if (h >= 12 && h < 17) return { text: 'צהריים טובים', emoji: '🌤️', sub: 'חצי יום נשאר לעשות הכל' };
  if (h >= 17 && h < 21) return { text: 'ערב טוב', emoji: '🌇', sub: 'סיכום יום מצוין' };
  return { text: 'לילה טוב', emoji: '🌙', sub: 'מנוחה טובה' };
}

export default function MorningGreeting({ user, pendingAbsences = 0, pendingPurchases = 0, openTickets = 0 }) {
  const greeting = useMemo(() => getGreeting(), []);
  const total = pendingAbsences + pendingPurchases + openTickets;

  return (
    <div className="relative rounded-2xl overflow-hidden animate-fade-in"
         style={{ background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 30%, #7c3aed 65%, #6d28d9 100%)', minHeight: '110px' }}>

      {/* Mesh / noise overlay for depth */}
      <div className="absolute inset-0 opacity-10"
           style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large left glow */}
        <div className="absolute -top-16 -left-16 h-56 w-56 rounded-full opacity-20"
             style={{ background: 'radial-gradient(circle, #a5b4fc, transparent)' }} />
        {/* Right glow */}
        <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full opacity-15"
             style={{ background: 'radial-gradient(circle, #c4b5fd, transparent)' }} />
        {/* Center streak */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-1/3 opacity-10"
             style={{ background: 'linear-gradient(180deg, #fff 0%, transparent 100%)' }} />
        {/* Floating dots */}
        <div className="absolute top-3 right-1/3 h-2.5 w-2.5 rounded-full bg-white/30 animate-float" />
        <div className="absolute top-10 right-1/2 h-1.5 w-1.5 rounded-full bg-white/20 animate-float" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-4 left-1/4 h-2 w-2 rounded-full bg-white/25 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-6 left-1/3 h-1 w-1 rounded-full bg-white/20 animate-float" style={{ animationDelay: '1.5s' }} />
        <div className="absolute bottom-6 right-1/4 h-1.5 w-1.5 rounded-full bg-white/15 animate-float" style={{ animationDelay: '0.8s' }} />
      </div>

      <div className="relative z-10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Emoji badge with glassmorphism */}
          <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
               style={{
                 background: 'rgba(255,255,255,0.18)',
                 backdropFilter: 'blur(12px)',
                 border: '1px solid rgba(255,255,255,0.3)',
                 boxShadow: '0 8px 32px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)',
               }}>
            {greeting.emoji}
          </div>

          <div>
            <p className="text-indigo-200 text-xs font-medium mb-0.5 tracking-wide">{greeting.sub}</p>
            <h2 className="text-white text-2xl font-black leading-tight drop-shadow-sm">
              {greeting.text}, {user?.full_name?.split(' ')[0]}!
            </h2>
          </div>
        </div>

        {/* Status chips */}
        <div className="flex items-center gap-2 flex-wrap">
          {total > 0 ? (
            <>
              {pendingAbsences > 0 && (
                <div className="flex items-center gap-1.5 rounded-xl px-3 py-2"
                     style={{
                       background: 'rgba(255,255,255,0.15)',
                       backdropFilter: 'blur(8px)',
                       border: '1px solid rgba(255,255,255,0.25)',
                       boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
                     }}>
                  <Clock className="h-3.5 w-3.5 text-yellow-300" />
                  <span className="text-white text-xs font-semibold">{pendingAbsences} היעדרויות</span>
                </div>
              )}
              {pendingPurchases > 0 && (
                <div className="flex items-center gap-1.5 rounded-xl px-3 py-2"
                     style={{
                       background: 'rgba(255,255,255,0.15)',
                       backdropFilter: 'blur(8px)',
                       border: '1px solid rgba(255,255,255,0.25)',
                       boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
                     }}>
                  <CheckSquare className="h-3.5 w-3.5 text-green-300" />
                  <span className="text-white text-xs font-semibold">{pendingPurchases} רכש</span>
                </div>
              )}
              {openTickets > 0 && (
                <div className="flex items-center gap-1.5 rounded-xl px-3 py-2"
                     style={{
                       background: 'rgba(255,255,255,0.15)',
                       backdropFilter: 'blur(8px)',
                       border: '1px solid rgba(255,255,255,0.25)',
                       boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
                     }}>
                  <AlertTriangle className="h-3.5 w-3.5 text-red-300" />
                  <span className="text-white text-xs font-semibold">{openTickets} תקלות</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 rounded-xl px-4 py-2.5"
                 style={{
                   background: 'rgba(255,255,255,0.18)',
                   backdropFilter: 'blur(8px)',
                   border: '1px solid rgba(255,255,255,0.3)',
                   boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
                 }}>
              <Sparkles className="h-4 w-4 text-yellow-300" />
              <span className="text-white text-sm font-bold">הכל מסודר!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
