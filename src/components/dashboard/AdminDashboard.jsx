import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import StatCard from '../StatCard';
import MeetingsList from '../meetings/MeetingsList';
import { useState } from 'react';
import AddMeeting from '../meetings/AddMeeting';
import DailyMessageBoard from './DailyMessageBoard';
import {
  Users, AlertTriangle, Clock, ShoppingCart, FileText,
  Wrench, BarChart3, TrendingUp, Plus, Heart
} from 'lucide-react';
import SendMessageModal from '../messages/SendMessageModal';
import { useAuth } from '@/lib/AuthContext';

export default function AdminDashboard() {
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { user } = useAuth();

  // Fetch all data
  const { data: users = [] } = useQuery({
    queryKey: ['users-all'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: absences = [] } = useQuery({
    queryKey: ['absences-all'],
    queryFn: () => base44.entities.Absence.list('-created_date', 100),
  });

  const { data: purchaseRequests = [] } = useQuery({
    queryKey: ['purchases-all'],
    queryFn: () => base44.entities.PurchaseRequest.list('-created_date', 100),
  });

  const { data: printRequests = [] } = useQuery({
    queryKey: ['prints-all'],
    queryFn: () => base44.entities.PrintRequest.list('-created_date', 100),
  });

  const { data: maintenanceTickets = [] } = useQuery({
    queryKey: ['maintenance-all'],
    queryFn: () => base44.entities.MaintenanceTicket.list('-created_date', 100),
  });

  const { data: onboardingDocs = [] } = useQuery({
    queryKey: ['onboarding-all'],
    queryFn: () => base44.entities.OnboardingDocument.list('-created_date', 100),
  });

  const { data: substituteReports = [] } = useQuery({
    queryKey: ['substitutes-all'],
    queryFn: () => base44.entities.SubstituteReport.list('-created_date', 100),
  });

  // Calculate stats
  const pendingAbsences = absences.filter(a => a.status === 'pending').length;
  const pendingPurchases = purchaseRequests.filter(p => p.status === 'pending').length;
  const pendingPrints = printRequests.filter(p => p.status === 'pending').length;
  const openTickets = maintenanceTickets.filter(t => t.status === 'open').length;
  const pendingOnboarding = onboardingDocs.filter(d => d.status === 'pending').length;
  const reportedSubstitutes = substituteReports.filter(s => s.status === 'reported').length;
  const totalStaff = users.length;

  const absenceStats = {
    pending: absences.filter(a => a.status === 'pending').length,
    approved: absences.filter(a => a.status === 'approved').length,
    rejected: absences.filter(a => a.status === 'rejected').length,
  };

  const purchaseStats = {
    pending: purchaseRequests.filter(p => p.status === 'pending').length,
    approved: purchaseRequests.filter(p => p.status === 'approved').length,
    completed: purchaseRequests.filter(p => p.status === 'completed').length,
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <SendMessageModal 
        isOpen={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        user={user}
        recipientRole="staff"
      />
      
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-3xl p-8 text-white shadow-lg border border-slate-600/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">לוח נתונים ניהולי</h2>
            <p className="text-slate-300">סקירת מערכת כוללת</p>
          </div>
          <BarChart3 className="h-12 w-12 text-blue-400 opacity-50" />
        </div>
      </div>

      {/* Daily Message Board */}
      <DailyMessageBoard user={user} />

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="סך כל העובדים"
          value={totalStaff}
          icon={Users}
          color="blue"
          subtext="כללי"
        />
        <StatCard
          title="היעדרויות בטיפול"
          value={pendingAbsences}
          icon={Clock}
          color="amber"
          subtext="ממתינות להחלטה"
        />
        <StatCard
          title="בקשות רכש"
          value={pendingPurchases}
          icon={ShoppingCart}
          color="green"
          subtext="ממתינות לאישור"
        />
        <StatCard
          title="טיקטים פתוחים"
          value={openTickets}
          icon={Wrench}
          color="red"
          subtext="בתחזוקה"
        />
      </div>

      {/* More Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-slate-800">טפסי קליטה</h3>
          </div>
          <div className="text-3xl font-bold text-purple-600 mb-2">{pendingOnboarding}</div>
          <p className="text-sm text-slate-600">ממתינים לאישור</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-cyan-100 rounded-xl">
              <TrendingUp className="h-6 w-6 text-cyan-600" />
            </div>
            <h3 className="font-bold text-slate-800">הדפסות</h3>
          </div>
          <div className="text-3xl font-bold text-cyan-600 mb-2">{pendingPrints}</div>
          <p className="text-sm text-slate-600">ממתינות לעיבוד</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-orange-100 rounded-xl">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
            <h3 className="font-bold text-slate-800">מילוי מקום</h3>
          </div>
          <div className="text-3xl font-bold text-orange-600 mb-2">{reportedSubstitutes}</div>
          <p className="text-sm text-slate-600">דוחות לאישור</p>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Absences Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-amber-100 rounded-xl">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">היעדרויות</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-100">
              <span className="text-sm text-amber-900">ממתינות לאישור</span>
              <span className="text-2xl font-bold text-amber-600">{absenceStats.pending}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
              <span className="text-sm text-green-900">אושרו</span>
              <span className="text-2xl font-bold text-green-600">{absenceStats.approved}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
              <span className="text-sm text-red-900">נדחו</span>
              <span className="text-2xl font-bold text-red-600">{absenceStats.rejected}</span>
            </div>
          </div>
        </div>

        {/* Purchase Requests Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 rounded-xl">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">בקשות רכש</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
              <span className="text-sm text-yellow-900">ממתינות</span>
              <span className="text-2xl font-bold text-yellow-600">{purchaseStats.pending}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
              <span className="text-sm text-green-900">אושרו</span>
              <span className="text-2xl font-bold text-green-600">{purchaseStats.approved}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
              <span className="text-sm text-blue-900">הושלמו</span>
              <span className="text-2xl font-bold text-blue-600">{purchaseStats.completed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Send Message to Staff */}
      <button
        onClick={() => setMessageModalOpen(true)}
        className="w-full p-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl hover:shadow-lg transition-all font-bold text-center flex items-center justify-center gap-2"
      >
        <Heart className="h-5 w-5" />
        שלח הערה מעצימה לצוות
      </button>

      {/* System Health */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          סיכום מצב המערכת
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500"></div>
            <span>{pendingAbsences + pendingPurchases + openTickets} פריטים בטיפול</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
            <span>{totalStaff} עובדים פעילים</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
            <span>{absenceStats.approved} היעדרויות אושרו השנה</span>
          </div>
        </div>
      </div>

      {/* Meetings Schedule */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            לוח פגישות
          </h3>
          <button
            onClick={() => setShowAddMeeting(true)}
            className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            פגישה חדשה
          </button>
        </div>
        <MeetingsList user={{ email: user?.email || '', full_name: user?.full_name || '' }} />
      </div>

      {showAddMeeting && (
        <AddMeeting user={{ email: user?.email || '', full_name: user?.full_name || '' }} onClose={() => setShowAddMeeting(false)} />
      )}
    </div>
  );
}