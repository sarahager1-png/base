import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

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

  const [syncToGoogle, setSyncToGoogle] = useState(true);

  const queryClient = useQueryClient();

  const createMeeting = useMutation({
    mutationFn: async (data) => {
      const meeting = await base44.entities.Meeting.create(data);
      
      if (syncToGoogle) {
        try {
          await base44.functions.invoke('syncMeetingToCalendar', { meetingId: meeting.id });
          toast.success('הפגישה נוספה גם ליומן גוגל');
        } catch (error) {
          toast.error('הפגישה נוצרה אך לא סונכרנה ליומן גוגל');
        }
      }
      
      return meeting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
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
            <label className="text-xs font-bold text-slate-600 block mb-2">שם המשתתף/ת</label>
            <Input
              placeholder="שם הורה / תלמיד/ה"
              value={formData.participant_name}
              onChange={(e) => setFormData({...formData, participant_name: e.target.value})}
              required
            />
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
                onChange={(e) => setFormData({...formData, meeting_date: e.target.value})}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2">שעה</label>
              <Input
                type="time"
                value={formData.meeting_time}
                onChange={(e) => setFormData({...formData, meeting_time: e.target.value})}
                required
              />
            </div>
          </div>

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

          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <input
              type="checkbox"
              id="syncGoogle"
              checked={syncToGoogle}
              onChange={(e) => setSyncToGoogle(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="syncGoogle" className="text-sm text-blue-800 cursor-pointer">
              סנכרן ליומן Google Calendar שלי
            </label>
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