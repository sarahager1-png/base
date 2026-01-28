import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Plus, Palmtree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DailyJournal from '../components/journal/DailyJournal';
import AddJournalEntry from '../components/journal/AddJournalEntry';
import AddHoliday from '../components/journal/AddHoliday';

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

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-blue-900">יומן בית הספר</h1>
          {isAdmin && (
            <div className="flex gap-2">
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
                ←
              </button>
              <h2 className="text-xl font-bold text-slate-800">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <button 
                onClick={goToNextMonth}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              >
                →
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

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateObj)}
                    className={`aspect-square p-2 rounded-xl border-2 transition-all text-sm relative group hover:border-blue-400 ${
                      isSelected ? 'border-blue-600 bg-blue-50' : 
                      holiday ? 'border-green-300 bg-green-50' :
                      isToday ? 'border-blue-300 bg-blue-50' :
                      'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`font-bold ${isToday ? 'text-blue-700' : 'text-slate-700'}`}>
                      {day}
                    </div>
                    {dayEntries.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {dayEntries.slice(0, 3).map((_, idx) => (
                          <div key={idx} className="w-1 h-1 rounded-full bg-blue-500" />
                        ))}
                      </div>
                    )}
                    {holiday && (
                      <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Daily View */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              {selectedDate?.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })}
            </h3>
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