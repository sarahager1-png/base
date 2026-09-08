/**
 * createMaintenanceNotification — event trigger on MaintenanceTicket (ticket_type: 'general')
 *
 * Events:
 *   create              → notify admins + vice_principals
 *   update forwarded    → notify ab_bayit users: they have a new task
 *   update done/closed  → notify ticket reporter: fixed
 *   update clarification→ notify ticket reporter: admin requested clarification
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    // Only handle physical maintenance tickets
    if (data.ticket_type === 'computer') {
      return Response.json({ success: true, skipped: true });
    }

    // ── New ticket ──────────────────────────────────────────────────────────
    if (event.type === 'create') {
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      const vps    = await base44.asServiceRole.entities.User.filter({ role: 'vice_principal' });

      for (const recipient of [...admins, ...vps]) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: recipient.email,
          title: data.urgency === 'safety' ? '🚨 סכנה בטיחותית!' :
                 data.urgency === 'urgent' ? 'קריאת תחזוקה דחופה!' : 'דיווח תחזוקה חדש',
          message: `${data.reporter_name} דיווחה על תקלה ב${data.location}: ${data.issue_type}${data.description ? ` — ${data.description}` : ''}`,
          type: 'maintenance',
          priority: data.urgency === 'safety' ? 'urgent' :
                    data.urgency === 'urgent' ? 'important' : 'normal',
          related_entity_type: 'MaintenanceTicket',
          related_entity_id: data.id,
        });
      }
    }

    // ── Forwarded to ab-bayit ───────────────────────────────────────────────
    if (event.type === 'update' && data.status === 'forwarded') {
      // Find ab_bayit users (special_roles array + maintenance role)
      const allUsers = await base44.asServiceRole.entities.User.list();
      const abBayitUsers = (allUsers as any[]).filter(u =>
        u.role === 'maintenance' ||
        (Array.isArray(u.special_roles) && u.special_roles.includes('ab_bayit'))
      );

      for (const u of abBayitUsers) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: u.email,
          title: data.urgency === 'safety' ? '🚨 משימת תחזוקה דחופה!' : 'משימת תחזוקה חדשה',
          message: `תקלה ב${data.location}: ${data.issue_type}${data.description ? ` — ${data.description}` : ''}`,
          type: 'maintenance',
          priority: data.urgency === 'safety' ? 'urgent' :
                    data.urgency === 'urgent' ? 'important' : 'normal',
          related_entity_type: 'MaintenanceTicket',
          related_entity_id: data.id,
        });
      }
    }

    // ── Done / closed — notify reporter ────────────────────────────────────
    if (event.type === 'update' && (data.status === 'done' || data.status === 'closed') && data.reporter_email) {
      const title = data.status === 'done' ? '✅ הליקוי תוקן!' : 'הדיווח נסגר';
      await base44.asServiceRole.entities.Notification.create({
        user_email: data.reporter_email,
        title,
        message: data.fix_description
          ? `הליקוי ב${data.location} טופל: ${data.fix_description}`
          : `הליקוי ב${data.location} שדיווחת עליו טופל ונסגר`,
        type: 'maintenance',
        priority: 'normal',
        related_entity_type: 'MaintenanceTicket',
        related_entity_id: data.id,
      });
    }

    // ── Clarification requested — notify reporter ───────────────────────────
    if (event.type === 'update' && data.status === 'clarification' && data.reporter_email) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: data.reporter_email,
        title: '❓ נדרש הבהרה לדיווח שלך',
        message: data.clarification_request
          ? `שאלה: ${data.clarification_request}`
          : `המנהלת ביקשה הבהרה לגבי הדיווח ב${data.location}`,
        type: 'maintenance',
        priority: 'important',
        related_entity_type: 'MaintenanceTicket',
        related_entity_id: data.id,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[createMaintenanceNotification]', error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
