import React, { useState, useMemo } from 'react';
import {
  HelpCircle, ChevronDown, ChevronUp, Search, BookOpen,
  Users, Shield, Bell, Calendar, Clock,
  Printer, Wrench, MessageCircle, Star, ArrowLeft,
  BarChart2, SlidersHorizontal, CheckSquare, FileText,
  Home, UserCircle, Heart, FolderOpen, BarChart3
} from 'lucide-react';

// ─── FAQ data ──────────────────────────────────────────────────────────────────
// roles: ['all'] | array of role strings | undefined = all
const FAQ = [
  {
    section: 'כלליות',
    icon: BookOpen, color: '#2563eb',
    view: null,
    roles: ['all'],
    items: [
      { q: 'איך נכנסים למערכת?', a: 'פתחו את smart-base-chabad.surge.sh בדפדפן. הזינו את המייל והסיסמה שקיבלתם. אם אין לכם גישה – פנו למנהל/ת.' },
      { q: 'שכחתי סיסמה – מה עושים?', a: 'לחצו "שכחתי סיסמה" במסך הכניסה. יישלח קישור לאיפוס למייל הרשום. אם אין גישה למייל – פנו למנהל/ת.' },
      { q: 'האפליקציה לא נטענת', a: 'רענן (F5). אם לא עוזר – נקו מטמון דפדפן (Ctrl+Shift+Delete) ונסו שוב. ודאו חיבור לאינטרנט.' },
      { q: 'איך מתקינים על הטלפון?', a: 'פתחו ב-Chrome בנייד ← תפריט 3 נקודות ← "הוסף למסך הבית". הלחצן "התקן" מופיע גם בסרגל העליון של האפליקציה.' },
      { q: 'איך משנים גודל גופן?', a: 'בסרגל העליון ישנם שלושה כפתורי "א" בגדלים שונים. לחצו על הגודל הנוח. ההגדרה נשמרת.' },
      { q: 'מה ההבדל בין מצב בהיר לכהה?', a: 'לחצו על אייקון ירח/שמש בסרגל העליון. מצב כהה נוח לאור חלש ומפחית עייפות עיניים.' },
      { q: 'מה זה חיפוש מהיר (⌘K)?', a: 'לחצו Ctrl+K (או ⌘K במק). יפתח חלון שמאפשר לנווט לכל עמוד בלי עכבר – הקלידו שם ← Enter.' },
      { q: 'הפרופיל שלי – איך עורכים?', a: 'לחצו על שמכם בפינה הימנית העליונה ← "הפרופיל שלי". אפשר לשנות: שם, תפקיד, טלפון, מגדר.' },
    ],
  },
  {
    section: 'לוח בקרה',
    icon: Home, color: '#0d9488',
    view: 'dashboard',
    roles: ['all'],
    items: [
      { q: 'מה רואים בלוח הבקרה?', a: 'לוח הבקרה מותאם לפי תפקידכם. מורים רואים: יומן, פעולות מהירות, לוח זמנים, תורנות. מנהל/ת רואה: כל ההיעדרויות, משימות פתוחות, דוח יום ועוד.' },
      { q: 'כפתורי הפעולות המהירות', a: 'בלוח הבקרה של מורה/סגל: לחיצה על כפתור פותחת טופס מהיר. אין צורך לנווט לעמוד נפרד. למשל: "עדרויות", "שעות נוספות", "צילומים", "רכש", "תחזוקה".' },
      { q: 'מהי הודעה יומית?', a: 'בכניסה עשויה לצוץ הודעה יומית (הכרזה, ציטוט, יום הולדת). ניתן לסגור אותה. המנהל/ת מגדיר/ה אותה ב"הגדרות מערכת".' },
      { q: 'איפה רואים תורנות של היום?', a: 'בלוח הבקרה בתחתית. אם יש לכם תורנות – תופיע הודעה צהובה עם פרטים. אם לא – לא מוצגת.' },
    ],
  },
  {
    section: 'היעדרויות ודיווח',
    icon: Clock, color: '#eab308',
    view: 'attendance',
    roles: ['all'],
    items: [
      { q: 'איך מדווחים על היעדרות?', a: 'לחצו "העדרויות" (כפתור אדום בדשבורד) ← מלאו תאריך, סיבה ופרטים ← שלח. המנהל/ת יקבל התראה.' },
      { q: 'מה הסטטוסים האפשריים?', a: 'ממתין לאישור (צהוב) ← מאושר (ירוק) / נדחה (אדום) / ממתין אישור רפואי (כתום). בסטטוס "ממתין אישור רפואי" – יש להגיש אישור.' },
      { q: 'איך רואים את ההיסטוריה שלי?', a: 'בתפריט ← "היעדרויות ודיווח" ← לשונית "היעדרויות". רואים את כל הדיווחים עם סטטוסים ותאריכים.' },
      { q: 'איך מדווחים על מילוי מקום?', a: 'בדשבורד ← "מילוי מקום" ← מלאו תאריך, שעות, כיתה ושם המורה הנעדר/ת ← שלח.' },
      { q: 'איך מדווחים על שעות נוספות?', a: 'בדשבורד ← "שעות נוספות" ← הזינו תאריך, מספר שעות ופירוט. יש גם "שעות מיוחדות" לצומחים מחדש/תורנות.' },
      { q: 'איך מדווחים פעילות חוץ?', a: 'בדשבורד ← "פעילות חוץ" ← ציינו יעד, שעת יציאה וחזרה.' },
    ],
  },
  {
    section: 'אישור היעדרויות',
    icon: Shield, color: '#0891b2',
    view: 'attendance',
    roles: ['admin', 'vice_principal', 'secretary'],
    items: [
      { q: 'איך מאשרים היעדרות?', a: 'בדשבורד הניהולי ← פאנל "היעדרויות ממתינות" ← לחצו "אשר" או "דחה". ניתן להוסיף הערה. המורה מקבל/ת התראה מיידית.' },
      { q: 'איך מזינים היעדרות ידנית?', a: 'בעמוד "היעדרויות ודיווח" ← כפתור "הזנה ידנית" (כחול). בחרו מורה, תאריכים וסיבה. שמיד מופיע ברשימה.' },
      { q: 'מה טאב "סטטיסטיקה"?', a: 'מציג טבלה: לכל עובד – מספר ימי היעדרות (מאושרים, ממתינים, נדחו) ממוינת מגבוהה לנמוכה.' },
      { q: 'מה דוח אופקית?', a: 'טאב "דוח אופקית" מציג את כל ההיעדרויות לחודש שנבחר. סמנו כל היעדרות שדווחה במשרד החינוך. יצוא ל-CSV ו-Excel זמין.' },
      { q: 'מה דוח שעות נוספות?', a: 'טאב "שעות נוספות" מציג טבלה לפי עובד: שעות רגילות, שעות מיוחדות וסה"כ. יצוא ל-Excel. כולל פירוט לכל דיווח.' },
    ],
  },
  {
    section: 'לוח זמנים ויומן',
    icon: Calendar, color: '#10b981',
    view: 'schedule',
    roles: ['all'],
    items: [
      { q: 'איפה רואים את לוח הזמנים שלי?', a: 'בתפריט ← "לוח זמנים". מוצג תצוגה שבועית עם שיעורים לפי כיתה ומקצוע. בדשבורד מורה מוצגת תצוגה מקוצרת של היום.' },
      { q: 'איך מעלים לוח זמנים?', a: 'מנהל/ת / רכז/ת ← עמוד "לוח זמנים" ← לשונית "העלאת מערכת" ← הורידו תבנית CSV ← מלאו ← העלו. ניתן גם ב-Excel.' },
      { q: 'מה הפורמט הנדרש לייצוא?', a: 'עמודות נדרשות: email, day (0-6 או שם יום עברי), lesson (1-8), subject (מקצוע), class_name. הורידו תבנית מהעמוד.' },
      { q: 'איפה רואים את יומן בית הספר?', a: 'בתפריט ← "יומן בית הספר". כולל אירועים, ימי חופש ופגישות. כולם יכולים לצפות, רק הנהלה יכולה לערוך.' },
      { q: 'איך מוסיפים אירוע ליומן?', a: 'ב"ניהול יומן" (תפריט ← "ניהול יומן") ← הוסף אירוע. נגיש למנהל/ת ולסגן/ית בלבד.' },
    ],
  },
  {
    section: 'מרכז צילומים',
    icon: Printer, color: '#eab308',
    view: 'printing',
    roles: ['all'],
    items: [
      { q: 'איך שולחים בקשת צילום?', a: 'בתפריט ← "מרכז צילומים" ← "בקשת צילום חדשה" ← העלו PDF, ציינו מקצוע, כיתה, כמות עותקים ועמודים בקובץ. הוסיפו הערות אם צריך ← שלח לאישור.' },
      { q: 'מה הסטטוסים בבקשת צילום?', a: 'ממתין → מאושר (הנהלה אישרה) → בהדפסה (המזכירה מדפיסה) → הושלם. ניתן לבטל בקשה בסטטוס "ממתין" בלחיצה על X.' },
      { q: 'אפשר לדחות את המועד?', a: 'בטופס הבקשה יש שדה "נדרש עד תאריך". מלאו את המועד הרצוי ← המזכירה תדע לתעדף.' },
      { q: 'אפשר לבקש דו-צדדי / A3 / צבעוני?', a: 'כן! בטופס הבקשה בחרו: גודל נייר (A4/A3/מיוחד), מצב צבע (שחור-לבן / צבעוני) ותיבת "דו-צדדי".' },
      { q: 'כמנהל/ת – איך מאשרים בקשות?', a: 'בעמוד "מרכז צילומים" ← בקשות ממתינות ← לחצו "אשר". ניתן לראות את הקובץ לפני אישור.' },
      { q: 'כמזכירה – איך מסמנים הדפסה הושלמה?', a: 'בחרו בקשות עם checkbox ← "סמן הושלם" (או "סמן בהדפסה"). לחצן "הדפס" מדפיס ישירות. יש גם כפתור WhatsApp להודעה אוטומטית.' },
      { q: 'איך מייצאים דוח הדפסות ל-Excel?', a: 'בראש עמוד "מרכז צילומים" ← כפתור ירוק "יצוא Excel". מכיל את כל הבקשות עם כל הפרטים.' },
      { q: 'מה הגרף "מעקב צילומים לפי מורה"?', a: 'בתחתית העמוד (למנהל/ת ומזכירה) יש טבלה מתרחבת לפי מורה ← לחצו על שם מורה לפירוט לפי כיתה ומקצוע.' },
    ],
  },
  {
    section: 'תפעול ורכש',
    icon: Wrench, color: '#64748b',
    view: 'maintenance',
    roles: ['all'],
    items: [
      { q: 'איך מדווחים תקלה?', a: 'בתפריט ← "תפעול ורכש" ← "תקלה חדשה". ציינו: תיאור, חדר / ציוד, רמת דחיפות. אב הבית יקבל התראה.' },
      { q: 'איך מגישים בקשת רכש?', a: 'בדשבורד ← "רכש" (כפתור כתום) ← פרטי הפריט, כמות ומחיר משוער ← שלח. הבקשה תועבר לאישור הנהלה.' },
      { q: 'אפשר לצרף תמונה לתקלה?', a: 'כן! בטופס הדיווח יש אפשרות לצלם / לצרף תמונה של התקלה.' },
      { q: 'מתי הבקשה תטופל?', a: 'לאחר שהבקשה מאושרת על ידי הנהלה, אב הבית מקבל הקצאה ומסמן "בטיפול" / "טופל". תקבלו התראה.' },
    ],
  },
  {
    section: 'משימות ואישורים',
    icon: CheckSquare, color: '#ca8a04',
    view: 'tasks',
    roles: ['all'],
    items: [
      { q: 'מה ניתן לאשר בעמוד "משימות"?', a: 'כל הבקשות הממתינות לאישורכם: חתימות, אישורי חופשה, בקשות מיוחדות. הסטטוסים: ממתין / אושר / נדחה.' },
      { q: 'איך יוצרים משימה חדשה?', a: 'בעמוד "משימות" ← "+ משימה חדשה". ניתן להקצות למשתמש אחר, להוסיף תאריך יעד ותיאור.' },
      { q: 'איך מסמנים משימה כהושלמה?', a: 'לחצו על ✓ לצד המשימה. הסטטוס ישתנה ל"הושלמה" ובעל/ת המשימה יקבל/ת התראה.' },
    ],
  },
  {
    section: 'הודעות והתראות',
    icon: Bell, color: '#f59e0b',
    view: 'notifications',
    roles: ['all'],
    items: [
      { q: 'איפה רואים התראות?', a: 'לחצו על פעמון בסרגל העליון. גם בתפריט ← "התראות" יש רשימה מלאה. Badge אדום מציין כמות שלא נקראו.' },
      { q: 'לא מקבלים התראות – מה לעשות?', a: 'Chrome: לחצו על מנעול בשורת הכתובת ← "התראות" ← "אפשר". לאחר מכן ב"הגדרות" ← "התראות" ← "אפשר דחיפה לנייד".' },
      { q: 'איך שולחים הודעה להנהלה?', a: 'בלוח הבקרה ← כפתור ורוד "שלח הודעה למנהלת". כתבו את ההודעה ושלחו. ההנהלה מקבלת התראה.' },
      { q: 'איפה ההודעות שנשלחו אלי?', a: 'בתפריט ← "התראות". כל ההודעות מופיעות שם לפי סדר זמן, עם סינון לפי סוג.' },
    ],
  },
  {
    section: 'ניהול צוות',
    icon: Users, color: '#f97316',
    view: 'hr',
    roles: ['admin', 'vice_principal', 'secretary'],
    items: [
      { q: 'איך מוסיפים עובד/ת חדש/ה?', a: 'בתפריט ← "ניהול צוות" ← "+ הוסף עובד". מלאו: שם מלא, מייל, תפקיד ומגדר. המערכת תשלח הזמנה.' },
      { q: 'איך עורכים פרטי עובד/ת?', a: 'בניהול צוות ← לחצו על שם העובד/ת ← ערכו שדות ← שמרו. שינוי תפקיד משפיע על הגישה של העובד/ת.' },
      { q: 'איך מגדירים הודעה יומית?', a: 'ניהול צוות ← "הגדרות מוסד" ← "הודעות יומיות" ← הוסף. בחרו: סוג, תאריך (חד-פעמי / שנתי חוזר), כתבו טקסט ← שמרו.' },
      { q: 'איך שולחים WhatsApp לכל הצוות?', a: 'בדשבורד ניהול ← כפתור "שלח WhatsApp לצוות" ← נפתח WhatsApp Web עם הודעה מוכנה. ניתן לערוך לפני שליחה.' },
    ],
  },
  {
    section: 'קליטת מחליפים',
    icon: FileText, color: '#14b8a6',
    view: 'onboarding',
    roles: ['admin', 'vice_principal', 'substitute'],
    items: [
      { q: 'מה עמוד "טפסי קליטה"?', a: 'מאפשר למחליפים / עובדים חדשים למלא טפסי קליטה דיגיטלית: פרטים אישיים, חשבון בנק, הצהרות ועוד.' },
      { q: 'מחליפ/ה – איך ממלאים טפסי קליטה?', a: 'בתפריט ← "טפסי קליטה". מלאו את הטפסים ← שלח. הנהלה תקבל הודעה שהטפסים הוגשו.' },
    ],
  },
  {
    section: 'ניהול תורנויות',
    icon: Clock, color: '#eab308',
    view: 'duty-management',
    roles: ['admin', 'vice_principal', 'coordinator'],
    items: [
      { q: 'איך מגדירים תורנויות לצוות?', a: 'בתפריט ← "ניהול תורנויות" ← הוסף תורנות. בחרו: עובד, יום, שעה וסוג תורנות. מורה יקבל/ת התראה.' },
      { q: 'איך מורה רואה את התורנות שלו/ה?', a: 'בלוח הבקרה ← כרטיס "תורנות היום". תיפתח הודעה צהובה עם פרטים. ניתן גם לראות ב"ניהול תורנויות".' },
    ],
  },
  {
    section: 'ניהול חדרים',
    icon: Home, color: '#84cc16',
    view: 'room-management',
    roles: ['all'],
    items: [
      { q: 'איך רואים פנויות חדרים?', a: 'בתפריט ← "ניהול חדרים". נראים כל החדרים עם סטטוס (תפוס / פנוי). לחצו על חדר לפרטים נוספים.' },
      { q: 'איך מבקשים חדר?', a: 'לחצו על חדר פנוי ← "בקש חדר" ← ציינו שעה ותיאור ← שלח לאישור.' },
    ],
  },
  {
    section: 'דוחות ויצוא',
    icon: BarChart3, color: '#2563eb',
    view: 'reports',
    roles: ['admin', 'vice_principal', 'coordinator', 'secretary'],
    items: [
      { q: 'מה כלול בעמוד "דוחות"?', a: '5 לשוניות: היעדרויות, רכש, הדפסות, תורנויות, תחזוקה. כל לשונית מציגה טבלה מלאה עם יצוא Excel. בראש: 4 KPIs עם מספרים עדכניים.' },
      { q: 'איך מייצאים לExcel?', a: 'בכל לשונית יש כפתור "יצוא Excel" ← לחצו ← הקובץ מורד מיד. הוא כולל את כל השורות (עד 100 בתצוגה, הכול בExcel).' },
      { q: 'מה דוח ריכוז שעות נוספות?', a: 'בעמוד "היעדרויות ודיווח" ← טאב "שעות נוספות". מציג: שעות רגילות, מיוחדות וסה"כ לכל עובד עם יצוא Excel.' },
    ],
  },
  {
    section: 'אנליטיקס',
    icon: BarChart2, color: '#06b6d4',
    view: 'analytics',
    roles: ['admin', 'vice_principal'],
    items: [
      { q: 'מה ניתן לראות באנליטיקס?', a: 'גרפים ותובנות על: היעדרויות לפי חודש, עובדים עם הכי הרבה היעדרויות, עלות שעות נוספות, מגמות לאורך זמן.' },
      { q: 'האם הנתונים בזמן אמת?', a: 'כן – הנתונים מתעדכנים ברגע שנוצרת פעולה חדשה במערכת (היעדרות מאושרת, בקשה ממתינה וכו\').' },
    ],
  },
  {
    section: 'הגדרות מערכת',
    icon: SlidersHorizontal, color: '#64748b',
    view: 'settings',
    roles: ['admin', 'vice_principal'],
    items: [
      { q: 'מה אפשר להגדיר בהגדרות?', a: '4 לשוניות: פיצ\'רים (הפעלה/כיבוי תכונות), WhatsApp (חיבור Green API), בית הספר (שם ולוגו), התראות (הרשאת push לנייד).' },
      { q: 'איך מפעילים / מכבים תכונה?', a: '"הגדרות מערכת" ← "פיצ\'רים" ← החליפו את המתג. למשל: WhatsApp, לוח זמנים, דוחות, קהילה. השינוי נכנס לתוקף מיד.' },
      { q: 'איך מחברים WhatsApp?', a: '"הגדרות מערכת" ← "WhatsApp" ← הזינו Instance ID ו-API Token מחשבון Green API שלכם. לחצו "שמור" ← "בדוק חיבור".' },
      { q: 'Green API – איך מקבלים חשבון?', a: 'גשו ל-green-api.com ← הירשמו ← צרו instance ← קחו את המזהה (ID) והטוקן (Token) ← הזינו בהגדרות.' },
    ],
  },
  {
    section: 'קהילה והווי',
    icon: Heart, color: '#eab308',
    view: 'community',
    roles: ['all'],
    items: [
      { q: 'מה ניתן לשתף בקהילה?', a: 'הודעות, תמונות, הכרזות וחגיגות. זהו מרחב פנימי לצוות בית הספר.' },
      { q: 'האם כולם יכולים לפרסם?', a: 'כן – כל חברי הצוות יכולים לפרסם. ניתן להגיב ולהגיב על פוסטים.' },
    ],
  },
  {
    section: 'ניהול קבצים',
    icon: FolderOpen, color: '#3b82f6',
    view: 'file-management',
    roles: ['all'],
    items: [
      { q: 'איך מעלים קובץ?', a: 'בתפריט ← "ניהול קבצים" ← "+ העלה קובץ". בחרו קובץ מהמחשב, ציינו שם ותיאור.' },
      { q: 'מי יכול לראות קבצים שהעליתי?', a: 'בהעלאה ניתן לסמן "ציבורי" (כולם) או להשאיר פרטי (רק אתם). מנהל/ת רואה הכל.' },
    ],
  },
  {
    section: 'אבחון תקלות',
    icon: Wrench, color: '#475569',
    view: null,
    roles: ['all'],
    items: [
      { q: 'הדף נטען ריק', a: 'ייתכן שאין לכם הרשאה, או שגיאת תקשורת. רענן (F5). אם חוזר – פנו למנהל/ת.' },
      { q: 'לחצתי שמור אבל לא נשמר', a: 'בדקו שהופיעה הודעת הצלחה ירוקה. אם לא – ודאו חיבור לאינטרנט ונסו שוב. צלמו מסך ופנו לתמיכה.' },
      { q: 'המערכת איטית', a: '1. סגרו לשוניות מיותרות. 2. נסו Chrome במקום Safari. 3. נקו מטמון (Ctrl+Shift+Delete). 4. ודאו שהאינטרנט תקין.' },
      { q: 'לא רואה תפריט מסוים', a: 'ייתכן שהתכונה כבויה. מנהל/ת יכולה להפעיל ב"הגדרות מערכת" ← "פיצ\'רים". ייתכן גם שאין לכם הרשאה לאותה תכונה.' },
    ],
  },
];

