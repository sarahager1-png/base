import React, { useState, useMemo } from 'react';
import {
  HelpCircle, ChevronDown, ChevronUp, Search, BookOpen,
  Users, Shield, FileText, Bell, Calendar, Clock,
  Printer, Wrench, ShoppingCart, MessageCircle, Star
} from 'lucide-react';

// ─────────────────────────────────────────────
//  FAQ Content
// ─────────────────────────────────────────────
const FAQ = [
  // ── כלליות
  {
    section: 'כלליות', icon: BookOpen, color: '#6366f1',
    items: [
      {
        q: 'איך נכנסים למערכת?',
        a: 'המערכת נפתחת דרך הדפדפן (Chrome / Firefox / Safari). הזינו את כתובת הגישה שקיבלתם מהמנהל/ת. אם אין לכם גישה – פנו למנהל/ת בית הספר.',
      },
      {
        q: 'שכחתי סיסמה – מה עושים?',
        a: 'לחצו על "שכחתי סיסמה" במסך הכניסה. יישלח אליכם קישוס לאיפוס לכתובת המייל שרשומה במערכת. אם אין לכם גישה למייל – צרו קשר עם המנהל/ת.',
      },
      {
        q: 'האפליקציה לא נטענת – מה הבעיה?',
        a: 'נסו לרענן את הדף (F5 או ⌘R). אם הבעיה נמשכת – נסו לנקות את מטמון הדפדפן (Ctrl+Shift+Delete), או פתחו בחלון פרטי (Incognito). ודאו שיש לכם חיבור לאינטרנט.',
      },
      {
        q: 'איך מתקינים את האפליקציה על הטלפון?',
        a: 'פתחו את האפליקציה בדפדפן Chrome בנייד. לחצו על התפריט (3 נקודות) ← "הוסף למסך הבית". האפליקציה תופיע כאייקון על שולחן העבודה וניתן להשתמש בה כמו אפליקציה רגילה.',
      },
      {
        q: 'איך משנים את גודל הגופן?',
        a: 'בראש המסך, ליד כפתור המצב הכהה, ישנם שלושה כפתורים עם האות "א" בגדלים שונים. לחצו על הגודל המתאים לכם. ההגדרה נשמרת לכניסות הבאות.',
      },
      {
        q: 'מה ההבדל בין מצב בהיר למצב כהה?',
        a: 'לחצו על אייקון הירח/שמש בפינה השמאלית העליונה של הפס הכהה. מצב כהה נוח יותר בסביבות עם תאורה חלשה ומפחית עייפות עיניים.',
      },
      {
        q: 'איך עובד ה-Command Palette (⌘K)?',
        a: 'לחצו על ⌘K (Mac) או Ctrl+K (Windows). יפתח חלון חיפוש מהיר שמאפשר לנווט לכל עמוד במערכת ללא עכבר. הקלידו חלק מהשם, השתמשו בחצים ← Enter לניווט.',
      },
    ],
  },

  // ── דיווח ומעקב (מורה)
  {
    section: 'דיווח ומעקב', icon: Clock, color: '#ef4444',
    items: [
      {
        q: 'איך מדווחים על היעדרות?',
        a: 'בלוח הבקרה לחצו על הכפתור הגדול "העדרויות" (אדום). מלאו את הטופס: תאריכי ההיעדרות, הסיבה, פרטי ממלא מקום (אם ידוע) ואם נדרש אישור רפואי. לחצו "שלח". המנהל/ת יקבל התראה.',
      },
      {
        q: 'שלחתי דיווח היעדרות – מתי יאושר?',
        a: 'לאחר השליחה, הבקשה מופיעה בסטטוס "ממתין לאישור" (צהוב). המנהל/ת מטפל/ת בבקשות בדרך כלל תוך 24 שעות. תקבלו התראה ברגע שהסטטוס משתנה.',
      },
      {
        q: 'איך רואים את כל ההיעדרויות שלי?',
        a: 'בלוח הבקרה לחצו על "דוח היעדרויות" (כחול-סגול). תיפתח טבלה מלאה עם כל ההיסטוריה שלכם – תאריכים, סיבות, סטטוסים. לחצו "הדפס / PDF" כדי לייצא לנייר או PDF.',
      },
      {
        q: 'ממתין "אישור רפואי" – מה עושים?',
        a: 'הבקשה עברה לסטטוס "ממתין אישור רפואי" (סגול). צלמו את האישור הרפואי ועלו אותו לבקשה הרלוונטית בעמוד "היעדרויות ודיווח" ← לחיצה על הבקשה ← "העלה אישור".',
      },
      {
        q: 'איך מדווחים על מילוי מקום שביצעתי?',
        a: 'בלוח הבקרה לחצו על "מילוי מקום". מלאו את פרטי השיעור שמילאתם, הכיתה והתאריך. הדוח יישלח לאישור המנהל/ת.',
      },
      {
        q: 'איך מדווחים על שעות נוספות?',
        a: 'לחצו על "שעות נוספות" בלוח הבקרה. הזינו מספר שעות, תיאור הפעילות ותאריך. הבקשה תועבר לאישור.',
      },
    ],
  },

  // ── לוח זמנים ויומן
  {
    section: 'לוח זמנים ויומן', icon: Calendar, color: '#10b981',
    items: [
      {
        q: 'איפה רואים את לוח הזמנים שלי?',
        a: 'בתפריט הצדדי לחצו על "לוח זמנים". תראו את השיעורים השבועיים שלכם. לוח הזמנים מוגדר על ידי המנהל/ת ולא ניתן לעריכה ישירה על ידי המורה.',
      },
      {
        q: 'איך רואים את יומן בית הספר?',
        a: 'לחצו על "יומן בית הספר" בתפריט. תראו את כל האירועים, ימי החופש והפגישות של בית הספר. לוח היומן גלוי לכולם.',
      },
      {
        q: 'איך מוסיפים אירוע ליומן?',
        a: 'רק מנהל/ת ומשנה מנהל/ת יכולים להוסיף אירועים ליומן. אם ברצונכם להוסיף – פנו אליהם.',
      },
      {
        q: 'איך יודעים מה קורה היום?',
        a: 'בכניסה ללוח הבקרה מוצגת הודעה יומית (אם הוגדרה), וכן לוח פגישות היום. הסתכלו על הכרטיס "יומן בית הספר – היום" בפסגת הדשבורד.',
      },
    ],
  },

  // ── בקשות ושירותים
  {
    section: 'בקשות ושירותים', icon: Printer, color: '#8b5cf6',
    items: [
      {
        q: 'איך מבקשים צילומים?',
        a: 'בתפריט "מרכז צילומים" (או כפתור "הדפסה" בדשבורד). מלאו: מה להדפיס, כמה עותקים, לאיזו כיתה, ועד מתי נדרש. הבקשה תועבר לאחראי/ת הצילומים.',
      },
      {
        q: 'הגשתי בקשת צילום – מתי תהיה מוכנה?',
        a: 'לאחר אישור הבקשה, אחראי/ת הצילומים מטפל/ת לפי סדר קדימות. תקבלו התראה כשהבקשה הושלמה.',
      },
      {
        q: 'איך מדווחים על תקלה בחדר / ציוד?',
        a: 'לחצו על "תפעול ורכש" בתפריט ← "דיווח תקלה". ציינו: מה התקלה, איפה (חדר/ציוד), ורמת דחיפות. אב הבית יקבל התראה.',
      },
      {
        q: 'איך מגישים בקשת רכש?',
        a: 'בעמוד "תפעול ורכש" בחרו "בקשת רכש". ציינו: פריט, כמות, מחיר משוער ונימוק. הבקשה תועבר לאישור הנהלה.',
      },
    ],
  },

  // ── הודעות והתראות
  {
    section: 'הודעות והתראות', icon: Bell, color: '#f59e0b',
    items: [
      {
        q: 'לא מקבלים התראות – מה לעשות?',
        a: 'לחצו על פעמון ההתראות בפינה הימנית העליונה. ודאו שהדפדפן נתן הרשאות התראה לאתר. אם לא – ב-Chrome: הגדרות ← פרטיות ← הרשאות אתרים ← התראות.',
      },
      {
        q: 'איך שולחים הודעה להנהלה?',
        a: 'בלוח הבקרה לחצו על "שלח הודעה להנהלה". כתבו את ההודעה ושלחו. ההנהלה תקבל התראה.',
      },
      {
        q: 'איפה רואים הודעות שנשלחו אלי?',
        a: 'לחצו על "מרכז הודעות" בתפריט הצדדי (אייקון פעמון). תוכלו לראות את כל ההודעות שהתקבלו.',
      },
    ],
  },

  // ── למנהל/ת
  {
    section: 'למנהל/ת', icon: Shield, color: '#0891b2',
    items: [
      {
        q: 'איך מאשרים / דוחים היעדרות?',
        a: 'בלוח הבקרה הניהולי, גללו ל"היעדרויות ממתינות". לחצו על הבקשה הרלוונטית ← "אשר" או "דחה". ניתן להוסיף הערה. המורה יקבל/ת התראה מיידית.',
      },
      {
        q: 'איך מוסיפים עובד/ת חדש/ה למערכת?',
        a: 'עברו ל"ניהול צוות" בתפריט. לחצו "הוסף עובד". מלאו: שם מלא, מייל, תפקיד וסוג מגדר (בן/בת). המערכת תשלח הזמנה לכניסה.',
      },
      {
        q: 'איך מגדירים הודעה יומית?',
        a: 'עברו ל"ניהול צוות" ← "הגדרות מוסד" ← לשונית "הודעות יומיות". לחצו "הוסף הודעה", בחרו סוג (חג / יום הולדת / ציטוט / הכרזה), הגדירו תאריך (חד-פעמי או שנתי חוזר), כתבו את ההודעה ושמרו. ההודעה תופיע לכל הצוות בתאריך שנקבע.',
      },
      {
        q: 'איך מגדירים את סוג בית הספר (בנים/בנות/מעורב)?',
        a: 'הגדרות מוסד ← לשונית "סוג בית הספר". בחרו: בית ספר בנות (פנייה בלשון נקבה), בנים (זכר) או מעורב. ניתן גם להגדיר לכל עובד/ת את המגדר האישי שלו/שלה דרך "ניהול צוות" ← לחיצה על העובד/ת.',
      },
      {
        q: 'איך יוצרים דוח לתדפיס?',
        a: 'בלוח הבקרה הניהולי לחצו "ייצוא דוח PDF". המסך יתאים את עצמו להדפסה ותוכלו לשמור כ-PDF. עבור מורה ספציפי/ת – בקשו ממנו/ממנה להפיק דוח אישי.',
      },
      {
        q: 'איך רואים מה קרה היום במערכת?',
        a: 'בלוח הבקרה הניהולי, גללו ל"פעילות אחרונה". תוכלו לראות פיד בזמן אמת של כל הפעולות: היעדרויות חדשות, בקשות רכש, תקלות תחזוקה – עם חותמת זמן לכל פעולה.',
      },
      {
        q: 'איך שולחים הודעה לכל הצוות?',
        a: 'בלוח הבקרה לחצו "שלח WhatsApp לצוות" לפתיחת WhatsApp Web עם הודעה מוכנה, או "הערה מעצימה לצוות" לשליחת הודעה דרך מערכת ההודעות הפנימית.',
      },
    ],
  },

  // ── אבחון תקלות
  {
    section: 'אבחון תקלות', icon: Wrench, color: '#64748b',
    items: [
      {
        q: 'הדף נטען אבל ריק – מה קורה?',
        a: 'ייתכן שאין לכם הרשאה לתצוגה זו, או שיש בעיית תקשורת עם השרת. נסו לרענן (F5). אם הבעיה חוזרת – צרו קשר עם מנהל/ת המערכת.',
      },
      {
        q: 'לחצתי שמור אבל השינויים לא נשמרו?',
        a: 'ודאו שהופיעה הודעת הצלחה (ירוקה) בפינה. אם לא הופיעה – בדקו שיש חיבור לאינטרנט ונסו שוב. אם השגיאה נמשכת – צלמו מסך ופנו לתמיכה.',
      },
      {
        q: 'המערכת איטית – מה לעשות?',
        a: '1. סגרו לשוניות מיותרות בדפדפן. 2. נסו Chrome במקום Safari. 3. נסו לנקות מטמון (Ctrl+Shift+Delete). 4. ודאו שהאינטרנט תקין.',
      },
    ],
  },
];

