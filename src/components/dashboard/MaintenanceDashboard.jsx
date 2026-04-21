import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import StatCard from '../StatCard';
import DailyMessageBoard from './DailyMessageBoard';
import { Wrench, AlertTriangle, ShoppingCart, CheckCircle, Clock } from 'lucide-react';

const URGENCY_LABEL = { urgent: 'דחוף', safety: 'בטיחות' };
const URGENCY_CLASS = { urgent: 'bg-amber-50 border-amber-200', safety: 'bg-red-50 border-red-200' };

export default function MaintenanceDashboard({ user }) {
  const queryClient = useQueryClient();

  const { data: tickets = [] } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => base44.entities.MaintenanceTicket.list('-created_date'),
  });
  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases', 'pending-maintenance'],
    queryFn: () => base44.entities.PurchaseRequest.filter({ status: 'pending' }),
  });

  const updateTicket = useMutation({
    mutationFn: ({ id, status }) => base44.entities.MaintenanceTicket.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenance'] }),
  });

  const openTickets  = tickets.filter(t => t.status === 'open');
  const urgentTickets = tickets.filter(t => t.urgency === 'urgent' || t.urgency === 'safety');
  const todayNew = tickets.filter(t => new Date(t.created_date).toDateString() === new Date().toDateString());

  return (
    <div className="space-y-5 animate-fade-in">
      <DailyMessageBoard user={user} />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="animate-slide-up-1">
          <StatCard title="קריאות פתוחות" value={openTickets.length} icon={Wrench} color="blue"
            subtext={`${todayNew.length} חדשות מהיום`} />
        </div>
        <div className="animate-slide-up-2">
          <StatCard title="התראות דחופות" value={urgentTickets.length} icon={AlertTriangle} color="red"
            subtext={urgentTickets[0]?.issue || 'הכל תקין'} />
        </div>
        <div className="animate-slide-up-3">
          <StatCard title="בקשות רכש" value={purchases.length} icon={ShoppingCart} color="amber"
            subtext="ממתינות לאישור" />
        </div>
      </div>

      {/* Tickets list */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
          <div className="h-7 w-7 rounded-lg bg-slate-700 flex items-center justify-center flex-shrink-0">
            <Wrench className="h-3.5 w-3.5 text-white" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">רשימת תקלות לטיפול</h3>
          {urgentTickets.length > 0 && (
            <span className="mr-auto text-[10px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">{urgentTickets.length} דחופות</span>
          )}
        </div>
        <div className="p-4 space-y-2.5">
          {tickets.length > 0 ? tickets.map(ticket => {
            const isUrgent = ticket.urgency === 'urgent' || ticket.urgency === 'safety';
            return (
              <div key={ticket.id} className={`flex items-center justify-between p-4 rounded-xl border ${isUrgent ? URGENCY_CLASS[ticket.urgency] : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex-1 min-w-0 ml-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[13px] font-bold text-slate-800 truncate">{ticket.location}</p>
                    {isUrgent && (
                      <span className="text-[10px] font-black bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        {URGENCY_LABEL[ticket.urgency]}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-slate-600 truncate">{ticket.issue}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">דיווח: {ticket.reporter_name}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {ticket.status === 'open' && (
                    <>
                      <button onClick={() => updateTicket.mutate({ id: ticket.id, status: 'in_progress' })}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors">
                        בטיפול
                      </button>
                      <button onClick={() => updateTicket.mutate({ id: ticket.id, status: 'completed' })}
                        className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                        טופל
                      </button>
                    </>
                  )}
                  {ticket.status === 'in_progress' && (
                    <button onClick={() => updateTicket.mutate({ id: ticket.id, status: 'completed' })}
                      className="text-[11px] font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                      סיים טיפול
                    </button>
                  )}
                  {ticket.status === 'completed' && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg">
                      <CheckCircle className="h-3.5 w-3.5" /> טופל
                    </span>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="flex items-center justify-center py-10 text-slate-400">
              <p className="text-sm font-medium">אין קריאות פתוחות</p>
            </div>
          )}
        </div>
      </div>

      {/* Purchases */}
      {purchases.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
            <div className="h-7 w-7 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">בקשות רכש ממתינות</h3>
            <span className="mr-auto text-[10px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded-full">{purchases.length}</span>
          </div>
          <div className="p-4 space-y-2">
            {purchases.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                <div>
                  <p className="text-[13px] font-semibold text-slate-700">{p.item_name}</p>
                  <p className="text-[11px] text-slate-400">{p.user_name}{p.estimated_cost ? ` · ₪${p.estimated_cost}` : ''}</p>
                </div>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">ממתין</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
