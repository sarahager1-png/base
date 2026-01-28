import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Find all absences awaiting certificates
    const awaitingCerts = await base44.asServiceRole.entities.Absence.filter({ 
      status: 'awaiting_certificate' 
    });

    const emailsSent = [];

    for (const absence of awaitingCerts) {
      // Send reminder email
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: absence.user_email,
        subject: 'תזכורת: נדרש לצרף אישור רפואי להיעדרות',
        body: `
          שלום ${absence.user_name},
          
          ההיעדרות שדיווחת בתאריך ${absence.start_date} עדיין ממתינה לאישור רפואי.
          
          נא לצרף את האישור הרפואי בהקדם האפשרי על מנת שנוכל לאשר את ההיעדרות ולדווח למשרד החינוך.
          
          ללא אישור רפואי, לא נוכל לאשר את ההיעדרות ולא נוכל לדווח את ממלאת המקום.
          
          תודה,
          המערכת האוטומטית
        `
      });

      emailsSent.push(absence.user_email);
    }

    return Response.json({ 
      success: true, 
      count: emailsSent.length,
      emails: emailsSent 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});