// ─────────────────────────────────────────────
//  Components
// ─────────────────────────────────────────────
function FAQItem({ q, a, isOpen, onToggle }) {
  return (
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden
      ${isOpen ? 'border-indigo-200 dark:border-indigo-700 shadow-sm' : 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600'}`}>
      <button
        className="w-full flex items-start justify-between gap-4 p-4 text-right"
        onClick={onToggle}
      >
        <span className={`font-semibold text-sm leading-relaxed ${isOpen ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-100'}`}>
          {q}
        </span>
        <div className={`flex-shrink-0 mt-0.5 p-0.5 rounded-full transition-colors
          ${isOpen ? 'bg-indigo-100 dark:bg-indigo-900' : 'bg-slate-100 dark:bg-slate-700'}`}>
          {isOpen
            ? <ChevronUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

export default function HelpCenter({ userRole }) {
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  const [activeSection, setActiveSection] = useState('all');

  // Filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQ.map(section => ({
      ...section,
      items: section.items.filter(item =>
        !q || item.q.includes(q) || item.a.includes(q)
      ),
    })).filter(s => {
      if (activeSection !== 'all' && s.section !== activeSection) return false;
      return s.items.length > 0;
    });
  }, [query, activeSection]);

  const totalResults = filtered.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden p-8 text-white"
           style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #6366f1 100%)' }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-8 -left-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-6 -right-6 h-28 w-28 rounded-full bg-white/10" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <HelpCircle className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black">מרכז עזרה</h1>
              <p className="text-white/70 text-sm">שאלות ותשובות – SMART BASE</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="חפשו שאלה..."
              className="w-full bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl pr-10 pl-4 py-3 text-white placeholder-white/50 outline-none focus:bg-white/20 focus:border-white/40 transition-all text-sm"
            />
          </div>
          {query && (
            <p className="text-white/60 text-xs mt-2">
              {totalResults === 0 ? 'לא נמצאו תוצאות' : `נמצאו ${totalResults} תשובות`}
            </p>
          )}
        </div>
      </div>

      {/* Section Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveSection('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border
            ${activeSection === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-indigo-300'}`}
        >
          הכל
        </button>
        {FAQ.map(s => (
          <button
            key={s.section}
            onClick={() => setActiveSection(activeSection === s.section ? 'all' : s.section)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border
              ${activeSection === s.section ? 'text-white border-transparent' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-indigo-300'}`}
            style={activeSection === s.section ? { background: s.color } : {}}
          >
            <s.icon className="h-3.5 w-3.5" />
            {s.section}
          </button>
        ))}
      </div>

      {/* FAQ Sections */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-semibold">לא נמצאו תוצאות</p>
          <p className="text-sm mt-1">נסו מילות חיפוש אחרות</p>
        </div>
      ) : (
        filtered.map(section => (
          <div key={section.section} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Section Header */}
            <div className="flex items-center gap-3 p-5 border-b border-slate-100 dark:border-slate-700">
              <div className="p-2.5 rounded-xl"
                   style={{ background: `${section.color}18`, border: `1px solid ${section.color}30` }}>
                <section.icon className="h-5 w-5" style={{ color: section.color }} />
              </div>
              <h2 className="font-bold text-slate-800 dark:text-white">{section.section}</h2>
              <span className="mr-auto text-xs text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                {section.items.length} שאלות
              </span>
            </div>

            {/* Items */}
            <div className="p-4 space-y-2">
              {section.items.map((item, i) => {
                const id = `${section.section}-${i}`;
                return (
                  <FAQItem
                    key={id}
                    q={item.q}
                    a={item.a}
                    isOpen={openId === id}
                    onToggle={() => setOpenId(openId === id ? null : id)}
                  />
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Contact Footer */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-center text-white">
        <Star className="h-8 w-8 mx-auto mb-3 text-yellow-400" />
        <h3 className="font-bold text-lg mb-1">לא מצאתם תשובה?</h3>
        <p className="text-slate-400 text-sm mb-4">פנו למנהל/ת המערכת שיוכלו לעזור לכם ישירות.</p>
        <p className="text-xs text-slate-500">SMART BASE · מערכת ניהול חכמה</p>
      </div>
    </div>
  );
}
