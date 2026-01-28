import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type === 'create' && data.urgency === 'urgent') {
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      const vps = await base44.asServiceRole.entities.User.filter({ role: 'vice_principal' });
      
      const recipients = [...admins, ...vps];

      for (const recipient of recipients) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: recipient.email,
          title: 'קריאת תחזוקה דחופה!',
          message: `${data.reporter_name} דיווח/ה על תקלה דחופה ב${data.location}: ${data.issue}`,
          type: 'maintenance',
          priority: data.urgency === 'safety' ? 'urgent' : 'important',
          related_entity_type: 'MaintenanceTicket',
          related_entity_id: data.id
        });
      }
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});