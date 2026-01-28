import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Wrench, Monitor, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function MaintenancePage() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => base44.entities.MaintenanceTicket.list('-created_date'),
    enabled: !!user,
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => base44.entities.PurchaseRequest.list('-created_date'),
    enabled: !!user,
  });

  const generalTickets = tickets.filter(t => t.ticket_type === 'general');
  const computerTickets = tickets.filter(t => t.ticket_type === 'computer');
  const openTickets = tickets.filter(t => t.status === 'open');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">תפעול ורכש</h1>
          <p className="text-slate-600">ניהול תחזוקה, תקלות ובקשות רכש</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">קריאות פתוחות</p>
                <p className="text-2xl font-bold text-slate-800">{openTickets.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-slate-100 rounded-full">
                <Wrench className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">תחזוקה כללית</p>
                <p className="text-2xl font-bold text-slate-800">{generalTickets.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-100 rounded-full">
                <Monitor className="h-6 w-6 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">מחשבים</p>
                <p className="text-2xl font-bold text-slate-800">{computerTickets.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">טופלו</p>
                <p className="text-2xl font-bold text-slate-800">
                  {tickets.filter(t => t.status === 'completed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-slate-500" />
                קריאות תחזוקה
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {tickets.length > 0 ? (
                  tickets.map(ticket => (
                    <div key={ticket.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {ticket.ticket_type === 'computer' ? (
                            <Monitor className="h-4 w-4 text-cyan-500" />
                          ) : (
                            <Wrench className="h-4 w-4 text-slate-500" />
                          )}
                          <span className="font-bold text-slate-800">{ticket.location}</span>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          ticket.status === 'completed' ? 'bg-green-100 text-green-700' :
                          ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {ticket.status === 'completed' ? 'טופל' :
                           ticket.status === 'in_progress' ? 'בטיפול' : 'פתוח'}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{ticket.issue}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{ticket.reporter_name}</span>
                        {ticket.urgency === 'safety' && (
                          <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                            בטיחות!
                          </span>
                        )}
                        {ticket.urgency === 'urgent' && (
                          <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">
                            דחוף
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-12">אין קריאות תחזוקה</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                בקשות רכש
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                {purchases.length > 0 ? (
                  purchases.slice(0, 8).map(purchase => (
                    <div key={purchase.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-slate-800">{purchase.item_name}</p>
                          <p className="text-xs text-slate-500 mt-1">{purchase.user_name}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          purchase.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                          purchase.status === 'ordered' ? 'bg-blue-100 text-blue-700' :
                          purchase.status === 'approved' ? 'bg-green-100 text-green-700' :
                          purchase.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {purchase.status === 'completed' ? 'הושלם' :
                           purchase.status === 'ordered' ? 'הוזמן' :
                           purchase.status === 'approved' ? 'מאושר' :
                           purchase.status === 'rejected' ? 'נדחה' : 'ממתין'}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600">{purchase.reason}</p>
                      {purchase.estimated_cost && (
                        <p className="text-xs text-slate-500 mt-2">₪{purchase.estimated_cost}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-12">אין בקשות רכש</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}