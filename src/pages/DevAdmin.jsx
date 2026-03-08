import React, { useState, useEffect } from 'react';
import {
  Shield, Plus, Trash2, Copy, CheckCircle, Eye, EyeOff,
  School, Globe, Key, Settings, AlertTriangle, ChevronDown, ChevronUp,
  Download, RefreshCw, Lock, Unlock, Building2, X
} from 'lucide-react';

const DEV_PASSWORD = 'dev2026!';
const STORAGE_KEY = 'smartbase_schools_registry';

const DEFAULT_ENV = (school) => `VITE_BASE44_APP_BASE_URL=https://app.base44.com
VITE_BASE44_APP_ID=${school.appId || 'INSERT_APP_ID_HERE'}
VITE_BASE44_API_KEY=${school.apiKey || 'INSERT_API_KEY_HERE'}`;

const VERCEL_JSON = (school) => JSON.stringify({
  buildCommand: "node node_modules/vite/bin/vite.js build",
  outputDirectory: "dist",
  framework: "vite",
  rewrites: [{ source: "/(.*)", destination: "/index.html" }],
  build: {
    env: {
      VITE_BASE44_APP_BASE_URL: "https://app.base44.com",
      VITE_BASE44_APP_ID: school.appId || "INSERT_APP_ID_HERE",
      VITE_BASE44_API_KEY: school.apiKey || "INSERT_API_KEY_HERE"
    }
  }
}, null, 2);

