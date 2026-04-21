import { useEffect, useRef } from 'react';
import { base44 } from '@/api/firebaseClient';
import { notify } from '@/lib/notify';

const LS_KEY = 'smartbase_cert_reminder_sent';

function todayKey() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function isPast750() {
  const now = new Date();
  return now.getHours() > 7 || (now.getHours() === 7 && now.getMinutes() >= 50);
}

function msUntil750() {
  const now = new Date();
  const target = new Date(now);
  target.setHours(7, 50, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target - now;
}

async function sendReminders(userEmail) {
  try {
    const absences = await base44.entities.Absence.list();
    // Find absences needing a certificate reminder
    const needReminder = absences.filter(a =>
      a.status === 'awaiting_certificate' ||
      (a.status === 'approved' && !a.certificate_url && a.absence_type !== 'choice_day')
    );

    if (needReminder.length === 0) return;

    // Group by teacher email to send one notification per teacher
    const byTeacher = {};
    needReminder.forEach(a => {
      const email = a.user_email;
      if (!email) return;
      if (!byTeacher[email]) byTeacher[email] = [];
      byTeacher[email].push(a);
    });

    // Create one notification per teacher (only if they haven't received one today)
    const today = todayKey();
    for (const [email, list] of Object.entries(byTeacher)) {
      // Check if we already sent a reminder today for this teacher
      const existing = await base44.entities.Notification.filter({ user_email: email, type: 'certificate_reminder' });
      const sentToday = existing.some(n => n.created_date?.startsWith(today));
      if (sentToday) continue;

      const count = list.length;
      await notify({
        user_email: email,
        type: 'certificate_reminder',
        title: 'תזכורת: אישור העדרות חסר',
        message: count === 1
          ? `יש לך היעדרות שממתינה להעלאת קובץ אישור. אנא הכנסי את הקובץ בהקדם.`
          : `יש לך ${count} היעדרויות הממתינות להעלאת קובץ אישור. אנא הכניסי את הקבצים בהקדם.`,
        read: false,
        link: 'attendance',
      });
    }
  } catch (err) {
    console.warn('useDailyAbsenceReminder: failed to send reminders', err);
  }
}

export function useDailyAbsenceReminder(user) {
  const timerRef = useRef(null);

  useEffect(() => {
    if (!user?.email) return;
    // Only run for teacher / substitute roles (and admin to see all, but reminders target teachers)
    // Actually we send to all users who have absences needing cert — filter happens in sendReminders

    const today = todayKey();
    const alreadySentToday = localStorage.getItem(LS_KEY) === today;

    const run = async () => {
      if (localStorage.getItem(LS_KEY) === todayKey()) return;
      localStorage.setItem(LS_KEY, todayKey());
      await sendReminders(user.email);
    };

    if (!alreadySentToday && isPast750()) {
      run();
    } else if (!alreadySentToday) {
      const delay = msUntil750();
      timerRef.current = setTimeout(run, delay);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user?.email]);
}
