import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type === 'create') {
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      const vps = await base44.asServiceRole.entities.User.filter({ role: 'vice_principal' });
      
      const recipients = [...admins, ...vps];

      for (const recipient of recipients) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: recipient.email,
          title: 'דיווח היעדרות חדש',
          message: `${data.user_name} דיווח/ה על היעדרות מ-${data.start_date} עד ${data.end_date}`,
          type: 'absence',
          priority: 'normal',
          related_entity_type: 'Absence',
          related_entity_id: data.id
        });
      }
    }

    if (event.type === 'update' && data.status === 'approved') {
      await base44.asServiceRole.entities.Notification.create({
        user_email: data.user_email,
        title: 'היעדרות אושרה',
        message: `ההיעדרות שלך מ-${data.start_date} עד ${data.end_date} אושרה`,
        type: 'absence',
        priority: 'normal',
        related_entity_type: 'Absence',
        related_entity_id: data.id
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});