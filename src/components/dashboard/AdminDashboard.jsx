import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import StatCard from '../StatCard';
import MeetingsList from '../meetings/MeetingsList';
import { useState } from 'react';
import AddMeeting from '../meetings/AddMeeting';
import DailyMessageBoard from './DailyMessageBoard';
import MorningGreeting from './MorningGreeting';
import ActivityTimeline from './ActivityTimeline';
import {
  Users, AlertTriangle, Clock, ShoppingCart, FileText,
  Wrench, BarChart3, TrendingUp, Plus, Heart,
  MessageCircle, Download, Printer
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

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(`שלום לצוות ${user?.school_name || 'בית הספר'} 👋\nעדכון מהמנהלת:\n\n`);
    window.open(`https://web.whatsapp.com/send?text=${msg}`, '_blank');
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in" id="print-area">
      <SendMessageModal
        isOpen={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        user={user}
        recipientRole="staff"
      />

      {/* Morning Greeting */}
      <MorningGreeting
        user={user}
        pendingAbsences={pendingAbsences}
        pendingPurchases={pendingPurchases}
        openTickets={openTickets}
      />

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
        {/* Onboarding card */}
        <div className="relative rounded-2xl p-6 overflow-hidden group"
             style={{
               background: 'linear-gradient(145deg, #f5f3ff 0%, #ffffff 50%, #ede9fe 100%)',
               border: '1px solid #8b5cf620',
               boxShadow: '0 2px 8px rgba(139,92,246,0.08)',
             }}>
          <div className="absolute -top-8 -left-8 h-32 w-32 rounded-full opacity-20 blur-2xl"
               style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
          <div className="relative flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl shadow-md" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', boxShadow: '0 6px 20px #8b5cf640' }}>
              <FileText className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-slate-700">טפסי קליטה</h3>
          </div>
          <div className="relative text-4xl font-black mb-1"
               style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {pendingOnboarding}
          </div>
          <p className="text-sm text-slate-500">ממתינים לאישור</p>
        </div>

        {/* Prints card */}
        <div className="relative rounded-2xl p-6 overflow-hidden group"
             style={{
               background: 'linear-gradient(145deg, #ecfeff 0%, #ffffff 50%, #cffafe 100%)',
               border: '1px solid #06b6d420',
               boxShadow: '0 2px 8px rgba(6,182,212,0.08)',
             }}>
          <div className="absolute -top-8 -left-8 h-32 w-32 rounded-full opacity-20 blur-2xl"
               style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
          <div className="relative flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl shadow-md" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', boxShadow: '0 6px 20px #06b6d440' }}>
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-slate-700">הדפסות</h3>
          </div>
          <div className="relative text-4xl font-black mb-1"
               style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {pendingPrints}
          </div>
          <p className="text-sm text-slate-500">ממתינות לעיבוד</p>
        </div>

        {/* Substitutes card */}
        <div className="relative rounded-2xl p-6 overflow-hidden group"
             style={{
               background: 'linear-gradient(145deg, #fff7ed 0%, #ffffff 50%, #ffedd5 100%)',
               border: '1px solid #f9731620',
               boxShadow: '0 2px 8px rgba(249,115,22,0.08)',
             }}>
          <div className="absolute -top-8 -left-8 h-32 w-32 rounded-full opacity-20 blur-2xl"
               style={{ background: 'radial-gradient(circle, #f97316, transparent)' }} />
          <div className="relative flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl shadow-md" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', boxShadow: '0 6px 20px #f9731640' }}>
              <Users className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-bold text-slate-700">מילוי מקום</h3>
          </div>
          <div className="relative text-4xl font-black mb-1"
               style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            {reportedSubstitutes}
          </div>
          <p className="text-sm text-slate-500">דוחות לאישור</p>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Absences Overview */}
        <div className="relative bg-white rounded-2xl overflow-hidden"
             style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #f59e0b15' }}>
          {/* Header gradient band */}
          <div className="p-5 flex items-center gap-3"
               style={{ background: 'linear-gradient(135deg, #fffbeb, #fef3c7)' }}>
            <div className="p-3 rounded-xl shadow-md" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 6px 20px #f59e0b40' }}>
              <Clock className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-base font-bold text-amber-900">היעדרויות</h3>
          </div>

          <div className="p-5 space-y-2.5">
            {/* Pending row */}
            <div className="flex items-center justify-between p-3.5 rounded-xl"
                 style={{ background: 'linear-gradient(135deg, #fffbeb, #fef9c3)', border: '1px solid #f59e0b25' }}>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-sm font-medium text-amber-800">ממתינות לאישור</span>
              </div>
              <span className="text-2xl font-black" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {absenceStats.pending}
              </span>
            </div>
            {/* Approved row */}
            <div className="flex items-center justify-between p-3.5 rounded-xl"
                 style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #10b98125' }}>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-sm font-medium text-emerald-800">אושרו</span>
              </div>
              <span className="text-2xl font-black" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {absenceStats.approved}
              </span>
            </div>
            {/* Rejected row */}
            <div className="flex items-center justify-between p-3.5 rounded-xl"
                 style={{ background: 'linear-gradient(135deg, #fef2f2, #fee2e2)', border: '1px solid #ef444425' }}>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-400" />
                <span className="text-sm font-medium text-red-800">נדחו</span>
              </div>
              <span className="text-2xl font-black" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {absenceStats.rejected}
              </span>
            </div>
          </div>
        </div>

        {/* Purchase Requests Overview */}
        <div className="relative bg-white rounded-2xl overflow-hidden"
             style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #10b98115' }}>
          {/* Header gradient band */}
          <div className="p-5 flex items-center gap-3"
               style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
            <div className="p-3 rounded-xl shadow-md" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 6px 20px #10b98140' }}>
              <ShoppingCart className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-base font-bold text-emerald-900">בקשות רכש</h3>
          </div>

          <div className="p-5 space-y-2.5">
            {/* Pending row */}
            <div className="flex items-center justify-between p-3.5 rounded-xl"
                 style={{ background: 'linear-gradient(135deg, #fffbeb, #fef9c3)', border: '1px solid #eab30825' }}>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-400" />
                <span className="text-sm font-medium text-yellow-800">ממתינות</span>
              </div>
              <span className="text-2xl font-black" style={{ background: 'linear-gradient(135deg, #eab308, #d97706)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {purchaseStats.pending}
              </span>
            </div>
            {/* Approved row */}
            <div className="flex items-center justify-between p-3.5 rounded-xl"
                 style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #10b98125' }}>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-sm font-medium text-emerald-800">אושרו</span>
              </div>
              <span className="text-2xl font-black" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {purchaseStats.approved}
              </span>
            </div>
            {/* Completed row */}
            <div className="flex items-center justify-between p-3.5 rounded-xl"
                 style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)', border: '1px solid #3b82f625' }}>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-400" />
                <span className="text-sm font-medium text-blue-800">הושלמו</span>
              </div>
              <span className="text-2xl font-black" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                {purchaseStats.completed}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 no-print">
        <button
          onClick={() => setMessageModalOpen(true)}
          className="p-4 text-white rounded-2xl hover:shadow-lg transition-all font-bold text-center flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #ec4899, #f43f5e)' }}
        >
          <Heart className="h-5 w-5" />
          הערה מעצימה לצוות
        </button>
        <button
          onClick={handleWhatsApp}
          className="p-4 text-white rounded-2xl hover:shadow-lg transition-all font-bold text-center flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}
        >
          <MessageCircle className="h-5 w-5" />
          שלח WhatsApp לצוות
        </button>
        <button
          onClick={handleExportPDF}
          className="p-4 text-white rounded-2xl hover:shadow-lg transition-all font-bold text-center flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
        >
          <Download className="h-5 w-5" />
          ייצוא דוח PDF
        </button>
      </div>

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

      {/* Activity Timeline */}
      <ActivityTimeline />

      {/* Meetings Schedule */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
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
        <MeetingsList user={user} />
      </div>

      {showAddMeeting && (
        <AddMeeting user={user} onClose={() => setShowAddMeeting(false)} />
      )}
    </div>
  );
}