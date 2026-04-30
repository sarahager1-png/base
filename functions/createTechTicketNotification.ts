/**
 * createTechTicketNotification — event trigger on MaintenanceTicket (ticket_type: 'computer')
 *
 * Events:
 *   create           → notify admins + vice_principals + tech_coordinators in parallel
 *                       ("first to claim" model)
 *   update claimed   → notify ticket reporter: someone is handling it
 *   update resolved  → notify ticket reporter: issue resolved
 *   update external  → notify admins: sent to external technician
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    // Only handle computer tickets
    if (data.ticket_type !== 'computer') {
      return Response.json({ success: true, skipped: true });
    }

    // ── New tech ticket ──────────────────────────────────────────────────────
    if (event.type === 'create') {
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      const vps    = await base44.asServiceRole.entities.User.filter({ role: 'vice_principal' });

      // Find tech coordinators (special_roles is an array field — list all, then filter)
      const allUsers = await base44.asServiceRole.entities.User.list();
      const techCoords = (allUsers as any[]).filter(u =>
        Array.isArray(u.special_roles) && u.special_roles.includes('tech_coordinator')
      );

      const urgencyLabel: Record<string, string> = { normal: 'רגיל', urgent: 'דחוף' };
      const urgencyPriority: Record<string, string> = { normal: 'important', urgent: 'urgent' };

      const recipients = [...admins, ...vps, ...techCoords];
      // Deduplicate by email
      const seen = new Set<string>();
      const unique = recipients.filter(u => {
        if (seen.has(u.email)) return false;
        seen.add(u.email);
        return true;
      });

      const title = data.urgency === 'urgent'
        ? '🔴 תקלת מחשב דחופה!'
        : '💻 תקלת מחשב חדשה';

      for (const recipient of unique) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: recipient.email,
          title,
          message: `${data.reporter_name} דיווחה על תקלה ב${data.location}: ${data.issue_type}${data.description ? ` — ${data.description}` : ''}`,
          type: 'tech',
          priority: urgencyPriority[data.urgency] ?? 'important',
          related_entity_type: 'MaintenanceTicket',
          related_entity_id: data.id,
        });
      }
    }

    // ── Ticket claimed ───────────────────────────────────────────────────────
    if (event.type === 'update' && data.status === 'claimed' && data.reporter_email) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: data.reporter_email,
        title: '👩‍💻 מישהי מטפלת בתקלה שלך',
        message: `${data.claimed_by_name ?? 'רכזת תקשוב'} לקחה טיפול בתקלה שדיווחת ב${data.location}`,
        type: 'tech',
        priority: 'normal',
        related_entity_type: 'MaintenanceTicket',
        related_entity_id: data.id,
      });
    }

    // ── Ticket resolved ──────────────────────────────────────────────────────
    if (event.type === 'update' && data.status === 'resolved' && data.reporter_email) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: data.reporter_email,
        title: '✅ התקלה נפתרה!',
        message: data.resolution
          ? `התקלה ב${data.location} נפתרה: ${data.resolution}`
          : `התקלה שדיווחת ב${data.location} טופלה ונסגרה`,
        type: 'tech',
        priority: 'normal',
        related_entity_type: 'MaintenanceTicket',
        related_entity_id: data.id,
      });
    }

    // ── Forwarded to external technician — notify admins ────────────────────
    if (event.type === 'update' && data.status === 'external') {
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      for (const admin of admins) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: admin.email,
          title: '🔧 תקלה הועברה לטכנאי חיצוני',
          message: `התקלה ב${data.location} הועברה לטכנאי: ${data.external_tech ?? ''}${data.external_est_date ? ` (עד ${data.external_est_date})` : ''}`,
          type: 'tech',
          priority: 'normal',
          related_entity_type: 'MaintenanceTicket',
          related_entity_id: data.id,
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[createTechTicketNotification]', error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
