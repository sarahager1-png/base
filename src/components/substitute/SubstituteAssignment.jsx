import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import { getScheduleForEmail, getFreeSlots } from '@/lib/scheduleStorage';
import { sendWhatsApp } from '@/lib/whatsapp';
import { isEnabled } from '@/lib/featureFlags';
import { UserCheck, Clock, Send, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { toast } from 'sonner';

const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];

export default function SubstituteAssignment({ absence, onAssigned }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [selectedSub, setSelectedSub]   = useState(null);
  const [selectedHours, setSelectedHours] = useState([]);
  const [sending, setSending] = useState(false);

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const assignMutation = useMutation({
    mutationFn: (data) => base44.entities.SubstituteReport.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['substitutes'] });
      toast.success('ממלאת מקום שובצה בהצלחה');
      onAssigned?.();
    },
  });

  const absentDayIdx = absence.start_date
    ? new Date(absence.start_date).getDay()
    : new Date().getDay();

  // Find teachers who have free slots on the absent teacher's day
  const substitutes = allUsers
    .filter(u => ['teacher', 'coordinator', 'counselor', 'assistant'].includes(u.role)
                 && u.email !== absence.user_email)
    .map(u => {
      const free = getFreeSlots(u.email, absentDayIdx);
      return { ...u, freeSlots: free };
    })
    .filter(u => u.freeSlots.length > 0)
    .sort((a, b) => b.freeSlots.length - a.freeSlots.length);

  const absentTeacherLessons = getScheduleForEmail(absence.user_email)
    .filter(l => l.day === absentDayIdx)
    .sort((a, b) => a.hour - b.hour);

  function toggleHour(h) {
    setSelectedHours(prev => prev.includes(h) ? prev.filter(x => x !== h) : [...prev, h]);
  }

  async function assign() {
    if (!selectedSub) return toast.error('יש לבחור ממלאת מקום');
    if (selectedHours.length === 0) return toast.error('יש לבחור שעות');
    setSending(true);
    try {
      await assignMutation.mutateAsync({
        absent_teacher_email: absence.user_email,
        absent_teacher_name:  absence.user_name,
        substitute_email: selectedSub.email,
        substitute_name:  selectedSub.full_name,
        date: absence.start_date,
        hours: selectedHours,
        status: 'assigned',
      });

      // Send WhatsApp if configured
      if (isEnabled('whatsapp') && selectedSub.phone) {
        const hoursList = selectedHours.join(', ');
        const msg = `שלום ${selectedSub.full_name} 👋\nבקשת מילוי מקום: ${absence.user_name} נעדרת.\nיום ${DAY_NAMES[absentDayIdx]}, שעות ${hoursList}.\nנא לאשר קבלה. תודה — מערכת Smart Base`;
        await sendWhatsApp(selectedSub.phone, msg).catch(() => {});
      }

      toast.success('השיבוץ נשלח');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-3 border border-blue-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100 transition-colors text-right">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-bold text-blue-700">שיבוץ ממלאת מקום</span>
          {substitutes.length > 0 && (
            <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">{substitutes.length} פנויות</span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-blue-500" /> : <ChevronDown className="h-4 w-4 text-blue-500" />}
      </button>

      {expanded && (
        <div className="p-4 space-y-4 bg-white">
          {/* Absent teacher's lessons that day */}
          {absentTeacherLessons.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">שעות {absence.user_name} ביום {DAY_NAMES[absentDayIdx]}:</p>
              <div className="flex flex-wrap gap-2">
                {absentTeacherLessons.map(l => (
                  <button key={l.hour}
                    onClick={() => toggleHour(l.hour)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      selectedHours.includes(l.hour)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-blue-300'
                    }`}>
                    שעה {l.hour} — {l.subject} {l.className}
                  </button>
                ))}
              </div>
              {absentTeacherLessons.length === 0 && (
                <p className="text-xs text-slate-400">אין מערכת שעות מוגדרת למורה זו</p>
              )}
            </div>
          )}

          {/* Pick substitute */}
          <div>
            <p className="text-xs font-bold text-slate-500 mb-2">בחירת ממלאת מקום:</p>
            {substitutes.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">אין מורות פנויות ביום זה (טען מערכת שעות)</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {substitutes.map(s => (
                  <button key={s.email}
                    onClick={() => setSelectedSub(s)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors ${
                      selectedSub?.email === s.email
                        ? 'bg-blue-50 border-blue-300 text-blue-800'
                        : 'bg-slate-50 border-slate-200 hover:border-blue-200'
                    }`}>
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-slate-400" />
                      <span className="font-semibold">{s.full_name}</span>
                    </div>
                    <span className="text-xs text-green-600 font-bold">{s.freeSlots.length} שעות פנויות</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={assign} disabled={sending || !selectedSub || selectedHours.length === 0}
            className="w-full py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center gap-2 transition-colors">
            <Send className="h-4 w-4" />
            {sending ? 'שולח...' : 'שבץ ממלאת מקום'}
          </button>
        </div>
      )}
    </div>
  );
}
