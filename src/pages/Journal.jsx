import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import { useAuth } from '@/lib/AuthContext';
import { Calendar, Plus, Palmtree, ChevronRight, ChevronLeft, BookMarked, CheckCircle, AlertCircle, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import DailyJournal from '../components/journal/DailyJournal';
import AddJournalEntry from '../components/journal/AddJournalEntry';
import AddHoliday from '../components/journal/AddHoliday';
import { getHebrewDate } from '@/utils/hebrewDate';
import { getAllSchedules } from '@/lib/scheduleStorage';
import { format } from 'date-fns';

const MOE_HOLIDAYS_5786 = [
  { name: 'ראש השנה תשפ"ו', start_date: '2025-09-22', end_date: '2025-09-24', type: 'holiday' },
  { name: 'יום כיפור', start_date: '2025-10-01', end_date: '2025-10-02', type: 'holiday' },
  { name: 'סוכות ושמחת תורה', start_date: '2025-10-06', end_date: '2025-10-14', type: 'holiday' },
  { name: 'חנוכה', start_date: '2025-12-24', end_date: '2026-01-02', type: 'vacation' },
  { name: 'טו בשבט', start_date: '2026-02-12', end_date: '2026-02-12', type: 'holiday' },
  { name: 'פורים', start_date: '2026-03-12', end_date: '2026-03-13', type: 'vacation' },
  { name: 'פסח', start_date: '2026-04-01', end_date: '2026-04-09', type: 'holiday' },
  { name: 'חול המועד פסח', start_date: '2026-04-02', end_date: '2026-04-08', type: 'vacation' },
  { name: 'יום הזיכרון', start_date: '2026-04-21', end_date: '2026-04-21', type: 'holiday' },
  { name: 'יום העצמאות', start_date: '2026-04-22', end_date: '2026-04-22', type: 'holiday' },
  { name: 'ל"ג בעומר', start_date: '2026-05-06', end_date: '2026-05-06', type: 'holiday' },
  { name: 'שבועות', start_date: '2026-05-20', end_date: '2026-05-21', type: 'holiday' },
  { name: 'חופשת קיץ', start_date: '2026-06-22', end_date: '2026-08-31', type: 'vacation' },
];

// ─── Daily Schedule (שיבוץ) Tab ───────────────────────────────────────────────
function DailyScheduleTab({ selectedDate, absences }) {
  const dow = selectedDate.getDay();
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  const allSchedules = getAllSchedules();

  // Build hour → lessons map for the selected day
  const hourMap = {};
  for (let h = 1; h <= 7; h++) hourMap[h] = [];
  Object.entries(allSchedules).forEach(([email, lessons]) => {
    lessons.forEach(l => {
      if (l.day === dow && l.hour >= 1 && l.hour <= 7) {
        hourMap[l.hour].push({ email, ...l });
      }
    });
  });

  // Absent teachers for this specific date
  const absentEmails = new Set(
    absences
      .filter(a => a.start_date <= dateStr && (!a.end_date || a.end_date >= dateStr))
      .map(a => a.user_email)
      .filter(Boolean)
  );

  const hasAnySchedule = Object.values(hourMap).some(arr => arr.length > 0);

  if (!hasAnySchedule) {
    return (
      <div className="text-center py-14 text-slate-400">
        <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-25" />
        <p className="font-medium text-slate-500">אין מערכת שעות לתצוגה</p>
        <p className="text-xs mt-1">יש לייבא מערכת שעות בעמוד <span className="font-bold">לוח זמנים ← יבוא</span></p>
      </div>
    );
  }

  const needsCoverage = Object.values(hourMap).some(lessons =>
    lessons.some(l => absentEmails.has(l.email))
  );

  return (
    <div className="space-y-3" dir="rtl">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-base font-bold text-slate-800">יום {dayNames[dow]}, {selectedDate.toLocaleDateString('he-IL')}</span>
        {absentEmails.size > 0 && (
          <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">
            ⚠ {absentEmails.size} נעדרים
          </span>
        )}
        {needsCoverage && (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold">
            נדרש שיבוץ
          </span>
        )}
      </div>

      {[1,2,3,4,5,6,7].map(h => {
        const lessons = hourMap[h];
        const hasAbsent = lessons.some(l => absentEmails.has(l.email));
        return (
          <div key={h} className={`rounded-xl border transition-colors ${
            hasAbsent ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'
          }`}>
            <div className={`flex items-center gap-3 px-4 py-2.5 border-b ${
              hasAbsent ? 'border-red-200 bg-red-100/50' : 'border-slate-100 bg-slate-50/70'
            } rounded-t-xl`}>
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                hasAbsent ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-600'
              }`}>{h}</span>
              <span className="text-xs font-bold text-slate-600">שעה {h}</span>
              {hasAbsent && (
                <span className="mr-auto text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                  ⚠ נדרש כיסוי
                </span>
              )}
            </div>
            <div className="p-3">
              {lessons.length === 0 ? (
                <p className="text-xs text-slate-300 text-center py-1">אין שיעורים</p>
              ) : (
                <div className="space-y-1.5">
                  {lessons.map((l, i) => {
                    const isAbsent = absentEmails.has(l.email);
                    return (
                      <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium ${
                        isAbsent
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : 'bg-slate-50 text-slate-700 border border-slate-100'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{l.subject || '—'}</span>
                          {l.className && <span className="text-slate-400">{l.className}</span>}
                          {l.room && <span className="text-slate-400">· חדר {l.room}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={isAbsent ? 'text-red-600' : 'text-slate-400'}>
                            {l.email?.split('@')[0]}
                          </span>
                          {isAbsent && (
                            <span className="px-1.5 py-0.5 bg-red-200 text-red-800 rounded-md font-bold text-[10px]">
                              נעדר/ת
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Journal() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [rightTab, setRightTab] = useState('journal'); // 'journal' | 'schedule'

  const queryClient = useQueryClient();

  const { data: entries = [] } = useQuery({
    queryKey: ['journal', currentMonth, currentYear],
    queryFn: () => base44.entities.JournalEntry.list(),
  });

  const { data: holidays = [] } = useQuery({
    queryKey: ['holidays'],
    queryFn: () => base44.entities.Holiday.list(),
  });

  const { data: absences = [] } = useQuery({
    queryKey: ['absences-journal'],
    queryFn: () => base44.entities.Absence.list(),
  });

  const [loadingMOE, setLoadingMOE] = useState(false);
  const [showMOEConfirm, setShowMOEConfirm] = useState(false);

  const loadMOEHolidays = async () => {
    setShowMOEConfirm(false);
    setLoadingMOE(true);
    let added = 0;
    try {
      for (const h of MOE_HOLIDAYS_5786) {
        const exists = holidays.some(
          ex => ex.name === h.name && ex.start_date === h.start_date
        );
        if (!exists) {
          await base44.entities.Holiday.create(h);
          added++;
        }
      }
      await queryClient.invalidateQueries({ queryKey: ['holidays'] });
      if (added > 0) {
        toast.success(`נטענו ${added} חגים וחופשות של משרד החינוך תשפ"ו`);
      } else {
        toast.info('כל החגים כבר קיימים במערכת');
      }
    } catch (e) {
      toast.error('שגיאה בטעינת החגים: ' + (e?.message || String(e)));
    } finally {
      setLoadingMOE(false);
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const getEntriesForDate = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return entries.filter(e => e.date === dateStr);
  };

  const getHolidayForDate = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidays.find(h => dateStr >= h.start_date && dateStr <= h.end_date);
  };

  const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin' || user.role === 'vice_principal';

  const DAY_HEADERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
  const DAY_FULL = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-100"><Calendar className="h-5 w-5 text-blue-600" /></div>
            יומן בית הספר
          </h1>
          {(() => {
            const hd = getHebrewDate(new Date());
            return hd ? <p className="text-sm text-slate-400 mt-1 mr-11">{hd.full}</p> : null;
          })()}
        </div>
        {isAdmin && (
          <div className="flex flex-wrap gap-2">
            {showMOEConfirm ? (
              <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2">
                <span className="text-xs text-yellow-800 font-semibold">לטעון חגי משרד החינוך?</span>
                <button onClick={loadMOEHolidays} className="px-3 py-1 bg-yellow-500 text-white text-xs rounded-lg font-bold hover:bg-yellow-600">כן</button>
                <button onClick={() => setShowMOEConfirm(false)} className="px-3 py-1 bg-white border border-slate-200 text-slate-500 text-xs rounded-lg hover:bg-slate-50">ביטול</button>
              </div>
            ) : (
              <button onClick={() => setShowMOEConfirm(true)} disabled={loadingMOE}
                className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
                <BookMarked className="h-3.5 w-3.5" />
                {loadingMOE ? 'טוען...' : 'חגי תשפ"ו'}
              </button>
            )}
            <button onClick={() => setShowAddHoliday(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-colors">
              <Palmtree className="h-3.5 w-3.5" />הוסף חופשה
            </button>
            <button onClick={() => setShowAddEntry(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors">
              <Plus className="h-3.5 w-3.5" />רשומה חדשה
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Month nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <button onClick={goToPrevMonth} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
            <div className="text-center">
              <h2 className="text-base font-bold text-slate-800">{monthNames[currentMonth]} {currentYear}</h2>
            </div>
            <button onClick={goToNextMonth} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DAY_HEADERS.map((day, i) => (
                <div key={day} className={`text-center py-2 text-xs font-bold tracking-wider ${
                  i === 6 ? 'text-blue-400' : i === 5 ? 'text-red-400' : 'text-slate-400'
                }`}>
                  {day}
                </div>
              ))}
            </div>

            {/* Date grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEntries = getEntriesForDate(day);
                const holiday = getHolidayForDate(day);
                const dateObj = new Date(currentYear, currentMonth, day);
                const dow = dateObj.getDay();
                const isToday = day === new Date().getDate() &&
                               currentMonth === new Date().getMonth() &&
                               currentYear === new Date().getFullYear();
                const isSelected = selectedDate?.getDate() === day &&
                                  selectedDate?.getMonth() === currentMonth &&
                                  selectedDate?.getFullYear() === currentYear;
                const hd = getHebrewDate(dateObj);
                const isSat = dow === 6;
                const isFri = dow === 5;

                return (
                  <button key={day} onClick={() => setSelectedDate(dateObj)}
                    className={`relative flex flex-col items-center justify-center rounded-xl py-2 transition-all group
                      ${isSelected
                        ? 'bg-blue-600 shadow-md shadow-blue-200'
                        : isToday
                          ? 'bg-blue-50 ring-2 ring-blue-300'
                          : holiday
                            ? 'bg-emerald-50'
                            : 'hover:bg-slate-50'
                      }`}
                  >
                    <span className={`text-sm font-bold leading-none ${
                      isSelected ? 'text-white' :
                      isToday ? 'text-blue-700' :
                      isSat ? 'text-blue-500' :
                      isFri ? 'text-red-400' :
                      'text-slate-700'
                    }`}>
                      {day}
                    </span>
                    {hd && (
                      <span className={`text-[9px] mt-0.5 leading-none font-medium ${
                        isSelected ? 'text-blue-200' : 'text-slate-300'
                      }`}>
                        {hd.day}
                      </span>
                    )}
                    {dayEntries.length > 0 && (
                      <div className="flex gap-0.5 mt-1">
                        {dayEntries.slice(0, 3).map((_, idx) => (
                          <div key={idx} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-400'}`} />
                        ))}
                      </div>
                    )}
                    {holiday && !isSelected && (
                      <div className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <div className="w-2 h-2 rounded-full bg-blue-600" />היום
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />חג / חופשה
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />אירוע
              </div>
            </div>
          </div>
        </div>

        {/* Daily View */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          {/* Date header */}
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/60">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-blue-100 flex-shrink-0">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {selectedDate?.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                {(() => {
                  const hd = selectedDate ? getHebrewDate(selectedDate) : null;
                  return hd ? <p className="text-xs text-blue-500 font-semibold mt-0.5">{hd.full}</p> : null;
                })()}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setRightTab('journal')}
              className={`flex-1 py-2.5 text-xs font-bold transition-colors ${
                rightTab === 'journal'
                  ? 'text-blue-600 border-b-2 border-blue-500 bg-blue-50/40'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              יומן
            </button>
            <button
              onClick={() => setRightTab('schedule')}
              className={`flex-1 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1 ${
                rightTab === 'schedule'
                  ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50/40'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              שיבוץ יומי
            </button>
          </div>

          <div className="p-5 overflow-y-auto">
            {rightTab === 'journal'
              ? <DailyJournal date={selectedDate} />
              : <DailyScheduleTab selectedDate={selectedDate} absences={absences} />
            }
          </div>
        </div>
      </div>

      {showAddEntry && (
        <AddJournalEntry 
          defaultDate={selectedDate?.toISOString().split('T')[0]}
          onClose={() => setShowAddEntry(false)} 
        />
      )}

      {showAddHoliday && (
        <AddHoliday onClose={() => setShowAddHoliday(false)} />
      )}
    </div>
  );
}