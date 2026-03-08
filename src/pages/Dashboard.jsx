import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Shield, Menu, Sparkles, Moon, Sun, Search } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/notifications/NotificationBell';
import CommandPalette from '../components/CommandPalette';
import DailyAnnouncementModal from '../components/DailyAnnouncementModal';
import { ThemeProvider, useTheme } from '@/lib/ThemeContext';
import { AccessibilityProvider, useAccessibility } from '@/lib/AccessibilityContext';
import { useAuth } from '@/lib/AuthContext';
import ManagementDashboard from '../components/dashboard/ManagementDashboard';
import StaffDashboard from '../components/dashboard/StaffDashboard';
import HRDashboard from '../components/dashboard/HRDashboard';
import SecretaryDashboard from '../components/dashboard/SecretaryDashboard';
import MaintenanceDashboard from '../components/dashboard/MaintenanceDashboard';
import { getHebrewDate } from '@/utils/hebrewDate';

import SubstituteDashboard from '../components/dashboard/SubstituteDashboard';
import VicePrincipalDashboard from '../components/dashboard/VicePrincipalDashboard';
import CounselorDashboard from '../components/dashboard/CounselorDashboard';
import StaffCoordinatorDashboard from '../components/dashboard/StaffCoordinatorDashboard';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import EmployeeDashboard from '../components/dashboard/EmployeeDashboard';
import Journal from './Journal';
import JournalManagement from './JournalManagement';
import Schedule from './Schedule';
import Tasks from './Tasks';
import Attendance from './Attendance';
import Community from './Community';
import Maintenance from './Maintenance';
import Printing from './Printing';
import Onboarding from './Onboarding';
import Notifications from './Notifications';
import DutyManagement from './DutyManagement';
import RoomManagement from './RoomManagement';
import HelpCenter from '../components/help/HelpCenter';
import FileManagementPage from './FileManagement';
import InsightsDashboard from '../components/analytics/InsightsDashboard';
import Profile from './Profile';
import DevAdmin from './DevAdmin';

const GREGORIAN_DATE = new Date().toLocaleDateString('he-IL');
const _hd = getHebrewDate(new Date());
const HEBREW_DATE = _hd ? _hd.full : '';

