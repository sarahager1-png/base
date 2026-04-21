import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import StatCard from '../StatCard';
import { Users, Calendar, FileSignature, MessageCircle, ArrowRight, CheckSquare, Clock } from 'lucide-react';

export default function CoordinatorDashboard({ user, setView }) {
  const { data: events = [] } = useQuery({
    queryKey: ['schoolEvents'],
    queryFn: () => base44.entities.SchoolEvent.list('-start_date', 10),
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', 'mine'],
    queryFn: () => base44.entities.Task.filter({ assigned_to: user?.email, status: 'pending' }),
    enabled: !!user?.email,
  });

  const { data: absences = [] } = useQuery({
    queryKey: ['absences', 'pending'],
    queryFn: () => base44.entities.Absence.filter({ status: 'pending' }),
  });

  const staffCount = allUsers.filter(u =>
    ['teacher', 'assistant', 'counselor'].includes(u.role)
  ).length;

  const today = new Date();
  const todayNum = today.getDate();
  const upcomingEvent = events.find(e => e.start_date >= todayNum);

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="צוות הוראה"
          value={staffCount || '—'}
          icon={Users}
          color="purple"
          subtext="מורות, סייעות, יועצות"
        />
        <StatCard
          title="אירוע קרוב"
          value={upcomingEvent ? `${upcomingEvent.start_date - todayNum} ימים` : 'אין'}
          icon={Calendar}
          color="blue"
          subtext={upcomingEvent?.title || 'אין אירועים קרובים'}
        />
        <StatCard
          title="היעדרויות ממתינות"
          value={absences.length}
          icon={Clock}
          color="amber"
          subtext={absences.length === 0 ? 'הכל מאושר' : 'לטיפול'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-yellow-600" />
            פעולות מהירות
          </h3>
          <div className="space-y-3">
            {[
              { label: 'היעדרויות ודיווח', sub: 'דיווח ואישור היעדרויות', view: 'attendance', icon: Clock },
              { label: 'לוח זמנים',         sub: 'מערכת השעות',            view: 'schedule',   icon: Calendar },
              { label: 'משימות ואישורים',   sub: `${tasks.length} ממתינות לטיפול`, view: 'tasks', icon: CheckSquare },
              { label: 'ניהול תורנויות',    sub: 'שיבוצים לתורנות',        view: 'duty-management', icon: Users },
            ].map(({ label, sub, view, icon: Icon }) => (
              <button key={view}
                onClick={() => setView?.(view)}
                className="w-full flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-yellow-50 hover:border-yellow-200 border border-transparent transition-all group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-full text-slate-500 group-hover:text-yellow-700 shadow-sm">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">{label}</p>
                    <p className="text-xs text-slate-500">{sub}</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-yellow-600" />
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-500" />
            אירועים קרובים
          </h3>
          <div className="space-y-3">
            {events.filter(e => e.start_date >= todayNum).slice(0, 5).length > 0 ? (
              events.filter(e => e.start_date >= todayNum).slice(0, 5).map(event => (
                <div key={event.id} className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="font-bold text-slate-800">{event.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                    <span>📅 {event.start_date} בחודש</span>
                    {event.location && <span>📍 {event.location}</span>}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10">
                <Calendar className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">אין אירועים קרובים</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pending Absences */}
      {absences.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-yellow-100 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            היעדרויות ממתינות לאישור ({absences.length})
          </h3>
          <div className="space-y-2">
            {absences.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{a.user_name}</p>
                  <p className="text-xs text-slate-500">{a.start_date} — {a.absence_reason}</p>
                </div>
                <button onClick={() => setView?.('attendance')}
                  className="text-xs px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                  לטיפול
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
