import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Calendar, Stethoscope, Clock, Map, Printer, 
  ShoppingCart, Wrench, Monitor, Shield, Timer, Sparkles, Users, Plus, Heart
} from 'lucide-react';
import ReportingModal from '../modals/ReportingModal';
import AbsenceReportModal from '../modals/AbsenceReportModal';
import PrintRequestModal from '../modals/PrintRequestModal';
import DailyJournal from '../journal/DailyJournal';
import AddMeeting from '../meetings/AddMeeting';
import MeetingsList from '../meetings/MeetingsList';
import StatCard from '../StatCard';
import SendMessageModal from '../messages/SendMessageModal';
import MessagesCenter from '../messages/MessagesCenter';

const TEACHER_BASE_SCHEDULE = {
  0: { 1: 'הסטוריה - ח׳2', 2: 'הסטוריה - ח׳2', 3: 'פרטני', 4: 'חלון', 5: 'אזרחות - ט׳1', 6: 'אזרחות - ט׳1' },
  1: { 1: 'חלון', 2: 'הסטוריה - ח׳3', 3: 'הסטוריה - ח׳3', 4: 'ישיבת צוות', 5: 'הסטוריה - ח׳2' },
  2: { 1: 'אזרחות - ט׳1', 2: 'אזרחות - ט׳1', 3: 'הסטוריה - ח׳2', 4: 'הסטוריה - ח׳2', 5: 'שהייה', 6: 'שהייה' },
  3: { 1: 'הסטוריה - ח׳3', 2: 'הסטוריה - ח׳3', 3: 'חלון', 4: 'פרטני', 5: 'חינוך - ח׳2' },
  4: { 1: 'חלון', 2: 'חלון', 3: 'הסטוריה - ח׳2', 4: 'הסטוריה - ח׳2', 5: 'אזרחות - ט׳1' },
  5: { 1: 'סיכום שבוע - ח׳2', 2: 'פרטני' },
};

export default function CounselorDashboard({ user, setView }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [absenceModalOpen, setAbsenceModalOpen] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const queryClient = useQueryClient();

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

  const { data: upcomingEvents = [] } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.SchoolEvent.list('-created_date', 5),
  });

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
      <div className="bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMDUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
              <Heart className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-1">שלום, {user.full_name}!</h2>
              <p className="text-cyan-100 text-sm opacity-90">יועצת - {user.title || ''}</p>
            </div>
          </div>
          <p className="text-white/90 text-base">יום של תמיכה והקשבה 💙</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="פגישות השבוע" 
          value={5} 
          icon={Users} 
          color="teal" 
          subtext="תלמידים והורים" 
        />
        <StatCard 
          title="אירועים קרובים" 
          value={upcomingEvents.length} 
          icon={Calendar} 
          color="blue" 
          subtext="פעילויות חברתיות" 
        />
        <StatCard 
          title="קבוצות טיפוליות" 
          value={3} 
          icon={Heart} 
          color="pink" 
          subtext="פעילות שוטפת" 
        />
      </div>

      {/* Daily Schedule */}
      <div className="bg-gradient-to-br from-white to-cyan-50/30 rounded-2xl shadow-lg border border-cyan-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Calendar className="h-5 w-5 text-cyan-600" />
              </div>
              מערכת השעות שלי
            </h3>
            <p className="text-sm text-slate-500 mt-1">{new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <button 
            onClick={() => setView('schedule')}
            className="text-xs font-bold text-cyan-600 hover:text-cyan-700 bg-cyan-50 hover:bg-cyan-100 px-4 py-2 rounded-lg transition-all border border-cyan-200 shadow-sm"
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
                    ? 'bg-gradient-to-br from-cyan-50 to-teal-50 border-cyan-200 shadow-md hover:shadow-lg hover:scale-105' 
                    : lesson 
                    ? 'bg-slate-50 border-slate-200 opacity-60'
                    : 'bg-white border-slate-200'
                }`}>
                  {lesson ? (
                    <>
                      <span className="font-bold text-slate-800 text-sm leading-tight">{lesson.split('-')[0]?.trim()}</span>
                      {lesson.includes('-') && (
                        <span className="text-xs text-cyan-600 bg-white px-2.5 py-0.5 rounded-full font-semibold border border-cyan-100">
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

      {/* Meetings Section */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Users className="h-5 w-5 text-teal-600" />
            </div>
            יומן פגישות
          </h3>
          <button
            onClick={() => setShowAddMeeting(true)}
            className="px-4 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            פגישה חדשה
          </button>
        </div>
        <MeetingsList user={user} />
      </div>

      {/* Quick Send Message to Staff */}
      <button
        onClick={() => setMessageModalOpen(true)}
        className="w-full p-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl hover:shadow-lg transition-all font-bold text-center flex items-center justify-center gap-2"
      >
        <Heart className="h-5 w-5" />
        שלח הערה מעצימה לצוות
      </button>

      <SendMessageModal 
        isOpen={messageModalOpen}
        onClose={() => setMessageModalOpen(false)}
        user={user}
        recipientRole="staff"
      />

      {/* Messages Center */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
        <MessagesCenter user={user} />
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

      {/* Social Team Management */}
      <div className="bg-gradient-to-br from-white to-pink-50/30 rounded-2xl shadow-lg border border-pink-100 p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-5 flex items-center gap-2">
          <div className="p-2 bg-pink-100 rounded-lg">
            <Heart className="h-5 w-5 text-pink-600" />
          </div>
          ניהול צוות חברתי
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-pink-200 rounded-xl p-6 hover:border-pink-300 transition-colors bg-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-pink-50 rounded-full text-pink-600 border border-pink-100">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">הודעה לצוות</h4>
                <p className="text-xs text-slate-500">שליחת הודעה קבוצתית</p>
              </div>
            </div>
            <button className="w-full py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors font-medium text-sm">
              שלח הודעה
            </button>
          </div>

          <div className="border border-pink-200 rounded-xl p-6 hover:border-pink-300 transition-colors bg-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-pink-50 rounded-full text-pink-600 border border-pink-100">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-800">תזמון אירוע</h4>
                <p className="text-xs text-slate-500">אירוע חברתי חדש</p>
              </div>
            </div>
            <button className="w-full py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors font-medium text-sm">
              אירוע חדש
            </button>
          </div>
        </div>
      </div>

      {/* Action Icons Grid */}
      <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="h-8 w-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">⚡</span>
          </div>
          פעולות מהירות
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
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

      {showAddMeeting && (
        <AddMeeting user={user} onClose={() => setShowAddMeeting(false)} />
      )}
    </div>
  );
}