import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Bell, Calendar, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_OPTIONS = [
  { value: 'birthday',     label: '🎂 יום הולדת',        hint: 'ברכה ליום הולדת' },
  { value: 'holiday',      label: '🎉 חג / חופשה',        hint: 'ברכת חג שמח' },
  { value: 'quote',        label: '💬 ציטוט יומי',        hint: 'ציטוט מעורר השראה' },
  { value: 'announcement', label: '📢 הודעה כללית',       hint: 'הודעה לכל הצוות' },
  { value: 'celebration',  label: '🌟 ציון מיוחד',        hint: 'אירוע מיוחד' },
];

const MONTH_NAMES = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

const EMPTY_FORM = { type: 'announcement', title: '', message: '', emoji: '', date_key: '', recurring: true };

export default function DailyAnnouncementsManager() {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);

  const { data: announcements = [] } = useQuery({
    queryKey: ['daily-announcements'],
    queryFn: () => base44.entities.DailyAnnouncement.list('-created_date'),
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.DailyAnnouncement.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-announcements'] });
      toast.success('ההודעה נשמרה');
      setForm(EMPTY_FORM);
      setShowForm(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => base44.entities.DailyAnnouncement.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['daily-announcements'] }); toast.success('נמחק'); },
  });

  const handleSave = () => {
    if (!form.message.trim() || !form.date_key) {
      toast.error('יש למלא תאריך והודעה');
      return;
    }
    createMut.mutate(form);
  };

  const formatDateKey = (key) => {
    if (!key) return '';
    const parts = key.split('-');
    if (parts.length === 2) {
      const [mm, dd] = parts;
      return `${dd} ${MONTH_NAMES[parseInt(mm,10)-1] || mm}`;
    }
    return new Date(key).toLocaleDateString('he-IL');
  };

  const typeMap = Object.fromEntries(TYPE_OPTIONS.map(t => [t.value, t]));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Bell className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-white text-base">הודעות יומיות</h3>
            <p className="text-xs text-slate-400">קופצות לכל הצוות בתאריך שנקבע</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-xl text-white transition-all hover:shadow-md"
          style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
        >
          <Plus className="h-4 w-4" />
          הוסף הודעה
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 space-y-4 border border-slate-200 dark:border-slate-600 animate-fade-in">
          <p className="text-sm font-bold text-slate-700 dark:text-white">הודעה חדשה</p>

          {/* Type */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TYPE_OPTIONS.map(t => (
              <button
                key={t.value}
                onClick={() => setForm(f => ({ ...f, type: t.value }))}
                className={`px-3 py-2 rounded-xl text-xs font-semibold text-right transition-all border
                  ${form.type === t.value
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-indigo-300'}`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Date + Recurring */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-slate-500 mb-1 block">
                {form.recurring ? 'תאריך חוזר (MM-DD)' : 'תאריך מדויק'}
              </label>
              {form.recurring ? (
                <input
                  type="text"
                  placeholder="03-14 (חודש-יום)"
                  value={form.date_key}
                  onChange={e => setForm(f => ({ ...f, date_key: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-400"
                />
              ) : (
                <input
                  type="date"
                  value={form.date_key}
                  onChange={e => setForm(f => ({ ...f, date_key: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-400"
                />
              )}
            </div>
            <div className="flex items-center gap-2 mt-5">
              <input
                type="checkbox"
                id="recurring"
                checked={form.recurring}
                onChange={e => setForm(f => ({ ...f, recurring: e.target.checked, date_key: '' }))}
                className="w-4 h-4 rounded text-indigo-600"
              />
              <label htmlFor="recurring" className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5" /> חוזר כל שנה
              </label>
            </div>
          </div>

          {/* Title + Emoji */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="אימוג'י (אופציונלי)"
              value={form.emoji}
              onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
              className="w-20 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-400 text-center"
            />
            <input
              type="text"
              placeholder="כותרת (אופציונלי)"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Message */}
          <textarea
            placeholder="טקסט ההודעה..."
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
          />

          <div className="flex gap-2">
            <button onClick={handleSave} disabled={createMut.isPending}
                    className="flex-1 py-2.5 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
              שמור הודעה
            </button>
            <button onClick={() => setShowForm(false)}
                    className="px-4 py-2.5 text-sm text-slate-500 bg-slate-100 dark:bg-slate-600 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors">
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-2">
        {announcements.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
            <p>אין הודעות מתוזמנות</p>
          </div>
        ) : announcements.map(a => {
          const t = typeMap[a.type] || typeMap.announcement;
          return (
            <div key={a.id}
                 className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
              <span className="text-xl flex-shrink-0">{a.emoji || t.label.split(' ')[0]}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 px-2 py-0.5 rounded-full">
                    {formatDateKey(a.date_key)}
                  </span>
                  {a.recurring && (
                    <span className="text-[10px] text-indigo-500 flex items-center gap-0.5">
                      <RefreshCw className="h-2.5 w-2.5" /> שנתי
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">{t.label}</span>
                </div>
                {a.title && <p className="text-sm font-semibold text-slate-700 dark:text-white mt-0.5 truncate">{a.title}</p>}
                <p className="text-xs text-slate-500 truncate">{a.message}</p>
              </div>
              <button onClick={() => deleteMut.mutate(a.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
