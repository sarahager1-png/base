import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import StatCard from '../StatCard';
import MeetingsList from '../meetings/MeetingsList';
import AddMeeting from '../meetings/AddMeeting';
import DailyMessageBoard from './DailyMessageBoard';
import MorningGreeting from './MorningGreeting';
import ActivityTimeline from './ActivityTimeline';
import {
  Users, Clock, ShoppingCart, FileText,
  Wrench, BarChart3, Plus, Heart,
  MessageCircle, Download, Printer, CheckCircle, XCircle, AlertCircle, X, Mail, Phone
} from 'lucide-react';
import SendMessageModal from '../messages/SendMessageModal';
import { useAuth } from '@/lib/AuthContext';
import { getWAConfig, sendWhatsApp } from '@/lib/whatsapp';
import { toast } from 'sonner';

const ROLE_LABELS = {
  admin: 'מנהלת/מנהל',
  vice_principal: 'סגנית/סגן מנהל',
  secretary: 'מזכירה/מזכיר',
  teacher: 'מורה',
  counselor: 'יועצת/יועץ',
  coordinator: 'רכזת/רכז',
  assistant: 'סייעת/סייע',
  substitute: 'מחליפה/מחליף',
  maintenance: 'אחזקה',
  staff: 'צוות כללי',
};

const ROLE_COLORS = {
  admin: 'bg-purple-100 text-purple-700',
  vice_principal: 'bg-indigo-100 text-indigo-700',
  secretary: 'bg-cyan-100 text-cyan-700',
  teacher: 'bg-blue-100 text-blue-700',
  counselor: 'bg-green-100 text-green-700',
  coordinator: 'bg-yellow-100 text-yellow-700',
  assistant: 'bg-orange-100 text-orange-700',
  substitute: 'bg-slate-100 text-slate-600',
  maintenance: 'bg-red-100 text-red-700',
  staff: 'bg-gray-100 text-gray-600',
};

