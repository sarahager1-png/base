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
import FileManagement from './FileManagement';
import HelpCenter from '../components/help/HelpCenter';
import InsightsDashboard from '../components/analytics/InsightsDashboard';
import MobileBottomNav from '../components/MobileBottomNav';

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
  const [viewAsRole, setViewAsRole] = useState(null);
  const [schoolName, setSchoolName] = useState('בית ספר "בינה"');
  const [schoolLogo, setSchoolLogo] = useState(null);
  const [isEditingSchool, setIsEditingSchool] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
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
           style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)' }}>
        <div className="text-center">
          <div className="relative mx-auto mb-6 h-16 w-16">
            <div className="absolute inset-0 rounded-2xl opacity-30 blur-xl"
                 style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }} />
            <div className="relative h-16 w-16 rounded-2xl flex items-center justify-center overflow-hidden"
                 style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #4f46e5 100%)' }}>
              <div className="absolute inset-0 opacity-30"
                   style={{ background: 'radial-gradient(circle at 30% 30%, #fff, transparent 60%)' }} />
              <Sparkles className="h-8 w-8 text-white animate-pulse relative z-10" />
            </div>
          </div>
          <div className="h-1 w-32 mx-auto rounded-full overflow-hidden bg-white/10">
            <div className="h-full rounded-full animate-loading-bar"
                 style={{ background: 'linear-gradient(90deg, #6366f1, #4f46e5)' }} />
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
      {/* Header */}
      <header className="sticky top-0 z-40 shadow-sm"
              style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>

        {/* ── Mobile Header (single row) ── */}
        <div className="lg:hidden px-3 h-14 flex items-center justify-between gap-2">
          {/* Left: hamburger + logo */}
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)}
                    className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
              <img src="/logo.svg" alt="SMART BASE" className="h-7 w-7 drop-shadow-md" />
              <span className="text-white font-bold text-sm tracking-wider">SMART BASE</span>
            </div>
          </div>
          {/* Right: search + dark + bell + avatar */}
          <div className="flex items-center gap-1">
            <button onClick={() => setCommandOpen(true)}
                    className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <Search className="h-4 w-4" />
            </button>
            <button onClick={toggleDark}
                    className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <NotificationBell userEmail={user.email} />
            <div className="h-8 w-8 rounded-xl flex items-center justify-center text-xs font-bold text-white ml-1"
                 style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
              {user.avatar || user.full_name?.charAt(0)}
            </div>
          </div>
        </div>

        {/* ── Desktop Header (two rows) ── */}
        <div className="hidden lg:block">
          {/* Top Bar - School Info */}
          <div className="border-b border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <label className="relative cursor-pointer group flex-shrink-0" title="לחצו להעלאת לוגו בית הספר">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const MAX_FILE_SIZE = 2 * 1024 * 1024;
                      if (file.size > MAX_FILE_SIZE) {
                        alert('הקובץ גדול מדי. גודל מקסימלי: 2MB');
                        e.target.value = '';
                        return;
                      }
                      const reader = new FileReader();
                      reader.onloadend = () => setSchoolLogo(reader.result);
                      reader.readAsDataURL(file);
                    }
                  }} />
                  {schoolLogo ? (
                    <img src={schoolLogo} alt="לוגו בית הספר"
                         className="h-11 w-11 object-contain rounded-xl border-2 border-white/20 bg-white/10 p-1 group-hover:border-indigo-400/70 transition-all" />
                  ) : (
                    <div className="h-11 w-11 rounded-xl border-2 border-dashed border-white/25 flex flex-col items-center justify-center gap-0.5 bg-white/5 group-hover:border-indigo-400/70 group-hover:bg-indigo-500/10 transition-all">
                      <Shield className="h-4 w-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                      <span className="text-[8px] text-slate-600 group-hover:text-indigo-400 leading-none transition-colors">לוגו</span>
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-xl bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[9px] text-white font-bold">העלה</span>
                  </div>
                </label>
                {isEditingSchool ? (
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    onBlur={() => setIsEditingSchool(false)}
                    className="text-base font-bold text-white border-b border-indigo-400 outline-none bg-transparent"
                    autoFocus
                  />
                ) : (
                  <h1 onClick={() => setIsEditingSchool(true)}
                      className="text-base font-bold text-white/90 cursor-pointer hover:text-white transition-colors">
                    {schoolName}
                  </h1>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="bg-white/5 px-2.5 py-1 rounded-full border border-white/10">{HEBREW_DATE}</span>
                <span className="bg-white/5 px-2.5 py-1 rounded-full border border-white/10">{GREGORIAN_DATE}</span>
              </div>
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex justify-between items-center">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
              <img src="/logo.svg" alt="SMART BASE" className="h-9 w-9 drop-shadow-md" />
              <div>
                <p className="text-white font-bold text-sm leading-tight tracking-widest">SMART BASE</p>
                <p className="text-slate-500 text-[10px] leading-tight">מערכת ניהול חכמה</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setCommandOpen(true)}
                      className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/10 text-xs">
                <Search className="h-3.5 w-3.5" />
                <span>חיפוש</span>
                <kbd className="text-[10px] font-mono bg-white/10 px-1 rounded">⌘K</kbd>
              </button>
              <div className="hidden sm:flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/10">
                {Object.entries(sizes).map(([key, val]) => (
                  <button key={key} onClick={() => setFontSize(key)} title={val.tip}
                          className={`px-2 py-1 rounded-md text-xs font-bold transition-all
                            ${fontSize === key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                          style={{ fontSize: key === 'normal' ? '11px' : key === 'large' ? '13px' : '15px' }}>
                    א
                  </button>
                ))}
              </div>
              <button onClick={toggleDark}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                      title={dark ? 'מצב בהיר' : 'מצב כהה'}>
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <NotificationBell userEmail={user.email} />
              {user.role === 'admin' && (
                <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-lg overflow-x-auto border border-white/10">
                  {[
                    { role: null, label: 'מנהלת' },
                    { role: 'vice_principal', label: 'סגנית' },
                    { role: 'secretary', label: 'מזכירה' },
                    { role: 'teacher', label: 'הוראה' },
                    { role: 'counselor', label: 'יועצת' },
                    { role: 'maintenance', label: 'אב בית' },
                    { role: 'substitute', label: 'מילוי מקום' },
                    { role: 'coordinator', label: 'רכז' },
                    { role: 'assistant', label: 'סייעת' },
                    { role: 'user', label: 'עובד כללי' },
                  ].map(item => (
                    <button key={item.role || 'admin'} onClick={() => setViewAsRole(item.role)}
                            className={`px-2.5 py-1 text-[11px] rounded-md whitespace-nowrap transition-all font-medium
                              ${viewAsRole === item.role ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}>
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2.5">
                <div className="hidden sm:block text-right leading-tight">
                  <p className="text-white text-xs font-semibold">{user.full_name}</p>
                  <p className="text-slate-500 text-[10px]">{user.title || gTitle(user.role)}</p>
                </div>
                <div className="h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg"
                     style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 15px #6366f140' }}>
                  {user.avatar || user.full_name?.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <MobileBottomNav
        activeView={currentView}
        setView={setCurrentView}
        openSidebar={() => setSidebarOpen(true)}
      />

      <div className="max-w-7xl mx-auto flex items-start pt-3 lg:pt-6 gap-6 px-3 sm:px-6 lg:px-8">
        <Sidebar 
          user={user} 
          activeView={currentView} 
          setView={setCurrentView}
          isOpen={sidebarOpen}
          closeSidebar={() => setSidebarOpen(false)}
          onLogout={handleLogout}
          onUserGenderChange={(g) => setUser(u => ({ ...u, gender: g }))}
        />

        <main className="flex-1 pb-24 lg:pb-10 min-w-0">
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

              {(viewAsRole === 'coordinator') && (
                <StaffCoordinatorDashboard user={{...user, role: 'coordinator'}} setView={setCurrentView} />
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
          {currentView === 'file-management' && <FileManagement />}
          {currentView === 'community' && <Community />}
          {currentView === 'maintenance' && <Maintenance />}
          {currentView === 'printing' && <Printing />}
          {currentView === 'onboarding' && <Onboarding />}
          {currentView === 'analytics' && <InsightsDashboard />}
          {currentView === 'help' && <HelpCenter userRole={user.role} />}
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