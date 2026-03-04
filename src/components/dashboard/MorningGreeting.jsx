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
         style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 40%, #6366f1 100%)' }}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-12 -left-12 h-48 w-48 rounded-full opacity-20"
             style={{ background: 'radial-gradient(circle, #fff, transparent)' }} />
        <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full opacity-10"
             style={{ background: 'radial-gradient(circle, #fff, transparent)' }} />
        <div className="absolute top-4 right-1/3 h-2 w-2 rounded-full bg-white/20 animate-float" />
        <div className="absolute top-8 right-1/2 h-1.5 w-1.5 rounded-full bg-white/15 animate-float" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-4 left-1/4 h-2 w-2 rounded-full bg-white/20 animate-float" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-2xl shadow-lg border border-white/20 flex-shrink-0">
            {greeting.emoji}
          </div>
          <div>
            <p className="text-white/70 text-xs font-medium mb-0.5">{greeting.sub}</p>
            <h2 className="text-white text-2xl font-black leading-tight">
              {greeting.text}, {user?.full_name?.split(' ')[0]}!
            </h2>
          </div>
        </div>

        {total > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {pendingAbsences > 0 && (
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
                <Clock className="h-3.5 w-3.5 text-yellow-300" />
                <span className="text-white text-xs font-semibold">{pendingAbsences} היעדרויות</span>
              </div>
            )}
            {pendingPurchases > 0 && (
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
                <CheckSquare className="h-3.5 w-3.5 text-green-300" />
                <span className="text-white text-xs font-semibold">{pendingPurchases} רכש</span>
              </div>
            )}
            {openTickets > 0 && (
              <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
                <AlertTriangle className="h-3.5 w-3.5 text-red-300" />
                <span className="text-white text-xs font-semibold">{openTickets} תקלות</span>
              </div>
            )}
          </div>
        )}
        {total === 0 && (
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20">
            <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            <span className="text-white text-xs font-semibold">הכל מסודר!</span>
          </div>
        )}
      </div>
    </div>
  );
}
