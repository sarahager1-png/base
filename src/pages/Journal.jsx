import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { Calendar, Plus, Palmtree, ChevronRight, ChevronLeft, BookMarked, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import DailyJournal from '../components/journal/DailyJournal';
import AddJournalEntry from '../components/journal/AddJournalEntry';
import AddHoliday from '../components/journal/AddHoliday';
import { getHebrewDate } from '@/utils/hebrewDate';

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

export default function Journal() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const queryClient = useQueryClient();

  const { data: entries = [] } = useQuery({
    queryKey: ['journal', currentMonth, currentYear],
    queryFn: () => base44.entities.JournalEntry.list(),
  });

  const { data: holidays = [] } = useQuery({
    queryKey: ['holidays'],
    queryFn: () => base44.entities.Holiday.list(),
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

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">יומן בית הספר</h1>
            {(() => {
              const hd = getHebrewDate(new Date());
              return hd ? (
                <p className="text-sm text-slate-500 mt-1">{hd.full}</p>
              ) : null;
            })()}
          </div>
          {isAdmin && (
            <div className="flex flex-wrap gap-2">
              {showMOEConfirm ? (
                <div className="flex items-center gap-2 bg-purple-50 border border-purple-300 rounded-xl px-3 py-1.5">
                  <span className="text-xs text-purple-800 font-medium">לטעון חגים רשמיים?</span>
                  <button onClick={loadMOEHolidays}
                    className="px-2 py-1 bg-purple-600 text-white text-xs rounded-lg font-bold hover:bg-purple-700">
                    כן
                  </button>
                  <button onClick={() => setShowMOEConfirm(false)}
                    className="px-2 py-1 bg-white border border-slate-300 text-slate-600 text-xs rounded-lg hover:bg-slate-50">
                    ביטול
                  </button>
                </div>
              ) : (
                <Button
                  onClick={() => setShowMOEConfirm(true)}
                  disabled={loadingMOE}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-sm"
                >
                  <BookMarked className="h-4 w-4 mr-1" />
                  {loadingMOE ? 'טוען...' : 'חגי משרד החינוך תשפ"ו'}
                </Button>
              )}
              <Button
                onClick={() => setShowAddHoliday(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Palmtree className="h-4 w-4 mr-2" />
                הוסף חופשה
              </Button>
              <Button
                onClick={() => setShowAddEntry(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                רשומה חדשה
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={goToPrevMonth}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-bold text-slate-800">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(day => (
                <div key={day} className="text-center text-xs font-bold text-slate-500 p-2">
                  {day}
                </div>
              ))}
              
              {Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayEntries = getEntriesForDate(day);
                const holiday = getHolidayForDate(day);
                const isToday = day === new Date().getDate() &&
                               currentMonth === new Date().getMonth() &&
                               currentYear === new Date().getFullYear();
                const dateObj = new Date(currentYear, currentMonth, day);
                const isSelected = selectedDate?.getDate() === day &&
                                  selectedDate?.getMonth() === currentMonth &&
                                  selectedDate?.getFullYear() === currentYear;
                const hd = getHebrewDate(dateObj);

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateObj)}
                    className={`aspect-square p-1 rounded-xl border-2 transition-all text-sm relative group hover:border-blue-400 flex flex-col items-center justify-center ${
                      isSelected ? 'border-blue-600 bg-blue-50' :
                      holiday ? 'border-green-300 bg-green-50' :
                      isToday ? 'border-blue-300 bg-blue-50' :
                      'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`font-bold leading-tight ${isToday ? 'text-blue-700' : 'text-slate-700'}`}>
                      {day}
                    </div>
                    {hd && (
                      <div className="text-[9px] leading-tight text-slate-400">
                        {hd.day}
                      </div>
                    )}
                    {dayEntries.length > 0 && (
                      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {dayEntries.slice(0, 3).map((_, idx) => (
                          <div key={idx} className="w-1 h-1 rounded-full bg-blue-500" />
                        ))}
                      </div>
                    )}
                    {holiday && (
                      <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-green-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily View */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                {selectedDate?.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              {(() => {
                const hd = selectedDate ? getHebrewDate(selectedDate) : null;
                return hd ? (
                  <p className="text-sm text-blue-600 font-medium mt-0.5 mr-7">{hd.full}</p>
                ) : null;
              })()}
            </div>
            <DailyJournal date={selectedDate} />
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