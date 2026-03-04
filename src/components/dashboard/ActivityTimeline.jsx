import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock, ShoppingCart, Wrench, FileText, Users, Activity } from 'lucide-react';

const STATUS_LABELS = {
  pending:   { label: 'ממתין',   color: '#f59e0b' },
  approved:  { label: 'אושר',    color: '#10b981' },
  rejected:  { label: 'נדחה',    color: '#ef4444' },
  open:      { label: 'פתוח',    color: '#3b82f6' },
  in_progress: { label: 'בטיפול', color: '#8b5cf6' },
  completed: { label: 'הושלם',   color: '#6b7280' },
  reported:  { label: 'דווח',    color: '#f97316' },
};

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'עכשיו';
  if (mins < 60) return `לפני ${mins} דקות`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `לפני ${hrs} שעות`;
  return `לפני ${Math.floor(hrs / 24)} ימים`;
}

function TimelineItem({ icon: Icon, color, title, subtitle, time, status }) {
  const s = STATUS_LABELS[status] || {};
  return (
    <div className="flex items-start gap-3 group">
      <div className="relative flex-shrink-0">
        <div className="h-9 w-9 rounded-xl flex items-center justify-center shadow-sm"
             style={{ background: `${color}18`, border: `1px solid ${color}30` }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        {/* Connecting line */}
        <div className="absolute top-9 right-1/2 -translate-x-1/2 w-px h-4 bg-slate-100 dark:bg-slate-700 group-last:hidden" />
      </div>
      <div className="flex-1 pb-4 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{title}</p>
            {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {s.label && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: `${s.color}18`, color: s.color }}>
                {s.label}
              </span>
            )}
            <span className="text-[10px] text-slate-400 whitespace-nowrap">{time}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActivityTimeline() {
  const { data: absences = [] }  = useQuery({ queryKey: ['absences-all'],  queryFn: () => base44.entities.Absence.list('-created_date', 5) });
  const { data: purchases = [] } = useQuery({ queryKey: ['purchases-tl'],  queryFn: () => base44.entities.PurchaseRequest.list('-created_date', 5) });
  const { data: tickets = [] }   = useQuery({ queryKey: ['tickets-tl'],    queryFn: () => base44.entities.MaintenanceTicket.list('-created_date', 5) });

  const events = [
    ...absences.map(a  => ({ date: a.created_date, icon: Clock,        color: '#f59e0b', title: `היעדרות – ${a.employee_name || ''}`, subtitle: a.reason, status: a.status })),
    ...purchases.map(p => ({ date: p.created_date, icon: ShoppingCart, color: '#10b981', title: `בקשת רכש – ${p.item_name || p.title || ''}`, subtitle: p.description, status: p.status })),
    ...tickets.map(t   => ({ date: t.created_date, icon: Wrench,       color: '#8b5cf6', title: `תקלה – ${t.title || ''}`, subtitle: t.location, status: t.status })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
          <Activity className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white text-base">פעילות אחרונה</h3>
          <p className="text-xs text-slate-400">זרם אירועים בזמן אמת</p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">אין פעילות אחרונה</div>
      ) : (
        <div>
          {events.map((e, i) => (
            <TimelineItem key={i} {...e} time={timeAgo(e.date)} />
          ))}
        </div>
      )}
    </div>
  );
}
