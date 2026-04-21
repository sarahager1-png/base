import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import { Clock, FileText, ShoppingCart, UserCheck, CheckCircle2, Trash2 } from 'lucide-react';
import { getStatusBadgeClass } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';

export default function TasksPage() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('smartbase_user') || 'null'); } catch { return null; }
  });
  const qc = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      if (authUser) setUser(authUser);
    });
  }, [authUser]);

  const isManager = user && ['admin', 'vice_principal', 'secretary', 'super_admin'].includes(user.role);

  // Manager queries
  const { data: absences       = [] } = useQuery({ queryKey: ['absences', 'pending'],    queryFn: () => base44.entities.Absence.filter({ status: 'pending' }),           enabled: !!user && isManager });
  const { data: purchaseRequests=[] } = useQuery({ queryKey: ['purchases', 'pending'],   queryFn: () => base44.entities.PurchaseRequest.filter({ status: 'pending' }),    enabled: !!user && isManager });
  const { data: onboardingDocs  = [] } = useQuery({ queryKey: ['onboarding', 'pending'], queryFn: () => base44.entities.OnboardingDocument.filter({ status: 'pending' }), enabled: !!user && isManager });

  // Personal queries
  const { data: myAbsences  = [] } = useQuery({ queryKey: ['myAbsences',  user?.email], queryFn: () => base44.entities.Absence.filter({ user_email: user.email }),           enabled: !!user });
  const { data: myPurchases = [] } = useQuery({ queryKey: ['myPurchases', user?.email], queryFn: () => base44.entities.PurchaseRequest.filter({ user_email: user.email }),    enabled: !!user });
  const { data: myOnboarding= [] } = useQuery({ queryKey: ['myOnboarding',user?.email], queryFn: () => base44.entities.OnboardingDocument.filter({ user_email: user.email }), enabled: !!user && user?.role === 'substitute' });

  // Approve / reject mutations (manager)
  const approveAbsence = useMutation({
    mutationFn: (id) => base44.entities.Absence.update(id, { status: 'approved' }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['absences'] }),
  });
  const rejectAbsence = useMutation({
    mutationFn: (id) => base44.entities.Absence.update(id, { status: 'rejected' }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['absences'] }),
  });
  const approvePurchase = useMutation({
    mutationFn: (id) => base44.entities.PurchaseRequest.update(id, { status: 'approved' }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['purchases'] }),
  });
  const approveOnboarding = useMutation({
    mutationFn: (id) => base44.entities.OnboardingDocument.update(id, { status: 'approved' }),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['onboarding'] }),
  });

  // Delete personal item
  const deleteAbsence  = useMutation({ mutationFn: (id) => base44.entities.Absence.delete(id),          onSuccess: () => qc.invalidateQueries({ queryKey: ['myAbsences'] }) });
  const deletePurchase = useMutation({ mutationFn: (id) => base44.entities.PurchaseRequest.delete(id),   onSuccess: () => qc.invalidateQueries({ queryKey: ['myPurchases'] }) });

  if (!user) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight mb-1">משימות ואישורים</h1>
        <p className="text-sm text-slate-400">מעקב אחר בקשות ואישורים בהמתנה</p>
      </div>

      {/* Manager stats */}
      {isManager && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'היעדרויות לאישור', count: absences.length,        Icon: Clock,      color: 'bg-amber-50 border-amber-100', iconBg: 'bg-amber-500', text: 'text-amber-700' },
            { label: 'בקשות רכש',        count: purchaseRequests.length, Icon: ShoppingCart,color: 'bg-blue-50 border-blue-100',  iconBg: 'bg-blue-600',  text: 'text-blue-700' },
            { label: 'טפסי קליטה',       count: onboardingDocs.length,   Icon: UserCheck,   color: 'bg-violet-50 border-violet-100', iconBg: 'bg-violet-600', text: 'text-violet-700' },
          ].map(({ label, count, Icon, color, iconBg, text }) => (
            <div key={label} className={`bg-white rounded-2xl border p-5 ${color}`}>
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="h-4.5 w-4.5 text-white" />
                </div>
                <div>
                  <p className={`text-2xl font-black tabular-nums ${text}`}>{count}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manager: absences to approve */}
      {isManager && absences.length > 0 && (
        <Section title="היעדרויות לאישור" icon={Clock} iconBg="bg-amber-500" count={absences.length}>
          {absences.map(a => (
            <TaskRow key={a.id}
              title={a.user_name}
              sub={`${a.start_date} — ${a.end_date} · ${a.absence_reason}`}
              status={a.status}
              actions={
                <div className="flex gap-2">
                  <ActionBtn variant="approve" onClick={() => approveAbsence.mutate(a.id)} loading={approveAbsence.isPending} />
                  <ActionBtn variant="reject"  onClick={() => rejectAbsence.mutate(a.id)}  loading={rejectAbsence.isPending} />
                </div>
              }
            />
          ))}
        </Section>
      )}

      {/* Manager: purchases to approve */}
      {isManager && purchaseRequests.length > 0 && (
        <Section title="בקשות רכש לאישור" icon={ShoppingCart} iconBg="bg-blue-600" count={purchaseRequests.length}>
          {purchaseRequests.map(p => (
            <TaskRow key={p.id}
              title={p.item_name}
              sub={`${p.user_name}${p.estimated_cost ? ` · ₪${p.estimated_cost}` : ''}`}
              status={p.status}
              actions={<ActionBtn variant="approve" onClick={() => approvePurchase.mutate(p.id)} loading={approvePurchase.isPending} />}
            />
          ))}
        </Section>
      )}

      {/* Manager: onboarding */}
      {isManager && onboardingDocs.length > 0 && (
        <Section title="טפסי קליטה לאישור" icon={UserCheck} iconBg="bg-violet-600" count={onboardingDocs.length}>
          {onboardingDocs.map(d => (
            <TaskRow key={d.id}
              title={d.user_name}
              sub={d.document_type}
              status={d.status}
              actions={<ActionBtn variant="approve" onClick={() => approveOnboarding.mutate(d.id)} loading={approveOnboarding.isPending} />}
            />
          ))}
        </Section>
      )}

      {/* My absences */}
      <Section title="ההיעדרויות שלי" icon={Clock} iconBg="bg-slate-700">
        {myAbsences.length > 0 ? myAbsences.map(a => (
          <TaskRow key={a.id}
            title={`${a.start_date}${a.end_date !== a.start_date ? ` — ${a.end_date}` : ''}`}
            sub={a.absence_reason}
            status={a.status}
            actions={a.status !== 'pending' && (
              <ActionBtn variant="delete" onClick={() => deleteAbsence.mutate(a.id)} loading={deleteAbsence.isPending} />
            )}
          />
        )) : <Empty text="אין דיווחי היעדרות" />}
      </Section>

      {/* My purchases */}
      <Section title="בקשות הרכש שלי" icon={ShoppingCart} iconBg="bg-blue-600">
        {myPurchases.length > 0 ? myPurchases.map(p => (
          <TaskRow key={p.id}
            title={p.item_name}
            sub={p.reason}
            status={p.status}
            actions={p.status !== 'pending' && (
              <ActionBtn variant="delete" onClick={() => deletePurchase.mutate(p.id)} loading={deletePurchase.isPending} />
            )}
          />
        )) : <Empty text="אין בקשות רכש" />}
      </Section>

      {/* Substitute: onboarding docs */}
      {user?.role === 'substitute' && (
        <Section title="טפסי הקליטה שלי" icon={FileText} iconBg="bg-violet-600">
          {myOnboarding.length > 0 ? myOnboarding.map(d => (
            <TaskRow key={d.id}
              title={d.document_type}
              sub={`הועלה: ${new Date(d.created_date).toLocaleDateString('he-IL')}`}
              status={d.status}
            />
          )) : <Empty text="אין טפסים" />}
        </Section>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function Section({ title, icon: Icon, iconBg, count, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
        <div className={`h-7 w-7 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0`}>
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>
        <h2 className="text-sm font-bold text-slate-800">{title}</h2>
        {count > 0 && (
          <span className={`mr-auto text-[10px] font-black text-white px-1.5 py-0.5 rounded-full ${iconBg}`}>{count}</span>
        )}
      </div>
      <div className="p-4 space-y-2.5">{children}</div>
    </div>
  );
}

function TaskRow({ title, sub, status, actions }) {
  const badge = getStatusBadgeClass(status);
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white transition-colors">
      <div className="min-w-0 flex-1 ml-3">
        <p className="text-[13px] font-semibold text-slate-800 truncate">{title}</p>
        {sub && <p className="text-[11px] text-slate-400 truncate mt-0.5">{sub}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {status && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.badgeClass}`}>{badge.label}</span>
        )}
        {actions}
      </div>
    </div>
  );
}

function ActionBtn({ variant, onClick, loading }) {
  if (variant === 'approve') return (
    <button onClick={onClick} disabled={loading}
      className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
      <CheckCircle2 className="h-3.5 w-3.5" /> אשר
    </button>
  );
  if (variant === 'reject') return (
    <button onClick={onClick} disabled={loading}
      className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors">
      דחה
    </button>
  );
  if (variant === 'delete') return (
    <button onClick={onClick} disabled={loading}
      className="p-1.5 rounded-lg text-slate-300 hover:text-red-400 hover:bg-red-50 disabled:opacity-50 transition-colors"
      title="מחק">
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  );
  return null;
}

function Empty({ text }) {
  return <p className="text-center text-slate-400 text-sm py-6 font-medium">{text}</p>;
}
