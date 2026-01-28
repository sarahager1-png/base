import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Shield, Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import NotificationBell from '../components/notifications/NotificationBell';
import ManagementDashboard from '../components/dashboard/ManagementDashboard';
import StaffDashboard from '../components/dashboard/StaffDashboard';
import HRDashboard from '../components/dashboard/HRDashboard';
import SecretaryDashboard from '../components/dashboard/SecretaryDashboard';
import MaintenanceDashboard from '../components/dashboard/MaintenanceDashboard';
import CoordinatorDashboard from '../components/dashboard/CoordinatorDashboard';
import SubstituteDashboard from '../components/dashboard/SubstituteDashboard';
import VicePrincipalDashboard from '../components/dashboard/VicePrincipalDashboard';
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

const HEBREW_DATE = "כ״ח טבת תשפ״ו";
const GREGORIAN_DATE = new Date().toLocaleDateString('he-IL');

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [viewAsRole, setViewAsRole] = useState(null);

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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 mt-4">טוען...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-blue-100 sticky top-0 z-40 h-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-slate-100 lg:hidden text-slate-600">
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView('dashboard')}>
              <div className="bg-blue-900 p-2 rounded-lg shadow-sm group-hover:bg-blue-800 transition-colors">
                <Shield className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-900 tracking-wide leading-none">BASE</h1>
                <p className="text-[10px] text-slate-400 tracking-wider">בינה מנהיגותית</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <NotificationBell userEmail={user.email} />
            
            {/* Role Switcher for Admin */}
            {user.role === 'admin' && (
              <div className="hidden md:flex items-center gap-2 bg-slate-100 p-1 rounded-lg overflow-x-auto">
                {[
                  { role: null, label: 'מנהלת' },
                  { role: 'vice_principal', label: 'סגנית' },
                  { role: 'secretary', label: 'מזכירה' },
                  { role: 'teacher', label: 'עובדת הוראה' },
                  { role: 'counselor', label: 'יועצת' },
                  { role: 'coordinator', label: 'רכזת' },
                  { role: 'maintenance', label: 'אב בית' },
                  { role: 'substitute', label: 'ממלאת מקום' },
                  { role: 'assistant', label: 'סייעת' },
                ].map(item => (
                  <button
                    key={item.role || 'admin'}
                    onClick={() => setViewAsRole(item.role)}
                    className={`px-3 py-1 text-xs rounded-md whitespace-nowrap transition-all ${viewAsRole === item.role ? 'bg-white shadow-sm text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-col items-end">
              <div className="text-sm font-bold text-blue-900 flex items-center gap-3">
                <div className="text-right leading-tight hidden sm:block">
                  <div className="text-slate-900">{user.full_name}</div>
                  <div className="text-xs text-slate-500 font-normal">{user.title || user.role}</div>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-800 font-bold border-2 border-white shadow-sm ring-1 ring-blue-100">
                  {user.avatar || user.full_name?.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Date */}
      <div className="bg-white border-b border-slate-200 py-1 px-4 lg:px-8 flex justify-center sm:justify-end text-xs text-slate-500 font-medium gap-4">
        <span>{HEBREW_DATE}</span>
        <span className="text-slate-300">|</span>
        <span>{GREGORIAN_DATE}</span>
      </div>

      <div className="max-w-7xl mx-auto flex items-start pt-6 gap-6 px-4 sm:px-6 lg:px-8">
        <Sidebar 
          user={user} 
          activeView={currentView} 
          setView={setCurrentView}
          isOpen={sidebarOpen}
          closeSidebar={() => setSidebarOpen(false)}
          onLogout={handleLogout}
        />

        <main className="flex-1 pb-10 min-w-0">
          {currentView === 'dashboard' && (
            <>
              {((user.role === 'admin' && !viewAsRole)) && (
                <ManagementDashboard user={user} />
              )}
              
              {(viewAsRole === 'vice_principal') && (
                <VicePrincipalDashboard user={{...user, role: 'vice_principal'}} setView={setCurrentView} />
              )}

              {(viewAsRole === 'secretary') && (
                <SecretaryDashboard />
              )}

              {(['teacher', 'assistant'].includes(viewAsRole)) && (
                <StaffDashboard user={{...user, role: viewAsRole}} setView={setCurrentView} />
              )}
              
              {(viewAsRole === 'maintenance') && (
                <MaintenanceDashboard />
              )}
              
              {(viewAsRole === 'coordinator') && (
                <CoordinatorDashboard />
              )}
              
              {(viewAsRole === 'substitute') && (
                <SubstituteDashboard user={{...user, role: 'substitute'}} />
              )}

              {!viewAsRole && user.role === 'vice_principal' && (
                <VicePrincipalDashboard user={user} setView={setCurrentView} />
              )}
              {!viewAsRole && user.role === 'secretary' && <SecretaryDashboard />}
              {!viewAsRole && user.role === 'maintenance' && <MaintenanceDashboard />}
              {!viewAsRole && user.role === 'coordinator' && <CoordinatorDashboard />}
              {!viewAsRole && user.role === 'substitute' && <SubstituteDashboard user={user} />}
              {!viewAsRole && ['teacher', 'assistant'].includes(user.role) && (
                <StaffDashboard user={user} setView={setCurrentView} />
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
          {currentView === 'community' && <Community />}
          {currentView === 'maintenance' && <Maintenance />}
          {currentView === 'printing' && <Printing />}
          {currentView === 'onboarding' && <Onboarding />}
        </main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/20 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}