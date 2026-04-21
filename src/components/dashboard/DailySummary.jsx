import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import { sendWhatsAppToMany } from '@/lib/whatsapp';
import { isEnabled } from '@/lib/featureFlags';
import { Sun, ChevronDown, ChevronUp, Users, Clock, Wrench, ShoppingCart, Calendar, Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const TODAY = new Date();
const TODAY_NUM = TODAY.getDate();
const TOMORROW_NUM = TODAY_NUM + 1;
const DAY_NAMES = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];

export default function DailySummary({ user }) {
  const [expanded, setExpanded] = useState(false);
  const [sending, setSending]   = useState(false);
  const [sent, setSent]         = useState(false);

  const { data: absences = [] } = useQuery({
    queryKey: ['absences', 'today'],
    queryFn: () => base44.entities.Absence.filter({ status: 'approved' }),
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ['maintenance', 'open'],
    queryFn: () => base44.entities.MaintenanceTicket.filter({ status: 'open' }),
  });

  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases', 'pending'],
    queryFn: () => base44.entities.PurchaseRequest.filter({ status: 'pending' }),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['schoolEvents'],
    queryFn: () => base44.entities.SchoolEvent.list('-start_date', 10),
  });

  const { data: duties = [] } = useQuery({
    queryKey: ['dutyAssignments', TODAY.getMonth() + 1, TODAY.getFullYear()],
    queryFn: () => base44.entities.DutyAssignment.filter({ month: TODAY.getMonth() + 1, year: TODAY.getFullYear() }),
  });

  const { data: prints = [] } = useQuery({
    queryKey: ['prints', 'pending'],
    queryFn: () => base44.entities.PrintRequest.filter({ status: 'pending' }),
  });

  const todayAbsences   = absences.filter(a => a.start_date <= TODAY_NUM && a.end_date >= TODAY_NUM);
  const tomorrowEvents  = events.filter(e => e.start_date === TOMORROW_NUM);
  const todayDuties     = duties.filter(d => d.day === TODAY_NUM);
  const urgentTickets   = tickets.filter(t => t.urgency === 'urgent' || t.urgency === 'safety');

  function buildSummaryText() {
    const dateStr = TODAY.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
    let lines = [`📋 *סיכום יום — ${dateStr}*\n`];

    if (todayAbsences.length > 0) {
      lines.push(`👤 *נעדרות היום (${todayAbsences.length}):*`);
      todayAbsences.forEach(a => lines.push(`   • ${a.user_name}`));
    } else {
      lines.push('✅ אין היעדרויות מאושרות היום');
    }

    if (urgentTickets.length > 0) {
      lines.push(`\n🔧 *תקלות דחופות (${urgentTickets.length}):*`);
      urgentTickets.forEach(t => lines.push(`   • ${t.location} — ${t.issue}`));
    }

    if (purchases.length > 0) {
      lines.push(`\n🛒 ${purchases.length} בקשות רכש ממתינות לאישור`);
    }

    if (prints.length > 0) {
      lines.push(`\n🖨️ ${prints.length} בקשות הדפסה בתור`);
    }

    if (tomorrowEvents.length > 0) {
      lines.push(`\n📅 *מחר:*`);
      tomorrowEvents.forEach(e => lines.push(`   • ${e.title}${e.location ? ` @ ${e.location}` : ''}`));
    }

    lines.push(`\n_נשלח ממערכת Smart Base_`);
    return lines.join('\n');
  }

  async function sendSummary() {
    setSending(true);
    try {
      const msg = buildSummaryText();
      if (isEnabled('whatsapp') && user?.phone) {
        await sendWhatsAppToMany([user.phone], msg);
        toast.success('סיכום נשלח לוואצאפ');
      } else {
        // Copy to clipboard as fallback
        await navigator.clipboard.writeText(msg);
        toast.success('הסיכום הועתק ללוח');
      }
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch {
      toast.error('שגיאה בשליחת הסיכום');
    } finally {
      setSending(false);
    }
  }

  const urgencyColor = urgentTickets.length > 0 ? 'border-yellow-200 bg-yellow-50' : 'border-yellow-100 bg-yellow-50';

  return (
    <div className={`rounded-2xl border p-5 ${urgencyColor}`}>
      <button onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between text-right">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-yellow-100 rounded-xl">
            <Sun className="h-5 w-5 text-yellow-700" />
          </div>
          <div>
            <p className="font-bold text-slate-800">סיכום יום</p>
            <p className="text-xs text-slate-500">
              {todayAbsences.length} נעדרות · {urgentTickets.length} תקלות דחופות · {tomorrowEvents.length} אירועים מחר
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={e => { e.stopPropagation(); sendSummary(); }}
            disabled={sending}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              sent ? 'bg-green-100 text-green-700' : 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300'
            }`}>
            {sent ? <><CheckCircle className="h-3.5 w-3.5" />נשלח</> : <><Send className="h-3.5 w-3.5" />שלח</>}
          </button>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <SummaryCard icon={Users}    color="blue"   label="נעדרות היום"     value={todayAbsences.length}  alert={todayAbsences.length > 0} />
          <SummaryCard icon={Wrench}   color="red"    label="תקלות דחופות"    value={urgentTickets.length}  alert={urgentTickets.length > 0} />
          <SummaryCard icon={ShoppingCart} color="amber" label="רכש ממתין"    value={purchases.length} />
          <SummaryCard icon={Calendar} color="purple" label="אירועים מחר"     value={tomorrowEvents.length} />

          {todayAbsences.length > 0 && (
            <div className="col-span-2 md:col-span-4 bg-white rounded-xl p-4 border border-blue-100">
              <p className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> נעדרות
              </p>
              <div className="flex flex-wrap gap-2">
                {todayAbsences.map(a => (
                  <span key={a.id} className="text-xs bg-blue-50 text-blue-800 border border-blue-200 px-2 py-1 rounded-lg font-medium">
                    {a.user_name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {tomorrowEvents.length > 0 && (
            <div className="col-span-2 md:col-span-4 bg-white rounded-xl p-4 border border-yellow-100">
              <p className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> מחר
              </p>
              {tomorrowEvents.map(e => (
                <p key={e.id} className="text-sm font-medium text-slate-700">{e.title}{e.location && <span className="text-slate-400"> · {e.location}</span>}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, color, label, value, alert }) {
  const colors = {
    blue:   'bg-blue-50 border-blue-100 text-blue-700',
    red:    'bg-yellow-50 border-yellow-100 text-yellow-700',
    amber:  'bg-yellow-50 border-yellow-100 text-yellow-700',
    purple: 'bg-yellow-50 border-yellow-100 text-yellow-700',
  };
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${colors[color]} ${alert ? 'ring-2 ring-offset-1 ring-yellow-300' : ''}`}>
      <Icon className="h-5 w-5 flex-shrink-0" />
      <div>
        <p className="text-2xl font-bold leading-none">{value}</p>
        <p className="text-xs mt-0.5 opacity-70">{label}</p>
      </div>
    </div>
  );
}
