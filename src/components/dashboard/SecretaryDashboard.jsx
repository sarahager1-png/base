import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import StatCard from '../StatCard';
import DailyMessageBoard from './DailyMessageBoard';
import MeetingsList from '../meetings/MeetingsList';
import AddMeeting from '../meetings/AddMeeting';
import AbsenceApprovalPanel from './AbsenceApprovalPanel';
import {
  Printer, ShoppingCart, FileText, ClipboardCheck,
  Download, Users, Plus, Wrench, AlertTriangle, Clock
} from 'lucide-react';

export default function SecretaryDashboard({ user }) {
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const queryClient = useQueryClient();

  const { data: printQueue = [] } = useQuery({
    queryKey: ['prints', 'pending'],
    queryFn: () => base44.entities.PrintRequest.filter({ status: 'pending' }),
  });
  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases', 'approved'],
    queryFn: () => base44.entities.PurchaseRequest.filter({ status: 'approved' }),
  });
  const { data: tickets = [] } = useQuery({
    queryKey: ['maintenance', 'open'],
    queryFn: () => base44.entities.MaintenanceTicket.filter({ status: 'open' }),
  });

  const completePrint = useMutation({
    mutationFn: (id) => base44.entities.PrintRequest.update(id, { status: 'completed' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prints'] }),
  });

  const downloadApproval = async (purchaseId) => {
    const response = await base44.functions.invoke('generatePurchaseApproval', { purchaseId });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `purchase-approval-${purchaseId.slice(0, 8)}.pdf`;
    document.body.appendChild(a); a.click();
    window.URL.revokeObjectURL(url); a.remove();
  };

  const totalCopies = printQueue.reduce((sum, job) => sum + job.copies, 0);
  const urgentTickets = tickets.filter(t => t.urgency === 'urgent' || t.urgency === 'safety');

  return (
    <div className="space-y-5 animate-fade-in">
      <DailyMessageBoard user={user} />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="animate-slide-up-1">
          <StatCard title="ממתין להדפסה" value={printQueue.length} icon={Printer} color="blue" subtext={`${totalCopies} דפים סה״כ`} />
        </div>
        <div className="animate-slide-up-2">
          <StatCard title="רכש לביצוע" value={purchases.length} icon={ShoppingCart} color="amber" subtext="מאושרים תקציבית" />
        </div>
        <div className="animate-slide-up-3">
          <StatCard title="תקלות פתוחות" value={tickets.length} icon={Wrench} color="red"
            subtext={urgentTickets.length > 0 ? `${urgentTickets.length} דחופות` : 'אין דחופות'} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Print Queue */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
            <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Printer className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">תור הדפסות פעיל</h3>
            {printQueue.length > 0 && (
              <span className="mr-auto text-[10px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-full">{printQueue.length}</span>
            )}
          </div>
          <div className="p-4 space-y-2.5">
            {printQueue.length > 0 ? printQueue.map(job => (
              <div key={job.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0 ${job.urgent ? 'bg-amber-100' : 'bg-white border border-slate-200'}`}>
                    <FileText className={`h-3.5 w-3.5 ${job.urgent ? 'text-amber-600' : 'text-slate-400'}`} />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-700">{job.user_name}</p>
                    <p className="text-[11px] text-slate-400">{job.file_name} · {job.copies} עותקים</p>
                  </div>
                </div>
                <button onClick={() => completePrint.mutate(job.id)}
                  className="text-[11px] font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors">
                  בוצע
                </button>
              </div>
            )) : (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <p className="text-sm font-medium">אין הדפסות ממתינות</p>
              </div>
            )}
          </div>
        </div>

        {/* Approval panel */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
            <div className="h-7 w-7 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
              <ClipboardCheck className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">אישור דוחות נוכחות</h3>
          </div>
          <div className="p-4">
            <AbsenceApprovalPanel />
          </div>
        </div>
      </div>

      {/* Purchases */}
      {purchases.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
            <div className="h-7 w-7 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
              <ShoppingCart className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">רכש מאושר</h3>
            <span className="mr-auto text-[10px] font-black bg-amber-500 text-white px-1.5 py-0.5 rounded-full">{purchases.length}</span>
          </div>
          <div className="p-4 space-y-2.5">
            {purchases.map(purchase => (
              <div key={purchase.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50">
                <div>
                  <p className="text-[13px] font-semibold text-slate-700">{purchase.item_name}</p>
                  <p className="text-[11px] text-slate-400">{purchase.user_name}{purchase.estimated_cost ? ` · ₪${purchase.estimated_cost}` : ''}</p>
                </div>
                <button onClick={() => downloadApproval(purchase.id)}
                  className="text-[11px] font-semibold bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-1">
                  <Download className="h-3 w-3" /> הורד
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tickets */}
      {tickets.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
            <div className="h-7 w-7 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
              <Wrench className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">תקלות פתוחות</h3>
            <span className="mr-auto text-[10px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">{tickets.length}</span>
          </div>
          <div className="p-4 space-y-2">
            {tickets.map(ticket => (
              <div key={ticket.id} className={`flex items-center justify-between p-3 rounded-xl border ${urgentTickets.includes(ticket) ? 'border-amber-200 bg-amber-50' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className={`h-4 w-4 flex-shrink-0 ${urgentTickets.includes(ticket) ? 'text-amber-500' : 'text-slate-400'}`} />
                  <div>
                    <p className="text-[13px] font-semibold text-slate-700">{ticket.location} — {ticket.issue}</p>
                    <p className="text-[11px] text-slate-400">דיווח: {ticket.reporter_name}</p>
                  </div>
                </div>
                {urgentTickets.includes(ticket) && (
                  <span className="text-[10px] font-black bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full flex-shrink-0">
                    {ticket.urgency === 'safety' ? 'בטיחות' : 'דחוף'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Meetings */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Users className="h-3.5 w-3.5 text-white" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">לוח פגישות</h3>
          <button onClick={() => setShowAddMeeting(true)}
            className="mr-auto text-[11px] font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1">
            <Plus className="h-3 w-3" /> פגישה חדשה
          </button>
        </div>
        <div className="p-4">
          <MeetingsList user={user} />
        </div>
      </div>

      {showAddMeeting && <AddMeeting user={user} onClose={() => setShowAddMeeting(false)} />}
    </div>
  );
}
