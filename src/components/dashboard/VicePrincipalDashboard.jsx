import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import StatCard from '../StatCard';
import ReportingModal from '../modals/ReportingModal';
import AbsenceReportModal from '../modals/AbsenceReportModal';
import PrintRequestModal from '../modals/PrintRequestModal';
import AbsenceApprovalPanel from './AbsenceApprovalPanel';
import AddMeeting from '../meetings/AddMeeting';
import MeetingsList from '../meetings/MeetingsList';
import DailyJournal from '../journal/DailyJournal';
import DailyMessageBoard from './DailyMessageBoard';
import { 
  AlertTriangle, UserCheck, Clock, ShoppingCart, Shield,
  CheckCircle, XCircle, Calendar, Printer, Map, Users, Plus, Wrench, Monitor, Timer, Sparkles
} from 'lucide-react';

const TEACHER_BASE_SCHEDULE = {
  0: { 1: 'הסטוריה - ח׳2', 2: 'הסטוריה - ח׳2', 3: 'פרטני', 4: 'חלון', 5: 'אזרחות - ט׳1', 6: 'אזרחות - ט׳1' },
  1: { 1: 'חלון', 2: 'הסטוריה - ח׳3', 3: 'הסטוריה - ח׳3', 4: 'ישיבת צוות', 5: 'הסטוריה - ח׳2' },
  2: { 1: 'אזרחות - ט׳1', 2: 'אזרחות - ט׳1', 3: 'הסטוריה - ח׳2', 4: 'הסטוריה - ח׳2', 5: 'שהייה', 6: 'שהייה' },
  3: { 1: 'הסטוריה - ח׳3', 2: 'הסטוריה - ח׳3', 3: 'חלון', 4: 'פרטני', 5: 'חינוך - ח׳2' },
  4: { 1: 'חלון', 2: 'חלון', 3: 'הסטוריה - ח׳2', 4: 'הסטוריה - ח׳2', 5: 'אזרחות - ט׳1' },
  5: { 1: 'סיכום שבוע - ח׳2', 2: 'פרטני' },
};

