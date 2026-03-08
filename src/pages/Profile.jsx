import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { User, Mail, Phone, Briefcase, Save, CheckCircle, Camera, Key, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ full_name: '', title: '', phone: '' });
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedPw, setSavedPw] = useState(false);
  const [error, setError] = useState('');
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    if (user) {
      setForm({ full_name: user.full_name || '', title: user.title || '', phone: user.phone || '' });
    }
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) { setError('שם מלא הוא שדה חובה'); return; }
    setSaving(true);
    setError('');
    try {
      await base44.entities.User.update(user.id, {
        full_name: form.full_name.trim(),
        title: form.title.trim(),
        phone: form.phone.trim(),
      });
      setUser(u => ({ ...u, ...form }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('שגיאה בשמירה, נסו שוב');
    } finally {
      setSaving(false);
    }
  };

  const handlePwSave = async (e) => {
    e.preventDefault();
    if (!pwForm.current) { setPwError('יש להזין סיסמה נוכחית'); return; }
    if (pwForm.next.length < 6) { setPwError('סיסמה חדשה חייבת להכיל לפחות 6 תווים'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('הסיסמאות אינן תואמות'); return; }
    setSavingPw(true);
    setPwError('');
    try {
      await base44.auth.changePassword({ currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwForm({ current: '', next: '', confirm: '' });
      setSavedPw(true);
      setTimeout(() => setSavedPw(false), 3000);
    } catch {
      setPwError('סיסמה נוכחית שגויה או שגיאת שרת');
    } finally {
      setSavingPw(false);
    }
  };

  const roleLabel = {
    admin: 'מנהל', vice_principal: 'סגן מנהל', secretary: 'מזכירה',
    teacher: 'מורה', assistant: 'סייעת', counselor: 'יועץ חינוכי',
    coordinator: 'רכז', maintenance: 'אחזקה', substitute: 'מחליף', user: 'עובד',
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="w-8 h-8 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6 page-enter" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <User className="h-6 w-6 text-teal-600" />
          הפרופיל שלי
        </h1>
        <p className="text-slate-500 text-sm mt-1">עדכון פרטים אישיים והגדרות חשבון</p>
      </div>

      {/* Avatar + Role */}
      <div className="card-premium p-6 flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <div className="h-20 w-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg"
               style={{ background: 'linear-gradient(135deg, #0d9488, #22c55e)' }}>
            {user.avatar || user.full_name?.charAt(0) || '?'}
          </div>
          <div className="absolute -bottom-1 -left-1 h-6 w-6 rounded-full bg-white border-2 border-teal-500 flex items-center justify-center">
            <Camera className="h-3 w-3 text-teal-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate">{user.full_name}</p>
          <p className="text-teal-600 font-medium text-sm">{user.title || roleLabel[user.role] || user.role}</p>
          <div className="flex items-center gap-1.5 mt-1 text-slate-500 text-sm">
            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-50 text-teal-700 border border-teal-200 flex-shrink-0">
          {roleLabel[user.role] || user.role}
        </span>
      </div>

      {/* Personal Info Form */}
      <form onSubmit={handleSave} className="card-premium p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-teal-600" />
          פרטים אישיים
        </h2>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">שם מלא</label>
          <input
            type="text"
            value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm transition-all"
            placeholder="שם מלא"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">תפקיד / כותרת</label>
          <input
            type="text"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm transition-all"
            placeholder="לדוגמה: מורה לתנ״ך ומחנכת ח׳2"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
            <Phone className="h-3 w-3" /> טלפון
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm transition-all"
            placeholder="05X-XXXXXXX"
            dir="ltr"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60 transition-all"
        >
          {saved ? (
            <><CheckCircle className="h-4 w-4" /> נשמר בהצלחה!</>
          ) : (
            <><Save className="h-4 w-4" /> {saving ? 'שומר...' : 'שמור שינויים'}</>
          )}
        </button>
      </form>

      {/* Password Change */}
      <form onSubmit={handlePwSave} className="card-premium p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Key className="h-4 w-4 text-teal-600" />
          שינוי סיסמה
        </h2>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">סיסמה נוכחית</label>
          <div className="relative">
            <input
              type={showCurrent ? 'text' : 'password'}
              value={pwForm.current}
              onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm pr-10 transition-all"
              dir="ltr"
            />
            <button type="button" onClick={() => setShowCurrent(v => !v)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">סיסמה חדשה</label>
            <div className="relative">
              <input
                type={showNext ? 'text' : 'password'}
                value={pwForm.next}
                onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm pr-10 transition-all"
                dir="ltr"
              />
              <button type="button" onClick={() => setShowNext(v => !v)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showNext ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">אישור סיסמה</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm transition-all"
              dir="ltr"
            />
          </div>
        </div>

        {pwError && <p className="text-red-500 text-sm">{pwError}</p>}

        <button
          type="submit"
          disabled={savingPw}
          className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60 transition-all"
        >
          {savedPw ? (
            <><CheckCircle className="h-4 w-4" /> סיסמה עודכנה!</>
          ) : (
            <><Key className="h-4 w-4" /> {savingPw ? 'מעדכן...' : 'עדכן סיסמה'}</>
          )}
        </button>
      </form>
    </div>
  );
}
