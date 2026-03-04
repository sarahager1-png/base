import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Plus, Palmtree, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DailyJournal from '../components/journal/DailyJournal';
import AddJournalEntry from '../components/journal/AddJournalEntry';
import AddHoliday from '../components/journal/AddHoliday';
import { getHebrewDate } from '@/utils/hebrewDate';
import PageHeader from '../components/PageHeader';

export default function Journal() {
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  React.useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
  };

  const { data: entries = [] } = useQuery({
    queryKey: ['journal', currentMonth, currentYear],
    queryFn: () => base44.entities.JournalEntry.list(),
  });

  const { data: holidays = [] } = useQuery({
    queryKey: ['holidays'],
    queryFn: () => base44.entities.Holiday.list(),
  });

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

  const hebrewMonthLabel = (() => {
    const firstHd = getHebrewDate(new Date(currentYear, currentMonth, 1));
    const lastHd  = getHebrewDate(new Date(currentYear, currentMonth + 1, 0));
    if (!firstHd) return '';
    if (firstHd.month === lastHd?.month) return `${firstHd.month} ${firstHd.year}`;
    return `${firstHd.month} - ${lastHd?.month} ${lastHd?.year}`;
  })();

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <PageHeader
          icon={Calendar}
          iconColor="#3b82f6"
          iconColor2="#2563eb"
          title="יומן בית הספר"
          subtitle={`${monthNames[currentMonth]} ${currentYear}  |  ${hebrewMonthLabel}`}
          actions={isAdmin && (
            <>
              <Button
                onClick={() => setShowAddHoliday(true)}
                className="bg-green-600 hover:bg-green-700 text-white text-sm"
              >
                <Palmtree className="h-4 w-4 ml-1" />
                הוסף חופשה
              </Button>
              <Button
                onClick={() => setShowAddEntry(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm"
              >
                <Plus className="h-4 w-4 ml-1" />
                רשומה חדשה
              </Button>
            </>
          )}
        />

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
              <div className="text-center">
                <h2 className="text-lg font-bold text-slate-800 leading-tight">
                  {monthNames[currentMonth]} {currentYear}
                </h2>
                <p className="text-xs text-blue-600 font-medium mt-0.5">{hebrewMonthLabel}</p>
              </div>
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
                    className={`aspect-square p-1 rounded-xl border-2 transition-all relative group hover:border-blue-400 flex flex-col items-center justify-center gap-0 ${
                      isSelected ? 'border-blue-600 bg-blue-50 shadow-md' :
                      holiday ? 'border-green-300 bg-green-50' :
                      isToday ? 'border-blue-300 bg-blue-50' :
                      'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {/* מספר לועזי */}
                    <div className={`font-bold text-sm leading-none ${
                      isSelected ? 'text-blue-700' :
                      isToday ? 'text-blue-700' :
                      'text-slate-800'
                    }`}>
                      {day}
                    </div>
                    {/* תאריך עברי */}
                    {hd && (
                      <div className={`text-[9px] leading-none mt-0.5 ${
                        isSelected ? 'text-blue-500' :
                        isToday ? 'text-blue-400' :
                        'text-slate-400'
                      }`}>
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