import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Calendar, Clock, AlertCircle, FileText, 
  Shield, CheckCircle, XCircle, Home
} from 'lucide-react';
import DailyJournal from '../journal/DailyJournal';

export default function EmployeeDashboard({ user }) {
  const dayIdx = new Date().getDay();
  const today = new Date();

  // Fetch employee's data
  const { data: myAbsences = [] } = useQuery({
    queryKey: ['my-absences', user.email],
    queryFn: () => base44.entities.Absence.filter({ user_email: user.email }, '-created_date', 20),
  });

  const { data: myPrintRequests = [] } = useQuery({
    queryKey: ['my-prints', user.email],
    queryFn: () => base44.entities.PrintRequest.filter({ user_email: user.email }, '-created_date', 20),
  });

  const { data: myPurchaseRequests = [] } = useQuery({
    queryKey: ['my-purchases', user.email],
    queryFn: () => base44.entities.PurchaseRequest.filter({ user_email: user.email }, '-created_date', 20),
  });

  const { data: myMaintenance = [] } = useQuery({
    queryKey: ['my-maintenance', user.email],
    queryFn: () => base44.entities.MaintenanceTicket.filter({ reporter_email: user.email }, '-created_date', 20),
  });

  const { data: myMeeting = [] } = useQuery({
    queryKey: ['my-meetings', user.email],
    queryFn: () => base44.entities.Meeting.filter({ user_email: user.email }, '-created_date', 20),
  });

  const { data: myDuty } = useQuery({
    queryKey: ['my-duty', user.email, today.getDate()],
    queryFn: async () => {
      const duties = await base44.entities.DutyAssignment.filter({ 
        staff_email: user.email, 
        day: today.getDate() 
      });
      return duties[0] || null;
    },
  });

  // Calculate stats
  const pendingAbsences = myAbsences.filter(a => a.status === 'pending').length;
  const approvedAbsences = myAbsences.filter(a => a.status === 'approved').length;
  const pendingPrints = myPrintRequests.filter(p => p.status === 'pending').length;
  const pendingPurchases = myPurchaseRequests.filter(p => p.status === 'pending').length;
  const openMaintenance = myMaintenance.filter(m => m.status === 'open').length;
  const upcomingMeetings = myMeeting.filter(m => new Date(m.meeting_date) >= today).length;

  const TEACHER_BASE_SCHEDULE = {
    0: { 1: 'הסטוריה - ח׳2', 2: 'הסטוריה - ח׳2', 3: 'פרטני', 4: 'חלון', 5: 'אזרחות - ט׳1' },
    1: { 1: 'חלון', 2: 'הסטוריה - ח׳3', 3: 'הסטוריה - ח׳3', 4: 'ישיבת צוות', 5: 'הסטוריה - ח׳2' },
    2: { 1: 'אזרחות - ט׳1', 2: 'אזרחות - ט׳1', 3: 'הסטוריה - ח׳2', 4: 'חלון', 5: 'שהייה' },
    3: { 1: 'הסטוריה - ח׳3', 2: 'הסטוריה - ח׳3', 3: 'חלון', 4: 'פרטני', 5: 'חינוך - ח׳2' },
    4: { 1: 'חלון', 2: 'חלון', 3: 'הסטוריה - ח׳2', 4: 'הסטוריה - ח׳2', 5: 'אזרחות - ט׳1' },
    5: { 1: 'סיכום שבוע - ח׳2', 2: 'פרטני' },
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">שלום, {user.full_name}</h2>
            <p className="text-blue-100">
              {today.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
          <Home className="h-12 w-12 opacity-50" />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <span className="text-xs font-medium text-slate-600">היעדרויות</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">{pendingAbsences}</div>
          <p className="text-xs text-slate-500 mt-1">בטיפול</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span className="text-xs font-medium text-slate-600">אושרו</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{approvedAbsences}</div>
          <p className="text-xs text-slate-500 mt-1">היעדרויות</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-purple-500" />
            <span className="text-xs font-medium text-slate-600">הדפסות</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">{pendingPrints}</div>
          <p className="text-xs text-slate-500 mt-1">ממתינות</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            <span className="text-xs font-medium text-slate-600">פגישות</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{upcomingMeetings}</div>
          <p className="text-xs text-slate-500 mt-1">קרובות</p>
        </div>
      </div>

      {/* Duty Alert */}
      {myDuty && (
        <div className="bg-amber-50 border-l-4 border-amber-500 rounded-lg p-4 flex items-center gap-3">
          <div className="p-3 bg-amber-100 rounded-full">
            <Shield className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-amber-900">תורנות היום</h3>
            <p className="text-sm text-amber-800">
              {myDuty.duty_type} בשעה {myDuty.time}
            </p>
          </div>
        </div>
      )}

      {/* Today's Schedule */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          מערכת השעות שלי היום
        </h3>
        
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map(hour => {
            const lesson = TEACHER_BASE_SCHEDULE[dayIdx]?.[hour];
            const isEmpty = !lesson || ['חלון', 'פרטני'].includes(lesson);
            
            return (
              <div key={hour} className="min-w-[100px]">
                <div className="text-center text-xs font-bold text-slate-500 mb-1 bg-slate-100 py-1 rounded">
                  שעה {hour}
                </div>
                <div className={`p-3 rounded-lg border text-center h-24 flex flex-col justify-center items-center gap-1 text-xs font-medium transition-all ${
                  lesson && !isEmpty
                    ? 'bg-blue-50 border-blue-200 shadow-sm'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  {lesson ? (
                    <>
                      <span className="font-bold text-slate-800">{lesson.split('-')[0]?.trim()}</span>
                      {lesson.includes('-') && (
                        <span className="text-slate-600">{lesson.split('-')[1]?.trim()}</span>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Absences */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            היעדרויות שלי
          </h3>
          
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {myAbsences.length > 0 ? (
              myAbsences.map(absence => (
                <div key={absence.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-slate-800">
                      {absence.absence_reason}
                    </span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      absence.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      absence.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {absence.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">
                    {new Date(absence.start_date).toLocaleDateString('he-IL')} - {new Date(absence.end_date).toLocaleDateString('he-IL')}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-center text-slate-500 py-4 text-sm">אין היעדרויות</p>
            )}
          </div>
        </div>

        {/* My Requests Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            בקשות שלי
          </h3>
          
          <div className="space-y-3">
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100 flex items-center justify-between">
              <span className="text-sm text-purple-900">הדפסות</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-purple-600">{pendingPrints}</span>
                <span className="text-xs text-purple-500">בטיפול</span>
              </div>
            </div>

            <div className="p-3 bg-green-50 rounded-lg border border-green-100 flex items-center justify-between">
              <span className="text-sm text-green-900">בקשות רכש</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-green-600">{pendingPurchases}</span>
                <span className="text-xs text-green-500">בטיפול</span>
              </div>
            </div>

            <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 flex items-center justify-between">
              <span className="text-sm text-orange-900">דיווחי תחזוקה</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-orange-600">{openMaintenance}</span>
                <span className="text-xs text-orange-500">פתוחים</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
              <span className="text-sm text-blue-900">פגישות</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-blue-600">{upcomingMeetings}</span>
                <span className="text-xs text-blue-500">קרובות</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Journal */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-slate-600" />
          יומן בית הספר
        </h3>
        <DailyJournal date={today} />
      </div>
    </div>
  );
}