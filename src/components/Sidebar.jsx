import React from 'react';
import { 
  Home, Calendar, CheckSquare, Clock, Users, UserPlus,
  Printer, Settings, Heart, LogOut, X, Bell
} from 'lucide-react';

export default function Sidebar({ activeView, setView, user, isOpen, closeSidebar, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'לוח בקרה ראשי', icon: Home, roles: ['all'] },
    { id: 'notifications', label: 'התראות', icon: Bell, roles: ['all'] },
    { id: 'journal', label: 'יומן בית הספר', icon: Calendar, roles: ['all'] },
    { id: 'journal-management', label: 'ניהול יומן', icon: Calendar, roles: ['admin', 'vice_principal'] },
    { id: 'schedule', label: 'לוח זמנים', icon: Calendar, roles: ['teacher', 'admin', 'vice_principal', 'secretary', 'coordinator', 'assistant'] },
    { id: 'tasks', label: 'משימות ואישורים', icon: CheckSquare, roles: ['all'] },
    { id: 'attendance', label: 'היעדרויות ודיווח', icon: Clock, roles: ['teacher', 'admin', 'vice_principal', 'secretary', 'coordinator', 'assistant', 'substitute'] },
    { id: 'hr', label: 'ניהול צוות', icon: Users, roles: ['admin', 'vice_principal', 'secretary', 'coordinator', 'maintenance', 'assistant', 'substitute'] },
    { id: 'onboarding', label: 'טפסי קליטה', icon: UserPlus, roles: ['substitute', 'admin', 'vice_principal'] },
    { id: 'printing', label: 'מרכז צילומים', icon: Printer, roles: ['secretary', 'teacher', 'coordinator', 'assistant', 'vice_principal'] },
    { id: 'maintenance', label: 'תפעול ורכש', icon: Settings, roles: ['admin', 'vice_principal', 'secretary', 'maintenance', 'teacher', 'coordinator'] },
    { id: 'community', label: 'קהילה והווי', icon: Heart, roles: ['all'] },
  ];

  return (
    <aside className={`
      fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out border-l border-blue-50
      ${isOpen ? 'translate-x-0' : 'translate-x-full'} lg:relative lg:translate-x-0 lg:shadow-none
    `}>
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between lg:hidden">
          <span className="font-bold text-blue-900">תפריט</span>
          <button onClick={closeSidebar}>
            <X className="h-6 w-6 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4">
          <nav className="space-y-2">
            {menuItems
              .filter(item => item.roles.includes('all') || item.roles.includes(user.role))
              .map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setView(item.id); closeSidebar(); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-right group
                    ${activeView === item.id 
                      ? 'bg-blue-50 text-blue-900 font-bold shadow-sm' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-blue-800'}
                  `}
                >
                  <item.icon className={`h-5 w-5 ${activeView === item.id ? 'text-amber-500' : 'text-slate-400 group-hover:text-blue-500'}`} />
                  <span>{item.label}</span>
                </button>
              ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={onLogout} 
            className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl w-full transition-colors font-medium"
          >
            <LogOut className="h-5 w-5" />
            <span>יציאה מהמערכת</span>
          </button>
        </div>
      </div>
    </aside>
  );
}