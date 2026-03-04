import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Heart, Calendar, Users, PartyPopper, Coffee, BookOpen } from 'lucide-react';

export default function CommunityPage() {
  const { data: events = [] } = useQuery({
    queryKey: ['events', 'social'],
    queryFn: async () => {
      const all = await base44.entities.SchoolEvent.list('-created_date');
      return all.filter(e => e.event_type === 'social');
    },
  });

  const { data: journalEntries = [] } = useQuery({
    queryKey: ['journal', 'community'],
    queryFn: async () => {
      const all = await base44.entities.JournalEntry.list('-created_date', 20);
      return all.filter(e => ['announcement', 'event'].includes(e.entry_type));
    },
  });

  const upcomingEvents = events.filter(e => {
    const today = new Date();
    const currentDay = today.getDate();
    return e.end_date >= currentDay;
  });

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-2">
            קהילה והווי בית ספרי
          </h1>
          <p className="text-slate-600">אירועים חברתיים, חגיגות והודעות לקהילה</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-pink-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-pink-100 rounded-full">
                <PartyPopper className="h-6 w-6 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">אירועים קרובים</p>
                <p className="text-3xl font-bold text-slate-800">{upcomingEvents.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-purple-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">חברי צוות</p>
                <p className="text-3xl font-bold text-slate-800">-</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Heart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">הודעות פעילות</p>
                <p className="text-3xl font-bold text-slate-800">{journalEntries.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
              <PartyPopper className="h-5 w-5 text-pink-500" />
              אירועים חברתיים קרובים
            </h2>
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.slice(0, 5).map(event => (
                  <div key={event.id} className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl border border-pink-100">
                    <h3 className="font-bold text-slate-800 mb-2">{event.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {event.start_date}-{event.end_date} בחודש
                      </span>
                      {event.time && <span>{event.time}</span>}
                    </div>
                    {event.location && (
                      <p className="text-sm text-slate-500 mt-2">📍 {event.location}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Coffee className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400">אין אירועים קרובים</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-purple-500" />
              הודעות ועדכונים
            </h2>
            <div className="space-y-4">
              {journalEntries.length > 0 ? (
                journalEntries.slice(0, 8).map(entry => (
                  <div key={entry.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-slate-800">{entry.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        entry.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                        entry.priority === 'important' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {entry.priority === 'urgent' ? 'דחוף' :
                         entry.priority === 'important' ? 'חשוב' : 'רגיל'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{entry.content}</p>
                    <p className="text-xs text-slate-400">{entry.date}</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Heart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400">אין הודעות חדשות</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}