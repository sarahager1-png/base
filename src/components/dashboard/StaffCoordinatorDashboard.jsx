import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Calendar, Stethoscope, Clock, Map, Printer, 
  ShoppingCart, Wrench, Monitor, Shield, Timer, Sparkles,
  Users, MessageCircle, ArrowRight, FileSignature, Upload, CheckSquare, Heart
} from 'lucide-react';
import ReportingModal from '../modals/ReportingModal';
import AbsenceReportModal from '../modals/AbsenceReportModal';
import PrintRequestModal from '../modals/PrintRequestModal';
import DailyJournal from '../journal/DailyJournal';
import StatCard from '../StatCard';

const TEACHER_BASE_SCHEDULE = {
  0: { 1: 'הסטוריה - ח׳2', 2: 'הסטוריה - ח׳2', 3: 'פרטני', 4: 'חלון', 5: 'אזרחות - ט׳1', 6: 'אזרחות - ט׳1' },
  1: { 1: 'חלון', 2: 'הסטוריה - ח׳3', 3: 'הסטוריה - ח׳3', 4: 'ישיבת צוות', 5: 'הסטוריה - ח׳2' },
  2: { 1: 'אזרחות - ט׳1', 2: 'אזרחות - ט׳1', 3: 'הסטוריה - ח׳2', 4: 'הסטוריה - ח׳2', 5: 'שהייה', 6: 'שהייה' },
  3: { 1: 'הסטוריה - ח׳3', 2: 'הסטוריה - ח׳3', 3: 'חלון', 4: 'פרטני', 5: 'חינוך - ח׳2' },
  4: { 1: 'חלון', 2: 'חלון', 3: 'הסטוריה - ח׳2', 4: 'הסטוריה - ח׳2', 5: 'אזרחות - ט׳1' },
  5: { 1: 'סיכום שבוע - ח׳2', 2: 'פרטני' },
};

