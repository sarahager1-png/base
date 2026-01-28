import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type === 'create') {
      const secretaries = await base44.asServiceRole.entities.User.filter({ role: 'secretary' });

      for (const secretary of secretaries) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: secretary.email,
          title: data.urgent ? 'בקשת הדפסה דחופה!' : 'בקשת הדפסה חדשה',
          message: `${data.user_name} ביקש/ה להדפיס ${data.copies} עותקים של ${data.file_name}`,
          type: 'print',
          priority: data.urgent ? 'urgent' : 'normal',
          related_entity_type: 'PrintRequest',
          related_entity_id: data.id
        });
      }
    }

    if (event.type === 'update' && data.status === 'completed') {
      await base44.asServiceRole.entities.Notification.create({
        user_email: data.user_email,
        title: 'ההדפסה הושלמה',
        message: `${data.file_name} (${data.copies} עותקים) מוכן לאיסוף`,
        type: 'print',
        priority: 'normal',
        related_entity_type: 'PrintRequest',
        related_entity_id: data.id
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});