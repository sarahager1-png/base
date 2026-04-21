import React from 'react';
import { getScheduleForEmail } from '@/lib/scheduleStorage';
import { Calendar } from 'lucide-react';

const DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
const HOURS = [1, 2, 3, 4, 5, 6, 7, 8];

const COLORS = [
  'bg-blue-50 border-blue-200 text-blue-800',
  'bg-yellow-50 border-yellow-200 text-yellow-800',
  'bg-green-50 border-green-200 text-green-800',
  'bg-yellow-50 border-yellow-200 text-yellow-800',
  'bg-yellow-50 border-yellow-200 text-yellow-800',
  'bg-green-50 border-green-200 text-green-800',
];

function colorForSubject(subject) {
  let h = 0;
  for (let i = 0; i < subject.length; i++) h = (h * 31 + subject.charCodeAt(i)) & 0xffff;
  return COLORS[h % COLORS.length];
}

export default function WeeklyScheduleView({ email, compact = false }) {
  const lessons = getScheduleForEmail(email);

  if (lessons.length === 0) {
    return (
      <div className="text-center py-10 text-slate-400">
        <Calendar className="h-10 w-10 mx-auto mb-3 text-slate-200" />
        <p className="font-medium">מערכת שעות טרם הוגדרה</p>
        <p className="text-xs mt-1">ניתן לייבא מקובץ Excel/CSV בלשונית "יבוא"</p>
      </div>
    );
  }

  // Build lookup: day → hour → lesson
  const grid = {};
  lessons.forEach(l => {
    if (!grid[l.day]) grid[l.day] = {};
    grid[l.day][l.hour] = l;
  });

  if (compact) {
    // Today's view — horizontal
    const todayIdx = new Date().getDay();
    const todayLessons = (grid[todayIdx] || {});
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {HOURS.map(h => {
          const lesson = todayLessons[h];
          return (
            <div key={h} className="min-w-[110px] flex-shrink-0">
              <div className="text-center text-xs font-bold text-slate-500 bg-slate-100 py-1 rounded-t-lg">שעה {h}</div>
              <div className={`p-3 rounded-b-xl border text-center h-20 flex flex-col justify-center transition-all ${
                lesson ? colorForSubject(lesson.subject) : 'bg-white border-slate-100'
              }`}>
                {lesson ? (
                  <>
                    <span className="font-bold text-sm leading-tight">{lesson.subject}</span>
                    {lesson.className && <span className="text-xs mt-0.5 opacity-70">{lesson.className}</span>}
                    {lesson.room     && <span className="text-xs opacity-50">חדר {lesson.room}</span>}
                  </>
                ) : (
                  <span className="text-slate-300 text-xs">פנוי</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Full weekly table
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-slate-200 bg-slate-50 p-2 text-center font-bold text-slate-600 w-14">שעה</th>
            {DAYS.map((d, i) => (
              <th key={d} className={`border border-slate-200 p-2 text-center font-bold text-slate-600 ${
                i === new Date().getDay() ? 'bg-blue-50 text-blue-700' : 'bg-slate-50'
              }`}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {HOURS.map(h => (
            <tr key={h}>
              <td className="border border-slate-200 bg-blue-50 p-2 text-center font-bold text-blue-900">{h}</td>
              {DAYS.map((_, d) => {
                const lesson = grid[d]?.[h];
                return (
                  <td key={d} className={`border border-slate-200 p-2 text-center ${lesson ? '' : 'bg-slate-50'}`}>
                    {lesson ? (
                      <div className={`rounded-lg px-2 py-1.5 border ${colorForSubject(lesson.subject)}`}>
                        <div className="font-bold text-xs">{lesson.subject}</div>
                        {lesson.className && <div className="text-xs opacity-70">{lesson.className}</div>}
                        {lesson.room && <div className="text-xs opacity-50">ח׳ {lesson.room}</div>}
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
