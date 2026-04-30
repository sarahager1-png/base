/**
 * createPurchaseNotification — event trigger on PurchaseRequest create/update
 *
 * Events handled:
 *   create          → notify admins + vice_principals: new request pending approval
 *   update approved → notify requesting teacher + secretaries: approved, purchasing begins
 *   update partial  → notify requesting teacher: partially approved
 *   update rejected → notify requesting teacher: rejected
 *   update arrived  → notify requesting teacher: items have arrived
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    // ── New purchase request ─────────────────────────────────────────────────
    if (event.type === 'create') {
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      const vps    = await base44.asServiceRole.entities.User.filter({ role: 'vice_principal' });
      const urgencyLabel: Record<string, string> = {
        normal: 'רגיל', urgent: 'דחוף', immediate: 'מיידי',
      };

      for (const recipient of [...admins, ...vps]) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: recipient.email,
          title: data.urgency === 'immediate' ? '⚡ בקשת רכש מיידית!' :
                 data.urgency === 'urgent'    ? '🔴 בקשת רכש דחופה' : 'בקשת רכש חדשה',
          message: `${data.user_name} הגישה בקשת רכש: "${data.purpose}" (${urgencyLabel[data.urgency] ?? data.urgency})`,
          type: 'purchase',
          priority: data.urgency === 'immediate' ? 'urgent' :
                    data.urgency === 'urgent'    ? 'important' : 'normal',
          related_entity_type: 'PurchaseRequest',
          related_entity_id: data.id,
        });
      }
    }

    // ── Approved / partially approved ────────────────────────────────────────
    if (event.type === 'update' && (data.status === 'approved' || data.status === 'partial')) {
      const label = data.status === 'approved' ? 'מאושרת במלואה' : 'אושרה חלקית';

      // Notify requesting teacher
      await base44.asServiceRole.entities.Notification.create({
        user_email: data.user_email,
        title: `✅ בקשת הרכש שלך ${label}`,
        message: data.admin_note
          ? `"${data.purpose}" — הערת מנהלת: ${data.admin_note}`
          : `"${data.purpose}" — ${label}`,
        type: 'purchase',
        priority: 'important',
        related_entity_type: 'PurchaseRequest',
        related_entity_id: data.id,
      });

      // Notify secretaries to execute the purchase
      const secretaries = await base44.asServiceRole.entities.User.filter({ role: 'secretary' });
      for (const sec of secretaries) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: sec.email,
          title: '🛒 בקשת רכש ממתינה לרכישה',
          message: `${data.user_name}: "${data.purpose}" — ${label}`,
          type: 'purchase',
          priority: 'important',
          related_entity_type: 'PurchaseRequest',
          related_entity_id: data.id,
        });
      }
    }

    // ── Rejected ─────────────────────────────────────────────────────────────
    if (event.type === 'update' && data.status === 'rejected') {
      await base44.asServiceRole.entities.Notification.create({
        user_email: data.user_email,
        title: '❌ בקשת הרכש נדחתה',
        message: data.admin_note
          ? `"${data.purpose}" — סיבה: ${data.admin_note}`
          : `"${data.purpose}" — נדחתה על ידי המנהלת`,
        type: 'purchase',
        priority: 'normal',
        related_entity_type: 'PurchaseRequest',
        related_entity_id: data.id,
      });
    }

    // ── Items arrived ─────────────────────────────────────────────────────────
    if (event.type === 'update' && data.status === 'arrived') {
      await base44.asServiceRole.entities.Notification.create({
        user_email: data.user_email,
        title: '📦 הציוד הגיע!',
        message: `הציוד שהזמנת עבור "${data.purpose}" הגיע ומוכן לאיסוף`,
        type: 'purchase',
        priority: 'important',
        related_entity_type: 'PurchaseRequest',
        related_entity_id: data.id,
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('[createPurchaseNotification]', error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
