import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Shield, Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import ManagementDashboard from '../components/dashboard/ManagementDashboard';
import StaffDashboard from '../components/dashboard/StaffDashboard';
import HRDashboard from '../components/dashboard/HRDashboard';
import SecretaryDashboard from '../components/dashboard/SecretaryDashboard';
import MaintenanceDashboard from '../components/dashboard/MaintenanceDashboard';
import CoordinatorDashboard from '../components/dashboard/CoordinatorDashboard';
import SubstituteDashboard from '../components/dashboard/SubstituteDashboard';
import VicePrincipalDashboard from '../components/dashboard/VicePrincipalDashboard';

const HEBREW_DATE = "כ״ח טבת תשפ״ו";
const GREGORIAN_DATE = new Date().toLocaleDateString('he-IL');

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

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
            {/* User Switcher for Demo */}
            {allUsers.length > 1 && (
              <div className="hidden md:flex items-center gap-2 bg-slate-100 p-1 rounded-lg overflow-x-auto max-w-md">
                {allUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => switchUser(u)}
                    className={`px-3 py-1 text-xs rounded-md whitespace-nowrap transition-all ${user.id === u.id ? 'bg-white shadow-sm text-blue-700 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {u.full_name?.split(' ')[0] || u.full_name || u.email.split('@')[0]}
                  </button>
                ))}
              </div>
            )}

            {allUsers.length <= 1 && user.role === 'admin' && (
              <div className="hidden md:block text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-200">
                💡 הזמן משתמשים נוספים דרך "ניהול צוות"
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
              {(user.role === 'admin' || user.role === 'vice_principal') && (
                <ManagementDashboard user={user} />
              )}
              
              {user.role === 'vice_principal' && (
                <div className="my-8 flex items-center gap-4">
                  <div className="h-px bg-slate-200 flex-1"></div>
                  <span className="text-slate-400 text-sm font-medium">אזור אישי (מורה)</span>
                  <div className="h-px bg-slate-200 flex-1"></div>
                </div>
              )}
              
              {['teacher', 'assistant'].includes(user.role) && (
                <StaffDashboard user={user} setView={setCurrentView} />
              )}

              {user.role === 'vice_principal' && <VicePrincipalDashboard user={user} setView={setCurrentView} />}
              {user.role === 'secretary' && <SecretaryDashboard />}
              {user.role === 'maintenance' && <MaintenanceDashboard />}
              {user.role === 'coordinator' && <CoordinatorDashboard />}
              {user.role === 'substitute' && <SubstituteDashboard user={user} />}
            </>
          )}

          {currentView === 'hr' && (
            <HRDashboard />
          )}

          {currentView !== 'dashboard' && currentView !== 'hr' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
              <h2 className="text-2xl font-bold text-slate-800">עמוד בבנייה: {currentView}</h2>
              <p className="text-slate-500 mt-2">המודול בפיתוח</p>
            </div>
          )}
        </main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-slate-900/20 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}