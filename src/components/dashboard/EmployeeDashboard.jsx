import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import {
  Calendar, Clock, FileText, Shield, CheckCircle
} from 'lucide-react';
import StatCard from '../StatCard';
import DailyJournal from '../journal/DailyJournal';
import { getStatusBadgeClass } from '@/lib/utils';

const TEACHER_BASE_SCHEDULE = {
  0: { 1: 'הסטוריה - ח׳2', 2: 'הסטוריה - ח׳2', 3: 'פרטני', 4: 'חלון', 5: 'אזרחות - ט׳1' },
  1: { 1: 'חלון', 2: 'הסטוריה - ח׳3', 3: 'הסטוריה - ח׳3', 4: 'ישיבת צוות', 5: 'הסטוריה - ח׳2' },
  2: { 1: 'אזרחות - ט׳1', 2: 'אזרחות - ט׳1', 3: 'הסטוריה - ח׳2', 4: 'חלון', 5: 'שהייה' },
  3: { 1: 'הסטוריה - ח׳3', 2: 'הסטוריה - ח׳3', 3: 'חלון', 4: 'פרטני', 5: 'חינוך - ח׳2' },
  4: { 1: 'חלון', 2: 'חלון', 3: 'הסטוריה - ח׳2', 4: 'הסטוריה - ח׳2', 5: 'אזרחות - ט׳1' },
  5: { 1: 'סיכום שבוע - ח׳2', 2: 'פרטני' },
};

export default function EmployeeDashboard({ user }) {
  const dayIdx = new Date().getDay();
  const today  = new Date();

  const { data: myAbsences       = [] } = useQuery({ queryKey: ['my-absences', user.email],  queryFn: () => base44.entities.Absence.filter({ user_email: user.email }, '-created_date', 20) });
  const { data: myPrintRequests  = [] } = useQuery({ queryKey: ['my-prints', user.email],    queryFn: () => base44.entities.PrintRequest.filter({ user_email: user.email }, '-created_date', 20) });
  const { data: myPurchaseRequests=[] } = useQuery({ queryKey: ['my-purchases', user.email], queryFn: () => base44.entities.PurchaseRequest.filter({ user_email: user.email }, '-created_date', 20) });
  const { data: myMaintenance    = [] } = useQuery({ queryKey: ['my-maintenance', user.email],queryFn: () => base44.entities.MaintenanceTicket.filter({ reporter_email: user.email }, '-created_date', 20) });
  const { data: myMeetings       = [] } = useQuery({ queryKey: ['my-meetings', user.email],  queryFn: () => base44.entities.Meeting.filter({ user_email: user.email }, '-created_date', 20) });
  const { data: myDuty } = useQuery({
    queryKey: ['my-duty', user.email, today.getDate()],
    queryFn: async () => {
      const duties = await base44.entities.DutyAssignment.filter({ staff_email: user.email, day: today.getDate() });
      return duties[0] || null;
    },
  });

  const pendingAbsences  = myAbsences.filter(a => a.status === 'pending').length;
  const approvedAbsences = myAbsences.filter(a => a.status === 'approved').length;
  const pendingPrints    = myPrintRequests.filter(p => p.status === 'pending').length;
  const pendingPurchases = myPurchaseRequests.filter(p => p.status === 'pending').length;
  const openMaintenance  = myMaintenance.filter(m => m.status === 'open').length;
  const upcomingMeetings = myMeetings.filter(m => new Date(m.meeting_date) >= today).length;

  return (
    <div className="space-y-5 animate-fade-in">
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="animate-slide-up-1"><StatCard title="היעדרויות בטיפול" value={pendingAbsences}  icon={Clock}        color="amber"  subtext="ממתינות לאישור" /></div>
        <div className="animate-slide-up-2"><StatCard title="היעדרויות אושרו"  value={approvedAbsences} icon={CheckCircle}  color="green"  subtext="מאושרות" /></div>
        <div className="animate-slide-up-3"><StatCard title="הדפסות ממתינות"   value={pendingPrints}    icon={FileText}     color="blue"   subtext="בטיפול מזכירה" /></div>
        <div className="animate-slide-up-4"><StatCard title="פגישות קרובות"    value={upcomingMeetings} icon={Calendar}     color="indigo" subtext="מתוכנן" /></div>
      </div>

      {/* Schedule */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Clock className="h-3.5 w-3.5 text-white" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">מערכת השעות שלי — היום</h3>
        </div>
        <div className="p-4 flex gap-3 overflow-x-auto scrollbar-hide">
          {[1, 2, 3, 4, 5].map(hour => {
            const lesson  = TEACHER_BASE_SCHEDULE[dayIdx]?.[hour];
            const isEmpty = !lesson || ['חלון', 'פרטני'].includes(lesson);
            return (
              <div key={hour} className="min-w-[96px] flex-1">
                <p className="text-center text-[10px] font-bold text-slate-400 mb-1.5">שעה {hour}</p>
                <div className={`p-3 rounded-xl border text-center h-[72px] flex flex-col justify-center items-center gap-1 ${!isEmpty ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-transparent'}`}>
                  {lesson ? (
                    <>
                      <span className="text-xs font-bold text-slate-800">{lesson.split('-')[0]?.trim()}</span>
                      {lesson.includes('-') && <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{lesson.split('-')[1]?.trim()}</span>}
                    </>
                  ) : <span className="text-slate-300 text-xs">—</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* My data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Absences */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
            <div className="h-7 w-7 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
              <Clock className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">היעדרויות שלי</h3>
          </div>
          <div className="p-4 space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
            {myAbsences.length > 0 ? myAbsences.map(absence => (
              <div key={absence.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-semibold text-slate-700">{absence.absence_reason}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadgeClass(absence.status).badgeClass}`}>
                    {getStatusBadgeClass(absence.status).label}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {new Date(absence.start_date).toLocaleDateString('he-IL')} — {new Date(absence.end_date).toLocaleDateString('he-IL')}
                </p>
              </div>
            )) : (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <p className="text-sm font-medium">אין היעדרויות</p>
              </div>
            )}
          </div>
        </div>

        {/* Requests summary */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
            <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <FileText className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">בקשות שלי</h3>
          </div>
          <div className="p-4 space-y-2">
            {[
              { label: 'הדפסות',         value: pendingPrints,    color: 'bg-blue-50 border-blue-100 text-blue-700',   badge: 'bg-blue-600' },
              { label: 'בקשות רכש',      value: pendingPurchases, color: 'bg-emerald-50 border-emerald-100 text-emerald-700', badge: 'bg-emerald-600' },
              { label: 'דיווחי תחזוקה', value: openMaintenance,  color: 'bg-amber-50 border-amber-100 text-amber-700', badge: 'bg-amber-500' },
              { label: 'פגישות',         value: upcomingMeetings, color: 'bg-indigo-50 border-indigo-100 text-indigo-700', badge: 'bg-indigo-600' },
            ].map(({ label, value, color, badge }) => (
              <div key={label} className={`flex items-center justify-between p-3 rounded-xl border ${color}`}>
                <span className="text-[13px] font-semibold">{label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-black text-white px-2 py-0.5 rounded-full ${badge}`}>{value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Journal */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
          <div className="h-7 w-7 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
            <Calendar className="h-3.5 w-3.5 text-white" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">יומן בית הספר</h3>
        </div>
        <div className="p-4">
          <DailyJournal date={today} />
        </div>
      </div>
    </div>
  );
}
