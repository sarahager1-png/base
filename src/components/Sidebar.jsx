import React from 'react';
import { 
  Home, Calendar, CheckSquare, Clock, Users, UserPlus,
  Printer, Settings, Heart, LogOut, X, Bell, Shield as ShieldIcon
} from 'lucide-react';

export default function Sidebar({ activeView, setView, user, isOpen, closeSidebar, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'לוח בקרה ראשי', icon: Home, roles: ['all'] },
    { id: 'notifications', label: 'התראות', icon: Bell, roles: ['all'] },
    { id: 'journal', label: 'יומן בית הספר', icon: Calendar, roles: ['all'] },
    { id: 'journal-management', label: 'ניהול יומן', icon: Calendar, roles: ['admin', 'vice_principal'] },
    { id: 'schedule', label: 'לוח זמנים', icon: Calendar, roles: ['teacher', 'admin', 'vice_principal', 'secretary', 'assistant', 'counselor', 'coordinator'] },
    { id: 'tasks', label: 'משימות ואישורים', icon: CheckSquare, roles: ['all'] },
    { id: 'attendance', label: 'היעדרויות ודיווח', icon: Clock, roles: ['teacher', 'admin', 'vice_principal', 'secretary', 'assistant', 'substitute', 'counselor', 'coordinator'] },
    { id: 'hr', label: 'ניהול צוות', icon: Users, roles: ['admin', 'vice_principal', 'secretary'] },
    { id: 'onboarding', label: 'טפסי קליטה', icon: UserPlus, roles: ['substitute', 'admin', 'vice_principal'] },
    { id: 'printing', label: 'מרכז צילומים', icon: Printer, roles: ['secretary', 'teacher', 'assistant', 'vice_principal', 'counselor', 'coordinator'] },
    { id: 'maintenance', label: 'תפעול ורכש', icon: Settings, roles: ['admin', 'vice_principal', 'secretary', 'maintenance', 'teacher', 'counselor', 'coordinator'] },
    { id: 'duty-management', label: 'ניהול תורנויות', icon: ShieldIcon, roles: ['admin', 'vice_principal', 'coordinator'] },
    { id: 'room-management', label: 'ניהול חדרים', icon: Home, roles: ['all'] },
    { id: 'community', label: 'קהילה והווי', icon: Heart, roles: ['all'] },
  ];

  return (
    <aside className={`
      fixed inset-y-0 right-0 z-50 w-64 transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : 'translate-x-full'} lg:relative lg:translate-x-0
    `}>
      <div className="h-full flex flex-col bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 rounded-2xl shadow-xl overflow-hidden border border-white/5">
        <div className="p-5 border-b border-white/10 flex items-center justify-between lg:hidden">
          <span className="font-bold text-white">תפריט</span>
          <button onClick={closeSidebar}>
            <X className="h-5 w-5 text-white/50 hover:text-white" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-3">
          <nav className="space-y-1">
            {menuItems
              .filter(item => item.roles.includes('all') || item.roles.includes(user.role))
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setView(item.id); closeSidebar(); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 text-right group text-sm
                    ${activeView === item.id 
                      ? 'bg-white/15 text-white font-semibold shadow-inner backdrop-blur-sm border border-white/10' 
                      : 'text-white/60 hover:bg-white/8 hover:text-white/90'}
                  `}
                >
                  <item.icon className={`h-4 w-4 flex-shrink-0 ${activeView === item.id ? 'text-blue-300' : 'text-white/40 group-hover:text-white/70'}`} />
                  <span>{item.label}</span>
                </button>
              ))}
          </nav>
        </div>
        
        <div className="p-3 border-t border-white/10">
          <button 
            onClick={onLogout} 
            className="flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl w-full transition-colors font-medium text-sm"
          >
            <LogOut className="h-4 w-4" />
            <span>יציאה מהמערכת</span>
          </button>
        </div>
      </div>
    </aside>
  );
}