import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CalendarDays, Plus, MapPin, Calendar, Clock } from 'lucide-react';

const WEEK_DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

export default function Schedule() {
  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [newEventData, setNewEventData] = useState({ 
    title: '', 
    start_date: new Date().getDate(), 
    end_date: new Date().getDate(),
    event_type: 'social', 
    participants: [] 
  });

  const queryClient = useQueryClient();

  const TEACHER_SCHEDULE = {
    0: { 1: 'הסטוריה - ח׳2', 2: 'הסטוריה - ח׳2', 3: 'פרטני', 4: 'חלון', 5: 'אזרחות - ט׳1', 6: 'אזרחות - ט׳1' },
    1: { 1: 'חלון', 2: 'הסטוריה - ח׳3', 3: 'הסטוריה - ח׳3', 4: 'ישיבת צוות', 5: 'הסטוריה - ח׳2' },
    2: { 1: 'אזרחות - ט׳1', 2: 'אזרחות - ט׳1', 3: 'הסטוריה - ח׳2', 4: 'הסטוריה - ח׳2', 5: 'שהייה', 6: 'שהייה' },
    3: { 1: 'הסטוריה - ח׳3', 2: 'הסטוריה - ח׳3', 3: 'חלון', 4: 'פרטני', 5: 'חינוך - ח׳2' },
    4: { 1: 'חלון', 2: 'חלון', 3: 'הסטוריה - ח׳2', 4: 'הסטוריה - ח׳2', 5: 'אזרחות - ט׳1' },
    5: { 1: 'סיכום שבוע - ח׳2', 2: 'פרטני' },
  };

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const currentUser = await base44.auth.me();
    setUser(currentUser);
  };

  const { data: events = [] } = useQuery({
    queryKey: ['schoolEvents'],
    queryFn: () => base44.entities.SchoolEvent.list('-created_date'),
  });

  const createEvent = useMutation({
    mutationFn: (data) => base44.entities.SchoolEvent.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schoolEvents'] });
      setIsEventModalOpen(false);
      setNewEventData({ title: '', start_date: new Date().getDate(), end_date: new Date().getDate(), event_type: 'social', participants: [] });
    },
  });

  const canSchedule = user && ['admin', 'vice_principal', 'coordinator'].includes(user.role);

  const getEventsForDay = (day) => {
    return events.filter(e => day >= e.start_date && day <= e.end_date);
  };

  const handleAddEvent = () => {
    createEvent.mutate(newEventData);
  };

  if (!user) return <div className="p-10 text-center">טוען...</div>;

  const colorMap = {
    social: 'bg-purple-100 text-purple-700',
    pedagogic: 'bg-blue-100 text-blue-700',
    staff: 'bg-amber-100 text-amber-700',
    holiday: 'bg-red-100 text-red-800',
    meeting: 'bg-green-100 text-green-700'
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Event Modal */}
        {isEventModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 w-96 shadow-2xl">
              <h3 className="text-lg font-bold text-slate-800 mb-4">הוספת אירוע ללוח</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-500">שם האירוע</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border rounded-lg"
                    value={newEventData.title}
                    onChange={(e) => setNewEventData({...newEventData, title: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500">תאריך התחלה</label>
                    <input 
                      type="number" min="1" max="31"
                      className="w-full p-2 border rounded-lg"
                      value={newEventData.start_date}
                      onChange={(e) => setNewEventData({...newEventData, start_date: parseInt(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500">תאריך סיום</label>
                    <input 
                      type="number" min="1" max="31"
                      className="w-full p-2 border rounded-lg"
                      value={newEventData.end_date}
                      onChange={(e) => setNewEventData({...newEventData, end_date: parseInt(e.target.value)})}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">סוג אירוע</label>
                  <select 
                    className="w-full p-2 border rounded-lg"
                    value={newEventData.event_type}
                    onChange={(e) => setNewEventData({...newEventData, event_type: e.target.value})}
                  >
                    <option value="social">חברתי</option>
                    <option value="pedagogic">פדגוגי</option>
                    <option value="staff">צוות</option>
                    <option value="holiday">חג/חופשה</option>
                  </select>
                </div>

                <div className="flex gap-2 mt-4">
                  <button onClick={handleAddEvent} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold">שמור</button>
                  <button onClick={() => setIsEventModalOpen(false)} className="flex-1 bg-slate-100 text-slate-600 py-2 rounded-lg font-bold">ביטול</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-amber-500" />
              מערכת שעות ויומן
            </h2>
            <p className="text-slate-500">מערכת שעות שבועית ואירועים מיוחדים</p>
          </div>
          {canSchedule && (
            <button 
              onClick={() => setIsEventModalOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" /> אירוע חדש
            </button>
          )}
        </div>

        {/* Weekly Schedule */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            מערכת שעות שבועית
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-600">שעה</th>
                  {['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'].map(day => (
                    <th key={day} className="border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-600">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7].map(hour => (
                  <tr key={hour}>
                    <td className="border border-slate-200 bg-blue-50 p-3 text-center font-bold text-blue-900">{hour}</td>
                    {[0, 1, 2, 3, 4, 5].map(dayIdx => {
                      const lesson = TEACHER_SCHEDULE[dayIdx]?.[hour];
                      const isWindow = lesson === 'חלון';
                      const isPersonal = lesson === 'פרטני';
                      const isStay = lesson === 'שהייה';
                      const isMeeting = lesson === 'ישיבת צוות';
                      
                      return (
                        <td 
                          key={dayIdx} 
                          className={`border border-slate-200 p-3 text-center ${
                            !lesson ? 'bg-slate-50' :
                            isWindow ? 'bg-slate-100 text-slate-400' :
                            isPersonal ? 'bg-amber-50 text-amber-700' :
                            isStay ? 'bg-purple-50 text-purple-700' :
                            isMeeting ? 'bg-green-50 text-green-700' :
                            'bg-white'
                          }`}
                        >
                          {lesson ? (
                            <div className="text-sm">
                              {lesson.includes(' - ') ? (
                                <>
                                  <div className="font-bold">{lesson.split(' - ')[0]}</div>
                                  <div className="text-xs opacity-70">{lesson.split(' - ')[1]}</div>
                                </>
                              ) : (
                                <span className="text-xs font-medium">{lesson}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar Grid */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-800">
                {new Date().toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-2 text-xs">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> חג</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> פדגוגי</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> חברתי</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> אישי</span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {WEEK_DAYS.map(d => (
                <div key={d} className="bg-slate-50 text-center py-2 text-xs font-bold text-slate-500">
                  {d}
                </div>
              ))}
              
              {Array.from({length: firstDayOfMonth}).map((_, i) => (
                <div key={`empty-${i}`} className="bg-white min-h-[100px]" />
              ))}

              {Array.from({length: daysInMonth}).map((_, i) => {
                const day = i + 1;
                const dayEvents = getEventsForDay(day);
                const isSelected = selectedDate === day;
                
                return (
                  <div 
                    key={day} 
                    onClick={() => setSelectedDate(day)}
                    className={`bg-white min-h-[100px] p-2 cursor-pointer transition-colors relative hover:bg-blue-50/50 ${isSelected ? 'ring-2 ring-inset ring-blue-500' : ''}`}
                  >
                    <span className={`text-sm font-bold ${isSelected ? 'text-blue-600' : 'text-slate-700'}`}>{day}</span>
                    <div className="mt-1 space-y-1">
                      {dayEvents.slice(0, 3).map((ev, idx) => (
                        <div key={idx} className={`text-[10px] px-1 py-0.5 rounded truncate ${colorMap[ev.event_type]}`}>
                          {ev.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-[10px] text-slate-400 text-center">+ עוד {dayEvents.length - 3}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Daily Agenda */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-0 flex flex-col overflow-hidden">
            <div className="bg-blue-600 p-6 text-white">
              <h3 className="text-3xl font-bold mb-1">{selectedDate}</h3>
              <p className="opacity-90 text-lg">{new Date().toLocaleDateString('he-IL', { month: 'long' })}</p>
              <div className="mt-4 flex items-center gap-2 text-blue-100 text-sm">
                <MapPin className="h-4 w-4" />
                <span>בית הספר "בינה מנהיגותית"</span>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  אירועים מיוחדים
                </h4>
                <div className="space-y-2">
                  {getEventsForDay(selectedDate).length > 0 ? (
                    getEventsForDay(selectedDate).map((ev, idx) => (
                      <div key={idx} className={`p-3 rounded-xl border-l-4 text-sm ${colorMap[ev.event_type]} border-current`}>
                        <p className="font-bold text-slate-800">{ev.title}</p>
                        {ev.time && <p className="text-xs opacity-70 mt-1">{ev.time}</p>}
                        {ev.participants?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {ev.participants.map((p, i) => (
                              <span key={i} className="text-[10px] bg-white bg-opacity-50 px-1.5 py-0.5 rounded border border-slate-200">
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-sm italic">אין אירועים מיוחדים היום</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}