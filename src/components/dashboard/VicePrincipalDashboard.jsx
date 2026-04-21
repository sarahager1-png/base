import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import StatCard from '../StatCard';
import ReportingModal from '../modals/ReportingModal';
import AbsenceReportModal from '../modals/AbsenceReportModal';
import PrintRequestModal from '../modals/PrintRequestModal';
import AbsenceApprovalPanel from './AbsenceApprovalPanel';
import AddMeeting from '../meetings/AddMeeting';
import MeetingsList from '../meetings/MeetingsList';
import DailyJournal from '../journal/DailyJournal';
import DailyMessageBoard from './DailyMessageBoard';
import SendMessageModal from '../messages/SendMessageModal';
import MessagesCenter from '../messages/MessagesCenter';
import {
  AlertTriangle, UserCheck, Clock, ShoppingCart, Shield,
  Calendar, Users, Plus, Wrench, Monitor, Timer, Sparkles,
  Heart, Map, ChevronLeft, MessageSquare
} from 'lucide-react';

const TEACHER_BASE_SCHEDULE = {
  0: { 1: 'הסטוריה - ח׳2', 2: 'הסטוריה - ח׳2', 3: 'פרטני', 4: 'חלון', 5: 'אזרחות - ט׳1', 6: 'אזרחות - ט׳1' },
  1: { 1: 'חלון', 2: 'הסטוריה - ח׳3', 3: 'הסטוריה - ח׳3', 4: 'ישיבת צוות', 5: 'הסטוריה - ח׳2' },
  2: { 1: 'אזרחות - ט׳1', 2: 'אזרחות - ט׳1', 3: 'הסטוריה - ח׳2', 4: 'הסטוריה - ח׳2', 5: 'שהייה', 6: 'שהייה' },
  3: { 1: 'הסטוריה - ח׳3', 2: 'הסטוריה - ח׳3', 3: 'חלון', 4: 'פרטני', 5: 'חינוך - ח׳2' },
  4: { 1: 'חלון', 2: 'חלון', 3: 'הסטוריה - ח׳2', 4: 'הסטוריה - ח׳2', 5: 'אזרחות - ט׳1' },
  5: { 1: 'סיכום שבוע - ח׳2', 2: 'פרטני' },
};

