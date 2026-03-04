import React, { useState } from 'react';
import {
  Home, Calendar, CheckSquare, Clock, Users, UserPlus,
  Printer, Settings, Heart, LogOut, X, Bell, ChevronRight, Sparkles, HelpCircle
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const NAV_COLORS = {
  dashboard:          { from: '#6366f1', to: '#4f46e5' },
  notifications:      { from: '#f59e0b', to: '#d97706' },
  journal:            { from: '#10b981', to: '#059669' },
  'journal-management': { from: '#06b6d4', to: '#0891b2' },
  schedule:           { from: '#3b82f6', to: '#2563eb' },
  tasks:              { from: '#8b5cf6', to: '#7c3aed' },
  attendance:         { from: '#ef4444', to: '#dc2626' },
  hr:                 { from: '#f97316', to: '#ea580c' },
  onboarding:         { from: '#14b8a6', to: '#0d9488' },
  printing:           { from: '#6366f1', to: '#4f46e5' },
  maintenance:        { from: '#64748b', to: '#475569' },
  'duty-management':  { from: '#ec4899', to: '#db2777' },
  'room-management':  { from: '#84cc16', to: '#65a30d' },
  community:          { from: '#f43f5e', to: '#e11d48' },
  help:               { from: '#64748b', to: '#475569' },
};

export default function Sidebar({ activeView, setView, user, isOpen, closeSidebar, onLogout, onUserGenderChange }) {
  const [savingGender, setSavingGender] = useState(false);

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
    { id: 'dashboard',           label: 'לוח בקרה ראשי',   icon: Home,       roles: ['all'] },
    { id: 'notifications',       label: 'התראות',           icon: Bell,       roles: ['all'] },
    { id: 'journal',             label: 'יומן בית הספר',   icon: Calendar,   roles: ['all'] },
    { id: 'journal-management',  label: 'ניהול יומן',       icon: Calendar,   roles: ['admin', 'vice_principal'] },
    { id: 'schedule',            label: 'לוח זמנים',        icon: Calendar,   roles: ['teacher', 'admin', 'vice_principal', 'secretary', 'assistant', 'counselor', 'coordinator'] },
    { id: 'tasks',               label: 'משימות ואישורים',  icon: CheckSquare, roles: ['all'] },
    { id: 'attendance',          label: 'היעדרויות ודיווח', icon: Clock,      roles: ['teacher', 'admin', 'vice_principal', 'secretary', 'assistant', 'substitute', 'counselor', 'coordinator'] },
    { id: 'hr',                  label: 'ניהול צוות',       icon: Users,      roles: ['admin', 'vice_principal', 'secretary'] },
    { id: 'onboarding',          label: 'טפסי קליטה',       icon: UserPlus,   roles: ['substitute', 'admin', 'vice_principal'] },
    { id: 'printing',            label: 'מרכז צילומים',     icon: Printer,    roles: ['secretary', 'teacher', 'assistant', 'vice_principal', 'counselor', 'coordinator'] },
    { id: 'maintenance',         label: 'תפעול ורכש',       icon: Settings,   roles: ['admin', 'vice_principal', 'secretary', 'maintenance', 'teacher', 'counselor', 'coordinator'] },
    { id: 'duty-management',     label: 'ניהול תורנויות',   icon: Settings,   roles: ['admin', 'vice_principal', 'coordinator'] },
    { id: 'room-management',     label: 'ניהול חדרים',      icon: Home,       roles: ['all'] },
    { id: 'community',           label: 'קהילה והווי',      icon: Heart,      roles: ['all'] },
    { id: 'help',                label: 'מרכז עזרה',         icon: HelpCircle, roles: ['all'] },
  ];

  const filtered = menuItems.filter(item =>
    item.roles.includes('all') || item.roles.includes(user?.role)
  );

  return (
    <aside className={`
      fixed inset-y-0 right-0 z-50 w-64 transform transition-all duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : 'translate-x-full'} lg:relative lg:translate-x-0
      flex flex-col
      bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900
      shadow-2xl
    `}
    style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}
    >
      {/* Top close button (mobile) */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 lg:hidden border-b border-white/10">
        <span className="text-white font-bold text-base tracking-wide">תפריט ניווט</span>
        <button onClick={closeSidebar} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <X className="h-5 w-5 text-slate-300" />
        </button>
      </div>

      {/* Logo / Brand */}
      <div className="px-5 pt-6 pb-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden"
               style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #4f46e5 100%)' }}>
            <div className="absolute inset-0 opacity-30"
                 style={{ background: 'radial-gradient(circle at 30% 30%, #fff, transparent 60%)' }} />
            <Sparkles className="h-5 w-5 text-white relative z-10" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight tracking-wide">SMART BASE</p>
            <p className="text-slate-400 text-[10px] leading-tight">מערכת ניהול חכמה</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {filtered.map((item) => {
          const isActive = activeView === item.id;
          const colors = NAV_COLORS[item.id] || { from: '#6366f1', to: '#4f46e5' };
          return (
            <button
              key={item.id}
              onClick={() => { setView(item.id); closeSidebar(); }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-right group relative overflow-hidden
                ${isActive ? 'text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}
              `}
              style={isActive ? {
                background: `linear-gradient(135deg, ${colors.from}22, ${colors.to}33)`,
                boxShadow: `0 4px 15px ${colors.from}30`
              } : {}}
            >
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full"
                     style={{ background: `linear-gradient(180deg, ${colors.from}, ${colors.to})` }} />
              )}
              <div className={`p-1.5 rounded-lg transition-all duration-200 flex-shrink-0`}
                   style={isActive ? {
                     background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                     boxShadow: `0 2px 8px ${colors.from}60`
                   } : {}}>
                <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`} />
              </div>
              <span className={`text-sm font-medium flex-1 ${isActive ? 'text-white' : ''}`}>{item.label}</span>
              {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/50 flex-shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-white/10 space-y-3">
        {user && (
          <div className="px-3 py-2.5 rounded-xl bg-white/5 space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                   style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
                {user.avatar || user.full_name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-semibold truncate">{user.full_name}</p>
                <p className="text-slate-500 text-[10px] truncate">{user.title || user.role}</p>
              </div>
            </div>
            {/* Gender Toggle */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-slate-500 text-[10px]">מגדר:</span>
              <button
                onClick={handleGenderToggle}
                disabled={savingGender}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all disabled:opacity-50"
                style={{
                  background: user.gender === 'male' ? 'rgba(99,102,241,0.3)' : 'rgba(236,72,153,0.3)',
                  color: user.gender === 'male' ? '#a5b4fc' : '#f9a8d4',
                  border: `1px solid ${user.gender === 'male' ? 'rgba(99,102,241,0.4)' : 'rgba(236,72,153,0.4)'}`,
                }}
                title="לחצו לשינוי מגדר"
              >
                {user.gender === 'male' ? '👨 בן' : '👩 בת'}
              </button>
              <span className="text-slate-600 text-[9px]">לחצו לשינוי</span>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl w-full transition-all duration-200 text-slate-400 hover:text-red-400 hover:bg-red-500/10 group"
        >
          <div className="p-1.5 rounded-lg group-hover:bg-red-500/10 transition-colors">
            <LogOut className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">יציאה מהמערכת</span>
        </button>
      </div>
    </aside>
  );
}
