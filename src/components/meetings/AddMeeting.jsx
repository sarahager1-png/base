import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Users, Loader2, Clock } from 'lucide-react';
import { toast } from 'sonner';

const TEACHER_BASE_SCHEDULE = {
  0: { 1: 'הסטוריה - ח׳2', 2: 'הסטוריה - ח׳2', 3: 'פרטני', 4: 'חלון', 5: 'אזרחות - ט׳1' },
  1: { 1: 'חלון', 2: 'הסטוריה - ח׳3', 3: 'הסטוריה - ח׳3', 4: 'ישיבת צוות', 5: 'הסטוריה - ח׳2' },
  2: { 1: 'אזרחות - ט׳1', 2: 'אזרחות - ט׳1', 3: 'הסטוריה - ח׳2', 4: 'חלון', 5: 'שהייה' },
  3: { 1: 'הסטוריה - ח׳3', 2: 'הסטוריה - ח׳3', 3: 'חלון', 4: 'פרטני', 5: 'חינוך - ח׳2' },
  4: { 1: 'חלון', 2: 'חלון', 3: 'הסטוריה - ח׳2', 4: 'הסטוריה - ח׳2', 5: 'אזרחות - ט׳1' },
  5: { 1: 'סיכום שבוע - ח׳2', 2: 'פרטני' },
};

export default function AddMeeting({ user, onClose }) {
  const [formData, setFormData] = useState({
    user_email: user.email,
    user_name: user.full_name,
    participant_name: '',
    participant_phone: '',
    meeting_date: '',
    meeting_time: '',
    duration_minutes: 30,
    purpose: '',
    location: 'משרד המנהלת',
    status: 'scheduled'
  });

  const [suggestedTimes, setSuggestedTimes] = useState([]);

  const queryClient = useQueryClient();

  // Fetch all staff members for selection
  const { data: staffMembers = [] } = useQuery({
    queryKey: ['staff-members'],
    queryFn: () => base44.entities.User.list(),
  });

  // Fetch meetings for the selected date
  const { data: existingMeetings = [] } = useQuery({
    queryKey: ['meetings-on-date', formData.meeting_date, user.email],
    queryFn: () => base44.entities.Meeting.filter({ user_email: user.email }),
    enabled: !!formData.meeting_date
  });

  // Calculate available times
  useEffect(() => {
    if (!formData.meeting_date) {
      setSuggestedTimes([]);
      return;
    }

    const date = new Date(formData.meeting_date);
    const dayOfWeek = date.getDay();
    const schedule = TEACHER_BASE_SCHEDULE[dayOfWeek] || {};

    const available = [];

    // First priority: חלון (break/window)
    for (let hour = 1; hour <= 5; hour++) {
      const lesson = schedule[hour];
      if (lesson === 'חלון') {
        available.push(`${String(hour + 7).padStart(2, '0')}:00`);
      }
    }

    // Second priority: פרטני (personal time)
    for (let hour = 1; hour <= 5; hour++) {
      const lesson = schedule[hour];
      if (lesson === 'פרטני') {
        available.push(`${String(hour + 7).padStart(2, '0')}:00`);
      }
    }

    setSuggestedTimes(available);
  }, [formData.meeting_date]);

  const createMeeting = useMutation({
    mutationFn: async (data) => {
      const meeting = await base44.entities.Meeting.create(data);
      return meeting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      toast.success('הפגישה נקבעה בהצלחה');
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMeeting.mutate(formData);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" />
            קביעת פגישה
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">בחר עובד/ת</label>
            <select
              className="w-full p-2 border border-slate-300 rounded-lg"
              value={formData.participant_name}
              onChange={(e) => setFormData({...formData, participant_name: e.target.value})}
              required
            >
              <option value="">-- בחר משתתף/ת --</option>
              {staffMembers.map(member => (
                <option key={member.id} value={member.full_name}>
                  {member.full_name} ({member.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">טלפון</label>
            <Input
              type="tel"
              placeholder="050-1234567"
              value={formData.participant_phone}
              onChange={(e) => setFormData({...formData, participant_phone: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2">תאריך</label>
              <Input
                type="date"
                value={formData.meeting_date}
                onChange={(e) => setFormData({...formData, meeting_date: e.target.value, meeting_time: ''})}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2">שעה</label>
              {suggestedTimes.length > 0 ? (
                <select
                  className="w-full p-2 border border-slate-300 rounded-lg"
                  value={formData.meeting_time}
                  onChange={(e) => setFormData({...formData, meeting_time: e.target.value})}
                  required
                >
                  <option value="">בחר שעה פנויה</option>
                  {suggestedTimes.map(time => (
                    <option key={time} value={time}>
                      {time} (חלון/פרטני)
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  type="time"
                  value={formData.meeting_time}
                  onChange={(e) => setFormData({...formData, meeting_time: e.target.value})}
                  required
                />
              )}
            </div>
          </div>

          {suggestedTimes.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-800 flex items-start gap-2">
              <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>המערכת מצאה {suggestedTimes.length} שעות פנויות (חלונות/זמן אישי)</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2">משך (דקות)</label>
              <select
                className="w-full p-2 border border-slate-300 rounded-lg"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({...formData, duration_minutes: Number(e.target.value)})}
              >
                <option value={15}>15 דקות</option>
                <option value={30}>30 דקות</option>
                <option value={45}>45 דקות</option>
                <option value={60}>שעה</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2">מיקום</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">נושא הפגישה</label>
            <Textarea
              placeholder="על מה הפגישה?"
              value={formData.purpose}
              onChange={(e) => setFormData({...formData, purpose: e.target.value})}
              className="h-24"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              ביטול
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={createMeeting.isPending}
            >
              {createMeeting.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />שומר...</>
              ) : (
                'קבע פגישה'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}