const QUICK_ACTIONS = [
  { id: 'absence',            label: 'העדרות',          Icon: Clock,        color: 'bg-amber-100 text-amber-700',     border: 'border-amber-200 hover:border-amber-400',  badge: 'חשוב' },
  { id: 'substitute',         label: 'מילוי מקום',      Icon: Users,        color: 'bg-amber-100 text-amber-700',     border: 'border-amber-200 hover:border-amber-400' },
  { id: 'overtime',           label: 'שעות נוספות',     Icon: Timer,        color: 'bg-amber-100 text-amber-700',     border: 'border-amber-200 hover:border-amber-400' },
  { id: 'external',           label: 'פעילות חוץ',      Icon: Map,          color: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200 hover:border-emerald-400' },
  { id: 'purchase',           label: 'רכש',              Icon: ShoppingCart, color: 'bg-blue-100 text-blue-700',       border: 'border-blue-200 hover:border-blue-400' },
  { id: 'maintenance_general',label: 'תחזוקה כללית',    Icon: Wrench,       color: 'bg-slate-100 text-slate-600',     border: 'border-slate-200 hover:border-slate-400' },
  { id: 'maintenance_pc',     label: 'תחזוקת מחשבים',  Icon: Monitor,      color: 'bg-indigo-100 text-indigo-700',   border: 'border-indigo-200 hover:border-indigo-400' },
  { id: 'special_overtime',   label: 'שעות מיוחדות',    Icon: Sparkles,     color: 'bg-violet-100 text-violet-700',   border: 'border-violet-200 hover:border-violet-400' },
];

export default function VicePrincipalDashboard({ user, setView }) {
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  const [absenceModalOpen, setAbsenceModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: absences = [] } = useQuery({
    queryKey: ['absences', 'pending'],
    queryFn: () => base44.entities.Absence.filter({ status: 'pending' }),
  });
  const { data: onboardingDocs = [] } = useQuery({
    queryKey: ['onboarding', 'pending'],
    queryFn: () => base44.entities.OnboardingDocument.filter({ status: 'pending' }),
  });
  const { data: purchaseRequests = [] } = useQuery({
    queryKey: ['purchases', 'pending'],
    queryFn: () => base44.entities.PurchaseRequest.filter({ status: 'pending' }),
  });
  const { data: substituteReports = [] } = useQuery({
    queryKey: ['substitutes', 'reported'],
    queryFn: () => base44.entities.SubstituteReport.filter({ status: 'reported' }),
  });
  const { data: myDuty } = useQuery({
    queryKey: ['duty', user.email, new Date().getDate()],
    queryFn: async () => {
      const duties = await base44.entities.DutyAssignment.filter({ staff_email: user.email, day: new Date().getDate() });
      return duties[0] || null;
    },
  });

  const openFeature = (id) => { setActiveFeature(id); setModalOpen(true); };
  const dayIdx = new Date().getDay();

  return (
    <div className="space-y-6 animate-fade-in">
      <ReportingModal isOpen={modalOpen} onClose={() => setModalOpen(false)} feature={activeFeature} user={user} />
      <AbsenceReportModal isOpen={absenceModalOpen} onClose={() => setAbsenceModalOpen(false)} user={user} />
      <PrintRequestModal isOpen={printModalOpen} onClose={() => setPrintModalOpen(false)} user={user} />
      <SendMessageModal isOpen={messageModalOpen} onClose={() => setMessageModalOpen(false)} user={user} recipientRole="staff" />

      <DailyMessageBoard user={user} />

      {/* Duty alert */}
      {myDuty && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 animate-slide-up">
          <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900">תורנות היום שלי</p>
            <p className="text-xs text-amber-700">{myDuty.duty_type} בשעה {myDuty.time}</p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
          <div className="h-7 w-7 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">פעולות מהירות</h3>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(({ id, label, Icon, color, border, badge }) => (
            <button
              key={id}
              onClick={() => id === 'absence' ? setAbsenceModalOpen(true) : openFeature(id)}
              className={`relative group flex flex-col items-center gap-2 p-4 rounded-xl border-2 bg-white ${border} hover:shadow-md transition-all duration-150`}
            >
              {badge && (
                <span className="absolute top-2 right-2 text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-150`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[12px] font-bold text-slate-700 leading-tight text-center">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats row — staggered */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-slide-up-1"><StatCard title="היעדרויות לאישור" value={absences.length} icon={Clock} color="amber" subtext="ממתינות להחלטה" /></div>
        <div className="animate-slide-up-2"><StatCard title="טפסי קליטה" value={onboardingDocs.length} icon={UserCheck} color="purple" subtext="עובדים חדשים" /></div>
        <div className="animate-slide-up-3"><StatCard title="בקשות רכש" value={purchaseRequests.length} icon={ShoppingCart} color="blue" subtext="לאישור תקציבי" /></div>
        <div className="animate-slide-up-4"><StatCard title="מילוי מקום" value={substituteReports.length} icon={AlertTriangle} color="red" subtext="דוחות לאישור" /></div>
      </div>

      {/* Schedule */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Calendar className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">
              מערכת שעות — {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: '2-digit', month: '2-digit' })}
            </h3>
          </div>
          <button
            onClick={() => setView('schedule')}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-100 flex items-center gap-1"
          >
            יומן חודשי <ChevronLeft className="h-3 w-3" />
          </button>
        </div>
        <div className="p-4 flex gap-3 overflow-x-auto scrollbar-hide">
          {[1, 2, 3, 4, 5, 6, 7].map(hour => {
            const lesson = TEACHER_BASE_SCHEDULE[dayIdx]?.[hour];
            return (
              <div key={hour} className="min-w-[100px] flex-1">
                <p className="text-center text-[10px] font-bold text-slate-400 mb-1.5">שעה {hour}</p>
                <div className={`p-3 rounded-xl border text-center h-[72px] flex flex-col justify-center items-center gap-1 transition-all ${lesson ? 'bg-white border-slate-200 hover:shadow-sm' : 'bg-slate-50 border-transparent'}`}>
                  {lesson ? (
                    <>
                      <span className="font-bold text-slate-800 text-xs leading-tight">{lesson.split('-')[0]?.trim()}</span>
                      {lesson.includes('-') && (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{lesson.split('-')[1]?.trim()}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-300 text-xs">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Approvals + Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
            <div className="h-7 w-7 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
              <Clock className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">היעדרויות לאישור</h3>
            {absences.length > 0 && (
              <span className="mr-auto text-[10px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded-full">
                {absences.length}
              </span>
            )}
          </div>
          <div className="p-4">
            <AbsenceApprovalPanel />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
            <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Users className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">יומן פגישות</h3>
            <button
              onClick={() => setShowAddMeeting(true)}
              className="mr-auto text-[11px] font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> פגישה חדשה
            </button>
          </div>
          <div className="p-4">
            <MeetingsList user={user} />
          </div>
        </div>
      </div>

      {/* Journal */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
          <div className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <Calendar className="h-3.5 w-3.5 text-white" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">יומן היום</h3>
        </div>
        <div className="p-4">
          <DailyJournal date={new Date()} />
        </div>
      </div>

      {/* Send message CTA */}
      <button
        onClick={() => setMessageModalOpen(true)}
        className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150 font-semibold text-sm"
      >
        <MessageSquare className="h-4 w-4" />
        שלח הערה מעצימה לצוות
      </button>

      {/* Messages */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
          <div className="h-7 w-7 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
            <Heart className="h-3.5 w-3.5 text-white" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">מרכז הודעות</h3>
        </div>
        <div className="p-4">
          <MessagesCenter user={user} />
        </div>
      </div>

      {showAddMeeting && <AddMeeting user={user} onClose={() => setShowAddMeeting(false)} />}
    </div>
  );
}
