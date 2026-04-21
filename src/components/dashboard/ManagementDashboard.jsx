import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import StatCard from '../StatCard';
import AddMeeting from '../meetings/AddMeeting';
import MeetingsList from '../meetings/MeetingsList';
import DailyMessageBoard from './DailyMessageBoard';
import DailySummary from './DailySummary';
import { isEnabled } from '@/lib/featureFlags';
import {
  AlertTriangle, UserCheck, Users, ShoppingCart,
  Shield, UserPlus, Clock, Plus, ChevronLeft
} from 'lucide-react';

export default function ManagementDashboard({ user }) {
  const [showAddMeeting, setShowAddMeeting] = useState(false);

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

  const urgentSubRequests = substituteReports.filter(s => !s.original_teacher);
  const totalPending = onboardingDocs.length + absences.length;

  return (
    <div className="space-y-6 animate-fade-in">
      <DailyMessageBoard user={user} />
      {isEnabled('dailySummary') && <DailySummary user={user} />}

      {/* Stats row — staggered slide-up */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-slide-up-1">
          <StatCard
            title="מילוי מקום נדרש"
            value={urgentSubRequests.length}
            icon={AlertTriangle}
            color="red"
            subtext={urgentSubRequests.length > 0 ? "דחוף: טרם שובץ" : "הכל מכוסה"}
          />
        </div>
        <div className="animate-slide-up-2">
          <StatCard
            title="טפסים לאישור"
            value={onboardingDocs.length}
            icon={UserCheck}
            color="purple"
            subtext="עובדים חדשים ממתינים"
          />
        </div>
        <div className="animate-slide-up-3">
          <StatCard
            title="היעדרויות ממתינות"
            value={absences.length}
            icon={Clock}
            color="amber"
            subtext="לאישור מנהלת"
          />
        </div>
        <div className="animate-slide-up-4">
          <StatCard
            title="בקשות רכש"
            value={purchaseRequests.length}
            icon={ShoppingCart}
            color="blue"
            subtext="ממתינות לאישור תקציבי"
          />
        </div>
      </div>

      {/* Control Center */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {user.role === 'admin' ? 'מרכז בקרה וחריגים' : 'שולחן עבודה — סגנית'}
              </h3>
              <p className="text-[11px] text-slate-400">{totalPending} אירועים בטיפול</p>
            </div>
          </div>
          {totalPending > 0 && (
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
              {totalPending} ממתינים
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-100">
          {/* Onboarding docs */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                <UserPlus className="h-3.5 w-3.5 text-violet-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">טפסי קליטה לאישור</h4>
              {onboardingDocs.length > 0 && (
                <span className="mr-auto text-[10px] font-bold bg-violet-600 text-white px-1.5 py-0.5 rounded-full">
                  {onboardingDocs.length}
                </span>
              )}
            </div>
            <div className="space-y-2">
              {onboardingDocs.length > 0 ? (
                onboardingDocs.slice(0, 3).map(doc => (
                  <div key={doc.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <div>
                      <p className="text-[13px] font-semibold text-slate-700">{doc.user_name}</p>
                      <p className="text-[11px] text-slate-400">{doc.document_type}</p>
                    </div>
                    <button className="text-[11px] font-semibold bg-violet-600 text-white px-3 py-1.5 rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-1">
                      צפה <ChevronLeft className="h-3 w-3" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <p className="text-sm font-medium">אין טפסים ממתינים</p>
                </div>
              )}
            </div>
          </div>

          {/* Meetings */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Users className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">יומן פגישות</h4>
              <button
                onClick={() => setShowAddMeeting(true)}
                className="mr-auto text-[11px] font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> פגישה חדשה
              </button>
            </div>
            <MeetingsList user={user} />
          </div>
        </div>
      </div>

      {showAddMeeting && (
        <AddMeeting user={user} onClose={() => setShowAddMeeting(false)} />
      )}
    </div>
  );
}
