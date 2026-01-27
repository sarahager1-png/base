import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  Calendar, Stethoscope, Clock, Map, Printer, 
  ShoppingCart, Wrench, Monitor, Shield, Hammer
} from 'lucide-react';
import ReportingModal from '../modals/ReportingModal';

const TEACHER_BASE_SCHEDULE = {
  0: { 1: 'הסטוריה - ח׳2', 2: 'הסטוריה - ח׳2', 3: 'פרטני', 4: 'חלון', 5: 'אזרחות - ט׳1', 6: 'אזרחות - ט׳1' },
  1: { 1: 'חלון', 2: 'הסטוריה - ח׳3', 3: 'הסטוריה - ח׳3', 4: 'ישיבת צוות', 5: 'הסטוריה - ח׳2' },
  2: { 1: 'אזרחות - ט׳1', 2: 'אזרחות - ט׳1', 3: 'הסטוריה - ח׳2', 4: 'הסטוריה - ח׳2', 5: 'שהייה', 6: 'שהייה' },
  3: { 1: 'הסטוריה - ח׳3', 2: 'הסטוריה - ח׳3', 3: 'חלון', 4: 'פרטני', 5: 'חינוך - ח׳2' },
  4: { 1: 'חלון', 2: 'חלון', 3: 'הסטוריה - ח׳2', 4: 'הסטוריה - ח׳2', 5: 'אזרחות - ט׳1' },
  5: { 1: 'סיכום שבוע - ח׳2', 2: 'פרטני' },
};

export default function StaffDashboard({ user, setView }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);

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

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-x-10 -translate-y-10"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">בוקר טוב, {user.full_name}!</h2>
          <p className="text-blue-100 text-lg opacity-90">"לכתחילה אריבער" - יום מוצלח ומלא עשייה.</p>
        </div>
      </div>

      {/* Daily Schedule */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
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

      {/* Action Icons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <button onClick={() => openFeature('absence')} className="relative overflow-hidden flex flex-col items-center p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-red-300 hover:bg-red-50 transition-all group text-center h-24 justify-center">
          <div className="absolute top-0 right-0 bg-red-100 text-[10px] text-red-700 font-bold px-2 py-0.5 rounded-bl-lg">לדיווח</div>
          <div className="p-3 bg-red-50 rounded-full text-red-500 group-hover:scale-110 transition-transform mb-2">
            <Stethoscope className="h-6 w-6" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 leading-tight">דיווח היעדרות</span>
        </button>
        
        <button onClick={() => openFeature('substitute')} className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-purple-300 hover:bg-purple-50 transition-all group text-center h-24 justify-center">
          <div className="p-3 bg-purple-50 rounded-full text-purple-500 group-hover:scale-110 transition-transform mb-2">
            <Clock className="h-6 w-6" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 leading-tight">מילוי מקום</span>
        </button>

        <button onClick={() => openFeature('external')} className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-green-300 hover:bg-green-50 transition-all group text-center h-24 justify-center">
          <div className="p-3 bg-green-50 rounded-full text-green-500 group-hover:scale-110 transition-transform mb-2">
            <Map className="h-6 w-6" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 leading-tight">פעילות חוץ</span>
        </button>

        <button onClick={() => openFeature('copies')} className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all group text-center h-24 justify-center">
          <div className="p-3 bg-blue-50 rounded-full text-blue-500 group-hover:scale-110 transition-transform mb-2">
            <Printer className="h-6 w-6" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 leading-tight">צילום</span>
        </button>

        <button onClick={() => openFeature('purchase')} className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-amber-300 hover:bg-amber-50 transition-all group text-center h-24 justify-center">
          <ShoppingCart className="h-6 w-6 text-amber-500 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-bold text-slate-700 leading-tight">רכש</span>
        </button>

        <button onClick={() => openFeature('maintenance_general')} className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-slate-400 hover:bg-slate-50 transition-all group text-center h-24 justify-center">
          <Wrench className="h-6 w-6 text-slate-500 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-bold text-slate-700 leading-tight">תחזוקה כללית</span>
        </button>

        <button onClick={() => openFeature('maintenance_pc')} className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-cyan-300 hover:bg-cyan-50 transition-all group text-center h-24 justify-center">
          <Monitor className="h-6 w-6 text-cyan-500 mb-1 group-hover:scale-110 transition-transform" />
          <span className="text-[11px] font-bold text-slate-700 leading-tight">תחזוקת מחשבים</span>
        </button>
      </div>
    </div>
  );
}