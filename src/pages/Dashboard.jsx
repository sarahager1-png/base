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

const HEBREW_DATE = "כ״ח טבת תשפ״ו";
const GREGORIAN_DATE = new Date().toLocaleDateString('he-IL');

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/30 to-slate-100 font-sans text-slate-800" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 shadow-md">
        {/* Top Bar - School Info */}
        <div className="bg-gradient-to-l from-blue-900 via-blue-800 to-slate-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
            <div className="flex items-center gap-4">
              {schoolLogo ? (
                <img src={schoolLogo} alt="לוגו בית הספר" className="h-12 w-12 object-contain rounded-xl border-2 border-white/20 bg-white/10 p-1" />
              ) : (
                <label className="h-12 w-12 border-2 border-dashed border-white/30 rounded-xl flex items-center justify-center cursor-pointer hover:border-white/60 hover:bg-white/10 transition-all group">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
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
                  <Shield className="h-5 w-5 text-white/50 group-hover:text-white/80" />
                </label>
              )}
              {isEditingSchool ? (
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  onBlur={() => setIsEditingSchool(false)}
                  className="text-2xl font-bold text-white border-b-2 border-blue-300 outline-none bg-transparent"
                  autoFocus
                />
              ) : (
                <div>
                  <h1
                    onClick={() => setIsEditingSchool(true)}
                    className="text-2xl font-bold text-white cursor-pointer hover:text-blue-200 transition-colors"
                  >
                    {schoolName}
                  </h1>
                  <p className="text-[10px] text-blue-300 mt-0.5">BASE - בינה מנהיגותית</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-blue-200">
              <span>{HEBREW_DATE}</span>
              <span className="text-white/20">|</span>
              <span>{GREGORIAN_DATE}</span>
            </div>
          </div>
        </div>
        
        {/* Navigation Bar */}
        <div className="bg-white/95 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-slate-100 lg:hidden text-slate-600">
                <Menu className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <NotificationBell userEmail={user.email} />
              
              {/* Role Switcher for Admin */}
              {user.role === 'admin' && (
                <div className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
                  {[
                    { role: null, label: 'מנהלת' },
                    { role: 'vice_principal', label: 'סגנית' },
                    { role: 'secretary', label: 'מזכירה' },
                    { role: 'teacher', label: 'הוראה' },
                    { role: 'counselor', label: 'יועצת' },
                    { role: 'maintenance', label: 'אב בית' },
                    { role: 'substitute', label: 'ממלאת מקום' },
                    { role: 'assistant', label: 'סייעת' },
                    { role: 'user', label: 'עובד כללי' },
                  ].map(item => (
                    <button
                      key={item.role || 'admin'}
                      onClick={() => setViewAsRole(item.role)}
                      className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap transition-all font-medium ${viewAsRole === item.role ? 'bg-blue-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-white'}`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3 border-r border-slate-200 pr-4">
                <div className="text-right leading-tight hidden sm:block">
                  <div className="text-sm font-bold text-slate-900">{user.full_name}</div>
                  <div className="text-xs text-slate-400">{user.title || user.role}</div>
                </div>
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {user.avatar || user.full_name?.charAt(0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

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
        </main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/20 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}