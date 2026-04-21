import React, { useState } from 'react';
import {
  Home, Calendar, CheckSquare, Clock, Users, UserPlus,
  Printer, Settings, Heart, LogOut, X, Bell, HelpCircle, BarChart2,
  Sun, Moon, Monitor, UserCircle, FolderOpen, Shield, BarChart3, SlidersHorizontal
} from 'lucide-react';
import { base44 } from '@/api/firebaseClient';
import { useQuery } from '@tanstack/react-query';
import { useAccessibility } from '@/lib/AccessibilityContext';
import { useTheme } from '@/lib/ThemeContext';
import { isEnabled } from '@/lib/featureFlags';

export default function Sidebar({ activeView, setView, user, isOpen, closeSidebar, onLogout, onUserGenderChange }) {
  const [savingGender, setSavingGender] = useState(false);
  const { gTitle } = useAccessibility();
  const { theme, setTheme } = useTheme();

  const THEME_OPTIONS = [
    { key: 'light',  icon: Sun,     label: 'בהיר' },
    { key: 'system', icon: Monitor, label: 'מערכת' },
    { key: 'dark',   icon: Moon,    label: 'כהה' },
  ];

  const handleGenderToggle = async () => {
    if (!user?.id) return;
    const newGender = user.gender === 'male' ? 'female' : 'male';
    setSavingGender(true);
    try {
      await base44.entities.User.update(user.id, { gender: newGender });
      onUserGenderChange?.(newGender);
    } finally {
      setSavingGender(false);
    }
  };

  const menuItems = [
    { id: 'dashboard',          label: 'לוח בקרה',        icon: Home,              roles: ['all'],           group: 'main' },
    { id: 'notifications',      label: 'התראות',           icon: Bell,              roles: ['all'],           group: 'main' },
    { id: 'journal',            label: 'יומן בית הספר',   icon: Calendar,          roles: ['all'],           group: 'main' },
    { id: 'tasks',              label: 'משימות ואישורים',  icon: CheckSquare,       roles: ['all'],           group: 'main' },
    { id: 'journal-management', label: 'ניהול יומן',       icon: Calendar,          roles: ['admin', 'vice_principal'], group: 'manage' },
    { id: 'schedule',           label: 'לוח זמנים',        icon: Calendar,          roles: ['teacher', 'admin', 'vice_principal', 'secretary', 'assistant', 'counselor', 'coordinator'], flag: 'schedule', group: 'manage' },
    { id: 'attendance',         label: 'היעדרויות',        icon: Clock,             roles: ['teacher', 'admin', 'vice_principal', 'secretary', 'assistant', 'substitute', 'counselor', 'coordinator'], group: 'manage' },
    { id: 'hr',                 label: 'ניהול צוות',       icon: Users,             roles: ['admin', 'vice_principal', 'secretary'], group: 'manage' },
    { id: 'onboarding',         label: 'טפסי קליטה',       icon: UserPlus,          roles: ['substitute', 'admin', 'vice_principal'], group: 'manage' },
    { id: 'duty-management',    label: 'ניהול תורנויות',   icon: Settings,          roles: ['admin', 'vice_principal', 'coordinator'], flag: 'duties', group: 'manage' },
    { id: 'room-management',    label: 'ניהול חדרים',      icon: Home,              roles: ['all'], flag: 'rooms', group: 'manage' },
    { id: 'printing',           label: 'מרכז צילומים',     icon: Printer,           roles: ['admin', 'vice_principal', 'secretary', 'teacher', 'assistant', 'counselor', 'coordinator'], group: 'ops' },
    { id: 'maintenance',        label: 'תפעול ורכש',       icon: Settings,          roles: ['admin', 'vice_principal', 'secretary', 'maintenance', 'teacher', 'counselor', 'coordinator'], group: 'ops' },
    { id: 'community',          label: 'קהילה והווי',      icon: Heart,             roles: ['all'], flag: 'community', group: 'ops' },
    { id: 'file-management',    label: 'ניהול קבצים',       icon: FolderOpen,        roles: ['all'], flag: 'files', group: 'ops' },
    { id: 'reports',            label: 'דוחות ויצוא',      icon: BarChart3,         roles: ['admin', 'vice_principal', 'coordinator', 'secretary'], flag: 'reports', group: 'insights' },
    { id: 'analytics',          label: 'אנליטיקס',         icon: BarChart2,         roles: ['admin', 'vice_principal'], group: 'insights' },
    { id: 'settings',           label: 'הגדרות מערכת',     icon: SlidersHorizontal, roles: ['admin', 'vice_principal'], group: 'system' },
    { id: 'help',               label: 'מרכז עזרה',         icon: HelpCircle,        roles: ['all'],           group: 'system' },
    { id: 'profile',            label: 'הפרופיל שלי',       icon: UserCircle,        roles: ['all'],           group: 'system' },
    { id: 'school-admin',       label: 'ניהול פיתוח',       icon: Shield,            roles: ['super_admin'],   group: 'system' },
  ];

  const GROUP_LABELS = {
    main:     'ראשי',
    manage:   'ניהול',
    ops:      'תפעול',
    insights: 'נתונים',
    system:   'מערכת',
  };

  const { data: notifData = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user.email }),
    enabled: !!user?.email,
    refetchInterval: 30000,
  });
  const unreadCount = notifData.filter(n => !n.read).length;

  const effectiveRole = user?.role === 'super_admin' ? 'admin' : user?.role;

  const filtered = menuItems.filter(item =>
    (item.roles.includes('all') || item.roles.includes(effectiveRole) || item.roles.includes(user?.role)) &&
    (!item.flag || isEnabled(item.flag))
  );

  // Group items
  const groups = ['main', 'manage', 'ops', 'insights', 'system'];
  const grouped = groups
    .map(g => ({ group: g, items: filtered.filter(i => i.group === g) }))
    .filter(g => g.items.length > 0);

  return (
    <aside className={`
      fixed inset-y-0 right-0 z-50 w-64 transform transition-all duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : 'translate-x-full'} lg:relative lg:translate-x-0
      flex flex-col shrink-0
      bg-white border-l border-slate-200/70
    `}>
      {/* Mobile close */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 lg:hidden border-b border-slate-100">
        <div className="flex items-center gap-2">
          <img src="/logo-smartbase.jpeg" alt="" className="h-7 w-7 rounded-lg object-cover object-top" />
          <span className="text-slate-800 font-bold text-sm">תפריט</span>
        </div>
        <button onClick={closeSidebar} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 scrollbar-thin">
        {grouped.map(({ group, items }, gi) => (
          <div key={group} className={gi > 0 ? 'mt-4' : ''}>
            {/* Section label */}
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 mb-1.5">
              {GROUP_LABELS[group]}
            </p>

            <div className="space-y-0.5">
              {items.map((item) => {
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setView(item.id); closeSidebar(); }}
                    className={`
                      relative w-full flex items-center gap-2.5 px-3 py-2 rounded-xl
                      transition-all duration-150 text-right group
                      ${isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }
                    `}
                  >
                    {/* Active left indicator */}
                    {isActive && (
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-600 rounded-full" />
                    )}

                    {/* Icon */}
                    <div className={`
                      h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-150
                      ${isActive
                        ? 'bg-blue-600 shadow-sm shadow-blue-200'
                        : 'bg-slate-100 group-hover:bg-slate-200'
                      }
                    `}>
                      <item.icon className={`h-3.5 w-3.5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`} />
                    </div>

                    <span className={`text-[13px] flex-1 leading-tight ${isActive ? 'font-semibold' : 'font-medium'}`}>
                      {item.label}
                    </span>
                    {item.id === 'notifications' && unreadCount > 0 && (
                      <span className="min-w-[20px] h-5 px-1 rounded-full bg-yellow-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom section */}
      <div className="p-3 border-t border-slate-100 space-y-2">
        {/* User card */}
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-black text-white flex-shrink-0 bg-blue-600 shadow-sm shadow-blue-200">
              {user.full_name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-slate-800 text-xs font-bold truncate">{user.full_name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-slate-400 text-[10px] truncate">{user.title || gTitle(user.role, user.gender)}</p>
                <button
                  onClick={handleGenderToggle}
                  disabled={savingGender}
                  className="text-[10px] px-1.5 py-0.5 rounded-md font-bold transition-all disabled:opacity-50 flex-shrink-0"
                  style={{
                    background: user.gender === 'male' ? 'rgba(13,148,136,0.12)' : 'rgba(236,72,153,0.12)',
                    color: user.gender === 'male' ? '#0d9488' : '#ec4899',
                  }}
                  title="לחצי לשינוי מגדר"
                >
                  {user.gender === 'male' ? 'בן' : 'בת'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Theme selector */}
        <div className="flex items-center gap-0.5 p-0.5 rounded-xl bg-slate-100">
          {THEME_OPTIONS.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setTheme(key)}
              title={label}
              className={`flex-1 flex items-center justify-center py-1.5 rounded-lg transition-all duration-150 ${
                theme === key
                  ? 'bg-white text-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl w-full text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-150 group"
        >
          <div className="h-7 w-7 rounded-lg bg-slate-100 group-hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition-colors">
            <LogOut className="h-3.5 w-3.5 group-hover:text-red-500 transition-colors" />
          </div>
          <span className="text-[13px] font-medium">יציאה מהמערכת</span>
        </button>
      </div>
    </aside>
  );
}
