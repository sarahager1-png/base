import React from 'react';
import { Home, Bell, Calendar, CheckSquare, LayoutGrid } from 'lucide-react';

const ITEMS = [
  { id: 'dashboard',     icon: Home,         label: 'ראשי' },
  { id: 'notifications', icon: Bell,         label: 'התראות' },
  { id: 'journal',       icon: Calendar,     label: 'יומן' },
  { id: 'tasks',         icon: CheckSquare,  label: 'משימות' },
  { id: '__menu',        icon: LayoutGrid,   label: 'עוד' },
];

const COLORS = {
  dashboard:     '#6366f1',
  notifications: '#f59e0b',
  journal:       '#10b981',
  tasks:         '#8b5cf6',
  __menu:        '#64748b',
};

export default function MobileBottomNav({ activeView, setView, openSidebar }) {
  return (
    <nav
      className="fixed bottom-0 right-0 left-0 z-50 lg:hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(15,23,42,0.97) 0%, #0f172a 100%)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-center justify-around px-2 pt-2 pb-2">
        {ITEMS.map(({ id, icon: Icon, label }) => {
          const isActive = id !== '__menu' && activeView === id;
          const color = COLORS[id];
          return (
            <button
              key={id}
              onClick={() => id === '__menu' ? openSidebar() : setView(id)}
              className="flex flex-col items-center gap-1 flex-1 py-1 relative group"
            >
              {/* Active indicator */}
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full"
                  style={{ background: color }}
                />
              )}
              <div
                className="h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200"
                style={isActive ? {
                  background: `linear-gradient(135deg, ${color}33, ${color}22)`,
                  boxShadow: `0 2px 12px ${color}40`,
                } : {}}
              >
                <Icon
                  className="h-5 w-5 transition-all duration-200"
                  style={{ color: isActive ? color : '#475569' }}
                />
              </div>
              <span
                className="text-[10px] font-medium leading-none transition-colors duration-200"
                style={{ color: isActive ? color : '#475569' }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
