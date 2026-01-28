import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Calendar, Clock, AlertCircle, Bell, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function DailyJournal({ date }) {
  const dateStr = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');

  const { data: entries = [] } = useQuery({
    queryKey: ['journal', dateStr],
    queryFn: () => base44.entities.JournalEntry.filter({ date: dateStr }),
  });

  const { data: holidays = [] } = useQuery({
    queryKey: ['holidays'],
    queryFn: () => base44.entities.Holiday.list(),
  });

  const holiday = holidays.find(h => 
    dateStr >= h.start_date && dateStr <= h.end_date
  );

  const typeConfig = {
    announcement: { icon: Bell, color: 'blue', label: 'הודעה' },
    reminder: { icon: Clock, color: 'amber', label: 'תזכורת' },
    event: { icon: Calendar, color: 'purple', label: 'אירוע' },
    holiday: { icon: Calendar, color: 'green', label: 'חג' },
    meeting: { icon: Users, color: 'indigo', label: 'ישיבה' },
  };

  const priorityConfig = {
    normal: 'border-slate-200',
    important: 'border-amber-400 bg-amber-50',
    urgent: 'border-red-400 bg-red-50',
  };

  return (
    <div className="space-y-4">
      {holiday && (
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
          <div className="flex items-center gap-2 text-green-800 font-bold">
            <Calendar className="h-5 w-5" />
            {holiday.name}
          </div>
          <p className="text-sm text-green-600 mt-1">
            {holiday.type === 'holiday' && 'חג'}
            {holiday.type === 'vacation' && 'חופשה'}
            {holiday.type === 'professional_development' && 'השתלמות'}
          </p>
        </div>
      )}

      {entries.length > 0 ? (
        <div className="space-y-3">
          {entries.map(entry => {
            const config = typeConfig[entry.entry_type] || typeConfig.announcement;
            const Icon = config.icon;
            
            return (
              <div 
                key={entry.id}
                className={`p-4 rounded-xl border-2 ${priorityConfig[entry.priority]} transition-all`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-${config.color}-100 text-${config.color}-600`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-800">{entry.title}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-${config.color}-100 text-${config.color}-700`}>
                        {config.label}
                      </span>
                      {entry.priority === 'urgent' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-200 text-red-800 font-bold flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          דחוף
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{entry.content}</p>
                    <p className="text-xs text-slate-400 mt-2">
                      נוצר ב-{format(new Date(entry.created_date), 'HH:mm')} ע״י {entry.created_by}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        !holiday && (
          <div className="text-center py-8 text-slate-400">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>אין אירועים ליום זה</p>
          </div>
        )
      )}
    </div>
  );
}