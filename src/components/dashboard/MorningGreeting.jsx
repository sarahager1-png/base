import React, { useMemo } from 'react';
import { Sparkles, Clock, ShoppingCart, Wrench } from 'lucide-react';

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5  && h < 12) return { text: 'בוקר טוב',     sub: 'יום פרודקטיבי לפניך' };
  if (h >= 12 && h < 17) return { text: 'צהריים טובים', sub: 'חצי יום נשאר לעשות הכל' };
  if (h >= 17 && h < 21) return { text: 'ערב טוב',       sub: 'סיכום יום מצוין' };
  return                         { text: 'לילה טוב',      sub: 'מנוחה טובה' };
}

export default function MorningGreeting({ user, pendingAbsences = 0, pendingPurchases = 0, openTickets = 0 }) {
  const greeting = useMemo(() => getGreeting(), []);
  const total    = pendingAbsences + pendingPurchases + openTickets;
  const firstName = user?.full_name?.split(' ')[0] || '';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">

      {/* Greeting text */}
      <div className="flex items-center gap-4">
        <div className="h-11 w-11 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0">
          {firstName?.charAt(0) || '👋'}
        </div>
        <div>
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
            {greeting.sub}
          </p>
          <h2 className="text-xl font-black text-slate-800 leading-none">
            {greeting.text},&nbsp;{firstName}!
          </h2>
        </div>
      </div>

      {/* Status chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {total === 0 ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 border border-green-100">
            <Sparkles className="h-4 w-4 text-green-500" />
            <span className="text-sm font-semibold text-green-700">הכל מסודר!</span>
          </div>
        ) : (
          <>
            {pendingAbsences > 0 && (
              <StatusChip icon={Clock} label={`${pendingAbsences} היעדרויות`} color="amber" />
            )}
            {pendingPurchases > 0 && (
              <StatusChip icon={ShoppingCart} label={`${pendingPurchases} רכש`} color="blue" />
            )}
            {openTickets > 0 && (
              <StatusChip icon={Wrench} label={`${openTickets} תקלות`} color="red" />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatusChip({ icon: Icon, label, color }) {
  const colors = {
    amber:  'bg-amber-50 border-amber-100 text-amber-700',
    blue:   'bg-blue-50  border-blue-100  text-blue-700',
    red:    'bg-red-50   border-red-100   text-red-600',
    green:  'bg-green-50 border-green-100 text-green-700',
  };
  const iconColors = {
    amber: 'text-amber-500', blue: 'text-blue-500', red: 'text-red-400', green: 'text-green-500',
  };
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${colors[color]}`}>
      <Icon className={`h-3.5 w-3.5 ${iconColors[color]}`} />
      {label}
    </div>
  );
}
