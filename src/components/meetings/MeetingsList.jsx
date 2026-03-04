import React, { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Users, Phone, MapPin, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function MeetingsList({ user }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.email) return;
    const unsubscribe = base44.entities.Meeting.subscribe((event) => {
      if (['create', 'update', 'delete'].includes(event.type)) {
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
      }
    });
    return unsubscribe;
  }, [user?.email, queryClient]);

  const { data: meetings = [] } = useQuery({
    queryKey: ['meetings', user.email],
    queryFn: () => base44.entities.Meeting.filter({ user_email: user.email }, '-meeting_date'),
  });

  const updateMeeting = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Meeting.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
    },
  });

  const upcomingMeetings = meetings.filter(m => 
    m.status === 'scheduled' && 
    new Date(m.meeting_date) >= new Date(new Date().setHours(0,0,0,0))
  );

  const pastMeetings = meetings.filter(m => 
    m.status === 'completed' || 
    new Date(m.meeting_date) < new Date(new Date().setHours(0,0,0,0))
  ).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Upcoming Meetings */}
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-500" />
          פגישות קרובות ({upcomingMeetings.length})
        </h3>
        {upcomingMeetings.length > 0 ? (
          <div className="space-y-3">
            {upcomingMeetings.map(meeting => (
              <div key={meeting.id} className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-blue-900">{meeting.participant_name}</h4>
                    <p className="text-sm text-blue-700">{meeting.purpose}</p>
                  </div>
                  <span className="text-xs bg-white px-2 py-1 rounded-lg text-blue-600 font-bold border border-blue-200">
                    {new Date(meeting.meeting_date).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-slate-600 mt-3">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {meeting.meeting_time}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {meeting.location}
                  </span>
                  {meeting.participant_phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {meeting.participant_phone}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => updateMeeting.mutate({ id: meeting.id, status: 'completed' })}
                    className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    סמן כבוצע
                  </button>
                  <button
                    onClick={() => updateMeeting.mutate({ id: meeting.id, status: 'cancelled' })}
                    className="text-xs px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50"
                  >
                    ביטול
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-400 text-sm text-center py-8 bg-slate-50 rounded-xl">אין פגישות מתוכננות</p>
        )}
      </div>

      {/* Past Meetings */}
      {pastMeetings.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-500 mb-3">פגישות אחרונות</h3>
          <div className="space-y-2">
            {pastMeetings.map(meeting => (
              <div key={meeting.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
                <div>
                  <p className="font-medium text-slate-700 text-sm">{meeting.participant_name}</p>
                  <p className="text-xs text-slate-500">{meeting.purpose}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{new Date(meeting.meeting_date).toLocaleDateString('he-IL')}</p>
                  {meeting.status === 'completed' && (
                    <span className="text-[10px] text-green-600 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      בוצע
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}