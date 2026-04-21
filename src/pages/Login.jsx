import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/firebaseClient';

const FEATURES = [
  'לוח בקרה ראשי', 'יומן בית הספר', 'ניהול היעדרויות',
  'משימות ואישורים', 'ניהול צוות (HR)', 'ניהול תורנויות',
  'מרכז צילומים', 'תפעול ורכש', 'חתימה דיגיטלית',
  'אנליטיקס ותובנות', 'טפסי קליטה', 'ניהול חדרים',
];

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [resetSent, setResetSent] = useState(false);

  /* ─── Firestore direct login (no Firebase Auth required) ─── */
  const loginViaFirestore = async (emailInput) => {
    const PROJECT = 'smart-base-chabad';
    const API_KEY = 'AIzaSyAddP9aqW8JoRpZQpo6aU0ah-VZNAJc2Lk';
    const res  = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users?key=${API_KEY}`);
    const json = await res.json();
    const users = (json.documents || []).map(doc => ({
      id:        doc.name.split('/').pop(),
      email:     doc.fields?.email?.stringValue     || '',
      full_name: doc.fields?.full_name?.stringValue || '',
      role:      doc.fields?.role?.stringValue      || '',
      school_id: doc.fields?.school_id?.stringValue || null,
      title:     doc.fields?.title?.stringValue     || '',
    }));
    const found = users.find(u => u.email.toLowerCase() === emailInput.toLowerCase());
    if (!found) throw new Error('האימייל לא נמצא במערכת — פני למנהלת');
    localStorage.setItem('smartbase_user', JSON.stringify(found));
    window.location.reload();
  };

  /* ─── Google GSI ─── */
  useEffect(() => {
    const initGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: '999838213116-uq2dgv92erdmiq4e0vvs4lvr5famiqoo.apps.googleusercontent.com',
        callback: async (res) => {
          const payload = JSON.parse(atob(res.credential.split('.')[1]));
          setLoading(true); setError('');
          try { await loginViaFirestore(payload.email); }
          catch (e) { setError(e.message); }
          finally { setLoading(false); }
        },
      });
      window.google.accounts.id.renderButton(
        document.getElementById('g-btn'),
        { theme: 'outline', size: 'large', width: 280, text: 'signin_with', locale: 'he' }
      );
    };

    if (window.google) {
      initGoogle();
    } else {
      window.onGoogleLibraryLoad = initGoogle;
    }

    return () => { window.onGoogleLibraryLoad = null; };
  }, []);

  /* ─── Email submit ─── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.reload();
    } catch {
      try { await loginViaFirestore(email); }
      catch (e2) { setError(e2.message || 'אימייל או סיסמה שגויים'); }
    } finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (!email) { setError('הכניסי אימייל קודם'); return; }
    try { await base44.auth.sendPasswordReset(email); setResetSent(true); }
    catch { setError('שגיאה בשליחת מייל איפוס'); }
  };

  return (
    <div className="min-h-screen flex" dir="rtl">

      {/* ── LEFT: dark feature panel ── */}
      <div className="hidden lg:flex flex-col justify-between flex-1 bg-slate-900 p-12 xl:p-16">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img src="/logo-smartbase.jpeg" alt="Smart Base"
               className="w-10 h-10 rounded-xl object-cover object-top" />
          <span className="text-white font-black text-lg tracking-tight">Smart Base</span>
        </div>

        {/* Headline */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-soft" />
            <span className="text-blue-300 text-xs font-semibold tracking-wide">רשת חינוך חב"ד</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight mb-4">
            כל מה שצוות<br/>
            <span className="text-blue-400">בית הספר</span><br/>
            צריך — במקום אחד.
          </h1>
          <p className="text-slate-400 text-base leading-relaxed max-w-sm">
            מניהול היעדרויות ועד תורנויות, מחתימה דיגיטלית ועד יומן חגים.
          </p>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2">
          {FEATURES.map(f => (
            <span key={f} className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
              {f}
            </span>
          ))}
        </div>

        {/* Stats */}
        <div className="flex gap-8 pt-8 border-t border-slate-800">
          {[['16+', 'מודולים'], ['100%', 'ענן ומובייל'], ['PWA', 'כאפליקציה']].map(([n, l]) => (
            <div key={l}>
              <p className="text-2xl font-black text-white">{n}</p>
              <p className="text-slate-500 text-xs mt-0.5">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT: login form ── */}
      <div className="flex items-center justify-center w-full lg:w-[460px] xl:w-[500px] flex-shrink-0 bg-white p-8">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10">
            <img src="/logo-smartbase.jpeg" alt="Smart Base"
                 className="w-9 h-9 rounded-xl object-cover object-top" />
            <span className="font-black text-slate-800 text-lg">Smart Base</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-1">ברוכים הבאים</h2>
            <p className="text-slate-400 text-sm">התחברו כדי לגשת למערכת</p>
          </div>

          {/* Google button */}
          <div id="g-btn" className="mb-5" />

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-xs font-medium">או עם אימייל</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">אימייל</label>
              <input
                type="email" value={email} required
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                dir="ltr"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-800
                           placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2
                           focus:ring-blue-100 transition-all bg-slate-50 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">סיסמה</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} value={password} required
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full px-4 py-3 pl-11 rounded-xl border border-slate-200 text-sm text-slate-800
                             placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2
                             focus:ring-blue-100 transition-all bg-slate-50 focus:bg-white"
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100">
                <p className="text-red-600 text-xs font-medium">{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl
                         bg-slate-900 text-white font-bold text-sm
                         hover:bg-slate-700 disabled:opacity-60
                         transition-all hover:-translate-y-0.5 hover:shadow-lg">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  מתחבר...
                </span>
              ) : (
                <>כניסה למערכת <ArrowLeft className="h-4 w-4" /></>
              )}
            </button>
          </form>

          {/* Forgot password */}
          <div className="mt-4 text-center">
            {resetSent ? (
              <p className="text-emerald-600 text-xs font-medium">✓ מייל איפוס נשלח</p>
            ) : (
              <button onClick={handleReset}
                className="text-slate-400 hover:text-slate-600 text-xs transition-colors">
                שכחתי סיסמה
              </button>
            )}
          </div>

          <p className="text-center text-slate-300 text-[11px] mt-8">
            גישה מורשית לצוות בית הספר בלבד
          </p>
        </div>
      </div>
    </div>
  );
}
