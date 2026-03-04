import React, { useEffect, useRef, useState } from 'react';
import {
  Home, Calendar, CheckSquare, Clock, Users, UserPlus,
  Printer, Settings, Heart, Bell, Shield, Search, X, ChevronLeft
} from 'lucide-react';

const ALL_ITEMS = [
  { id: 'dashboard',          label: 'לוח בקרה ראשי',    icon: Home,        group: 'ניווט' },
  { id: 'notifications',      label: 'התראות',            icon: Bell,        group: 'ניווט' },
  { id: 'journal',            label: 'יומן בית הספר',    icon: Calendar,    group: 'ניווט' },
  { id: 'journal-management', label: 'ניהול יומן',        icon: Calendar,    group: 'ניהול' },
  { id: 'schedule',           label: 'לוח זמנים',         icon: Calendar,    group: 'ניווט' },
  { id: 'tasks',              label: 'משימות ואישורים',   icon: CheckSquare, group: 'ניווט' },
  { id: 'attendance',         label: 'היעדרויות ודיווח',  icon: Clock,       group: 'ניווט' },
  { id: 'hr',                 label: 'ניהול צוות',        icon: Users,       group: 'ניהול' },
  { id: 'onboarding',         label: 'טפסי קליטה',        icon: UserPlus,    group: 'ניהול' },
  { id: 'printing',           label: 'מרכז צילומים',      icon: Printer,     group: 'שירותים' },
  { id: 'maintenance',        label: 'תפעול ורכש',        icon: Settings,    group: 'שירותים' },
  { id: 'duty-management',    label: 'ניהול תורנויות',    icon: Shield,      group: 'ניהול' },
  { id: 'room-management',    label: 'ניהול חדרים',       icon: Home,        group: 'שירותים' },
  { id: 'community',          label: 'קהילה והווי',       icon: Heart,       group: 'כללי' },
];

export default function CommandPalette({ isOpen, onClose, onNavigate, user }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);

  const filtered = ALL_ITEMS.filter(item =>
    item.label.includes(query) || item.id.includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null;
      }
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && filtered[selected]) {
        onNavigate(filtered[selected].id);
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, filtered, selected, onClose, onNavigate]);

  useEffect(() => { setSelected(0); }, [query]);

  if (!isOpen) return null;

  // Group results
  const groups = {};
  filtered.forEach(item => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  });

  let globalIdx = 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" dir="rtl">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-xl mx-4 rounded-2xl shadow-2xl overflow-hidden animate-fade-in"
           style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', border: '1px solid rgba(255,255,255,0.1)' }}>

        {/* Search Bar */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-white/10">
          <Search className="h-5 w-5 text-slate-400 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="חפש עמוד, פעולה..."
            className="flex-1 bg-transparent text-white placeholder-slate-500 outline-none text-sm"
          />
          <div className="flex items-center gap-1 text-slate-600 text-xs">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-slate-400 text-[10px] font-mono">ESC</kbd>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-white/10 transition-colors">
            <X className="h-4 w-4 text-slate-400" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="text-center text-slate-500 py-8 text-sm">לא נמצאו תוצאות</div>
          ) : (
            Object.entries(groups).map(([groupName, items]) => (
              <div key={groupName}>
                <p className="px-4 py-1 text-[10px] font-semibold text-slate-600 uppercase tracking-widest">{groupName}</p>
                {items.map(item => {
                  const idx = globalIdx++;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { onNavigate(item.id); onClose(); }}
                      onMouseEnter={() => setSelected(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 transition-all text-right
                        ${selected === idx ? 'bg-indigo-600/30 text-white' : 'text-slate-300 hover:bg-white/5'}`}
                    >
                      <div className={`p-1.5 rounded-lg flex-shrink-0 ${selected === idx ? 'bg-indigo-500/30' : 'bg-white/5'}`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm flex-1">{item.label}</span>
                      {selected === idx && <ChevronLeft className="h-3.5 w-3.5 text-indigo-400 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-white/5 flex items-center gap-4 text-[10px] text-slate-600">
          <span><kbd className="font-mono">↑↓</kbd> ניווט</span>
          <span><kbd className="font-mono">Enter</kbd> כניסה</span>
          <span><kbd className="font-mono">⌘K</kbd> סגירה</span>
        </div>
      </div>
    </div>
  );
}
