/**
 * WhatsApp Bot Webhook — מקבל הודעות מ-WATI ומעדכן את מסד הנתונים
 *
 * הגדרות נדרשות (Environment Variables):
 *   WATI_API_URL  — כתובת ה-API של WATI (לדוגמה: https://live-server.wati.io)
 *   WATI_TOKEN    — Bearer token מ-WATI
 *
 * ישות נדרשת ב-Base44 (צור ידנית דרך הממשק):
 *   WhatsAppSession: phone (string), step (string), data (string), updated_date (datetime)
 *
 * שדה נדרש בישות User:
 *   phone (string) — מספר טלפון בפורמט בינלאומי ללא + (לדוגמה: 972501234567)
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const WATI_API_URL = Deno.env.get('WATI_API_URL') ?? '';
const WATI_TOKEN   = Deno.env.get('WATI_TOKEN') ?? '';

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 דקות

// ────────────────────────────────────────────────────────────
// שליחת הודעה דרך WATI
// ────────────────────────────────────────────────────────────
async function sendMessage(phone: string, text: string): Promise<void> {
  if (!WATI_API_URL || !WATI_TOKEN) {
    console.warn('WATI env vars not set — skipping send');
    return;
  }
  await fetch(`${WATI_API_URL}/api/v1/sendSessionMessage/${phone}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${WATI_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messageText: text }),
  });
}

// ────────────────────────────────────────────────────────────
// תפריט ראשי
// ────────────────────────────────────────────────────────────
const MAIN_MENU = `שלום! 👋 ברוך הבא לבוט הניהול.

בחר/י פעולה:
*1* — דיווח היעדרות
*2* — סטטוס היעדרויות אחרונות
*3* — עזרה`;

// ────────────────────────────────────────────────────────────
// מיפוי סיבות היעדרות
// ────────────────────────────────────────────────────────────
const REASON_KEY: Record<string, string> = {
  '1': 'sick_child',
  '2': 'choice_day',
  '3': 'declaration_days',
  '4': 'other',
};

const REASON_LABEL: Record<string, string> = {
  '1': 'ילד חולה',
  '2': 'יום בחירה',
  '3': 'יום הצהרה',
  '4': 'אחר',
};

const STATUS_LABEL: Record<string, string> = {
  pending:               '⏳ ממתין לאישור',
  approved:              '✅ מאושר',
  rejected:              '❌ נדחה',
  awaiting_certificate:  '⚠️ ממתין לאישור רפואי',
};

// ────────────────────────────────────────────────────────────
// פענוח תאריך DD/MM או DD/MM/YYYY → YYYY-MM-DD
// ────────────────────────────────────────────────────────────
function parseDate(input: string): string | null {
  const m = input.trim().match(/^(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?$/);
  if (!m) return null;
  const year  = m[3]
    ? (m[3].length === 2 ? '20' + m[3] : m[3])
    : new Date().getFullYear().toString();
  return `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

// ────────────────────────────────────────────────────────────
// Webhook handler
// ────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  try {
    const base44  = createClientFromRequest(req);
    const body    = await req.json();

    // תמיכה גם ב-WATI וגם בפורמטים אחרים
    const phone   = (body.waId ?? body.from ?? '').replace(/^\+/, '');
    const msgText = (body.text?.body ?? body.body ?? '').trim();

    if (!phone || !msgText) {
      return Response.json({ success: true });
    }

    // ── מצא משתמש לפי מספר טלפון ───────────────────────────
    const users = await base44.asServiceRole.entities.User.filter({ phone });
    const user  = users[0];

    if (!user) {
      await sendMessage(phone,
        'מספר הטלפון שלך אינו רשום במערכת.\nאנא פנה/י למנהל.');
      return Response.json({ success: true });
    }

    // ── טען / אפס סשן ────────────────────────────────────────
    const sessions = await base44.asServiceRole.entities.WhatsAppSession.filter({ phone });
    let session = sessions[0] ?? null;

    const isExpired = session &&
      (Date.now() - new Date(session.updated_date).getTime()) > SESSION_TTL_MS;

    if (isExpired || msgText === 'תפריט' || msgText === 'menu') {
      if (session) {
        await base44.asServiceRole.entities.WhatsAppSession.update(session.id, {
          step: 'main', data: '{}', updated_date: new Date().toISOString(),
        });
        session = { ...session, step: 'main', data: '{}' };
      }
    }

    const step        = session?.step ?? 'main';
    const sessionData = JSON.parse(session?.data ?? '{}');

    // ── נהל שלבי שיחה ────────────────────────────────────────

    // ════ תפריט ════════════════════════════════════════════
    if (step === 'main') {

      if (msgText === '1') {
        const newData = {
          user_email: user.email,
          user_name:  user.full_name,
        };
        if (session) {
          await base44.asServiceRole.entities.WhatsAppSession.update(session.id, {
            step: 'absence_start', data: JSON.stringify(newData),
            updated_date: new Date().toISOString(),
          });
        } else {
          await base44.asServiceRole.entities.WhatsAppSession.create({
            phone, step: 'absence_start', data: JSON.stringify(newData),
            updated_date: new Date().toISOString(),
          });
        }
        await sendMessage(phone,
          'מאיזה תאריך מתחילה ההיעדרות?\nפורמט: DD/MM (לדוגמה: 05/03)');

      } else if (msgText === '2') {
        const absences = await base44.asServiceRole.entities.Absence.filter(
          { user_email: user.email }, '-created_date', 3,
        );
        if (absences.length === 0) {
          await sendMessage(phone, 'אין לך דיווחי היעדרות עדיין.');
        } else {
          const lines = absences.map(a =>
            `📅 ${a.start_date} → ${a.end_date}\n${STATUS_LABEL[a.status] ?? a.status}`
          ).join('\n\n');
          await sendMessage(phone,
            `ההיעדרויות האחרונות שלך:\n\n${lines}\n\nשלח/י *תפריט* לחזרה.`);
        }

      } else if (msgText === '3') {
        await sendMessage(phone,
          'לתמיכה אנא פנה/י ישירות למזכירות.\n\nשלח/י *תפריט* לחזרה לתפריט.');

      } else {
        await sendMessage(phone, MAIN_MENU);
      }

    // ════ שלב 1: תאריך התחלה ═══════════════════════════════
    } else if (step === 'absence_start') {
      const date = parseDate(msgText);
      if (!date) {
        await sendMessage(phone,
          'פורמט לא תקין. שלח/י שוב: DD/MM (לדוגמה: 05/03)');
      } else {
        const newData = { ...sessionData, start_date: date };
        await base44.asServiceRole.entities.WhatsAppSession.update(session.id, {
          step: 'absence_end', data: JSON.stringify(newData),
          updated_date: new Date().toISOString(),
        });
        await sendMessage(phone,
          `תאריך התחלה: ${msgText} ✅\nעד איזה תאריך? (DD/MM)`);
      }

    // ════ שלב 2: תאריך סיום ════════════════════════════════
    } else if (step === 'absence_end') {
      const date = parseDate(msgText);
      if (!date) {
        await sendMessage(phone,
          'פורמט לא תקין. שלח/י שוב: DD/MM');
      } else {
        const newData = { ...sessionData, end_date: date };
        await base44.asServiceRole.entities.WhatsAppSession.update(session.id, {
          step: 'absence_reason', data: JSON.stringify(newData),
          updated_date: new Date().toISOString(),
        });
        await sendMessage(phone,
          'מה סיבת ההיעדרות?\n*1* — ילד חולה\n*2* — יום בחירה\n*3* — יום הצהרה\n*4* — אחר');
      }

    // ════ שלב 3: סיבה ושמירה ═══════════════════════════════
    } else if (step === 'absence_reason') {
      const reasonKey = REASON_KEY[msgText];
      if (!reasonKey) {
        await sendMessage(phone, 'נא לשלוח מספר בין 1 ל-4');
      } else {
        await base44.asServiceRole.entities.Absence.create({
          user_email:            sessionData.user_email,
          user_name:             sessionData.user_name,
          start_date:            sessionData.start_date,
          end_date:              sessionData.end_date,
          absence_reason:        reasonKey,
          status:                'pending',
          reported_to_ministry:  false,
        });

        await base44.asServiceRole.entities.WhatsAppSession.update(session.id, {
          step: 'main', data: '{}', updated_date: new Date().toISOString(),
        });

        await sendMessage(phone,
          `✅ ההיעדרות נרשמה!\n\n` +
          `מ: ${sessionData.start_date}\n` +
          `עד: ${sessionData.end_date}\n` +
          `סיבה: ${REASON_LABEL[msgText]}\n\n` +
          `תקבל/י הודעה כשהמנהל יאשר.\n` +
          `שלח/י *תפריט* לפעולות נוספות.`
        );
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[whatsappBot]', error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
