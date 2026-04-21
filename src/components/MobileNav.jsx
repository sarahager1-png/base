import React from 'react';
import { Home, Clock, CheckSquare, Printer, Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';

const TABS = [
  { id: 'dashboard',   label: 'בית',      Icon: Home },
  { id: 'attendance',  label: 'היעדרות',  Icon: Clock },
  { id: 'tasks',       label: 'משימות',   Icon: CheckSquare },
  { id: 'printing',    label: 'צילומים',  Icon: Printer },
  { id: 'notifications', label: 'התראות', Icon: Bell },
];

export default function MobileNav({ activeView, setView, userEmail }) {
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userEmail],
    queryFn: () => base44.entities.Notification.filter({ user_email: userEmail }),
    enabled: !!userEmail,
    refetchInterval: 30000,
  });

  const unread = notifications.filter(n => !n.read).length;

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 safe-area-inset"
         style={{ background: 'linear-gradient(160deg,#0f172a 0%,#1d3461 60%,#1e3a5f 100%)', borderTop: '1px solid rgba(59,130,246,0.2)', paddingBottom: 'env(safe-area-inset-bottom,0px)' }}>
      <div className="flex items-stretch">
        {TABS.map(({ id, label, Icon }) => {
          const active = activeView === id;
          const showBadge = id === 'notifications' && unread > 0;
          return (
            <button
              key={id}
              onClick={() => setView(id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all relative ${active ? 'opacity-100' : 'opacity-40'}`}
            >
              {active && (
                <span className="absolute top-0 inset-x-3 h-0.5 rounded-b-full"
                      style={{ background: 'linear-gradient(90deg,#93c5fd,#22c55e)' }} />
              )}
              <div className="relative">
                <Icon className={`h-5 w-5 ${active ? 'text-blue-200' : 'text-white'}`} />
                {showBadge && (
                  <span className="absolute -top-1.5 -left-1.5 min-w-[16px] h-4 rounded-full bg-yellow-500 text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold leading-none ${active ? 'text-blue-200' : 'text-white'}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
