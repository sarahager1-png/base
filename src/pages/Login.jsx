import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, ChevronLeft, Bell, Calendar, CalendarDays,
  CheckSquare, Clock, Users, UserPlus, Printer, Settings,
  Shield, Home, Files, Heart, BarChart2, HelpCircle,
  LayoutDashboard, ArrowLeft, Star, Zap, Lock, Globe,
  ChevronDown, Play
} from 'lucide-react';

/* ─── Data ─────────────────────────────────────────────── */
const MODULES = [
  { icon: LayoutDashboard, label: 'לוח בקרה',       color: '#6366f1', desc: 'מבט כולל על כל הנעשה' },
  { icon: Bell,            label: 'התראות',           color: '#f59e0b', desc: 'עדכונים בזמן אמת' },
  { icon: Calendar,        label: 'יומן בית הספר',   color: '#10b981', desc: 'אירועים וחגים' },
  { icon: CalendarDays,    label: 'לוח זמנים',        color: '#3b82f6', desc: 'סדר יום מסודר' },
  { icon: CheckSquare,     label: 'משימות ואישורים',  color: '#8b5cf6', desc: 'ניהול פניות ואישורים' },
  { icon: Clock,           label: 'היעדרויות',        color: '#ef4444', desc: 'דיווח ומעקב' },
  { icon: Users,           label: 'ניהול צוות',       color: '#f97316', desc: 'מידע עובדים' },
  { icon: UserPlus,        label: 'קליטת עובדים',     color: '#14b8a6', desc: 'טפסים דיגיטליים' },
  { icon: Printer,         label: 'מרכז צילומים',     color: '#06b6d4', desc: 'בקשות הדפסה' },
  { icon: Settings,        label: 'תפעול ורכש',       color: '#64748b', desc: 'הזמנות ורכש' },
  { icon: Shield,          label: 'ניהול תורנויות',   color: '#ec4899', desc: 'שיבוץ אוטומטי' },
  { icon: Home,            label: 'ניהול חדרים',      color: '#84cc16', desc: 'הזמנת מרחבים' },
  { icon: Files,           label: 'ניהול קבצים',      color: '#0ea5e9', desc: 'מסמכים משותפים' },
  { icon: Heart,           label: 'קהילה והווי',      color: '#f43f5e', desc: 'אירועים חברתיים' },
  { icon: BarChart2,       label: 'אנליטיקס',         color: '#a855f7', desc: 'נתונים וגרפים' },
  { icon: HelpCircle,      label: 'מרכז עזרה',        color: '#475569', desc: 'תמיכה מיידית' },
];

const ROLES = [
  { emoji: '👩‍💼', title: 'מנהלת',       desc: 'תמונת מצב מלאה, אנליטיקס, ניהול צוות' },
  { emoji: '📋', title: 'מזכירה',       desc: 'תור הדפסות, היעדרויות, אישורים' },
  { emoji: '👩‍🏫', title: 'מורה',         desc: 'לוח זמנים, משימות, דיווח נוכחות' },
  { emoji: '🛠️', title: 'אב בית',       desc: 'תפעול, רכש, ניהול חדרים' },
  { emoji: '🤝', title: 'יועצת',        desc: 'מעקב תלמידים, יומן, אירועים' },
  { emoji: '⚡', title: 'מילוי מקום',   desc: 'לוח זמנים, טפסי קליטה מהירים' },
];

const STATS = [
  { num: '16',   label: 'מודולים מובנים' },
  { num: '10+',  label: 'תפקידים נתמכים' },
  { num: '100%', label: 'עברית RTL' },
  { num: '∞',    label: 'נגישות' },
];

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  w: 3 + (i % 5) * 2,
  top: (i * 13.7) % 95,
  left: (i * 17.3) % 95,
  dur: 3 + (i % 4),
  delay: (i * 0.4) % 3,
  color: i % 3 === 0 ? '#6366f1' : i % 3 === 1 ? '#8b5cf6' : '#a78bfa',
}));

/* ─── Animated Counter ──────────────────────────────────── */
function Counter({ target }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const num = parseInt(target) || 0;
        let start = 0;
        const step = Math.ceil(num / 40);
        const id = setInterval(() => {
          start += step;
          if (start >= num) { setVal(num); clearInterval(id); }
          else setVal(start);
        }, 30);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{val}</span>;
}

