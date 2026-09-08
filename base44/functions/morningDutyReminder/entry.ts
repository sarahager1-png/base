/**
 * morningDutyReminder — cron: every morning, notify staff about today's duties
 *
 * Deploy as a scheduled function (e.g. daily at 07:00 Israel time).
 * In base44 platform set cron: "0 5 * * *" (05:00 UTC = 07:00 IST / 08:00 IDT)
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Today's date in YYYY-MM-DD (Israel time approximation using UTC+2/+3)
    const now = new Date();
    const ilOffset = now.getMonth() >= 3 && now.getMonth() <= 9 ? 3 : 2; // IDT/IST
    const ilNow = new Date(now.getTime() + ilOffset * 60 * 60 * 1000);
    const today = ilNow.toISOString().split('T')[0];

    // Fetch all assignments for today
    const assignments = await base44.asServiceRole.entities.DutyAssignment.filter({ date: today });

    if (assignments.length === 0) {
      return Response.json({ success: true, sent: 0, message: 'אין תורנויות היום' });
    }

    // Group by staff_email to send one notification per person
    const byEmail: Record<string, { name: string; duties: string[] }> = {};
    for (const a of assignments) {
      if (!a.staff_email) continue;
      if (!byEmail[a.staff_email]) {
        byEmail[a.staff_email] = { name: a.staff_name ?? '', duties: [] };
      }
      const label = a.location ? `${a.duty_name} (${a.location})` : a.duty_name;
      byEmail[a.staff_email].duties.push(label);
    }

    let sent = 0;
    for (const [email, { name, duties }] of Object.entries(byEmail)) {
      const dutyList = duties.join(', ');
      await base44.asServiceRole.entities.Notification.create({
        user_email: email,
        title: 'תזכורת תורנות להיום 📋',
        message: `שלום ${name}, היום יש לך תורנות: ${dutyList}`,
        type: 'duty',
        priority: 'normal',
      });
      sent++;
    }

    return Response.json({ success: true, sent, date: today });
  } catch (error) {
    console.error('[morningDutyReminder]', error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
