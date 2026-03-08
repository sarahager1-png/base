import React, { useState, useEffect } from 'react';
import {
  Eye, EyeOff, LogIn,
  Home, Bell, Calendar, CheckSquare, Clock, Users, UserPlus,
  Printer, Settings, Heart, BarChart2, HelpCircle, Shield, BookOpen,
  PenLine, Download, Palmtree, MessageSquare
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const FEATURES = [
  { icon: Home,         label: 'לוח בקרה',         color: '#6366f1' },
  { icon: Calendar,     label: 'יומן בית הספר',    color: '#8b5cf6' },
  { icon: Clock,        label: 'היעדרויות ודיווח',  color: '#ec4899' },
  { icon: CheckSquare,  label: 'משימות ואישורים',   color: '#f59e0b' },
  { icon: Users,        label: 'ניהול צוות (HR)',   color: '#10b981' },
  { icon: Shield,       label: 'ניהול תורנויות',    color: '#3b82f6' },
  { icon: Printer,      label: 'מרכז צילומים',      color: '#06b6d4' },
  { icon: Settings,     label: 'תפעול ורכש',        color: '#f97316' },
  { icon: Heart,        label: 'קהילה והווי',       color: '#ef4444' },
  { icon: BarChart2,    label: 'אנליטיקס ותובנות',  color: '#a855f7' },
  { icon: UserPlus,     label: 'טפסי קליטה',        color: '#14b8a6' },
  { icon: BookOpen,     label: 'ניהול חדרים',       color: '#84cc16' },
  { icon: PenLine,      label: 'חתימה דיגיטלית',   color: '#8b5cf6' },
  { icon: Download,     label: 'ייצוא דוחות',       color: '#22c55e' },
  { icon: Palmtree,     label: 'לוח שנה — חגים',    color: '#f59e0b' },
  { icon: MessageSquare,label: 'הודעות ותקשורת',    color: '#6366f1' },
];

export default function Login() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Cycle through highlighted features
  useEffect(() => {
    const t = setInterval(() => setActiveFeature(p => (p + 1) % FEATURES.length), 1800);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.reload();
    } catch {
      setError('אימייל או סיסמה שגויים');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex relative overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #0f0c29 0%, #1e1b4b 40%, #312e81 100%)' }}
      dir="rtl"
    >
      {/* Aurora blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] opacity-20 blur-[100px]"
             style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] opacity-15 blur-[80px]"
             style={{ background: 'radial-gradient(circle, #4f46e5, transparent)' }} />
        <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] opacity-10 blur-[60px]"
             style={{ background: 'radial-gradient(circle, #a78bfa, transparent)' }} />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]"
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      {/* ─── LEFT PANEL: Features showcase ─── */}
      <div className={`hidden lg:flex flex-col justify-center flex-1 px-12 xl:px-20 py-12 relative z-10 transition-all duration-700 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}>
        {/* Logo */}
        <div className="mb-10">
          <img src="/logo-full.jpeg" alt="Smart Base"
               className="h-16 rounded-2xl shadow-xl object-contain" />
          <p className="text-purple-300 text-sm mt-3 font-medium">מערכת ניהול חכמה לבית הספר</p>
        </div>

        <h2 className="text-4xl font-black text-white mb-2 leading-tight">
          כל מה שצוות<br />
          <span style={{ background: 'linear-gradient(90deg, #c4b5fd, #a78bfa, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            בית הספר צריך
          </span>
        </h2>
        <p className="text-slate-400 text-base mb-10">במקום אחד, מכל מכשיר, בכל זמן</p>

        {/* Features grid */}
        <div className="grid grid-cols-4 gap-3">
          {FEATURES.map(({ icon: Icon, label, color }, i) => (
            <div
              key={i}
              className="rounded-xl p-3 border transition-all duration-500 cursor-default select-none"
              style={{
                background: activeFeature === i
                  ? `linear-gradient(135deg, ${color}25, ${color}10)`
                  : 'rgba(255,255,255,0.03)',
                borderColor: activeFeature === i ? `${color}60` : 'rgba(255,255,255,0.07)',
                transform: activeFeature === i ? 'scale(1.04)' : 'scale(1)',
                boxShadow: activeFeature === i ? `0 0 20px ${color}30` : 'none',
              }}
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg flex-shrink-0"
                     style={{ background: `${color}22` }}>
                  <Icon className="h-3.5 w-3.5" style={{ color }} />
                </div>
                <p className="text-white text-[11px] font-semibold leading-tight">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Stats bar */}
        <div className="mt-10 flex gap-8">
          {[
            { n: '16+', label: 'מודולים' },
            { n: '100%', label: 'ענן ומובייל' },
            { n: 'PWA', label: 'כאפליקציה' },
          ].map(({ n, label }) => (
            <div key={label}>
              <p className="text-2xl font-black" style={{ color: '#c4b5fd' }}>{n}</p>
              <p className="text-slate-500 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── RIGHT PANEL: Login form ─── */}
      <div className={`flex items-center justify-center w-full lg:w-[420px] xl:w-[460px] flex-shrink-0 p-6 relative z-10 transition-all duration-700 delay-100 ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}>
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img src="/logo-full.jpeg" alt="Smart Base"
                 className="h-16 rounded-2xl shadow-xl object-contain mx-auto mb-3" />
            <p className="text-purple-300 text-sm">מערכת ניהול חכמה לבית הספר</p>
          </div>

          {/* Card */}
          <div className="rounded-3xl p-8 shadow-2xl"
               style={{
                 background: 'linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                 border: '1px solid rgba(255,255,255,0.12)',
                 backdropFilter: 'blur(20px)',
               }}>

            {/* Shimmer top line */}
            <div className="absolute top-0 left-8 right-8 h-px rounded-full"
                 style={{ background: 'linear-gradient(90deg, transparent, rgba(196,181,253,0.5), transparent)' }} />

            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
                   style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                <LogIn className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-black text-white mb-1">ברוכים הבאים</h2>
              <p className="text-slate-400 text-sm">התחברו כדי לגשת למערכת</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 mr-1">אימייל</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-slate-600 outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    direction: 'ltr',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(167,139,250,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 mr-1">סיסמה</label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-slate-600 outline-none transition-all"
                    style={{
                      background: 'rgba(255,255,255,0.07)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      direction: 'ltr',
                      paddingLeft: '44px',
                    }}
                    onFocus={e => e.target.style.borderColor = 'rgba(167,139,250,0.6)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                     style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                  <div className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-xs">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl text-white font-bold text-sm transition-all duration-200 hover:opacity-90 hover:scale-[1.01] active:scale-[0.99] shadow-xl disabled:opacity-60 mt-2"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #6d28d9 100%)',
                  boxShadow: '0 8px 30px rgba(109,40,217,0.5)',
                }}
              >
                <LogIn className="h-4 w-4" />
                {loading ? 'מתחבר...' : 'כניסה למערכת'}
              </button>
            </form>

            <p className="text-center text-slate-600 text-xs mt-6">
              גישה מורשית לצוות בית הספר בלבד
            </p>
          </div>

          {/* Mobile feature pills */}
          <div className="lg:hidden mt-6 flex flex-wrap gap-2 justify-center">
            {FEATURES.slice(0, 8).map(({ icon: Icon, label, color }, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                   style={{ background: `${color}18`, border: `1px solid ${color}35`, color }}>
                <Icon className="h-3 w-3" />
                {label}
              </div>
            ))}
          </div>

          <p className="text-center text-slate-700 text-[11px] mt-6">
            © {new Date().getFullYear()} Smart Base · מערכת ניהול חכמה
          </p>
        </div>
      </div>
    </div>
  );
}