export default function StaffCoordinatorDashboard({ user, setView }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  const [absenceModalOpen, setAbsenceModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [showAddMeeting, setShowAddMeeting] = useState(false);

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

  const { data: events = [] } = useQuery({
    queryKey: ['schoolEvents'],
    queryFn: () => base44.entities.SchoolEvent.list('-start_date', 5),
  });

  const upcomingEvent = events.find(e => e.start_date >= new Date().getDate());

  const openFeature = (feature) => {
    setActiveFeature(feature);
    setModalOpen(true);
  };

  const dayIdx = new Date().getDay();

  return (
    <div className="space-y-6 animate-fade-in relative">
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

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-1">שלום, {user.full_name}!</h2>
              <p className="text-purple-100 text-sm opacity-90">עובדת הוראה + רכזת - {user.title || ''}</p>
            </div>
          </div>
          <p className="text-white/90 text-base">"לכתחילה אריבער" - יום של הוראה וניהול צוות 🌟</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="הצוות שלי" 
          value="12" 
          icon={Users} 
          color="purple" 
          subtext="עובדות הוראה תחת הנחייתך" 
        />
        <StatCard 
          title="אירוע קרוב" 
          value={upcomingEvent ? `${upcomingEvent.start_date - new Date().getDate()} ימים` : 'אין'} 
          icon={Calendar} 
          color="blue" 
          subtext={upcomingEvent?.title || 'אין אירועים קרובים'} 
        />
        <StatCard 
          title="קבצים לחתימה" 
          value="0" 
          icon={FileSignature} 
          color="amber" 
          subtext="הכל מאושר" 
        />
      </div>

      {/* Daily Schedule */}
      <div className="bg-gradient-to-br from-white to-purple-50/30 rounded-2xl shadow-lg border border-purple-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              מערכת השעות שלי
            </h3>
            <p className="text-sm text-slate-500 mt-1">{new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <button 
            onClick={() => setView('schedule')}
            className="text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-lg transition-all border border-purple-200 shadow-sm"
          >
            📅 יומן חודשי מלא
          </button>
        </div>
        
        <div className="flex gap-3 overflow-x-auto pb-3 px-1">
          {[1, 2, 3, 4, 5, 6, 7].map(hour => {
            const lesson = TEACHER_BASE_SCHEDULE[dayIdx]?.[hour];
            const isEmpty = !lesson || ['חלון', 'פרטני'].includes(lesson);
            
            return (
              <div key={hour} className="min-w-[130px] flex-1">
                <div className="text-center text-xs font-bold text-slate-500 mb-2 bg-slate-100 py-1 rounded-t-lg">שעה {hour}</div>
                <div className={`p-4 rounded-b-xl border-2 text-center h-24 flex flex-col justify-center items-center gap-1.5 transition-all ${
                  lesson && !isEmpty
                    ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-md hover:shadow-lg hover:scale-105' 
                    : lesson 
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : 'bg-white border-slate-200'
                }`}>
                  {lesson ? (
                    <>
                      <span className="font-bold text-slate-800 text-sm leading-tight">{lesson.split('-')[0]?.trim()}</span>
                      {lesson.includes('-') && (
                        <span className="text-xs text-purple-600 bg-white px-2.5 py-0.5 rounded-full font-semibold border border-purple-100">
                          {lesson.split('-')[1]?.trim()}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-slate-300 text-sm">ריק</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Duty Alert */}
      {myDuty && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full text-amber-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900">תורנות היום</h4>
              <p className="text-sm text-amber-800">{myDuty.duty_type} בשעה {myDuty.time}</p>
            </div>
          </div>
        </div>
      )}

      {/* Coordination Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            ניהול הצוות
          </h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-4 bg-purple-50 rounded-xl hover:bg-purple-100 border-2 border-purple-200 hover:border-purple-300 transition-all group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-full text-purple-600 shadow-sm">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">הודעה לצוות</p>
                  <p className="text-xs text-slate-500">שליחת עדכון לצוות</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-purple-400 group-hover:text-purple-600" />
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-purple-50 rounded-xl hover:bg-purple-100 border-2 border-purple-200 hover:border-purple-300 transition-all group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-full text-purple-600 shadow-sm">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800">תזמון אירוע</p>
                  <p className="text-xs text-slate-500">אירוע חדש בשכבה</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-purple-400 group-hover:text-purple-600" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-amber-100 p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <FileSignature className="h-5 w-5 text-amber-600" />
            </div>
            העלאת קבצים לחתימה
          </h3>
          <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer group">
            <Upload className="h-8 w-8 text-slate-300 mx-auto mb-2 group-hover:text-amber-500" />
            <p className="text-sm font-medium text-slate-600">גררי קבצים לכאן</p>
            <p className="text-xs text-slate-400 mt-1">תוכניות עבודה, דוחות</p>
          </div>
          <div className="mt-3">
            <p className="text-xs font-bold text-slate-500 mb-2">קבצים אחרונים:</p>
            <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-100">
              <span className="text-xs text-green-800 flex items-center gap-2">
                <CheckSquare className="h-3 w-3" /> תוכנית שנתית.pdf
              </span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded text-green-700">
                נחתם
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Journal */}
      <div className="bg-gradient-to-br from-white to-amber-50/30 rounded-2xl shadow-lg border border-amber-100 p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Calendar className="h-5 w-5 text-amber-600" />
          </div>
          יומן בית הספר - היום
        </h3>
        <DailyJournal date={new Date()} />
      </div>

      {/* Action Icons Grid */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="h-8 w-8 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">⚡</span>
          </div>
          פעולות מהירות
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
          <button onClick={() => setAbsenceModalOpen(true)} className="relative overflow-hidden flex flex-col items-center p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl shadow-sm border-2 border-red-200 hover:border-red-400 hover:shadow-md transition-all group text-center h-28 justify-center">
            <div className="absolute top-1 right-1 bg-red-500 text-[9px] text-white font-bold px-2 py-0.5 rounded-full shadow">חשוב</div>
            <div className="p-2.5 bg-red-100 rounded-full text-red-600 group-hover:scale-110 transition-transform mb-2">
              <Stethoscope className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-slate-700 leading-tight">דיווח היעדרות</span>
          </button>
        
          <button onClick={() => openFeature('substitute')} className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl shadow-sm border-2 border-purple-200 hover:border-purple-400 hover:shadow-md transition-all group text-center h-28 justify-center">
            <div className="p-2.5 bg-purple-100 rounded-full text-purple-600 group-hover:scale-110 transition-transform mb-2">
              <Clock className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-slate-700 leading-tight">מילוי מקום</span>
          </button>

          <button onClick={() => openFeature('external')} className="flex flex-col items-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-sm border-2 border-green-200 hover:border-green-400 hover:shadow-md transition-all group text-center h-28 justify-center">
            <div className="p-2.5 bg-green-100 rounded-full text-green-600 group-hover:scale-110 transition-transform mb-2">
              <Map className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-slate-700 leading-tight">פעילות חוץ</span>
          </button>

          <button onClick={() => setPrintModalOpen(true)} className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl shadow-sm border-2 border-blue-200 hover:border-blue-400 hover:shadow-md transition-all group text-center h-28 justify-center">
            <div className="p-2.5 bg-blue-100 rounded-full text-blue-600 group-hover:scale-110 transition-transform mb-2">
              <Printer className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-slate-700 leading-tight">צילום</span>
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

          <button onClick={() => openFeature('overtime')} className="flex flex-col items-center p-4 bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl shadow-sm border-2 border-yellow-200 hover:border-yellow-400 hover:shadow-md transition-all group text-center h-28 justify-center">
            <div className="p-2.5 bg-yellow-100 rounded-full text-yellow-700 group-hover:scale-110 transition-transform mb-2">
              <Timer className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-slate-700 leading-tight">שעות נוספות</span>
          </button>

          <button onClick={() => openFeature('special_overtime')} className="flex flex-col items-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl shadow-sm border-2 border-indigo-200 hover:border-indigo-400 hover:shadow-md transition-all group text-center h-28 justify-center">
            <div className="p-2.5 bg-indigo-100 rounded-full text-indigo-600 group-hover:scale-110 transition-transform mb-2">
              <Sparkles className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-slate-700 leading-tight">שעות מיוחדות</span>
          </button>
        </div>
      </div>

      {/* Meetings Schedule */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
              <Users className="h-4 w-4 text-blue-600" />
            </div>
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