export default function AdminDashboard() {
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [showStaff, setShowStaff] = useState(false);
  const [staff, setStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [staffSearch, setStaffSearch] = useState('');
  const { user } = useAuth();

  const loadStaff = useCallback(async () => {
    if (!user?.school_id) return;
    setStaffLoading(true);
    try {
      const list = await base44.firestoreStaff.list(user.school_id);
      setStaff(list);
    } catch(e) { console.error(e); }
    setStaffLoading(false);
  }, [user?.school_id]);

  const handleShowStaff = () => {
    setShowStaff(true);
    loadStaff();
  };

  const { data: users = [] } = useQuery({ queryKey: ['users-all'], queryFn: () => base44.entities.User.list() });
  const { data: absences = [] } = useQuery({ queryKey: ['absences-all'], queryFn: () => base44.entities.Absence.list('-created_date', 100) });
  const { data: purchaseRequests = [] } = useQuery({ queryKey: ['purchases-all'], queryFn: () => base44.entities.PurchaseRequest.list('-created_date', 100) });
  const { data: printRequests = [] } = useQuery({ queryKey: ['prints-all'], queryFn: () => base44.entities.PrintRequest.list('-created_date', 100) });
  const { data: maintenanceTickets = [] } = useQuery({ queryKey: ['maintenance-all'], queryFn: () => base44.entities.MaintenanceTicket.list('-created_date', 100) });
  const { data: onboardingDocs = [] } = useQuery({ queryKey: ['onboarding-all'], queryFn: () => base44.entities.OnboardingDocument.list('-created_date', 100) });
  const { data: substituteReports = [] } = useQuery({ queryKey: ['substitutes-all'], queryFn: () => base44.entities.SubstituteReport.list('-created_date', 100) });

  const pendingAbsences    = absences.filter(a => a.status === 'pending').length;
  const approvedAbsences   = absences.filter(a => a.status === 'approved').length;
  const rejectedAbsences   = absences.filter(a => a.status === 'rejected').length;
  const pendingPurchases   = purchaseRequests.filter(p => p.status === 'pending').length;
  const approvedPurchases  = purchaseRequests.filter(p => p.status === 'approved').length;
  const completedPurchases = purchaseRequests.filter(p => p.status === 'completed').length;
  const pendingPrints      = printRequests.filter(p => p.status === 'pending').length;
  const openTickets        = maintenanceTickets.filter(t => t.status === 'open').length;
  const pendingOnboarding  = onboardingDocs.filter(d => d.status === 'pending').length;
  const reportedSubstitutes = substituteReports.filter(s => s.status === 'reported').length;
  const totalStaff         = users.length;

  const handleWhatsApp = async () => {
    const waConfig = getWAConfig();
    const text = `שלום לצוות ${user?.school_name || 'בית הספר'} 👋\nעדכון מהמנהלת:\n\n`;

    if (waConfig.instanceId && waConfig.token && waConfig.adminPhone) {
      try {
        await sendWhatsApp(waConfig.adminPhone, text);
        toast.success('הודעה נשלחה לוואצאפ!');
      } catch (e) {
        toast.error('שגיאה בשליחה — ' + e.message);
      }
    } else {
      const msg = encodeURIComponent(text);
      const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
      const base = isMobile ? 'whatsapp://send' : 'https://web.whatsapp.com/send';
      window.open(`${base}?text=${msg}`, '_blank');
    }
  };

  const StatRow = ({ label, value, icon: Icon, color }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        <span className="text-sm text-slate-600">{label}</span>
      </div>
      <span className="text-sm font-bold text-slate-800 tabular-nums">{value}</span>
    </div>
  );

  return (
    <div className="space-y-5" id="print-area">
      <SendMessageModal isOpen={messageModalOpen} onClose={() => setMessageModalOpen(false)} user={user} recipientRole="staff" />

      {/* Greeting */}
      <MorningGreeting user={user} pendingAbsences={pendingAbsences} pendingPurchases={pendingPurchases} openTickets={openTickets} />

      {/* Daily Message */}
      <DailyMessageBoard user={user} />

      {/* Main Stats — 4 cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={handleShowStaff} className="cursor-pointer">
          <StatCard title="אנשי צוות" value={totalStaff} icon={Users} color="blue" subtext="לחץ לרשימה" />
        </div>
        <StatCard title="היעדרויות בטיפול"  value={pendingAbsences}   icon={Clock}        color="yellow" subtext="ממתינות להחלטה" />
        <StatCard title="בקשות רכש"         value={pendingPurchases}  icon={ShoppingCart} color="green"  subtext="ממתינות לאישור" />
        <StatCard title="טיקטים פתוחים"     value={openTickets}       icon={Wrench}       color="red"    subtext="בתחזוקה" />
      </div>

      {/* Middle row: detail tables + side stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Absences detail */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/80">
            <div className="p-1.5 rounded-lg bg-yellow-100"><Clock className="h-3.5 w-3.5 text-yellow-600" /></div>
            <span className="text-sm font-semibold text-slate-700">היעדרויות</span>
          </div>
          <div className="px-4 pt-1 pb-2">
            <StatRow label="ממתינות לאישור" value={pendingAbsences}  icon={AlertCircle} color="text-yellow-500" />
            <StatRow label="אושרו"           value={approvedAbsences} icon={CheckCircle} color="text-green-500" />
            <StatRow label="נדחו"            value={rejectedAbsences} icon={XCircle}     color="text-red-400" />
          </div>
        </div>

        {/* Purchases detail */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/80">
            <div className="p-1.5 rounded-lg bg-green-100"><ShoppingCart className="h-3.5 w-3.5 text-green-600" /></div>
            <span className="text-sm font-semibold text-slate-700">בקשות רכש</span>
          </div>
          <div className="px-4 pt-1 pb-2">
            <StatRow label="ממתינות"  value={pendingPurchases}   icon={AlertCircle} color="text-yellow-500" />
            <StatRow label="אושרו"    value={approvedPurchases}  icon={CheckCircle} color="text-green-500" />
            <StatRow label="הושלמו"   value={completedPurchases} icon={CheckCircle} color="text-blue-500" />
          </div>
        </div>

        {/* Mini stats */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/80">
            <div className="p-1.5 rounded-lg bg-blue-100"><BarChart3 className="h-3.5 w-3.5 text-blue-600" /></div>
            <span className="text-sm font-semibold text-slate-700">נוספים</span>
          </div>
          <div className="px-4 pt-1 pb-2">
            <StatRow label="טפסי קליטה"  value={pendingOnboarding}   icon={FileText} color="text-purple-500" />
            <StatRow label="הדפסות"       value={pendingPrints}        icon={Printer}  color="text-cyan-500" />
            <StatRow label="מילוי מקום"   value={reportedSubstitutes}  icon={Users}    color="text-orange-500" />
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 no-print">
        <button onClick={() => setMessageModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm">
          <Heart className="h-4 w-4" />הערה מעצימה לצוות
        </button>
        <button onClick={handleWhatsApp}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors shadow-sm">
          <MessageCircle className="h-4 w-4" />שלח WhatsApp לצוות
        </button>
        <button onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">
          <Download className="h-4 w-4" />ייצוא דוח PDF
        </button>
      </div>

      {/* Bottom row: Activity + Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActivityTimeline />

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-100"><Users className="h-3.5 w-3.5 text-blue-600" /></div>
              <h3 className="text-sm font-bold text-slate-800">לוח פגישות</h3>
            </div>
            <button onClick={() => setShowAddMeeting(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              <Plus className="h-3.5 w-3.5" />פגישה חדשה
            </button>
          </div>
          <MeetingsList user={user} />
        </div>
      </div>

      {showAddMeeting && <AddMeeting user={user} onClose={() => setShowAddMeeting(false)} />}

      {/* Staff List Modal */}
      {showStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-100"><Users className="h-4 w-4 text-blue-600" /></div>
                <div>
                  <h2 className="text-sm font-bold text-slate-800">אנשי הצוות</h2>
                  <p className="text-xs text-slate-400">{staff.length} עובדים רשומים</p>
                </div>
              </div>
              <button onClick={() => setShowStaff(false)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 py-3 border-b border-slate-100">
              <input
                type="text"
                placeholder="חיפוש לפי שם או תפקיד..."
                value={staffSearch}
                onChange={e => setStaffSearch(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 bg-slate-50"
              />
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {staffLoading ? (
                <div className="text-center py-12 text-slate-400 text-sm">טוען...</div>
              ) : staff.filter(s =>
                  !staffSearch ||
                  s.full_name?.includes(staffSearch) ||
                  ROLE_LABELS[s.role]?.includes(staffSearch)
                ).length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">לא נמצאו עובדים</div>
              ) : (
                staff
                  .filter(s =>
                    !staffSearch ||
                    s.full_name?.includes(staffSearch) ||
                    ROLE_LABELS[s.role]?.includes(staffSearch)
                  )
                  .sort((a, b) => (a.full_name || '').localeCompare(b.full_name || '', 'he'))
                  .map(s => (
                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {s.full_name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{s.full_name}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-1">
                            <Mail className="h-3 w-3" />{s.email}
                          </p>
                        </div>
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[s.role] || 'bg-slate-100 text-slate-600'}`}>
                        {ROLE_LABELS[s.role] || s.role}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
