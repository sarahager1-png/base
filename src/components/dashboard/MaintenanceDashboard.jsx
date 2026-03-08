import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import StatCard from '../StatCard';
import DailyMessageBoard from './DailyMessageBoard';
import { Wrench, AlertTriangle, CheckSquare, ShoppingCart } from 'lucide-react';

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance'] });
    },
  });

  const openTickets = tickets.filter(t => t.status === 'open');
  const urgentTickets = tickets.filter(t => t.urgency === 'urgent' || t.urgency === 'safety');

  return (
    <div className="space-y-6 animate-fade-in">
      <DailyMessageBoard user={user} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="קריאות פתוחות" 
          value={openTickets.length} 
          icon={Wrench} 
          color="blue" 
          subtext={`${tickets.filter(t => new Date(t.created_date).toDateString() === new Date().toDateString()).length} חדשות מהיום`} 
        />
        <StatCard 
          title="התראות דחופות" 
          value={urgentTickets.length} 
          icon={AlertTriangle} 
          color="red" 
          subtext={urgentTickets[0]?.issue || 'הכל תקין'} 
        />
        <StatCard
          title="בקשות רכש"
          value={purchases.length}
          icon={ShoppingCart}
          color="amber"
          subtext="ממתינות לאישור"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
            <Wrench className="h-5 w-5 text-slate-500" />
            רשימת תקלות לטיפול
          </h3>
          <button className="text-sm text-blue-600 font-medium hover:underline">
            היסטוריית טיפולים
          </button>
        </div>

        <div className="space-y-4">
          {tickets.length > 0 ? (
            tickets.map(ticket => (
              <div 
                key={ticket.id} 
                className={`p-4 rounded-xl border-l-4 ${
                  ticket.urgency === 'urgent' || ticket.urgency === 'safety' 
                    ? 'border-red-500 bg-red-50' 
                    : 'border-blue-400 bg-slate-50'
                } flex justify-between items-center`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-slate-800">{ticket.location}</span>
                    {(ticket.urgency === 'urgent' || ticket.urgency === 'safety') && (
                      <span className="text-[10px] bg-red-200 text-red-800 px-2 py-0.5 rounded-full font-bold">
                        {ticket.urgency === 'safety' ? 'בטיחותי!' : 'דחוף'}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 text-sm">{ticket.issue}</p>
                  <p className="text-xs text-slate-400 mt-1">דיווח: {ticket.reporter_name}</p>
                </div>
                <div className="flex gap-2">
                  {ticket.status === 'open' && (
                    <>
                      <button 
                        onClick={() => updateTicket.mutate({ id: ticket.id, status: 'in_progress' })}
                        className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-lg text-sm hover:bg-slate-50"
                      >
                        בטיפול
                      </button>
                      <button 
                        onClick={() => updateTicket.mutate({ id: ticket.id, status: 'completed' })}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 shadow-sm"
                      >
                        טופל
                      </button>
                    </>
                  )}
                  {ticket.status === 'in_progress' && (
                    <button 
                      onClick={() => updateTicket.mutate({ id: ticket.id, status: 'completed' })}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 shadow-sm"
                    >
                      סיים טיפול
                    </button>
                  )}
                  {ticket.status === 'completed' && (
                    <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-lg font-bold">
                      ✓ טופל
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-center py-8">אין קריאות פתוחות</p>
          )}
        </div>
      </div>
      {/* Purchase Requests */}
      {purchases.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2 mb-4">
            <ShoppingCart className="h-5 w-5 text-amber-500" />
            בקשות רכש ממתינות ({purchases.length})
          </h3>
          <div className="space-y-3">
            {purchases.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{p.item_name}</p>
                  <p className="text-xs text-slate-500">{p.user_name}{p.estimated_cost ? ` • ₪${p.estimated_cost}` : ''}</p>
                </div>
                <span className="text-[10px] bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-bold">ממתין</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}