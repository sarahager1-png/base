import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

const TYPE_STYLES = {
  birthday:     { bg: 'from-pink-500 to-rose-500',      emoji: '🎂', label: 'יום הולדת שמח' },
  holiday:      { bg: 'from-amber-500 to-orange-500',   emoji: '🎉', label: 'חג שמח' },
  quote:        { bg: 'from-indigo-500 to-purple-600',  emoji: '💬', label: 'ציטוט היום' },
  announcement: { bg: 'from-slate-700 to-slate-900',    emoji: '📢', label: 'הודעה חשובה' },
  celebration:  { bg: 'from-emerald-500 to-teal-600',   emoji: '🌟', label: 'ציון מיוחד' },
};

function todayKey() {
  const d = new Date();
  return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function fullKey() {
  return new Date().toISOString().slice(0,10);
}
function seenStorageKey() {
  return `sb-announcements-seen-${fullKey()}`;
}

export default function DailyAnnouncementModal({ user }) {
  const [visible, setVisible] = useState(false);
  const [idx, setIdx] = useState(0);
  const today = todayKey();
  const fullToday = fullKey();

  const { data: all = [] } = useQuery({
    queryKey: ['daily-announcements'],
    queryFn: () => base44.entities.DailyAnnouncement.list(),
    staleTime: 1000 * 60 * 10,
  });

  // Filter: recurring (MM-DD match) or specific date match
  const todays = all.filter(a => {
    if (a.recurring) return a.date_key === today;
    return a.date_key === fullToday || a.date_key === today;
  });

  useEffect(() => {
    if (todays.length === 0) return;
    // Check if already seen today
    const seen = JSON.parse(localStorage.getItem(seenStorageKey()) || '[]');
    const unseen = todays.filter(a => !seen.includes(a.id));
    if (unseen.length > 0) {
      setVisible(true);
      setIdx(0);
    }
  }, [todays.length]);

  const handleClose = () => {
    const seen = JSON.parse(localStorage.getItem(seenStorageKey()) || '[]');
    todays.forEach(a => { if (!seen.includes(a.id)) seen.push(a.id); });
    localStorage.setItem(seenStorageKey(), JSON.stringify(seen));
    setVisible(false);
  };

  if (!visible || todays.length === 0) return null;

  const ann = todays[idx];
  const style = TYPE_STYLES[ann?.type] || TYPE_STYLES.announcement;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={handleClose} />

      <div className={`relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-fade-in bg-gradient-to-br ${style.bg}`}>
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-white/10" />
        </div>

        <div className="relative z-10 p-8 text-center text-white">
          {/* Close */}
          <button onClick={handleClose}
                  className="absolute top-4 left-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            <X className="h-4 w-4" />
          </button>

          {/* Type badge */}
          <div className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4 backdrop-blur-sm border border-white/20">
            {style.label}
          </div>

          {/* Emoji */}
          <div className="text-7xl mb-4 animate-float">{ann?.emoji || style.emoji}</div>

          {/* Title */}
          {ann?.title && (
            <h2 className="text-2xl font-black mb-3 leading-tight">{ann.title}</h2>
          )}

          {/* Message */}
          <p className="text-white/90 text-base leading-relaxed font-medium">{ann?.message}</p>

          {/* Navigation if multiple */}
          {todays.length > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={() => setIdx(i => Math.max(0, i-1))}
                      disabled={idx === 0}
                      className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
              <span className="text-xs text-white/60">{idx+1} / {todays.length}</span>
              <button onClick={() => setIdx(i => Math.min(todays.length-1, i+1))}
                      disabled={idx === todays.length-1}
                      className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          )}

          <button onClick={handleClose}
                  className="mt-6 w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-white font-bold rounded-xl transition-all">
            תודה, מתחילים! ✨
          </button>
        </div>
      </div>
    </div>
  );
}