function DashboardInner() {
  const { dark, toggleDark } = useTheme();
  const { fontSize, setFontSize, sizes, gTitle } = useAccessibility();
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [viewAsRole, setViewAsRole] = useState(null);
  const [schoolName, setSchoolName] = useState('בית ספר "בינה"');
  const [schoolLogo, setSchoolLogo] = useState(null);
  const [isEditingSchool, setIsEditingSchool] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setIsInstalled(true));
    if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') { setIsInstalled(true); setInstallPrompt(null); }
  };

  useEffect(() => {
    loadUser();
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  const { user: authUser } = useAuth();

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    } catch {
      setUser(authUser);
    }
  };

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const switchUser = (selectedUser) => {
    setUser(selectedUser);
    setCurrentView('dashboard');
    setSidebarOpen(false);
    setDemoMode(true);
  };

  const handleLogout = async () => {
    await base44.auth.logout();
  };

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: 'linear-gradient(135deg, #0d2b28 0%, #0f4540 50%, #0d2b28 100%)' }}>
        <div className="text-center">
          <div className="relative mx-auto mb-6 h-16 w-16">
            <div className="absolute inset-0 rounded-2xl opacity-30 blur-xl"
                 style={{ background: 'linear-gradient(135deg, #0d9488, #22c55e)' }} />
            <div className="relative h-16 w-16 rounded-2xl flex items-center justify-center overflow-hidden"
                 style={{ background: 'linear-gradient(135deg, #0d9488 0%, #22c55e 100%)' }}>
              <div className="absolute inset-0 opacity-30"
                   style={{ background: 'radial-gradient(circle at 30% 30%, #fff, transparent 60%)' }} />
              <Sparkles className="h-8 w-8 text-white animate-pulse relative z-10" />
            </div>
          </div>
          <div className="h-1 w-32 mx-auto rounded-full overflow-hidden bg-white/10">
          <div className="h-full rounded-full animate-loading-bar"
               style={{ background: 'linear-gradient(90deg, #0d9488, #22c55e)' }} />
          </div>
          <p className="text-slate-400 mt-4 text-sm">טוען את המערכת...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 font-sans text-slate-800 dark:text-slate-100" dir="rtl">
      <CommandPalette
        isOpen={commandOpen}
        onClose={() => setCommandOpen(false)}
        onNavigate={(view) => { setCurrentView(view); setViewAsRole(null); }}
        user={user}
      />
      {user && <DailyAnnouncementModal user={user} />}
      {/* ══════════════ HEADER ══════════════ */}
      <header className="sticky top-0 z-40" dir="rtl"
              style={{ background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 30%, #4c1d95 65%, #3730a3 100%)', boxShadow: '0 1px 0 rgba(255,255,255,0.07), 0 8px 40px rgba(49,46,129,0.6)' }}>

        {/* Subtle top shimmer */}
        <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
             style={{ background: 'linear-gradient(90deg, transparent, rgba(196,181,253,0.6) 40%, rgba(255,255,255,0.8) 50%, rgba(196,181,253,0.6) 60%, transparent)' }} />

        {/* Main bar */}
        <div className="relative max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 h-[60px] flex items-center justify-between gap-2">

          {/* ── RIGHT: Logo + school name ── */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile hamburger */}
            <button onClick={() => setSidebarOpen(true)}
                    className="lg:hidden p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-all flex-shrink-0">
              <Menu className="h-5 w-5" />
            </button>

            {/* Logo — click goes home */}
            <button onClick={() => setCurrentView('dashboard')}
                    className="flex items-center gap-2.5 group flex-shrink-0">
              <div className="relative h-9 w-9 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/20 group-hover:ring-violet-400/60 transition-all"
                   style={{ boxShadow: '0 2px 12px rgba(109,40,217,0.5)' }}>
                <img src="/icon.jpeg" alt="לוגו" className="h-full w-full object-cover" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 55%)' }} />
              </div>
              <img src="/logo-full.jpeg" alt="Smart Base"
                   className="hidden sm:block h-7 object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                   style={{ filter: 'brightness(1.2) drop-shadow(0 1px 6px rgba(109,40,217,0.6))' }}
                   onError={e => { e.target.style.display='none'; }} />
            </button>

            {/* Divider */}
            <div className="hidden md:block h-6 w-px flex-shrink-0" style={{ background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.15), transparent)' }} />

            {/* School name */}
            <div className="hidden md:block min-w-0">
              {isEditingSchool ? (
                <input type="text" value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  onBlur={() => setIsEditingSchool(false)} autoFocus
                  className="text-sm font-bold text-white bg-transparent border-b border-violet-400 outline-none w-44" />
              ) : (
                <p onClick={() => setIsEditingSchool(true)}
                   className="text-sm font-bold text-white/95 hover:text-violet-200 cursor-pointer truncate transition-colors leading-none">
                  {schoolName}
                </p>
              )}
              <p className="text-[10px] text-violet-300/70 mt-0.5 leading-none">{HEBREW_DATE} · {GREGORIAN_DATE}</p>
            </div>
          </div>

          {/* ── LEFT: Controls ── */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">

            {/* Search pill */}
            <button onClick={() => setCommandOpen(true)}
                    className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-full text-white/45 hover:text-white transition-all text-xs"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <Search className="h-3 w-3" />
              <span className="hidden lg:inline">חיפוש</span>
              <kbd className="hidden lg:inline text-[9px] font-mono opacity-50 bg-white/10 px-1 rounded">⌘K</kbd>
            </button>

            {/* Font size */}
            <div className="hidden sm:flex items-center rounded-full overflow-hidden"
                 style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {Object.entries(sizes).map(([key, val]) => (
                <button key={key} onClick={() => setFontSize(key)} title={val.tip}
                        className={`w-7 h-7 font-bold transition-all ${fontSize === key ? 'text-white' : 'text-white/35 hover:text-white/70'}`}
                        style={fontSize === key ? { background: 'rgba(139,92,246,0.7)' } : {}}
                        dangerouslySetInnerHTML={undefined}>
                  <span style={{ fontSize: key === 'normal' ? '10px' : key === 'large' ? '12px' : '14px' }}>א</span>
                </button>
              ))}
            </div>

            {/* Install PWA */}
            {!isInstalled && installPrompt && (
              <button onClick={handleInstall}
                      className="hidden sm:flex items-center gap-1.5 h-8 px-3 rounded-full text-white font-bold text-xs transition-all hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 2px 12px rgba(109,40,217,0.5)' }}>
                <span>⬇</span>
                <span>התקן אפליקציה</span>
              </button>
            )}

            {/* Dark mode */}
            <button onClick={toggleDark} title={dark ? 'מצב בהיר' : 'מצב כהה'}
                    className="h-8 w-8 rounded-full flex items-center justify-center transition-all text-white/40 hover:text-white"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            </button>

            {/* Notifications */}
            <NotificationBell userEmail={user.email} />

            {/* User avatar */}
            <button onClick={() => setCurrentView('profile')} title="הפרופיל שלי"
                    className="flex items-center gap-2 group pr-1">
              <div className="hidden sm:block text-right leading-tight">
                <p className="text-white/90 text-xs font-semibold group-hover:text-violet-200 transition-colors leading-none">{user.full_name}</p>
                <p className="text-violet-300/50 text-[10px] mt-0.5 leading-none">{user.title || gTitle(user.role)}</p>
              </div>
              <div className="h-8 w-8 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ring-1 ring-violet-400/40"
                   style={{ background: 'linear-gradient(135deg, #7c3aed, #4338ca)', boxShadow: '0 0 12px rgba(124,58,237,0.4)' }}>
                {user.avatar || user.full_name?.charAt(0)}
              </div>
            </button>
          </div>
        </div>

        {/* ── Role switcher (admin only) ── */}
        {user.role === 'admin' && (
          <div className="relative" style={{ background: 'rgba(0,0,0,0.25)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-1.5 flex items-center gap-1 overflow-x-auto scrollbar-hide">
              <span className="text-[9px] text-white/20 ml-1 flex-shrink-0 uppercase tracking-wider">תצוגה</span>
              {[
                { role: null,            label: 'מנהלת',   emoji: '👩‍💼' },
                { role: 'vice_principal',label: 'סגנית',   emoji: '📋' },
                { role: 'secretary',     label: 'מזכירה',  emoji: '💼' },
                { role: 'teacher',       label: 'מורה',    emoji: '📚' },
                { role: 'counselor',     label: 'יועצת',   emoji: '💛' },
                { role: 'maintenance',   label: 'אב בית',  emoji: '🔧' },
                { role: 'substitute',    label: 'מ.מ.',    emoji: '🔄' },
                { role: 'assistant',     label: 'סייעת',   emoji: '🤝' },
                { role: 'user',          label: 'עובד',    emoji: '👤' },
              ].map(item => (
                <button key={item.role ?? 'admin'}
                        onClick={() => setViewAsRole(item.role)}
                        className="flex items-center gap-1 px-2.5 py-1 text-[10px] rounded-full whitespace-nowrap transition-all font-semibold flex-shrink-0"
                        style={viewAsRole === item.role
                          ? { background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: '#fff', boxShadow: '0 2px 8px rgba(124,58,237,0.5)' }
                          : { color: 'rgba(255,255,255,0.35)' }}>
                  <span>{item.emoji}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-sm font-medium px-4 py-2 flex items-center justify-center gap-2 animate-fade-in">
          <span className="h-2 w-2 rounded-full bg-white animate-pulse flex-shrink-0" />
          אין חיבור לאינטרנט — המערכת עובדת במצב לא מקוון
        </div>
      )}

      <div className="max-w-7xl mx-auto flex items-start pt-6 gap-6 px-4 sm:px-6 lg:px-8">
        <Sidebar 
          user={user} 
          activeView={currentView} 
          setView={setCurrentView}
          isOpen={sidebarOpen}
          closeSidebar={() => setSidebarOpen(false)}
          onLogout={handleLogout}
          onUserGenderChange={(g) => setUser(u => ({ ...u, gender: g }))}
        />

        <main className="flex-1 pb-10 min-w-0">
          {currentView === 'dashboard' && (
            <>
              {((user.role === 'admin' && !viewAsRole)) && (
                <AdminDashboard />
              )}
              
              {(viewAsRole === 'vice_principal') && (
                <VicePrincipalDashboard user={{...user, role: 'vice_principal'}} setView={setCurrentView} />
              )}

              {(viewAsRole === 'secretary') && (
                <SecretaryDashboard user={{...user, role: 'secretary'}} />
              )}

              {(['teacher', 'assistant'].includes(viewAsRole)) && (
                <StaffDashboard user={{...user, role: viewAsRole}} setView={setCurrentView} />
              )}

              {(viewAsRole === 'user') && (
                <EmployeeDashboard user={{...user, role: 'user'}} />
              )}

              {(viewAsRole === 'counselor') && (
                <CounselorDashboard user={{...user, role: 'counselor'}} setView={setCurrentView} />
              )}
              
              {(viewAsRole === 'maintenance') && (
                <MaintenanceDashboard user={{...user, role: 'maintenance'}} />
              )}
              
              {(viewAsRole === 'substitute') && (
                <SubstituteDashboard user={{...user, role: 'substitute'}} />
              )}

              {!viewAsRole && user.role === 'vice_principal' && (
                <VicePrincipalDashboard user={user} setView={setCurrentView} />
              )}
              {!viewAsRole && user.role === 'secretary' && <SecretaryDashboard user={user} />}
              {!viewAsRole && user.role === 'maintenance' && <MaintenanceDashboard user={user} />}
              {!viewAsRole && user.role === 'substitute' && <SubstituteDashboard user={user} />}
              {!viewAsRole && user.role === 'counselor' && (
                <CounselorDashboard user={user} setView={setCurrentView} />
              )}
              {!viewAsRole && user.role === 'coordinator' && (
                <StaffCoordinatorDashboard user={user} setView={setCurrentView} />
              )}
              {!viewAsRole && ['teacher', 'assistant'].includes(user.role) && (
                <StaffDashboard user={user} setView={setCurrentView} />
              )}
              {!viewAsRole && user.role === 'user' && (
                <EmployeeDashboard user={user} />
              )}
            </>
          )}

          {currentView === 'hr' && (
            <HRDashboard />
          )}

          {currentView === 'notifications' && <Notifications />}
          {currentView === 'journal' && <Journal />}
          {currentView === 'journal-management' && <JournalManagement />}
          {currentView === 'schedule' && <Schedule />}
          {currentView === 'tasks' && <Tasks />}
          {currentView === 'attendance' && <Attendance />}
          {currentView === 'duty-management' && <DutyManagement />}
          {currentView === 'room-management' && <RoomManagement />}
          {currentView === 'community' && <Community />}
          {currentView === 'maintenance' && <Maintenance />}
          {currentView === 'printing' && <Printing />}
          {currentView === 'onboarding' && <Onboarding />}
          {currentView === 'analytics' && <InsightsDashboard />}
          {currentView === 'file-management' && <FileManagementPage />}
          {currentView === 'help' && <HelpCenter userRole={user.role} />}
          {currentView === 'profile' && <Profile />}
          {currentView === 'dev-admin' && <DevAdmin />}
        </main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/20 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}

export default function Dashboard() {
  return (
    <AccessibilityProvider>
      <ThemeProvider>
        <DashboardInner />
      </ThemeProvider>
    </AccessibilityProvider>
  );
}