const ROLE_LABEL = {
  admin: 'מנהל/ת',
  vice_principal: 'סגן/ית מנהל',
  secretary: 'מזכירה',
  teacher: 'מורה',
  coordinator: 'רכז/ת',
  counselor: 'יועצ/ת',
  assistant: 'סייע/ת',
  substitute: 'מחליפ/ה',
  maintenance: 'אב בית',
  user: 'עובד/ת',
};

function FAQItem({ q, a, isOpen, onToggle }) {
  return (
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden
      ${isOpen ? 'border-blue-200 shadow-sm' : 'border-slate-100 hover:border-slate-200'}`}>
      <button className="w-full flex items-start justify-between gap-4 p-4 text-right" onClick={onToggle}>
        <span className={`font-semibold text-sm leading-relaxed ${isOpen ? 'text-blue-700' : 'text-slate-800'}`}>
          {q}
        </span>
        <div className={`flex-shrink-0 mt-0.5 p-0.5 rounded-full transition-colors
          ${isOpen ? 'bg-blue-100' : 'bg-slate-100'}`}>
          {isOpen ? <ChevronUp className="h-4 w-4 text-blue-600" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

export default function HelpCenter({ userRole, onNavigate }) {
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState(null);
  const [activeSection, setActiveSection] = useState('all');
  const [roleFilter, setRoleFilter] = useState(true); // show role-relevant only

  const visibleSections = useMemo(() => {
    if (!roleFilter || !userRole) return FAQ;
    return FAQ.filter(s =>
      s.roles.includes('all') || s.roles.includes(userRole)
    );
  }, [userRole, roleFilter]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visibleSections.map(section => ({
      ...section,
      items: section.items.filter(item =>
        !q || item.q.includes(q) || item.a.includes(q)
      ),
    })).filter(s => {
      if (activeSection !== 'all' && s.section !== activeSection) return false;
      return s.items.length > 0;
    });
  }, [query, activeSection, visibleSections]);

  const totalResults = filtered.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <div className="space-y-5" dir="rtl">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-100"><HelpCircle className="h-5 w-5 text-blue-600" /></div>
          מרכז עזרה
        </h1>
        <p className="text-sm text-slate-400 mt-1 mr-11">SMART BASE · {ROLE_LABEL[userRole] || 'משתמש/ת'}</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveSection('all'); }}
            placeholder="חפשו שאלה..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-slate-800 placeholder-slate-400 outline-none focus:border-blue-400 focus:bg-white transition-all text-sm"
          />
        </div>
        {query && (
          <p className="text-slate-400 text-xs mt-2 pr-1">
            {totalResults === 0 ? 'לא נמצאו תוצאות' : `נמצאו ${totalResults} תשובות`}
          </p>
        )}
      </div>

      {/* Role filter toggle */}
      {userRole && (
        <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 px-4 py-3">
          <label className="flex items-center gap-2 cursor-pointer flex-1">
            <div className="relative">
              <input type="checkbox" className="sr-only peer" checked={roleFilter} onChange={e => setRoleFilter(e.target.checked)} />
              <div className="w-9 h-5 bg-slate-200 rounded-full peer peer-checked:bg-blue-600 peer-checked:after:translate-x-4 rtl:peer-checked:after:-translate-x-4 after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
            </div>
            <span className="text-sm font-semibold text-slate-700">הצג רק עזרה רלוונטית לתפקידי ({ROLE_LABEL[userRole]})</span>
          </label>
          <span className="text-xs text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">
            {visibleSections.length} נושאים
          </span>
        </div>
      )}

      {/* Section pills */}
      <div className="flex gap-1.5 flex-wrap">
        <button
          onClick={() => setActiveSection('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border
            ${activeSection === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
        >
          הכל
        </button>
        {visibleSections.map(s => (
          <button
            key={s.section}
            onClick={() => setActiveSection(activeSection === s.section ? 'all' : s.section)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border
              ${activeSection === s.section ? 'text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}
            style={activeSection === s.section ? { background: s.color } : {}}
          >
            <s.icon className="h-3 w-3" />
            {s.section}
          </button>
        ))}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-lg font-semibold">לא נמצאו תוצאות</p>
          <p className="text-sm mt-1">נסו מילות חיפוש אחרות</p>
        </div>
      ) : (
        filtered.map(section => (
          <div key={section.section} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 p-4 md:p-5 border-b border-slate-100">
              <div className="p-2.5 rounded-xl" style={{ background: `${section.color}18`, border: `1px solid ${section.color}30` }}>
                <section.icon className="h-5 w-5" style={{ color: section.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-slate-800">{section.section}</h2>
                <p className="text-xs text-slate-400">{section.items.length} שאלות</p>
              </div>
              {onNavigate && section.view && (
                <button
                  onClick={() => onNavigate(section.view)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors text-white flex-shrink-0"
                  style={{ background: section.color }}
                >
                  עבור לתכונה
                  <ArrowLeft className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="p-4 space-y-2">
              {section.items.map((item, i) => {
                const id = `${section.section}-${i}`;
                return (
                  <FAQItem
                    key={id} q={item.q} a={item.a}
                    isOpen={openId === id}
                    onToggle={() => setOpenId(openId === id ? null : id)}
                  />
                );
              })}
            </div>
          </div>
        ))
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 text-center">
        <div className="p-3 rounded-xl bg-yellow-100 w-fit mx-auto mb-3">
          <Star className="h-5 w-5 text-yellow-600" />
        </div>
        <h3 className="font-bold text-slate-800 mb-1">לא מצאתם תשובה?</h3>
        <p className="text-slate-500 text-sm">פנו למנהל/ת המערכת שיוכלו לעזור ישירות.</p>
        <p className="text-xs text-slate-300 mt-3">SMART BASE · מערכת ניהול חכמה</p>
      </div>
    </div>
  );
}