export default function VicePrincipalDashboard({ user, setView }) {
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  const [absenceModalOpen, setAbsenceModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
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
      const today = new Date().getDate();
      const duties = await base44.entities.DutyAssignment.filter({ 
        staff_email: user.email, 
        day: today 
      });
      return duties[0];
    },
  });

  const updateAbsence = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Absence.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absences'] });
    },
  });

  const openFeature = (feature) => {
    setActiveFeature(feature);
    setModalOpen(true);
  };

  const dayIdx = new Date().getDay();

  return (
    <div className="space-y-8 animate-fade-in">
      <ReportingModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        feature={activeFeature}
        user={user}
      />
      <AbsenceReportModal 
        isOpen={absenceModalOpen}
        onClose={() => setAbsenceModalOpen(false)}
        user={user}
      />
      <PrintRequestModal 
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        user={user}
      />

      <DailyMessageBoard user={user} />

      {/* Quick Actions - Top Priority */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <button onClick={() => setAbsenceModalOpen(true)} className="relative overflow-hidden flex flex-col items-center p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl shadow-sm border-2 border-red-200 hover:border-red-400 hover:shadow-md transition-all group text-center h-28 justify-center">
          <div className="absolute top-1 right-1 bg-red-500 text-[9px] text-white font-bold px-2 py-0.5 rounded-full shadow">חשוב</div>
          <div className="p-2.5 bg-red-100 rounded-full text-red-600 group-hover:scale-110 transition-transform mb-2">
            <Clock className="h-6 w-6" />
          </div>
          <span className="text-xs font-bold text-slate-700 leading-tight">העדרות</span>
        </button>
      
        <button onClick={() => openFeature('substitute')} className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl shadow-sm border-2 border-purple-200 hover:border-purple-400 hover:shadow-md transition-all group text-center h-28 justify-center">
          <div className="p-2.5 bg-purple-100 rounded-full text-purple-600 group-hover:scale-110 transition-transform mb-2">
            <Users className="h-6 w-6" />
          </div>
          <span className="text-xs font-bold text-slate-700 leading-tight">מילוי מקום</span>
        </button>

        <button onClick={() => openFeature('overtime')} className="flex flex-col items-center p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl shadow-sm border-2 border-yellow-200 hover:border-yellow-400 hover:shadow-md transition-all group text-center h-28 justify-center">
          <div className="p-2.5 bg-yellow-100 rounded-full text-yellow-700 group-hover:scale-110 transition-transform mb-2">
            <Timer className="h-6 w-6" />
          </div>
          <span className="text-xs font-bold text-slate-700 leading-tight">שעות נוספות</span>
        </button>

        <button onClick={() => openFeature('external')} className="flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border-2 border-green-200 hover:border-green-400 hover:shadow-md transition-all group text-center h-28 justify-center">
          <div className="p-2.5 bg-green-100 rounded-full text-green-600 group-hover:scale-110 transition-transform mb-2">
            <Map className="h-6 w-6" />
          </div>
          <span className="text-xs font-bold text-slate-700 leading-tight">פעילות חוץ</span>
        </button>

        <button onClick={() => openFeature('purchase')} className="flex flex-col items-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl shadow-sm border-2 border-amber-200 hover:border-amber-400 hover:shadow-md transition-all group text-center h-28 justify-center">
          <div className="p-2.5 bg-amber-100 rounded-full text-amber-600 group-hover:scale-110 transition-transform mb-2">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <span className="text-xs font-bold text-slate-700 leading-tight">רכש</span>
        </button>

        <button onClick={() => openFeature('maintenance_general')} className="flex flex-col items-center p-4 bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl shadow-sm border-2 border-slate-200 hover:border-slate-400 hover:shadow-md transition-all group text-center h-28 justify-center">
          <div className="p-2.5 bg-slate-100 rounded-full text-slate-600 group-hover:scale-110 transition-transform mb-2">
            <Wrench className="h-6 w-6" />
          </div>
          <span className="text-xs font-bold text-slate-700 leading-tight">תחזוקה כללית</span>
        </button>

        <button onClick={() => openFeature('maintenance_pc')} className="flex flex-col items-center p-4 bg-gradient-to-br from-cyan-50 to-teal-50 rounded-xl shadow-sm border-2 border-cyan-200 hover:border-cyan-400 hover:shadow-md transition-all group text-center h-28 justify-center">
          <div className="p-2.5 bg-cyan-100 rounded-full text-cyan-600 group-hover:scale-110 transition-transform mb-2">
            <Monitor className="h-6 w-6" />
          </div>
          <span className="text-xs font-bold text-slate-700 leading-tight">תחזוקת מחשבים</span>
        </button>

        <button onClick={() => openFeature('special_overtime')} className="flex flex-col items-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-md transition-all group text-center h-28 justify-center">
          <div className="p-2.5 bg-indigo-100 rounded-full text-indigo-600 group-hover:scale-110 transition-transform mb-2">
            <Sparkles className="h-6 w-6" />
          </div>
          <span className="text-xs font-bold text-slate-700 leading-tight">שעות מיוחדות</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 rounded-3xl p-8 text-white shadow-lg border border-slate-600/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 text-white">שלום, {user.full_name}</h2>
            <p className="text-slate-300 text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" />
              סגנית מנהלת
            </p>
          </div>
          <div className="h-16 w-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
            <Shield className="h-8 w-8 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="היעדרויות לאישור" 
          value={absences.length} 
          icon={Clock} 
          color="amber" 
          subtext="ממתינות להחלטה" 
        />
        <StatCard 
          title="טפסי קליטה" 
          value={onboardingDocs.length} 
          icon={UserCheck} 
          color="purple" 
          subtext="עובדים חדשים" 
        />
        <StatCard 
          title="בקשות רכש" 
          value={purchaseRequests.length} 
          icon={ShoppingCart} 
          color="blue" 
          subtext="לאישור תקציבי" 
        />
        <StatCard 
          title="מילוי מקום" 
          value={substituteReports.length} 
          icon={AlertTriangle} 
          color="red" 
          subtext="דוחות לאישור" 
        />
      </div>

      {/* Daily Schedule */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow" style={{ order: 10 }}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            מערכת שעות - {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: '2-digit', month: '2-digit' })}
          </h3>
          <button 
            onClick={() => setView('schedule')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors border border-blue-100"
          >
            לצפייה ביומן חודשי מלא
          </button>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5, 6, 7].map(hour => {
            const lesson = TEACHER_BASE_SCHEDULE[dayIdx]?.[hour];
            
            return (
              <div key={hour} className="min-w-[120px] flex-1">
                <div className="text-center text-xs font-bold text-slate-400 mb-1">שעה {hour}</div>
                <div className={`p-4 rounded-xl border text-center h-full flex flex-col justify-center items-center gap-1 shadow-sm transition-all hover:shadow-md ${lesson ? 'bg-white border-slate-200' : 'bg-slate-50 border-transparent'}`}>
                  {lesson ? (
                    <>
                      <span className="font-bold text-slate-800 text-sm">{lesson.split('-')[0]?.trim()}</span>
                      {lesson.includes('-') && (
                        <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          {lesson.split('-')[1]?.trim()}
                        </span>
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

      {/* My Duty Alert */}
      {myDuty && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full text-amber-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900">תורנות היום שלי</h4>
              <p className="text-sm text-amber-800">{myDuty.duty_type} בשעה {myDuty.time}</p>
            </div>
          </div>
        </div>
      )}

      {/* Today's Journal */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
            <Calendar className="h-4 w-4 text-blue-600" />
          </div>
          יומן היום
        </h3>
        <DailyJournal date={new Date()} />
      </div>



      {/* Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
            היעדרויות לאישור
          </h3>
          <AbsenceApprovalPanel />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
              יומן פגישות
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
      </div>

      {showAddMeeting && (
        <AddMeeting user={user} onClose={() => setShowAddMeeting(false)} />
      )}
    </div>
  );
}