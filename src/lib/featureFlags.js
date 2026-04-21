const STORAGE_KEY = 'school_feature_flags';

export const DEFAULT_FLAGS = {
  schedule:       { label: 'מערכת שעות',       description: 'העלאת מערכת שעות מקובץ ותצוגה לכל מורה', enabled: true },
  substitutes:    { label: 'ממלאי מקום',        description: 'הצעה אוטומטית לממלאת מקום בעת היעדרות',  enabled: true },
  whatsapp:       { label: 'הודעות WhatsApp',  description: 'שליחת הודעות דרך WhatsApp (Green API)',  enabled: false },
  dailySummary:   { label: 'סיכום יום',         description: 'תצוגת סיכום יומי למנהלת בתחתית הדשבורד', enabled: true },
  pushNotifications: { label: 'התראות לנייד', description: 'שליחת push notifications למכשיר',         enabled: true },
  reports:        { label: 'דוחות ויצוא Excel', description: 'דוחות מסוכמים ויצוא לקובץ Excel',        enabled: true },
  printing:       { label: 'מרכז הדפסות',       description: 'ניהול בקשות הדפסה וצילומים',            enabled: true },
  duties:         { label: 'תורנויות',           description: 'שיבוץ וניהול תורנויות',                 enabled: true },
  maintenance:    { label: 'תחזוקה ורכש',        description: 'דיווח תקלות ובקשות רכש',               enabled: true },
  community:      { label: 'קהילה',              description: 'אירועים חברתיים והודעות',               enabled: true },
  files:          { label: 'ניהול קבצים',        description: 'העלאה ושיתוף קבצים',                   enabled: true },
  rooms:          { label: 'ניהול חדרים',         description: 'הזמנת חדרים ומשאבים',                  enabled: true },
};

export function getFlags() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { ...DEFAULT_FLAGS };
    const parsed = JSON.parse(stored);
    // merge with defaults so new flags appear
    const merged = { ...DEFAULT_FLAGS };
    Object.keys(parsed).forEach(k => {
      if (merged[k]) merged[k] = { ...merged[k], enabled: parsed[k].enabled };
    });
    return merged;
  } catch {
    return { ...DEFAULT_FLAGS };
  }
}

export function setFlag(key, enabled) {
  const flags = getFlags();
  if (flags[key]) flags[key].enabled = enabled;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flags));
}

export function isEnabled(key) {
  return getFlags()[key]?.enabled ?? true;
}

export function useFeature(key) {
  return isEnabled(key);
}
