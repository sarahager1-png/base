import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'vice_principal')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { meetingId } = await req.json();
    
    const meeting = await base44.entities.Meeting.get(meetingId);
    
    if (!meeting) {
      return Response.json({ error: 'Meeting not found' }, { status: 404 });
    }

    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');

    const startDateTime = `${meeting.meeting_date}T${meeting.meeting_time}:00`;
    const endTime = new Date(startDateTime);
    endTime.setMinutes(endTime.getMinutes() + (meeting.duration_minutes || 30));
    
    const calendarEvent = {
      summary: `פגישה עם ${meeting.participant_name}`,
      description: `נושא: ${meeting.purpose}\n${meeting.notes ? 'הערות: ' + meeting.notes : ''}`,
      location: meeting.location || '',
      start: {
        dateTime: startDateTime,
        timeZone: 'Asia/Jerusalem',
      },
      end: {
        dateTime: endTime.toISOString().slice(0, -5),
        timeZone: 'Asia/Jerusalem',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calendarEvent),
    });

    if (!response.ok) {
      const error = await response.text();
      return Response.json({ error: `Google Calendar error: ${error}` }, { status: response.status });
    }

    const calendarEventData = await response.json();

    await base44.asServiceRole.entities.Meeting.update(meetingId, {
      google_calendar_event_id: calendarEventData.id,
    });

    return Response.json({ 
      success: true, 
      eventId: calendarEventData.id,
      eventLink: calendarEventData.htmlLink 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});