import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/firebaseClient';
import { useQuery } from '@tanstack/react-query';
import { Shield, Menu, Sparkles, Moon, Sun, Search, Eye, Users, BookOpen, MessageCircle, Wrench, RefreshCw, HeartHandshake, User, ClipboardList, GraduationCap } from 'lucide-react';
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
import SchoolAdmin from './SchoolAdmin';
import Reports from './Reports';
import SettingsPage from './Settings';
import MobileNav from '../components/MobileNav';

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
  const [schoolName, setSchoolName] = useState(() => localStorage.getItem('school_name') || 'בית הספר');
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-8 h-16 w-16">
            <img src="/logo-smartbase.jpeg" alt="Smart Base"
                 className="h-16 w-16 rounded-2xl object-cover object-top shadow-sm animate-float" />
          </div>
          <p className="text-slate-800 font-bold text-lg mb-1">Smart Base</p>
          <p className="text-slate-400 text-sm mb-6">טוען את המערכת...</p>
          <div className="h-0.5 w-40 mx-auto rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full w-1/2 rounded-full bg-blue-500 animate-loading-bar" />
          </div>
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
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80" dir="rtl">
        <div className="max-w-full px-5 lg:px-8 h-[60px] flex items-center justify-between gap-4">

          {/* ── RIGHT: hamburger + logo + school name ── */}
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSidebarOpen(true)}
                    className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors flex-shrink-0">
              <Menu className="h-5 w-5" />
            </button>

            <button onClick={() => setCurrentView('dashboard')} className="flex items-center gap-2.5 flex-shrink-0">
              <img src="/logo-smartbase.jpeg" alt="Smart Base"
                   className="w-9 h-9 rounded-xl object-cover object-top shadow-sm" />
              <span className="hidden sm:block text-slate-800 font-bold text-base">SMART BASE</span>
            </button>

            <div className="hidden md:block h-7 w-px bg-slate-200 flex-shrink-0" />

            <div className="hidden md:block min-w-0">
              {isEditingSchool ? (
                <input type="text" value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  onBlur={() => { setIsEditingSchool(false); localStorage.setItem('school_name', schoolName); }}
                  autoFocus
                  className="text-sm font-semibold text-slate-800 bg-transparent border-b-2 border-blue-500 outline-none w-48" />
              ) : (
                <p onClick={() => setIsEditingSchool(true)}
                   className="text-sm font-semibold text-slate-700 hover:text-blue-600 cursor-pointer truncate transition-colors">
                  {schoolName}
                </p>
              )}
              <p className="text-[11px] text-slate-400 mt-0.5">{HEBREW_DATE} · {GREGORIAN_DATE}</p>
            </div>
          </div>

          {/* ── LEFT: Controls ── */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* Search */}
            <button onClick={() => setCommandOpen(true)}
                    className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg text-slate-500 hover:bg-slate-100 transition-all text-sm border border-slate-200">
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline text-slate-400 text-xs">חיפוש</span>
              <kbd className="hidden lg:inline text-[10px] text-slate-300 bg-slate-100 px-1.5 rounded font-mono">⌘K</kbd>
            </button>

            {/* Font size */}
            <div className="hidden md:flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-100">
              {Object.entries(sizes).map(([key, val]) => (
                <button key={key} onClick={() => setFontSize(key)} title={val.tip}
                        className={`w-8 h-8 rounded-md font-bold transition-all ${
                          fontSize === key ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}>
                  <span style={{ fontSize: key === 'normal' ? '11px' : key === 'large' ? '13px' : '15px' }}>א</span>
                </button>
              ))}
            </div>

            {/* Install PWA */}
            {!isInstalled && installPrompt && (
              <button onClick={handleInstall}
                      className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors shadow-sm">
                <span className="hidden sm:inline">התקן אפליקציה</span>
                <span className="sm:hidden">⬇</span>
              </button>
            )}

            {/* Dark mode */}
            <button onClick={toggleDark} title={dark ? 'מצב בהיר' : 'מצב כהה'}
                    className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors border border-slate-200">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Notifications */}
            <NotificationBell userEmail={user.email} />

            {/* User avatar + name */}
            <button onClick={() => setCurrentView('profile')} title="הפרופיל שלי"
                    className="flex items-center gap-2 pl-1 group">
              <div className="hidden sm:block text-right">
                <p className="text-slate-700 text-xs font-semibold leading-tight">{user.full_name}</p>
                <p className="text-slate-400 text-[10px] leading-tight">{user.title || gTitle(user.role, user.gender)}</p>
              </div>
              <div className="h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex-shrink-0">
                {user.full_name?.charAt(0)}
              </div>
            </button>
          </div>
        </div>

        {/* ── Role switcher (admin / super_admin only) ── */}
        {['admin', 'super_admin'].includes(user.role) && (
          <div className="border-t border-slate-200/60 bg-gradient-to-l from-slate-50 via-white to-slate-50">
            <div className="px-4 lg:px-8 py-2.5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {/* Label */}
              <div className="flex items-center gap-1.5 flex-shrink-0 ml-1">
                <div className="h-5 w-5 rounded-md bg-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Eye className="h-3 w-3 text-white" />
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">תצוגה כ:</span>
              </div>
              <div className="h-5 w-px bg-slate-200 flex-shrink-0" />
              {[
                { role: null,             roleKey: 'admin',          Icon: GraduationCap,   color: 'indigo'  },
                { role: 'vice_principal', roleKey: 'vice_principal', Icon: ClipboardList,   color: 'violet'  },
                { role: 'secretary',      roleKey: 'secretary',      Icon: Users,           color: 'blue'    },
                { role: 'teacher',        roleKey: 'teacher',        Icon: BookOpen,        color: 'emerald' },
                { role: 'counselor',      roleKey: 'counselor',      Icon: MessageCircle,   color: 'amber'   },
                { role: 'maintenance',    roleKey: 'maintenance',    Icon: Wrench,          color: 'orange'  },
                { role: 'substitute',     roleKey: 'substitute',     Icon: RefreshCw,       color: 'teal'    },
                { role: 'assistant',      roleKey: 'assistant',      Icon: HeartHandshake,  color: 'pink'    },
                { role: 'user',           roleKey: 'user',           Icon: User,            color: 'slate'   },
              ].map(item => {
                const label = gTitle(item.roleKey);
                const active = viewAsRole === item.role;
                const colorMap = {
                  indigo:  { bg: 'bg-indigo-600',  ring: 'ring-indigo-200',  pill: 'bg-indigo-50 text-indigo-700 border-indigo-200',  activePill: 'bg-indigo-600 text-white border-indigo-600 shadow-indigo-200'  },
                  violet:  { bg: 'bg-violet-600',  ring: 'ring-violet-200',  pill: 'bg-violet-50 text-violet-700 border-violet-200',  activePill: 'bg-violet-600 text-white border-violet-600 shadow-violet-200'  },
                  blue:    { bg: 'bg-blue-600',    ring: 'ring-blue-200',    pill: 'bg-blue-50 text-blue-700 border-blue-200',          activePill: 'bg-blue-600 text-white border-blue-600 shadow-blue-200'        },
                  emerald: { bg: 'bg-emerald-600', ring: 'ring-emerald-200', pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', activePill: 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-200'},
                  amber:   { bg: 'bg-amber-500',   ring: 'ring-amber-200',   pill: 'bg-amber-50 text-amber-700 border-amber-200',       activePill: 'bg-amber-500 text-white border-amber-500 shadow-amber-200'     },
                  orange:  { bg: 'bg-orange-500',  ring: 'ring-orange-200',  pill: 'bg-orange-50 text-orange-700 border-orange-200',    activePill: 'bg-orange-500 text-white border-orange-500 shadow-orange-200'  },
                  teal:    { bg: 'bg-teal-600',    ring: 'ring-teal-200',    pill: 'bg-teal-50 text-teal-700 border-teal-200',          activePill: 'bg-teal-600 text-white border-teal-600 shadow-teal-200'        },
                  pink:    { bg: 'bg-pink-500',    ring: 'ring-pink-200',    pill: 'bg-pink-50 text-pink-700 border-pink-200',          activePill: 'bg-pink-500 text-white border-pink-500 shadow-pink-200'        },
                  slate:   { bg: 'bg-slate-600',   ring: 'ring-slate-200',   pill: 'bg-slate-100 text-slate-600 border-slate-200',      activePill: 'bg-slate-700 text-white border-slate-700 shadow-slate-200'     },
                };
                const c = colorMap[item.color];
                return (
                  <button
                    key={item.role ?? 'admin'}
                    onClick={() => setViewAsRole(item.role)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border whitespace-nowrap transition-all duration-150 flex-shrink-0 ${
                      active
                        ? `${c.activePill} shadow-md shadow-${item.color}-100 -translate-y-px`
                        : `${c.pill} hover:shadow-sm hover:-translate-y-px`
                    }`}
                  >
                    <item.Icon className="h-3 w-3 flex-shrink-0" />
                    {label}
                    {active && <span className="inline-block h-1.5 w-1.5 rounded-full bg-white/70 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Offline banner */}
      {!isOnline && (
        <div className="bg-yellow-500 text-white text-sm font-medium px-4 py-2 flex items-center justify-center gap-2 animate-fade-in">
          <span className="h-2 w-2 rounded-full bg-white animate-pulse flex-shrink-0" />
          אין חיבור לאינטרנט — המערכת עובדת במצב לא מקוון
        </div>
      )}

      <div className="flex items-start min-h-[calc(100vh-68px)]">
        <Sidebar 
          user={user} 
          activeView={currentView} 
          setView={setCurrentView}
          isOpen={sidebarOpen}
          closeSidebar={() => setSidebarOpen(false)}
          onLogout={handleLogout}
          onUserGenderChange={(g) => setUser(u => ({ ...u, gender: g }))}
        />

        <main className="flex-1 pb-24 lg:pb-10 min-w-0 p-5 lg:p-7">
          <RoleSetupReminder user={user} onNavigate={setCurrentView} />
          {currentView === 'dashboard' && (
            <>
              {((['admin', 'super_admin'].includes(user.role)) && !viewAsRole) && (
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
          {currentView === 'reports' && <Reports />}
          {currentView === 'settings' && <SettingsPage />}
          {currentView === 'help' && <HelpCenter userRole={user.role} onNavigate={setCurrentView} />}
          {currentView === 'profile' && <Profile />}
          {currentView === 'dev-admin' && <DevAdmin />}
          {currentView === 'school-admin' && <SchoolAdmin />}
        </main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/20 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      <MobileNav activeView={currentView} setView={setCurrentView} userEmail={user.email} />
    </div>
  );
}

function RoleSetupReminder({ user, onNavigate }) {
  const isManager = ['admin','vice_principal','secretary'].includes(user?.role);
  if (!isManager) return null;

  const DISMISSED_KEY = `role_reminder_dismissed_${user?.email}`;
  const [dismissed, setDismissed] = React.useState(() => !!localStorage.getItem(DISMISSED_KEY));
  if (dismissed) return null;

  const dismiss = () => { localStorage.setItem(DISMISSED_KEY, '1'); setDismissed(true); };

  return (
    <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3.5 flex items-start gap-3" dir="rtl">
      <span className="text-xl flex-shrink-0 mt-0.5">⚠️</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-amber-900">הגדרת תפקידים מיוחדים</p>
        <p className="text-xs text-amber-700 mt-0.5">
          הגדרת תפקידים מותאמים (רכזת ביטחון, אחראית חדרים וכו') היא תנאי לכך שהפונקציות המיוחדות יופיעו אצלן.
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button onClick={() => { onNavigate('settings'); dismiss(); }}
          className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-xl transition-colors whitespace-nowrap">
          הגדרי עכשיו
        </button>
        <button onClick={dismiss} className="text-amber-400 hover:text-amber-600 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
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