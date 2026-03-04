import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertTriangle } from 'lucide-react';

const TEACHER_SCHEDULE = {
  0: { 1: 'הסטוריה - ח׳2', 2: 'הסטוריה - ח׳2', 3: 'פרטני', 4: 'חלון', 5: 'אזרחות - ט׳1', 6: 'אזרחות - ט׳1' },
  1: { 1: 'חלון', 2: 'הסטוריה - ח׳3', 3: 'הסטוריה - ח׳3', 4: 'ישיבת צוות', 5: 'הסטוריה - ח׳2' },
  2: { 1: 'אזרחות - ט׳1', 2: 'אזרחות - ט׳1', 3: 'הסטוריה - ח׳2', 4: 'הסטוריה - ח׳2', 5: 'שהייה', 6: 'שהייה' },
  3: { 1: 'הסטוריה - ח׳3', 2: 'הסטוריה - ח׳3', 3: 'חלון', 4: 'פרטני', 5: 'חינוך - ח׳2' },
  4: { 1: 'חלון', 2: 'חלון', 3: 'הסטוריה - ח׳2', 4: 'הסטוריה - ח׳2', 5: 'אזרחות - ט׳1' },
  5: { 1: 'סיכום שבוע - ח׳2', 2: 'פרטני' },
};

export function SubstituteForm({ user, onSubmit }) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedLessons, setSelectedLessons] = useState([]);
  const [substituteName, setSubstituteName] = useState('');
  const [showWarning, setShowWarning] = useState(false);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const teachers = allUsers.filter(u =>
    ['teacher', 'coordinator', 'counselor', 'vice_principal'].includes(u.role)
  );

  const daySchedule = selectedDate ? TEACHER_SCHEDULE[new Date(selectedDate).getDay()] || {} : {};
  const frontalLessons = Object.entries(daySchedule).filter(
    ([_, lesson]) => !['חלון', 'פרטני', 'ישיבת צוות', 'שהייה'].includes(lesson)
  );
  const scheduledLessonsCount = frontalLessons.length;
  const totalHoursWithSubstitute = scheduledLessonsCount + selectedLessons.length;

  React.useEffect(() => {
    setShowWarning(totalHoursWithSubstitute > 9);
  }, [totalHoursWithSubstitute]);

  const handleSubmit = () => {
    onSubmit({
      reporter_email: user.email,
      reporter_name: user.full_name,
      date: selectedDate,
      hours_count: selectedLessons.length,
      class_name: selectedLessons.map(l => l.class).join(', '),
      subject: selectedLessons.map(l => l.subject).join(', '),
      original_teacher: substituteName,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-slate-500">תאריך</label>
        <input
          type="date"
          value={selectedDate}
          className="w-full p-2 border rounded-lg"
          onChange={(e) => { setSelectedDate(e.target.value); setSelectedLessons([]); }}
        />
      </div>

      {selectedDate && (
        <>
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <p className="text-sm text-slate-700"><span className="font-bold">שעות המערכת שלך היום:</span> {scheduledLessonsCount} שעות</p>
            <p className="text-sm text-slate-700 mt-1"><span className="font-bold">שעות מילוי מקום שבחרת:</span> {selectedLessons.length} שעות</p>
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
                        isSelected ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-white hover:border-purple-300'
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
            <option value="">בחרי עובדת הוראה מהרשימה</option>
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
  );
}

export function SubstituteHistory({ history }) {
  return (
    <div className="space-y-2">
      {history.map(sub => (
        <div key={sub.id} className="p-3 border rounded-lg">
          <p className="font-bold text-sm">{sub.date} - {sub.hours_count} שעות</p>
          <p className="text-xs text-slate-500">{sub.status}</p>
        </div>
      ))}
    </div>
  );
}
