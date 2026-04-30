import React, { useState } from 'react';
import { base44 } from '@/api/firebaseClient';
import { User, Phone, Mail, BookOpen, Home, ChevronRight, ChevronLeft, Check } from 'lucide-react';

const LS_KEY = (email) => `smartbase_profile_done_${email}`;

export function profileSetupNeeded(user) {
  if (!user?.email) return false;
  return !localStorage.getItem(LS_KEY(user.email));
}

export function markProfileDone(email) {
  localStorage.setItem(LS_KEY(email), '1');
}

const TEACHER_ROLES = ['teacher', 'substitute', 'counselor', 'coordinator', 'assistant'];

const ROLE_LABEL = {
  admin: 'מנהלת',
  vice_principal: 'סגנית מנהל',
  secretary: 'מזכירה',
  teacher: 'מורה',
  counselor: 'יועצת',
  coordinator: 'רכזת',
  assistant: 'סייעת',
  substitute: 'מחליפה',
  maintenance: 'אחזקה',
  staff: 'צוות',
};

const STEP_ICONS = [User, Phone, BookOpen];

export default function ProfileSetupModal({ user, onComplete }) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    full_name: user.full_name || '',
    phone: user.phone || '',
    home_class: user.home_class || '',
    subject: user.subject || '',
  });

  const isTeacher = TEACHER_ROLES.includes(user.role);
  const steps = [
    { key: 'identity', title: 'ברוכה הבאה!', subtitle: `כמה פרטים קצרים לפני שמתחילים` },
    { key: 'phone',    title: 'טלפון לוואצאפ', subtitle: 'לקבלת התראות ועדכונים ישירות לטלפון' },
    ...(isTeacher ? [{ key: 'teaching', title: 'פרטי הוראה', subtitle: 'ניתן לדלג ולהשלים מאוחר יותר', optional: true }] : []),
  ];

  const totalSteps = steps.length;
  const current = steps[step];

  const upd = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError(''); };

  const validate = () => {
    if (current.key === 'identity' && !form.full_name.trim()) return 'שם מלא הוא שדה חובה';
    if (current.key === 'phone'    && !form.phone.trim())     return 'מספר טלפון הוא שדה חובה';
    return '';
  };

  const goNext = async () => {
    if (!current.optional) {
      const err = validate();
      if (err) { setError(err); return; }
    }
    if (step < totalSteps - 1) { setStep(s => s + 1); return; }
    await finish();
  };

  const skip = () => {
    setError('');
    if (step < totalSteps - 1) setStep(s => s + 1);
    else finish();
  };

  const finish = async () => {
    setSaving(true);
    try {
      const patch = {
        full_name:        form.full_name.trim(),
        phone:            form.phone.trim(),
        home_class:       (form.home_class || '').trim(),
        subject:          (form.subject || '').trim(),
        profile_complete: true,
      };
      // User may be in 'users' or 'staff' collection — update both silently
      await Promise.allSettled([
        base44.firestoreUsers.update(user.id, patch),
        base44.firestoreStaff.update(user.id, patch),
      ]);
      await base44.auth.updateMe(patch);
      markProfileDone(user.email);
      onComplete(patch);
    } catch {
      setError('שגיאה בשמירה. אנא נסי שוב.');
    }
    setSaving(false);
  };

  const inp = 'w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all';
  const StepIcon = STEP_ICONS[step];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gradient-to-br from-blue-600/20 to-purple-600/20 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

        {/* Header stripe */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-8 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <StepIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{current.title}</h2>
              <p className="text-blue-100 text-xs mt-0.5">{current.subtitle}</p>
            </div>
          </div>

          {/* Progress dots */}
          <div className="flex gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i < step ? 'bg-white flex-1' :
                  i === step ? 'bg-white flex-[2]' :
                  'bg-white/30 flex-1'
                }`}
              />
            ))}
          </div>
          <p className="text-blue-100 text-[10px] mt-2 text-left">שלב {step + 1} מתוך {totalSteps}</p>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-4">

          {/* Step: identity */}
          {current.key === 'identity' && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-slate-500">שם מלא</span>
                  <span className="text-xs text-red-400">*</span>
                </div>
                <input
                  className={inp}
                  value={form.full_name}
                  onChange={e => upd('full_name', e.target.value)}
                  placeholder="שרה לוי"
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400">מייל (לא ניתן לשינוי)</p>
                  <p className="text-sm text-slate-600 font-medium" dir="ltr">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 bg-blue-50 rounded-xl border border-blue-100">
                <User className="h-4 w-4 text-blue-400 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-blue-400">תפקיד</p>
                  <p className="text-sm text-blue-700 font-medium">{ROLE_LABEL[user.role] || user.role}</p>
                </div>
              </div>
            </>
          )}

          {/* Step: phone */}
          {current.key === 'phone' && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-500">מספר טלפון</span>
                  <span className="text-xs text-red-400">*</span>
                </div>
                <input
                  className={inp}
                  type="tel"
                  dir="ltr"
                  value={form.phone}
                  onChange={e => upd('phone', e.target.value)}
                  placeholder="05X-XXXXXXX"
                  autoFocus
                />
              </div>
              <div className="flex items-start gap-2.5 px-3 py-3 bg-green-50 rounded-xl border border-green-100">
                <div className="mt-0.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <p className="text-xs text-green-700 leading-relaxed">
                  המספר ישמש לשליחת התראות בוואצאפ — אישורי היעדרות, תזכורות וחדשות חשובות.
                </p>
              </div>
            </>
          )}

          {/* Step: teaching */}
          {current.key === 'teaching' && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <Home className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-500">כיתת אחריות</span>
                  <span className="text-xs text-slate-300">(אופציונלי)</span>
                </div>
                <input
                  className={inp}
                  value={form.home_class}
                  onChange={e => upd('home_class', e.target.value)}
                  placeholder="לדוגמה: ז׳2"
                  autoFocus
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-bold text-slate-500">מקצוע הוראה</span>
                  <span className="text-xs text-slate-300">(אופציונלי)</span>
                </div>
                <input
                  className={inp}
                  value={form.subject}
                  onChange={e => upd('subject', e.target.value)}
                  placeholder="לדוגמה: מתמטיקה"
                />
              </div>
            </>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-100">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 pb-7 flex items-center justify-between">
          <div>
            {step > 0 && (
              <button
                onClick={() => { setStep(s => s - 1); setError(''); }}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 transition-colors">
                <ChevronRight className="h-4 w-4" />
                חזרה
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {current.optional && (
              <button
                onClick={skip}
                disabled={saving}
                className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
                דלג
              </button>
            )}
            <button
              onClick={goNext}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-60 shadow-sm">
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : step < totalSteps - 1 ? (
                <>הבא <ChevronLeft className="h-4 w-4" /></>
              ) : (
                <>סיום <Check className="h-4 w-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
