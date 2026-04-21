import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import {
  Calendar, Stethoscope, Clock, Map, Printer,
  ShoppingCart, Wrench, Monitor, Shield, Timer, Sparkles, Heart, FileText, Camera, MessageSquare
} from 'lucide-react';
import ReportingModal from '../modals/ReportingModal';
import AbsenceReportModal from '../modals/AbsenceReportModal';
import PrintRequestModal from '../modals/PrintRequestModal';
import DailyJournal from '../journal/DailyJournal';
import DailyMessageBoard from './DailyMessageBoard';
import SendMessageModal from '../messages/SendMessageModal';
import MessagesCenter from '../messages/MessagesCenter';
import TeacherAbsenceReport from '../reports/TeacherAbsenceReport';
import WeeklyScheduleView from '../schedule/WeeklyScheduleView';
import { isEnabled } from '@/lib/featureFlags';

const QUICK_ACTIONS = [
  { id: 'absence',            label: 'העדרות',          Icon: Stethoscope,  color: 'bg-amber-100 text-amber-700',     border: 'border-amber-200 hover:border-amber-400',  badge: 'חשוב' },
  { id: 'absence_report',     label: 'דוח היעדרויות',   Icon: FileText,     color: 'bg-blue-100 text-blue-700',       border: 'border-blue-200 hover:border-blue-400',    sub: 'PDF' },
  { id: 'substitute',         label: 'מילוי מקום',      Icon: Clock,        color: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200 hover:border-emerald-400' },
  { id: 'overtime',           label: 'שעות נוספות',     Icon: Timer,        color: 'bg-amber-100 text-amber-700',     border: 'border-amber-200 hover:border-amber-400' },
  { id: 'special_overtime',   label: 'שעות מיוחדות',    Icon: Sparkles,     color: 'bg-violet-100 text-violet-700',   border: 'border-violet-200 hover:border-violet-400' },
  { id: 'external',           label: 'פעילות חוץ',      Icon: Map,          color: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200 hover:border-emerald-400' },
  { id: 'purchase',           label: 'רכש',              Icon: ShoppingCart, color: 'bg-amber-100 text-amber-700',     border: 'border-amber-200 hover:border-amber-400' },
  { id: 'maintenance_general',label: 'תחזוקה',           Icon: Wrench,       color: 'bg-slate-100 text-slate-600',     border: 'border-slate-200 hover:border-slate-400' },
  { id: 'maintenance_pc',     label: 'מחשבים',           Icon: Monitor,      color: 'bg-indigo-100 text-indigo-700',   border: 'border-indigo-200 hover:border-indigo-400' },
  { id: 'printing',           label: 'צילומים',          Icon: Camera,       color: 'bg-blue-100 text-blue-700',       border: 'border-blue-200 hover:border-blue-400' },
];

export default function StaffDashboard({ user, setView }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  const [absenceModalOpen, setAbsenceModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [absenceReportOpen, setAbsenceReportOpen] = useState(false);

  const { data: myDuty } = useQuery({
    queryKey: ['duty', user.email, new Date().getDate()],
    queryFn: async () => {
      const duties = await base44.entities.DutyAssignment.filter({ staff_email: user.email, day: new Date().getDate() });
      return duties[0] || null;
    },
  });

  const openFeature = (feature) => { setActiveFeature(feature); setModalOpen(true); };

  const handleAction = (id) => {
    if (id === 'absence')        return setAbsenceModalOpen(true);
    if (id === 'absence_report') return setAbsenceReportOpen(true);
    if (id === 'printing')       return setPrintModalOpen(true);
    openFeature(id);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <ReportingModal isOpen={modalOpen} onClose={() => setModalOpen(false)} feature={activeFeature} user={user} />
      <AbsenceReportModal isOpen={absenceModalOpen} onClose={() => setAbsenceModalOpen(false)} user={user} />
      <PrintRequestModal isOpen={printModalOpen} onClose={() => setPrintModalOpen(false)} user={user} />
      <SendMessageModal isOpen={messageModalOpen} onClose={() => setMessageModalOpen(false)} user={user} recipientRole="leadership" />
      <TeacherAbsenceReport user={user} isOpen={absenceReportOpen} onClose={() => setAbsenceReportOpen(false)} />

      <DailyMessageBoard user={user} />

      {/* Duty alert */}
      {myDuty && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50 animate-slide-up">
          <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900">תורנות היום</p>
            <p className="text-xs text-amber-700">{myDuty.duty_type} בשעה {myDuty.time}</p>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
          <div className="h-7 w-7 rounded-lg bg-slate-900 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">פעולות מהירות</h3>
        </div>
        <div className="p-4 grid grid-cols-3 sm:grid-cols-5 gap-3">
          {QUICK_ACTIONS.map(({ id, label, Icon, color, border, badge, sub }) => (
            <button
              key={id}
              onClick={() => handleAction(id)}
              className={`relative group flex flex-col items-center gap-2 p-3 rounded-xl border-2 bg-white ${border} hover:shadow-md transition-all duration-150`}
            >
              {badge && (
                <span className="absolute top-1.5 right-1.5 text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">{badge}</span>
              )}
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${color} group-hover:scale-110 transition-transform duration-150`}>
                <Icon className="h-4.5 w-4.5" />
              </div>
              <span className="text-[11px] font-bold text-slate-700 leading-tight text-center">{label}</span>
              {sub && <span className="text-[10px] text-slate-400">{sub}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule */}
      {isEnabled('schedule') && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-3.5 w-3.5 text-white" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">מערכת השעות — היום</h3>
            </div>
            <button onClick={() => setView('schedule')}
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors">
              שבועי מלא ↗
            </button>
          </div>
          <div className="p-4">
            <WeeklyScheduleView email={user?.email} compact />
          </div>
        </div>
      )}

      {/* Journal */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
          <div className="h-7 w-7 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
            <Calendar className="h-3.5 w-3.5 text-white" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">יומן בית הספר — היום</h3>
        </div>
        <div className="p-4">
          <DailyJournal date={new Date()} />
        </div>
      </div>

      {/* Send message */}
      <button
        onClick={() => setMessageModalOpen(true)}
        className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all duration-150 font-semibold text-sm"
      >
        <MessageSquare className="h-4 w-4" />
        שלח הודעה למנהלת / סגנית / יועצת
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
    </div>
  );
}
