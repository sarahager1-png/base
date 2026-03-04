import React, { useState } from 'react';

export function OvertimeForm({ onSubmit }) {
  const [formData, setFormData] = useState({});
  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-slate-500">תאריך</label>
        <input
          type="date"
          className="w-full p-2 border rounded-lg"
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
        />
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500">מספר שעות</label>
        <input
          type="number" min="0" step="0.5"
          className="w-full p-2 border rounded-lg"
          onChange={(e) => setFormData({ ...formData, hours: parseFloat(e.target.value) })}
        />
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500">פירוט - על מה?</label>
        <textarea
          className="w-full p-2 border rounded-lg" rows="3"
          placeholder="לדוגמה: אסיפת הורים, פעילות עם תלמידים, הכנת מערכי שיעור"
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
        ></textarea>
      </div>
      <button
        onClick={() => onSubmit(formData)}
        className="w-full bg-amber-600 text-white py-3 rounded-xl font-bold hover:bg-amber-700"
      >
        שלח דיווח
      </button>
    </div>
  );
}

export function OvertimeHistory({ history }) {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
        <p className="text-sm font-bold text-amber-900">יתרת שעות נוספות: 40 שעות</p>
        <p className="text-xs text-amber-700 mt-1">מתוך מכסה שנתית</p>
      </div>
      <div className="space-y-2">
        {history.map(ot => (
          <div key={ot.id} className="p-3 border rounded-lg">
            <p className="font-bold text-sm">{ot.date} - {ot.hours} שעות</p>
            <p className="text-xs text-slate-500">{ot.reason}</p>
            <p className="text-xs text-slate-400">{ot.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SpecialOvertimeForm({ onSubmit }) {
  const [formData, setFormData] = useState({});
  const [weekDates, setWeekDates] = useState([]);

  const totalHours = weekDates.reduce((sum, d) => sum + (d.hours || 0), 0);

  const handleSubmit = () => {
    onSubmit({ ...formData, dates: weekDates, total_hours: totalHours });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold text-slate-500">סוג פעילות</label>
        <select
          className="w-full p-2 border rounded-lg"
          onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
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
                  type="date" value={dayDate.date || ''}
                  onChange={(e) => {
                    const newDates = [...weekDates];
                    newDates[idx] = { ...dayDate, date: e.target.value };
                    setWeekDates(newDates);
                  }}
                  className="flex-1 p-2 border rounded-lg text-sm"
                />
                <input
                  type="number" min="0" step="0.5" value={dayDate.hours || 0}
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
        <p className="text-sm font-bold text-indigo-600 mt-2">סה״כ: {totalHours} שעות</p>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-500">פרטים נוספים</label>
        <textarea
          className="w-full p-2 border rounded-lg" rows="2"
          onChange={(e) => setFormData({ ...formData, details: e.target.value })}
        ></textarea>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!formData.activity_type || weekDates.length === 0}
        className={`w-full text-white py-3 rounded-xl font-bold ${
          !formData.activity_type || weekDates.length === 0 ? 'bg-slate-300' : 'bg-indigo-600 hover:bg-indigo-700'
        }`}
      >
        שלח דיווח
      </button>
    </div>
  );
}

export function SpecialOvertimeHistory({ history }) {
  return (
    <div className="space-y-2">
      {history.map(sot => (
        <div key={sot.id} className="p-3 border rounded-lg">
          <p className="font-bold text-sm">
            {sot.activity_type === 'tzomchim' ? 'צומחים מחדש' : 'תורנות'} - {sot.total_hours} שעות
          </p>
          <p className="text-xs text-slate-500">{sot.status}</p>
        </div>
      ))}
    </div>
  );
}
