import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  X, Stethoscope, Clock, Map, Timer, Printer, 
  ShoppingCart, Hammer, Monitor, Upload, AlertTriangle,
  ShieldAlert, Sparkles
} from 'lucide-react';

export default function ReportingModal({ isOpen, onClose, feature, user }) {
  const [activeTab, setActiveTab] = useState('report');
  const queryClient = useQueryClient();

  // Form states
  const [formData, setFormData] = useState({});
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedLessons, setSelectedLessons] = useState([]);
  const [substituteName, setSubstituteName] = useState('');
  const [showWarning, setShowWarning] = useState(false);
  const [weekDates, setWeekDates] = useState([]);
  
  // Reset on close
  React.useEffect(() => {
    if (!isOpen) {
      setSelectedDate('');
      setSelectedLessons([]);
      setSubstituteName('');
      setFormData({});
      setShowWarning(false);
    }
  }, [isOpen]);

  // Fetch teachers list
  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
    enabled: isOpen && feature === 'substitute',
  });

  const teachers = allUsers.filter(u => 
    ['teacher', 'coordinator', 'counselor', 'vice_principal'].includes(u.role)
  );

  const TEACHER_SCHEDULE = {
    0: { 1: 'הסטוריה - ח׳2', 2: 'הסטוריה - ח׳2', 3: 'פרטני', 4: 'חלון', 5: 'אזרחות - ט׳1', 6: 'אזרחות - ט׳1' },
    1: { 1: 'חלון', 2: 'הסטוריה - ח׳3', 3: 'הסטוריה - ח׳3', 4: 'ישיבת צוות', 5: 'הסטוריה - ח׳2' },
    2: { 1: 'אזרחות - ט׳1', 2: 'אזרחות - ט׳1', 3: 'הסטוריה - ח׳2', 4: 'הסטוריה - ח׳2', 5: 'שהייה', 6: 'שהייה' },
    3: { 1: 'הסטוריה - ח׳3', 2: 'הסטוריה - ח׳3', 3: 'חלון', 4: 'פרטני', 5: 'חינוך - ח׳2' },
    4: { 1: 'חלון', 2: 'חלון', 3: 'הסטוריה - ח׳2', 4: 'הסטוריה - ח׳2', 5: 'אזרחות - ט׳1' },
    5: { 1: 'סיכום שבוע - ח׳2', 2: 'פרטני' },
  };

  const daySchedule = selectedDate ? TEACHER_SCHEDULE[new Date(selectedDate).getDay()] || {} : {};
  const frontalLessons = Object.entries(daySchedule).filter(([_, lesson]) => !['חלון', 'פרטני', 'ישיבת צוות', 'שהייה'].includes(lesson));
  const scheduledLessonsCount = frontalLessons.length;
  const totalHoursWithSubstitute = scheduledLessonsCount + selectedLessons.length;
  
  // Check if exceeds 9 hours
  React.useEffect(() => {
    if (totalHoursWithSubstitute > 9) {
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [totalHoursWithSubstitute]);

  // Queries for history
  const { data: substituteHistory = [] } = useQuery({
    queryKey: ['substitutes', user.email],
    queryFn: () => base44.entities.SubstituteReport.filter({ reporter_email: user.email }, '-created_date', 10),
    enabled: isOpen && feature === 'substitute' && activeTab === 'history',
  });

  const { data: overtimeHistory = [] } = useQuery({
    queryKey: ['overtime', user.email],
    queryFn: () => base44.entities.OvertimeReport.filter({ user_email: user.email }, '-created_date', 10),
    enabled: isOpen && feature === 'overtime' && activeTab === 'history',
  });

  const { data: externalHistory = [] } = useQuery({
    queryKey: ['external', user.email],
    queryFn: () => base44.entities.ExternalActivity.filter({ user_email: user.email }, '-created_date', 10),
    enabled: isOpen && feature === 'external' && activeTab === 'history',
  });

  const { data: printHistory = [] } = useQuery({
    queryKey: ['prints', user.email],
    queryFn: () => base44.entities.PrintRequest.filter({ user_email: user.email }, '-created_date', 10),
    enabled: isOpen && feature === 'copies' && activeTab === 'history',
  });

  const { data: specialOvertimeHistory = [] } = useQuery({
    queryKey: ['special_overtime', user.email],
    queryFn: () => base44.entities.SpecialOvertimeReport.filter({ user_email: user.email }, '-created_date', 10),
    enabled: isOpen && feature === 'special_overtime' && activeTab === 'history',
  });



  const createSubstitute = useMutation({
    mutationFn: (data) => base44.entities.SubstituteReport.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['substitutes'] });
      onClose();
    },
  });

  const createOvertime = useMutation({
    mutationFn: (data) => base44.entities.OvertimeReport.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtime'] });
      onClose();
    },
  });

  const createExternal = useMutation({
    mutationFn: (data) => base44.entities.ExternalActivity.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['external'] });
      onClose();
    },
  });

  const createPurchase = useMutation({
    mutationFn: (data) => base44.entities.PurchaseRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      onClose();
    },
  });

  const createMaintenance = useMutation({
    mutationFn: (data) => base44.entities.MaintenanceTicket.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
      onClose();
    },
  });

  const createSpecialOvertime = useMutation({
    mutationFn: (data) => base44.entities.SpecialOvertimeReport.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['special_overtime'] });
      onClose();
    },
  });

  const handleSubmit = () => {
    if (feature === 'substitute') {
      createSubstitute.mutate({
        reporter_email: user.email,
        reporter_name: user.full_name,
        date: selectedDate,
        hours_count: selectedLessons.length,
        class_name: selectedLessons.map(l => l.class).join(', '),
        subject: selectedLessons.map(l => l.subject).join(', '),
        original_teacher: substituteName,
      });
    } else if (feature === 'overtime') {
      createOvertime.mutate({
        user_email: user.email,
        user_name: user.full_name,
        date: formData.date,
        hours: formData.hours,
        reason: formData.reason,
      });
    } else if (feature === 'external') {
      createExternal.mutate({
        user_email: user.email,
        user_name: user.full_name,
        date: formData.start_date,
        destination: formData.destination,
        start_time: formData.start_time,
        end_time: formData.end_time,
      });
    } else if (feature === 'purchase') {
      createPurchase.mutate({
        user_email: user.email,
        user_name: user.full_name,
        item_name: formData.item_name,
        reason: formData.reason,
        urgency: formData.urgency || 'normal',
      });
    } else if (feature === 'maintenance_general' || feature === 'maintenance_pc') {
      createMaintenance.mutate({
        reporter_email: user.email,
        reporter_name: user.full_name,
        ticket_type: feature === 'maintenance_pc' ? 'computer' : 'general',
        location: formData.location,
        issue: formData.issue,
        urgency: formData.urgency || 'normal',
      });
    } else if (feature === 'special_overtime') {
      const total_hours = weekDates.reduce((sum, d) => sum + (d.hours || 0), 0);
      createSpecialOvertime.mutate({
        user_email: user.email,
        user_name: user.full_name,
        activity_type: formData.activity_type,
        dates: weekDates,
        total_hours,
        details: formData.details || '',
      });
    }
  };

  if (!isOpen) return null;

  const featureConfig = {
    substitute: { icon: Clock, title: 'דיווח מילוי מקום', color: 'purple' },
    external: { icon: Map, title: 'פעילות חוץ', color: 'green' },
    overtime: { icon: Timer, title: 'שעות נוספות', color: 'amber' },
    special_overtime: { icon: Sparkles, title: 'שעות נוספות מיוחדות', color: 'indigo' },
    copies: { icon: Printer, title: 'מכסת צילומים', color: 'blue' },
    purchase: { icon: ShoppingCart, title: 'בקשת רכש', color: 'amber' },
    maintenance_general: { icon: Hammer, title: 'תחזוקה כללית', color: 'slate' },
    maintenance_pc: { icon: Monitor, title: 'תחזוקת מחשבים', color: 'blue' },
  };

  const config = featureConfig[feature] || {};
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            {Icon && <Icon className={`text-${config.color}-500`} />}
            {config.title}
          </h3>
          <button onClick={onClose}>
            <X className="text-slate-400 hover:text-slate-600" />
          </button>
        </div>

        {/* Tabs */}
        {!['purchase', 'maintenance_general', 'maintenance_pc'].includes(feature) && (
          <div className="flex border-b border-slate-100">
            <button 
              onClick={() => setActiveTab('report')}
              className={`flex-1 py-3 text-sm font-bold ${activeTab === 'report' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              דיווח חדש
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 text-sm font-bold ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              {feature === 'overtime' ? 'יתרת שעות: 40' : 'היסטוריה ונתונים'}
            </button>
          </div>
        )}

        <div className="p-6 overflow-y-auto flex-1">
          {/* SUBSTITUTE */}
          {feature === 'substitute' && activeTab === 'report' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">תאריך</label>
                <input 
                  type="date" 
                  value={selectedDate}
                  className="w-full p-2 border rounded-lg"
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setSelectedLessons([]);
                  }}
                />
              </div>

              {selectedDate && (
                <>
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <p className="text-sm text-slate-700">
                      <span className="font-bold">שעות המערכת שלך היום:</span> {scheduledLessonsCount} שעות
                    </p>
                    <p className="text-sm text-slate-700 mt-1">
                      <span className="font-bold">שעות מילוי מקום שבחרת:</span> {selectedLessons.length} שעות
                    </p>
                    <p className={`text-sm font-bold mt-1 ${totalHoursWithSubstitute > 9 ? 'text-red-600' : 'text-green-600'}`}>
                      סה״כ: {totalHoursWithSubstitute} שעות {totalHoursWithSubstitute > 9 && '⚠️ חריגה מ-9 שעות!'}
                    </p>
                  </div>

                  {showWarning && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-red-900">אזהרה: חריגה מ-9 שעות יומיות!</p>
                          <p className="text-xs text-red-700 mt-1">
                            יש לדווח על היעדרות משעות שהיו חלון/פרטני במערכת שלך, או לבחור פחות שעות מילוי מקום.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {frontalLessons.length > 0 && (
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-2 block">בחרי שעות פרונטליות שמילאת</label>
                      <div className="space-y-2">
                        {frontalLessons.map(([hourNum, lesson]) => {
                          const [subject, className] = lesson.split(' - ');
                          const isSelected = selectedLessons.some(l => l.hour === hourNum);
                          return (
                            <button
                              key={hourNum}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedLessons(selectedLessons.filter(l => l.hour !== hourNum));
                                } else {
                                  setSelectedLessons([...selectedLessons, { hour: hourNum, subject, class: className }]);
                                }
                              }}
                              className={`w-full p-3 rounded-lg border-2 text-right transition-all ${
                                isSelected 
                                  ? 'border-purple-500 bg-purple-50' 
                                  : 'border-slate-200 bg-white hover:border-purple-300'
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-sm">שעה {hourNum}: {lesson}</span>
                                {isSelected && <span className="text-purple-600 font-bold">✓</span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {selectedLessons.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-2 block">במקום מי מילאת?</label>
                  <select
                    value={substituteName}
                    onChange={(e) => setSubstituteName(e.target.value)}
                    className="w-full p-3 border rounded-lg"
                  >
                    <option value="">בחרי מורה מהרשימה</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.full_name}>
                        {teacher.full_name} {teacher.title && `(${teacher.title})`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button 
                onClick={handleSubmit}
                disabled={!selectedDate || selectedLessons.length === 0 || !substituteName || showWarning}
                className={`w-full text-white py-3 rounded-xl font-bold ${
                  !selectedDate || selectedLessons.length === 0 || !substituteName || showWarning
                    ? 'bg-slate-300' 
                    : 'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {showWarning ? 'לא ניתן לדווח - יותר מ-9 שעות' : 'שלח דיווח'}
              </button>
            </div>
          )}

          {feature === 'substitute' && activeTab === 'history' && (
            <div className="space-y-2">
              {substituteHistory.map(sub => (
                <div key={sub.id} className="p-3 border rounded-lg">
                  <p className="font-bold text-sm">{sub.date} - {sub.hours_count} שעות</p>
                  <p className="text-xs text-slate-500">{sub.status}</p>
                </div>
              ))}
            </div>
          )}

          {/* PURCHASE */}
          {feature === 'purchase' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">שם המוצר</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-lg"
                  onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">סיבת הבקשה</label>
                <textarea 
                  className="w-full p-2 border rounded-lg" 
                  rows="3"
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                ></textarea>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">דחיפות</label>
                <select 
                  className="w-full p-2 border rounded-lg"
                  onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                >
                  <option value="normal">רגיל</option>
                  <option value="urgent">דחוף</option>
                </select>
              </div>
              <button 
                onClick={handleSubmit}
                className="w-full bg-amber-500 text-white py-3 rounded-xl font-bold hover:bg-amber-600"
              >
                שלח למנהלת
              </button>
            </div>
          )}

          {/* EXTERNAL ACTIVITY */}
          {feature === 'external' && activeTab === 'report' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">תאריך התחלה</label>
                <input 
                  type="date" 
                  className="w-full p-2 border rounded-lg"
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">תאריך סיום</label>
                <input 
                  type="date" 
                  className="w-full p-2 border rounded-lg"
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500">שעת התחלה</label>
                  <input 
                    type="time" 
                    className="w-full p-2 border rounded-lg"
                    onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500">שעת סיום</label>
                  <input 
                    type="time" 
                    className="w-full p-2 border rounded-lg"
                    onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">פרוט הפעילות</label>
                <textarea 
                  className="w-full p-2 border rounded-lg" 
                  rows="3"
                  placeholder="לדוגמה: סיור לימודי למוזיאון המדע"
                  onChange={(e) => setFormData({...formData, destination: e.target.value})}
                ></textarea>
              </div>
              <button 
                onClick={handleSubmit}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700"
              >
                שלח לאישור
              </button>
            </div>
          )}

          {feature === 'external' && activeTab === 'history' && (
            <div className="space-y-2">
              {externalHistory.map(ext => (
                <div key={ext.id} className="p-3 border rounded-lg">
                  <p className="font-bold text-sm">{ext.date}</p>
                  <p className="text-xs text-slate-500">{ext.destination}</p>
                  <p className="text-xs text-slate-400">{ext.start_time} - {ext.end_time}</p>
                </div>
              ))}
            </div>
          )}

          {/* OVERTIME */}
          {feature === 'overtime' && activeTab === 'report' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">תאריך</label>
                <input 
                  type="date" 
                  className="w-full p-2 border rounded-lg"
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">מספר שעות</label>
                <input 
                  type="number"
                  min="0"
                  step="0.5"
                  className="w-full p-2 border rounded-lg"
                  onChange={(e) => setFormData({...formData, hours: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">פירוט - על מה?</label>
                <textarea 
                  className="w-full p-2 border rounded-lg" 
                  rows="3"
                  placeholder="לדוגמה: הכנת מערכי שיעור, תיקון מבחנים"
                  onChange={(e) => setFormData({...formData, reason: e.target.value})}
                ></textarea>
              </div>
              <button 
                onClick={handleSubmit}
                className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700"
              >
                שלח דיווח
              </button>
            </div>
          )}

          {feature === 'overtime' && activeTab === 'history' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                <p className="text-sm font-bold text-amber-900">יתרת שעות נוספות: 40 שעות</p>
                <p className="text-xs text-amber-700 mt-1">מתוך מכסה שנתית</p>
              </div>
              <div className="space-y-2">
                {overtimeHistory.map(ot => (
                  <div key={ot.id} className="p-3 border rounded-lg">
                    <p className="font-bold text-sm">{ot.date} - {ot.hours} שעות</p>
                    <p className="text-xs text-slate-500">{ot.reason}</p>
                    <p className="text-xs text-slate-400">{ot.status}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SPECIAL OVERTIME */}
          {feature === 'special_overtime' && activeTab === 'report' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">סוג פעילות</label>
                <select 
                  className="w-full p-2 border rounded-lg"
                  onChange={(e) => setFormData({...formData, activity_type: e.target.value})}
                >
                  <option value="">בחרי סוג</option>
                  <option value="tzomchim">צומחים מחדש</option>
                  <option value="duty">תורנות</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 mb-2 block">שיבוץ שבועי</label>
                <div className="space-y-2">
                  {['א', 'ב', 'ג', 'ד', 'ה', 'ו'].map((day, idx) => {
                    const dayDate = weekDates[idx] || { date: '', hours: 0 };
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-8 font-bold text-slate-600">יום {day}</span>
                        <input 
                          type="date"
                          value={dayDate.date || ''}
                          onChange={(e) => {
                            const newDates = [...weekDates];
                            newDates[idx] = { ...dayDate, date: e.target.value };
                            setWeekDates(newDates);
                          }}
                          className="flex-1 p-2 border rounded-lg text-sm"
                        />
                        <input 
                          type="number"
                          min="0"
                          step="0.5"
                          value={dayDate.hours || 0}
                          onChange={(e) => {
                            const newDates = [...weekDates];
                            newDates[idx] = { ...dayDate, hours: parseFloat(e.target.value) || 0 };
                            setWeekDates(newDates);
                          }}
                          placeholder="שעות"
                          className="w-20 p-2 border rounded-lg text-sm"
                        />
                      </div>
                    );
                  })}
                </div>
                <p className="text-sm font-bold text-indigo-600 mt-2">
                  סה״כ: {weekDates.reduce((sum, d) => sum + (d.hours || 0), 0)} שעות
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500">פרטים נוספים</label>
                <textarea 
                  className="w-full p-2 border rounded-lg" 
                  rows="2"
                  onChange={(e) => setFormData({...formData, details: e.target.value})}
                ></textarea>
              </div>

              <button 
                onClick={handleSubmit}
                disabled={!formData.activity_type || weekDates.length === 0}
                className={`w-full text-white py-3 rounded-xl font-bold ${
                  !formData.activity_type || weekDates.length === 0
                    ? 'bg-slate-300'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                שלח דיווח
              </button>
            </div>
          )}

          {feature === 'special_overtime' && activeTab === 'history' && (
            <div className="space-y-2">
              {specialOvertimeHistory.map(sot => (
                <div key={sot.id} className="p-3 border rounded-lg">
                  <p className="font-bold text-sm">
                    {sot.activity_type === 'tzomchim' ? 'צומחים מחדש' : 'תורנות'} - {sot.total_hours} שעות
                  </p>
                  <p className="text-xs text-slate-500">{sot.status}</p>
                </div>
              ))}
            </div>
          )}

          {/* MAINTENANCE */}
          {(feature === 'maintenance_general' || feature === 'maintenance_pc') && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500">מיקום</label>
                <input 
                  type="text" 
                  className="w-full p-2 border rounded-lg"
                  placeholder={feature === 'maintenance_pc' ? 'מספר מחשב / חדר' : 'כיתה / מיקום'}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">תיאור הבעיה</label>
                <textarea 
                  className="w-full p-2 border rounded-lg" 
                  rows="3"
                  onChange={(e) => setFormData({...formData, issue: e.target.value})}
                ></textarea>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">דחיפות</label>
                <select 
                  className="w-full p-2 border rounded-lg"
                  onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                >
                  <option value="normal">רגיל</option>
                  <option value="urgent">דחוף</option>
                  {feature === 'maintenance_general' && <option value="safety">בטיחותי!</option>}
                </select>
              </div>
              <button 
                onClick={handleSubmit}
                className={`w-full text-white py-3 rounded-xl font-bold ${feature === 'maintenance_pc' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-600 hover:bg-slate-700'}`}
              >
                {feature === 'maintenance_pc' ? 'דווח לתקשוב' : 'דווח לאב הבית'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}