export default function DevAdmin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [schools, setSchools] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [copiedKey, setCopiedKey] = useState('');
  const [newSchool, setNewSchool] = useState({
    name: '', city: '', adminEmail: '', appId: '', apiKey: '', vercelUrl: '', notes: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try { setSchools(JSON.parse(saved)); } catch {}
    }
  }, []);

  const saveSchools = (list) => {
    setSchools(list);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  };

  const handleLogin = () => {
    if (password === DEV_PASSWORD) {
      setAuthenticated(true);
      setError('');
    } else {
      setError('סיסמת מפתח שגויה');
    }
  };

  const addSchool = () => {
    if (!newSchool.name) return;
    const school = { ...newSchool, id: Date.now().toString(), createdAt: new Date().toISOString(), active: true };
    saveSchools([...schools, school]);
    setNewSchool({ name: '', city: '', adminEmail: '', appId: '', apiKey: '', vercelUrl: '', notes: '' });
    setShowAdd(false);
  };

  const deleteSchool = (id) => {
    if (!window.confirm('למחוק בית ספר זה?')) return;
    saveSchools(schools.filter(s => s.id !== id));
  };

  const toggleActive = (id) => {
    saveSchools(schools.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const updateSchool = (id, field, value) => {
    saveSchools(schools.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const copyToClipboard = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 2000);
    } catch {
      // fallback
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(''), 2000);
    }
  };

  const exportSchools = () => {
    const blob = new Blob([JSON.stringify(schools, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schools-registry.json';
    a.click();
  };

  // ── Login screen ──
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl"
           style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' }}>
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
                 style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white">פאנל מפתח</h1>
            <p className="text-slate-400 text-sm mt-1">גישה מוגבלת למפתחי המערכת</p>
          </div>

          <div className="rounded-2xl p-6"
               style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <label className="block text-xs font-bold text-slate-400 mb-2">סיסמת מפתח</label>
            <div className="relative mb-4">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-white text-sm outline-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', direction: 'ltr' }}
              />
              <button type="button" onClick={() => setShowPassword(p => !p)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
            <button onClick={handleLogin}
              className="w-full py-3 rounded-xl font-bold text-white text-sm"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              כניסה
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main admin panel ──
  return (
    <div className="min-h-screen bg-slate-950 text-white" dir="rtl">
      {/* Header */}
      <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-black text-lg">פאנל מפתח — Smart Base</h1>
            <p className="text-slate-400 text-xs">ניהול בתי ספר ופריסות</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportSchools}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm">
            <Download className="h-4 w-4" />
            ייצוא JSON
          </button>
          <button onClick={() => setAuthenticated(false)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm">
            <Lock className="h-4 w-4" />
            נעל
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Architecture Info */}
        <div className="rounded-2xl p-5 mb-8 border border-indigo-800"
             style={{ background: 'rgba(79,70,229,0.1)' }}>
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-indigo-300 mb-1">ארכיטקטורת בידוד בתי ספר</h3>
              <p className="text-indigo-200 text-sm leading-relaxed">
                כל בית ספר מקבל <strong>App ID נפרד ב-base44</strong> = מסד נתונים עצמאי לחלוטין.
                לכל בית ספר מפרסים instance נפרד ב-Vercel עם משתני הסביבה הייחודיים שלו.
                אין זליגת נתונים בין בתי ספר.
              </p>
            </div>
          </div>
        </div>

        {/* Schools list header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-400" />
            בתי ספר ({schools.length})
          </h2>
          <button onClick={() => setShowAdd(p => !p)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
            <Plus className="h-4 w-4" />
            הוסף בית ספר
          </button>
        </div>

        {/* Add school form */}
        {showAdd && (
          <div className="rounded-2xl p-6 mb-6 border border-slate-700 bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-200">בית ספר חדש</h3>
              <button onClick={() => setShowAdd(false)} className="text-slate-500 hover:text-slate-300">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {[
                { key: 'name', label: 'שם בית הספר', placeholder: 'בית ספר שלהבות' },
                { key: 'city', label: 'עיר', placeholder: 'תל אביב' },
                { key: 'adminEmail', label: 'מנהלת (אימייל)', placeholder: 'principal@school.edu' },
                { key: 'vercelUrl', label: 'כתובת Vercel (אחרי פריסה)', placeholder: 'https://school-x.vercel.app' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-slate-400 mb-1">{label}</label>
                  <input
                    type="text"
                    placeholder={placeholder}
                    value={newSchool[key]}
                    onChange={e => setNewSchool(p => ({ ...p, [key]: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none bg-slate-800 border border-slate-700 focus:border-purple-500"
                    style={{ direction: key === 'adminEmail' || key === 'vercelUrl' ? 'ltr' : 'rtl' }}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  App ID ב-base44
                  <span className="text-slate-500 font-normal mr-1">(מ-base44.com → Apps)</span>
                </label>
                <input
                  type="text"
                  placeholder="69794b7749148839a583cd2b"
                  value={newSchool.appId}
                  onChange={e => setNewSchool(p => ({ ...p, appId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none bg-slate-800 border border-slate-700 focus:border-purple-500 font-mono"
                  style={{ direction: 'ltr' }}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  API Key ב-base44
                  <span className="text-slate-500 font-normal mr-1">(Settings → API Keys)</span>
                </label>
                <input
                  type="text"
                  placeholder="4002c112b24e443bb2433c..."
                  value={newSchool.apiKey}
                  onChange={e => setNewSchool(p => ({ ...p, apiKey: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none bg-slate-800 border border-slate-700 focus:border-purple-500 font-mono"
                  style={{ direction: 'ltr' }}
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-400 mb-1">הערות</label>
              <input
                type="text"
                placeholder="..."
                value={newSchool.notes}
                onChange={e => setNewSchool(p => ({ ...p, notes: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-white text-sm outline-none bg-slate-800 border border-slate-700 focus:border-purple-500"
              />
            </div>
            <button onClick={addSchool} disabled={!newSchool.name}
              className="px-6 py-2.5 rounded-xl font-bold text-sm disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
              שמור בית ספר
            </button>
          </div>
        )}

        {/* Schools list */}
        {schools.length === 0 ? (
          <div className="rounded-2xl p-12 text-center border border-dashed border-slate-700">
            <Building2 className="h-12 w-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">אין בתי ספר עדיין</p>
            <p className="text-slate-600 text-sm mt-1">לחץ על "הוסף בית ספר" כדי להתחיל</p>
          </div>
        ) : (
          <div className="space-y-3">
            {schools.map(school => (
              <div key={school.id}
                   className="rounded-2xl border overflow-hidden"
                   style={{
                     background: 'rgba(255,255,255,0.03)',
                     borderColor: school.active ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.08)'
                   }}>
                {/* School header row */}
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl"
                         style={{ background: school.active ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)' }}>
                      <School className="h-5 w-5" style={{ color: school.active ? '#818cf8' : '#475569' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{school.name}</span>
                        {school.city && <span className="text-slate-500 text-sm">{school.city}</span>}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          school.active ? 'bg-green-900/50 text-green-400' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {school.active ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </div>
                      {school.adminEmail && (
                        <p className="text-slate-400 text-xs mt-0.5" style={{ direction: 'ltr' }}>
                          {school.adminEmail}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {school.vercelUrl && (
                      <a href={school.vercelUrl} target="_blank" rel="noreferrer"
                         className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-400 border border-blue-800 hover:bg-blue-900/30">
                        <Globe className="h-3.5 w-3.5" />
                        פתח אתר
                      </a>
                    )}
                    <button onClick={() => toggleActive(school.id)}
                      className="p-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400">
                      {school.active ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </button>
                    <button onClick={() => setExpandedId(expandedId === school.id ? null : school.id)}
                      className="p-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-400">
                      {expandedId === school.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <button onClick={() => deleteSchool(school.id)}
                      className="p-2 rounded-lg border border-red-900 hover:bg-red-900/30 text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedId === school.id && (
                  <div className="border-t border-slate-800 p-5 space-y-5">
                    {/* Edit fields */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: 'name', label: 'שם בית הספר' },
                        { key: 'city', label: 'עיר' },
                        { key: 'adminEmail', label: 'מנהלת (אימייל)' },
                        { key: 'vercelUrl', label: 'כתובת Vercel' },
                        { key: 'appId', label: 'App ID (base44)' },
                        { key: 'apiKey', label: 'API Key (base44)' },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="block text-xs font-bold text-slate-500 mb-1">{label}</label>
                          <input
                            type="text"
                            value={school[key] || ''}
                            onChange={e => updateSchool(school.id, key, e.target.value)}
                            className="w-full px-3 py-2 rounded-lg text-white text-xs outline-none bg-slate-800 border border-slate-700 focus:border-purple-500 font-mono"
                            style={{ direction: 'ltr' }}
                          />
                        </div>
                      ))}
                    </div>

                    {/* .env file */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                          <Key className="h-3.5 w-3.5" />
                          קובץ .env לפריסה
                        </label>
                        <button
                          onClick={() => copyToClipboard(DEFAULT_ENV(school), `env-${school.id}`)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border border-slate-700 hover:bg-slate-800 text-slate-300">
                          {copiedKey === `env-${school.id}`
                            ? <><CheckCircle className="h-3.5 w-3.5 text-green-400" /> הועתק!</>
                            : <><Copy className="h-3.5 w-3.5" /> העתק</>}
                        </button>
                      </div>
                      <pre className="bg-slate-950 rounded-xl p-4 text-xs text-green-300 overflow-x-auto border border-slate-800"
                           style={{ direction: 'ltr', fontFamily: 'monospace' }}>
                        {DEFAULT_ENV(school)}
                      </pre>
                    </div>

                    {/* vercel.json */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                          <Settings className="h-3.5 w-3.5" />
                          vercel.json
                        </label>
                        <button
                          onClick={() => copyToClipboard(VERCEL_JSON(school), `vercel-${school.id}`)}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border border-slate-700 hover:bg-slate-800 text-slate-300">
                          {copiedKey === `vercel-${school.id}`
                            ? <><CheckCircle className="h-3.5 w-3.5 text-green-400" /> הועתק!</>
                            : <><Copy className="h-3.5 w-3.5" /> העתק</>}
                        </button>
                      </div>
                      <pre className="bg-slate-950 rounded-xl p-4 text-xs text-blue-300 overflow-x-auto border border-slate-800"
                           style={{ direction: 'ltr', fontFamily: 'monospace' }}>
                        {VERCEL_JSON(school)}
                      </pre>
                    </div>

                    {/* Deployment steps */}
                    <div className="rounded-xl p-4 border border-slate-700 bg-slate-900">
                      <h4 className="font-bold text-slate-300 text-sm mb-3 flex items-center gap-2">
                        <RefreshCw className="h-4 w-4 text-purple-400" />
                        שלבי פריסה לבית ספר זה
                      </h4>
                      <ol className="space-y-2 text-sm text-slate-400" style={{ paddingRight: '16px' }}>
                        <li><strong className="text-slate-300">1.</strong> צור App חדש ב-<a href="https://base44.com" target="_blank" rel="noreferrer" className="text-purple-400 hover:underline">base44.com</a> → העתק את App ID</li>
                        <li><strong className="text-slate-300">2.</strong> ב-App החדש: Settings → API Keys → צור מפתח והעתק</li>
                        <li><strong className="text-slate-300">3.</strong> עדכן כאן את App ID ו-API Key → העתק את vercel.json</li>
                        <li><strong className="text-slate-300">4.</strong> הכנס את vercel.json לתיקיית הקוד של המערכת</li>
                        <li><strong className="text-slate-300">5.</strong> פרוס ב-Vercel → עדכן כתובת Vercel בשדה למעלה</li>
                        <li><strong className="text-slate-300">6.</strong> ב-base44 App החדש: הזמן את מנהלת בית הספר ב-Users</li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Current deployment info */}
        <div className="mt-8 rounded-2xl p-5 border border-slate-700 bg-slate-900">
          <h3 className="font-bold text-slate-300 mb-3 flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-blue-400" />
            הפריסה הנוכחית (מה שפתוח עכשיו)
          </h3>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-slate-500 mb-1">App ID</p>
              <p className="font-mono text-slate-300">69794b7749148839a583cd2b</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-slate-500 mb-1">כתובת</p>
              <p className="font-mono text-slate-300 truncate">{window.location.hostname}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-3">
              <p className="text-slate-500 mb-1">סביבה</p>
              <p className="font-mono text-slate-300">{import.meta.env.MODE}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