/* ─── Main ──────────────────────────────────────────────── */
export default function Login({ onLogin }) {
  const [visible, setVisible] = useState(false);
  const [hoveredModule, setHoveredModule] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const scrollToModules = () =>
    document.getElementById('modules-section')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="min-h-screen font-sans overflow-x-hidden" dir="rtl"
         style={{ background: 'linear-gradient(160deg, #060b18 0%, #0f172a 40%, #0c1a2e 70%, #060b18 100%)' }}>

      {/* ══ Sticky nav ══ */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'py-2 border-b border-white/10 backdrop-blur-xl' : 'py-4'}`}
           style={scrolled ? { background: 'rgba(6,11,24,0.85)' } : {}}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl flex items-center justify-center overflow-hidden shadow-lg"
                 style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
              <img src="/logo.svg" alt="SMART BASE" className="h-5 w-5" />
            </div>
            <span className="text-white font-black tracking-widest text-sm">SMART BASE</span>
          </div>
          <button onClick={onLogin}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 4px 20px #6366f150' }}>
            <Sparkles className="h-4 w-4" />
            כניסה למערכת
          </button>
        </div>
      </nav>

      {/* ══ Hero ══ */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center overflow-hidden">
        {/* BG glows + particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] rounded-full opacity-15 blur-3xl"
               style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
          <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
               style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />
          <div className="absolute inset-0 opacity-[0.03]"
               style={{
                 backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)',
                 backgroundSize: '60px 60px',
               }} />
          {PARTICLES.map(p => (
            <div key={p.id} className="absolute rounded-full"
                 style={{
                   width: p.w, height: p.w,
                   top: `${p.top}%`, left: `${p.left}%`,
                   background: p.color, opacity: 0.2,
                   animation: `floatP ${p.dur}s ${p.delay}s infinite alternate ease-in-out`,
                 }} />
          ))}
        </div>

        <div className={`relative z-10 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-bold text-indigo-300 border border-indigo-500/30"
               style={{ background: 'rgba(99,102,241,0.12)' }}>
            <Zap className="h-3.5 w-3.5 text-yellow-400" />
            מערכת ניהול חכמה לבתי ספר · 2025
            <Star className="h-3.5 w-3.5 text-yellow-400" />
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black text-white leading-none mb-6 tracking-tight">
            <span className="block">ניהול בית הספר</span>
            <span className="block mt-2"
                  style={{
                    background: 'linear-gradient(135deg, #818cf8 0%, #a78bfa 40%, #c084fc 70%, #e879f9 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  }}>
              הפך להיות חכם
            </span>
          </h1>

          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            פלטפורמה אחת לכל הצוות. 16 מודולים. 10 תפקידים. ממשק עברי מלא.<br className="hidden sm:block" />
            מהמורה ועד המנהלת — הכל במקום אחד.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button onClick={onLogin}
                    className="group relative flex items-center gap-3 px-8 py-4 rounded-2xl text-white font-black text-lg transition-all duration-200 hover:scale-105 active:scale-95 overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                      boxShadow: '0 20px 60px #6366f155, 0 0 0 1px rgba(255,255,255,0.1) inset',
                    }}>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                   style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)' }} />
              <Sparkles className="h-5 w-5 relative z-10 group-hover:rotate-12 transition-transform" />
              <span className="relative z-10">כניסה למערכת</span>
              <ChevronLeft className="h-5 w-5 relative z-10 group-hover:-translate-x-1 transition-transform" />
            </button>

            <button onClick={scrollToModules}
                    className="flex items-center gap-2 px-6 py-4 rounded-2xl text-slate-300 font-semibold text-sm transition-all hover:text-white hover:bg-white/5 border border-white/10">
              <Play className="h-4 w-4" />
              גלה את הפיצ׳רים
            </button>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {STATS.map(({ num, label }) => (
              <div key={label} className="rounded-2xl p-4 border border-white/8 text-center"
                   style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)' }}>
                <p className="text-2xl font-black text-white mb-0.5">
                  {/^\d+$/.test(num) ? <Counter target={num} /> : num}
                </p>
                <p className="text-slate-500 text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <button onClick={scrollToModules}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                style={{ animation: 'bounce 2s infinite' }}>
          <ChevronDown className="h-6 w-6" />
        </button>
      </section>

      {/* ══ Modules ══ */}
      <section id="modules-section" className="relative px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-indigo-300 border border-indigo-500/30 mb-4"
                  style={{ background: 'rgba(99,102,241,0.1)' }}>
              16 מודולים מובנים
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              כל מה שצריך,<br />
              <span style={{
                background: 'linear-gradient(135deg, #34d399, #10b981)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>במקום אחד</span>
            </h2>
            <p className="text-slate-400 text-base max-w-xl mx-auto">
              מלוח בקרה ועד אנליטיקס — הכל מתוכנן לחוויה ישראלית אמיתית
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {MODULES.map(({ icon: Icon, label, color, desc }, idx) => {
              const isHov = hoveredModule === idx;
              return (
                <div key={label}
                     onMouseEnter={() => setHoveredModule(idx)}
                     onMouseLeave={() => setHoveredModule(null)}
                     className="relative group rounded-2xl p-4 cursor-default transition-all duration-300"
                     style={{
                       background: `linear-gradient(135deg, ${color}15, ${color}08)`,
                       border: `1px solid ${color}35`,
                       transform: isHov ? 'translateY(-5px) scale(1.02)' : 'none',
                       boxShadow: isHov ? `0 24px 48px ${color}30, 0 0 0 1px ${color}50` : `0 2px 12px ${color}15`,
                     }}>
                  {/* Subtle top glow stripe */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
                       style={{ background: `linear-gradient(90deg, transparent, ${color}80, transparent)` }} />
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-3 transition-all duration-300"
                       style={{
                         background: `linear-gradient(135deg, ${color}45, ${color}25)`,
                         border: `1px solid ${color}60`,
                         boxShadow: isHov ? `0 0 24px ${color}50` : `0 4px 12px ${color}25`,
                       }}>
                    <Icon className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" style={{ color }} />
                  </div>
                  <p className="text-white text-sm font-bold mb-1 leading-tight">{label}</p>
                  <p className="text-slate-400 text-xs leading-snug">{desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ Roles ══ */}
      <section className="relative px-6 py-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full opacity-8 blur-3xl"
               style={{ background: 'radial-gradient(ellipse, #8b5cf6, transparent)' }} />
        </div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold text-purple-300 border border-purple-500/30 mb-4"
                  style={{ background: 'rgba(139,92,246,0.1)' }}>
              מותאם לכל תפקיד
            </span>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4">
              ממשק ייחודי<br />
              <span style={{
                background: 'linear-gradient(135deg, #c084fc, #a855f7)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>לכל תפקיד</span>
            </h2>
            <p className="text-slate-400 text-base max-w-xl mx-auto">
              כל עובד רואה רק את מה שרלוונטי עבורו — פחות בלבול, יותר יעילות
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {ROLES.map(({ emoji, title, desc }) => (
              <div key={title}
                   className="group rounded-2xl p-5 border border-white/8 text-center transition-all duration-300 hover:border-purple-500/40 hover:-translate-y-1"
                   style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">{emoji}</div>
                <p className="text-white font-bold text-sm mb-1">{title}</p>
                <p className="text-slate-500 text-[11px] leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ Feature highlights ══ */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Globe, color: '#10b981', title: 'עברית מלאה', desc: 'RTL מושלם, תאריך עברי, שמות חודשים — הכל בעברית אמיתית' },
              { icon: Lock,  color: '#6366f1', title: 'הרשאות חכמות', desc: 'כל תפקיד רואה רק את הרלוונטי לו — מאובטח ומסודר' },
              { icon: Zap,   color: '#f59e0b', title: 'מהיר ומגיב', desc: 'PWA מלא, עובד גם בסלולרי, עם עדכונים בזמן אמת' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title}
                   className="group rounded-2xl p-6 border border-white/8 flex gap-4 items-start transition-all duration-300 hover:-translate-y-1"
                   style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                     style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
                  <Icon className="h-6 w-6" style={{ color }} />
                </div>
                <div>
                  <p className="text-white font-bold text-base mb-1">{title}</p>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ CTA banner ══ */}
      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-3xl overflow-hidden p-12 text-center"
               style={{
                 background: 'linear-gradient(135deg, #3730a3 0%, #4f46e5 35%, #7c3aed 70%, #6d28d9 100%)',
                 boxShadow: '0 40px 100px #6366f140',
               }}>
            {/* Decorations */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 blur-2xl"
                   style={{ background: 'radial-gradient(circle, #a5b4fc, transparent)' }} />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full opacity-20 blur-2xl"
                   style={{ background: 'radial-gradient(circle, #c4b5fd, transparent)' }} />
              <div className="absolute inset-0 opacity-5"
                   style={{
                     backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
                     backgroundSize: '30px 30px',
                   }} />
            </div>

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-bold text-indigo-200 border border-white/25"
                   style={{ background: 'rgba(255,255,255,0.15)' }}>
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                גישה מורשית לצוות בית הספר
              </div>

              <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">מוכנים להתחיל?</h2>
              <p className="text-indigo-200 text-lg mb-10 max-w-lg mx-auto">
                הצטרפו לצוות בית הספר וגלו את כל מה שהמערכת יכולה לעשות עבורכם
              </p>

              <button onClick={onLogin}
                      className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-white text-indigo-700 font-black text-lg transition-all duration-200 hover:scale-105 active:scale-95 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700"
                     style={{ background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.08), transparent)' }} />
                <Sparkles className="h-5 w-5 relative z-10 text-indigo-500 group-hover:rotate-12 transition-transform" />
                <span className="relative z-10">כניסה למערכת</span>
                <ArrowLeft className="h-5 w-5 relative z-10 text-indigo-500 group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ Footer ══ */}
      <footer className="px-6 py-8 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="h-7 w-7 rounded-lg flex items-center justify-center overflow-hidden"
               style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
            <img src="/logo.svg" alt="" className="h-4 w-4" />
          </div>
          <span className="text-white font-black tracking-widest text-xs">SMART BASE</span>
        </div>
        <p className="text-slate-600 text-xs">© {new Date().getFullYear()} Smart Base · מערכת ניהול חכמה לבתי ספר</p>
      </footer>

      <style>{`
        @keyframes floatP {
          from { opacity: 0.15; transform: translateY(0px) scale(1); }
          to   { opacity: 0.35; transform: translateY(-14px) scale(1.3); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-8px); }
        }
      `}</style>
    </div>
  );
}
