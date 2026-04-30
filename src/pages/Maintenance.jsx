import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  Wrench, Monitor, ShoppingCart, Plus, X, Trash2, Send, FileSpreadsheet,
  CheckCircle, AlertTriangle, Clock, MessageSquare, Package, ChevronDown, ChevronUp,
  User, Building, Edit2
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────

const MAINT_LOCATIONS = ['כיתה', 'מסדרון', 'חצר', 'שירותים', 'חדר מורים', 'מעבדה', 'ספרייה', 'משרד', 'אולם ספורט', 'חדר אוכל', 'אחר'];
const MAINT_TYPES = [
  'חשמל / תאורה', 'אינסטלציה / מים', 'ריהוט שבור', 'דלת / חלון',
  'ניקיון לא שגרתי', 'ציוד חצר', 'אחר',
];
const TECH_TYPES = [
  'המחשב לא נדלק', 'אינטרנט לא עובד', 'המקרן לא עובד',
  'סאונד לא עובד', 'תוכנה לא פותחת', 'סיסמה לא עובדת', 'בעיית הרשאות', 'אחר',
];
const URGENCY_LABEL = { normal: 'רגיל', urgent: 'דחוף', safety: 'סכנה בטיחותית', immediate: 'מיידי' };
const URGENCY_COLOR = {
  normal: 'bg-slate-100 text-slate-600',
  urgent: 'bg-orange-100 text-orange-700',
  safety: 'bg-red-100 text-red-700',
  immediate: 'bg-red-100 text-red-700',
};

const MAINT_STATUS = { new: 'חדש', forwarded: 'הועבר לאב הבית', in_progress: 'בתהליך', waiting: 'ממתין לחלקים', done: 'תוקן', closed: 'נסגר', clarification: 'ממתין להבהרה' };
const MAINT_STATUS_COLOR = {
  new: 'bg-yellow-100 text-yellow-700',
  forwarded: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-orange-100 text-orange-700',
  waiting: 'bg-purple-100 text-purple-700',
  done: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-500',
  clarification: 'bg-amber-100 text-amber-700',
};
const TECH_STATUS = { new: 'דווח', claimed: 'בטיפול', external: 'הועבר לטכנאי', resolved: 'נפתר', irreparable: 'לא ניתן לתקן' };
const TECH_STATUS_COLOR = {
  new: 'bg-yellow-100 text-yellow-700',
  claimed: 'bg-blue-100 text-blue-700',
  external: 'bg-orange-100 text-orange-700',
  resolved: 'bg-green-100 text-green-700',
  irreparable: 'bg-slate-100 text-slate-500',
};
const PURCHASE_STATUS = { pending: 'ממתינה', approved: 'מאושרת', partial: 'אושרה חלקית', rejected: 'נדחתה', purchasing: 'ברכישה', arrived: 'הגיע' };
const PURCHASE_STATUS_COLOR = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  partial: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-700',
  purchasing: 'bg-orange-100 text-orange-700',
  arrived: 'bg-green-100 text-green-700',
};

const inp = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-white';
const textarea = 'w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-white resize-none';

function genCode() {
  return `PRCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
}
function parseJSON(s, fallback = []) {
  try { return s ? JSON.parse(s) : fallback; } catch { return fallback; }
}
function fmtDate(s) {
  if (!s) return '';
  return new Date(s).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function MaintenancePage() {
  const { user } = useAuth();
  const specialRoles = Array.isArray(user?.special_roles) ? user.special_roles : [];
  const isAdmin     = ['admin', 'vice_principal'].includes(user?.role);
  const isSecretary = user?.role === 'secretary';
  const isAbBayit   = user?.role === 'maintenance' || specialRoles.includes('ab_bayit');
  const isTechCoord = isAdmin || specialRoles.includes('tech_coordinator');

  const [tab, setTab] = useState('procurement');

  const TABS = [
    { id: 'procurement', label: 'רכש', icon: ShoppingCart },
    { id: 'maintenance', label: 'תחזוקה', icon: Wrench },
    { id: 'tech',        label: 'תקשוב', icon: Monitor },
  ];

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center gap-3">
        <Wrench className="h-6 w-6 text-blue-600 flex-shrink-0" />
        <div>
          <h1 className="text-xl font-bold text-slate-800">תפעול ורכש</h1>
          <p className="text-xs text-slate-400">ניהול תחזוקה, תקלות מחשבים ובקשות רכש</p>
        </div>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${tab === t.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <t.icon className="h-4 w-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === 'procurement' && (
        <ProcurementTab user={user} isAdmin={isAdmin} isSecretary={isSecretary} />
      )}
      {tab === 'maintenance' && (
        <MaintenanceTab user={user} isAdmin={isAdmin} isAbBayit={isAbBayit} />
      )}
      {tab === 'tech' && (
        <TechTab user={user} isAdmin={isAdmin} isTechCoord={isTechCoord} specialRoles={specialRoles} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — PROCUREMENT (רכש)
// ══════════════════════════════════════════════════════════════════════════════
function ProcurementTab({ user, isAdmin, isSecretary }) {
  const qc = useQueryClient();
  const [showForm,      setShowForm]      = useState(false);
  const [approving,     setApproving]     = useState(null);
  const [expandedId,    setExpandedId]    = useState(null);
  const [showSuppliers, setShowSuppliers] = useState(false);

  const { data: allRequests = [] } = useQuery({
    queryKey: ['purchaseRequests'],
    queryFn: () => base44.entities.PurchaseRequest.list('-created_date'),
    enabled: !!user,
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => base44.entities.Supplier.list(),
    enabled: !!user,
  });

  const myRequests     = allRequests.filter(r => r.user_email === user?.email);
  const pendingAdmin   = allRequests.filter(r => r.status === 'pending');
  const approvedList   = allRequests.filter(r => ['approved','partial','purchasing','arrived'].includes(r.status));

  const createReq = useMutation({
    mutationFn: d => base44.entities.PurchaseRequest.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchaseRequests'] }); setShowForm(false); toast.success('הבקשה נשלחה'); },
    onError: () => toast.error('שגיאה בשליחה'),
  });

  const updateReq = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PurchaseRequest.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['purchaseRequests'] }); setApproving(null); toast.success('עודכן'); },
    onError: () => toast.error('שגיאה'),
  });

  const exportExcel = () => {
    const rows = allRequests.flatMap(r =>
      parseJSON(r.items_json).map(item => ({
        'שם מורה': r.user_name, 'מטרה': r.purpose, 'פריט': item.name,
        'כמות': item.qty, 'מחיר משוער': item.est_price || '',
        'אושר': item.approved === true ? 'כן' : item.approved === false ? 'לא' : 'ממתין',
        'הגיע': item.arrived ? 'כן' : 'לא',
        'דחיפות': URGENCY_LABEL[r.urgency] || '', 'סטטוס': PURCHASE_STATUS[r.status] || r.status,
        'תאריך': fmtDate(r.created_date),
      }))
    );
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'רכש');
    XLSX.writeFile(wb, `procurement-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel הורד');
  };

  return (
    <div className="space-y-4">
      {/* Header actions */}
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div />
        <div className="flex gap-2">
          {(isAdmin || isSecretary) && (
            <button onClick={exportExcel}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-colors">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
            </button>
          )}
          {!isAdmin && !isSecretary && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors">
              <Plus className="h-4 w-4" /> בקשת רכש חדשה
            </button>
          )}
        </div>
      </div>

      {/* New request form */}
      {showForm && (
        <NewPurchaseForm
          user={user}
          suppliers={suppliers}
          onSubmit={data => createReq.mutate(data)}
          onClose={() => setShowForm(false)}
          pending={createReq.isPending}
        />
      )}

      {/* Admin: pending approvals */}
      {isAdmin && pendingAdmin.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="font-bold text-slate-800">ממתינות לאישור</h2>
            <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingAdmin.length}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {pendingAdmin.map(req => (
              <PurchaseRequestCard
                key={req.id} req={req}
                isAdmin={isAdmin} expanded={expandedId === req.id}
                onToggle={() => setExpandedId(id => id === req.id ? null : req.id)}
                onApprove={() => setApproving(req)}
                onUpdate={data => updateReq.mutate({ id: req.id, data })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Per-item approval modal */}
      {approving && (
        <ApprovalModal
          req={approving}
          onClose={() => setApproving(null)}
          onSave={(items, adminNote) => {
            const anyApproved = items.some(i => i.approved === true);
            const allApproved = items.every(i => i.approved === true);
            const isSelPurchase = approving.request_type === 'self';
            updateReq.mutate({
              id: approving.id,
              data: {
                items_json: JSON.stringify(items),
                admin_note: adminNote,
                status: anyApproved ? (allApproved ? 'approved' : 'partial') : 'rejected',
                approval_code: (anyApproved && isSelPurchase) ? genCode() : approving.approval_code,
              },
            });
          }}
        />
      )}

      {/* Secretary / Admin: approved & in-progress */}
      {(isAdmin || isSecretary) && approvedList.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">בקשות מאושרות</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {approvedList.map(req => (
              <PurchaseRequestCard
                key={req.id} req={req}
                isAdmin={isAdmin} isSecretary={isSecretary}
                expanded={expandedId === req.id}
                onToggle={() => setExpandedId(id => id === req.id ? null : req.id)}
                onUpdate={data => updateReq.mutate({ id: req.id, data })}
              />
            ))}
          </div>
        </div>
      )}

      {/* Teacher: my requests */}
      {!isAdmin && !isSecretary && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">הבקשות שלי</h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{myRequests.length}</span>
          </div>
          {myRequests.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-14">אין בקשות רכש עדיין</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {myRequests.map(req => (
                <PurchaseRequestCard
                  key={req.id} req={req}
                  expanded={expandedId === req.id}
                  onToggle={() => setExpandedId(id => id === req.id ? null : req.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Supplier management (admin / secretary) */}
      {(isAdmin || isSecretary) && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-slate-400" />
              <h2 className="font-bold text-slate-800">ניהול ספקים</h2>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{suppliers.length}</span>
            </div>
            <button onClick={() => setShowSuppliers(v => !v)}
              className="text-xs font-semibold text-blue-600 hover:underline">
              {showSuppliers ? 'סגור' : 'ערוך ספקים'}
            </button>
          </div>
          {showSuppliers && <SupplierManager suppliers={suppliers} qc={qc} />}
          {!showSuppliers && suppliers.length > 0 && (
            <div className="px-5 py-3 flex flex-wrap gap-2">
              {suppliers.map(s => (
                <span key={s.id} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                  {s.name}
                </span>
              ))}
            </div>
          )}
          {!showSuppliers && suppliers.length === 0 && (
            <p className="text-center text-slate-400 text-sm py-6">לחצי "ערוך ספקים" להוספת ספקים</p>
          )}
        </div>
      )}
    </div>
  );
}

function SupplierManager({ suppliers, qc }) {
  const [form, setForm] = useState(null); // null | { name:'', phone:'', category:'', notes:'' } | { id, ... }

  const save = useMutation({
    mutationFn: d => d.id ? base44.entities.Supplier.update(d.id, d) : base44.entities.Supplier.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); setForm(null); toast.success('נשמר'); },
    onError: () => toast.error('שגיאה'),
  });
  const del = useMutation({
    mutationFn: id => base44.entities.Supplier.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['suppliers'] }); toast.success('נמחק'); },
    onError: () => toast.error('שגיאה'),
  });

  return (
    <div className="p-4 space-y-3">
      {form && (
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 space-y-2.5">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-slate-700">{form.id ? 'עריכת ספק' : 'ספק חדש'}</p>
            <button onClick={() => setForm(null)}><X className="h-4 w-4 text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <input className={inp} autoFocus value={form.name || ''} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="שם הספק *" />
            </div>
            <input className={inp} value={form.phone || ''} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="טלפון" />
            <input className={inp} value={form.category || ''} onChange={e => setForm(f => ({...f, category: e.target.value}))} placeholder="סוג ציוד (כתיבה, אמנות...)" />
            <div className="col-span-2">
              <input className={inp} value={form.notes || ''} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="הערות (כתובת, שעות פתיחה...)" />
            </div>
          </div>
          <button onClick={() => { if(!form.name?.trim()) return; save.mutate(form); }}
            disabled={!form.name?.trim() || save.isPending}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-colors">
            {save.isPending ? 'שומר...' : 'שמור'}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {suppliers.map(s => (
          <div key={s.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <Building className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm">{s.name}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {[s.phone, s.category, s.notes].filter(Boolean).join(' · ')}
              </p>
            </div>
            <div className="flex gap-0.5 flex-shrink-0">
              <button onClick={() => setForm({...s})} className="p-2 text-blue-400 hover:bg-blue-50 rounded-xl transition-colors">
                <Edit2 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => { if(confirm('למחוק ספק?')) del.mutate(s.id); }} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {!form && (
        <button onClick={() => setForm({ name: '', phone: '', category: '', notes: '' })}
          className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-xl text-sm font-semibold transition-colors w-full justify-center">
          <Plus className="h-4 w-4" /> הוסף ספק
        </button>
      )}
    </div>
  );
}

function NewPurchaseForm({ user, suppliers, onSubmit, onClose, pending }) {
  const [purpose,   setPurpose]   = useState('');
  const [urgency,   setUrgency]   = useState('normal');
  const [reqType,   setReqType]   = useState('regular');
  const [suppId,    setSuppId]    = useState('');
  const [targetDate,setTargetDate]= useState('');
  const [items,     setItems]     = useState([{ id: 1, name: '', qty: 1, est_price: '', link: '', note: '' }]);

  const addItem = () => setItems(prev => [...prev, { id: Date.now(), name: '', qty: 1, est_price: '', link: '', note: '' }]);
  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));
  const updateItem = (id, field, val) => setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: val } : i));

  const submit = () => {
    if (!purpose.trim() || items.some(i => !i.name.trim())) {
      toast.error('מטרת הבקשה ושם הפריטים הם שדות חובה');
      return;
    }
    const supplier = suppliers.find(s => s.id === suppId);
    onSubmit({
      user_email: user.email, user_name: user.full_name,
      purpose, urgency, request_type: reqType,
      supplier_id: suppId, supplier_name: supplier?.name || '',
      target_date: targetDate, status: 'pending',
      items_json: JSON.stringify(items),
      created_date: new Date().toISOString(),
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="font-bold text-slate-800">בקשת רכש חדשה</h2>
        <button onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1.5">מטרת הבקשה <span className="text-red-400">*</span></label>
          <input className={inp} value={purpose} onChange={e => setPurpose(e.target.value)}
            placeholder="למשל: פעילות מיוחדת לפורים, שיעור מדעים..." autoFocus />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">דחיפות</label>
            <select className={inp} value={urgency} onChange={e => setUrgency(e.target.value)}>
              <option value="normal">רגיל</option>
              <option value="urgent">דחוף</option>
              <option value="immediate">מיידי</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">תאריך יעד</label>
            <input type="date" className={inp} value={targetDate} onChange={e => setTargetDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1.5">סוג בקשה</label>
          <div className="flex gap-2">
            {[['regular','רכישה רגילה (המזכירה תבצע)'],['self','רכישה עצמית אצל ספק']].map(([v,l]) => (
              <button key={v} onClick={() => setReqType(v)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border transition-colors ${reqType === v ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {reqType === 'self' && suppliers.length > 0 && (
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">ספק</label>
            <select className={inp} value={suppId} onChange={e => setSuppId(e.target.value)}>
              <option value="">— בחרי ספק —</option>
              {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-500">פריטים <span className="text-red-400">*</span></label>
            <button onClick={addItem} className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline">
              <Plus className="h-3.5 w-3.5" /> פריט נוסף
            </button>
          </div>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={item.id} className="bg-slate-50 rounded-xl border border-slate-100 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 w-4">{idx + 1}</span>
                  <input className={`${inp} flex-1`} value={item.name} onChange={e => updateItem(item.id, 'name', e.target.value)}
                    placeholder="שם הפריט *" />
                  <input type="number" min="1" className="w-16 px-2 py-2.5 border border-slate-200 bg-white rounded-xl text-sm outline-none focus:border-blue-400 text-center"
                    value={item.qty} onChange={e => updateItem(item.id, 'qty', e.target.value)} />
                  {items.length > 1 && (
                    <button onClick={() => removeItem(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2 mr-6">
                  <input className={`${inp} flex-1`} value={item.est_price} onChange={e => updateItem(item.id, 'est_price', e.target.value)}
                    placeholder="מחיר משוער ₪" />
                  <input className={`${inp} flex-1`} value={item.link} onChange={e => updateItem(item.id, 'link', e.target.value)}
                    placeholder="קישור (אופציונלי)" />
                </div>
                <input className={`${inp} mr-6`} value={item.note} onChange={e => updateItem(item.id, 'note', e.target.value)}
                  placeholder="הערה..." />
              </div>
            ))}
          </div>
        </div>

        <button onClick={submit} disabled={pending}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-colors">
          {pending ? 'שולח...' : 'שלחי בקשה'}
        </button>
      </div>
    </div>
  );
}

function ApprovalModal({ req, onClose, onSave }) {
  const [items, setItems] = useState(() =>
    parseJSON(req.items_json).map(i => ({ ...i, approved: i.approved ?? null }))
  );
  const [adminNote, setAdminNote] = useState(req.admin_note || '');

  const setApproval = (id, val) => setItems(prev => prev.map(i => i.id === id ? { ...i, approved: val } : i));
  const setItemNote = (id, note) => setItems(prev => prev.map(i => i.id === id ? { ...i, admin_note: note } : i));

  const allDecided = items.every(i => i.approved !== null);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto" dir="rtl">
        <div className="bg-gradient-to-l from-blue-600 to-blue-500 px-5 py-4 flex items-start justify-between sticky top-0">
          <div>
            <h3 className="font-bold text-white">אישור בקשת רכש</h3>
            <p className="text-blue-100 text-xs mt-0.5">{req.user_name} — {req.purpose}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-xl">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-500 font-medium">סמני אישור או דחייה לכל פריט:</p>
          {items.map((item, idx) => (
            <div key={item.id} className={`rounded-xl border p-3 transition-colors ${item.approved === true ? 'bg-green-50 border-green-200' : item.approved === false ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-slate-400">{idx + 1}.</span>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                  <p className="text-xs text-slate-400">כמות: {item.qty}{item.est_price ? ` · ₪${item.est_price}` : ''}</p>
                  {item.link && <a href={item.link} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline">קישור</a>}
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => setApproval(item.id, true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${item.approved === true ? 'bg-green-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-green-400'}`}>
                    ✓ אשר
                  </button>
                  <button onClick={() => setApproval(item.id, false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${item.approved === false ? 'bg-red-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-red-400'}`}>
                    ✗ דחה
                  </button>
                </div>
              </div>
              {item.approved === false && (
                <input className={inp} value={item.admin_note || ''} onChange={e => setItemNote(item.id, e.target.value)}
                  placeholder="סיבת דחייה (חובה) — יש במחסן / כמות קטנה יותר..." />
              )}
            </div>
          ))}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">הערה כללית</label>
            <textarea className={textarea} rows={2} value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="הערה למורה..." />
          </div>
          <button onClick={() => onSave(items, adminNote)} disabled={!allDecided}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-colors">
            {allDecided ? 'שמרי אישור' : `נשאר לאשר ${items.filter(i => i.approved === null).length} פריטים`}
          </button>
        </div>
      </div>
    </div>
  );
}

function PurchaseRequestCard({ req, isAdmin, isSecretary, expanded, onToggle, onApprove, onUpdate }) {
  const items = parseJSON(req.items_json);
  const approvedItems = items.filter(i => i.approved === true);
  const arrivedCount  = items.filter(i => i.arrived).length;

  const markArrived = (itemId) => {
    const updItems = items.map(i => i.id === itemId ? { ...i, arrived: true } : i);
    const allArrived = updItems.filter(i => i.approved === true).every(i => i.arrived);
    onUpdate?.({ items_json: JSON.stringify(updItems), status: allArrived ? 'arrived' : 'purchasing' });
  };

  return (
    <div className={`px-4 py-3.5 transition-colors ${expanded ? 'bg-slate-50' : 'hover:bg-slate-50/60'}`}>
      <div className="flex items-start gap-3 cursor-pointer" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-800 text-sm">{req.purpose}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PURCHASE_STATUS_COLOR[req.status] || 'bg-slate-100 text-slate-500'}`}>
              {PURCHASE_STATUS[req.status] || req.status}
            </span>
            {req.urgency !== 'normal' && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${URGENCY_COLOR[req.urgency]}`}>
                {URGENCY_LABEL[req.urgency]}
              </span>
            )}
            {req.approval_code && (
              <span className="text-[10px] font-mono bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">{req.approval_code}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5 flex-wrap">
            <span>{req.user_name}</span>
            <span>·</span>
            <span>{items.length} פריטים</span>
            {req.target_date && <><span>·</span><span>יעד: {fmtDate(req.target_date)}</span></>}
            {arrivedCount > 0 && <><span>·</span><span className="text-green-600 font-semibold">{arrivedCount}/{approvedItems.length} הגיעו</span></>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAdmin && req.status === 'pending' && onApprove && (
            <button onClick={e => { e.stopPropagation(); onApprove(); }}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors">
              אשרי פריטים
            </button>
          )}
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 mr-1 space-y-2">
          {items.map((item, idx) => (
            <div key={item.id || idx} className={`flex items-start gap-2 p-2.5 rounded-xl border text-sm ${item.arrived ? 'bg-green-50 border-green-100' : item.approved === false ? 'bg-red-50 border-red-100' : item.approved === true ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-100'}`}>
              <span className="text-lg flex-shrink-0">
                {item.arrived ? '✅' : item.approved === false ? '❌' : item.approved === true ? '📦' : '⏳'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{item.name}</p>
                <p className="text-xs text-slate-400">כמות: {item.qty}{item.est_price ? ` · ₪${item.est_price}` : ''}</p>
                {item.admin_note && <p className="text-xs text-red-600 mt-0.5">{item.admin_note}</p>}
              </div>
              {(isSecretary || isAdmin) && item.approved === true && !item.arrived && onUpdate && (
                <button onClick={() => markArrived(item.id)}
                  className="flex-shrink-0 px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors">
                  הגיע ✓
                </button>
              )}
            </div>
          ))}
          {req.admin_note && (
            <div className="bg-amber-50 rounded-xl border border-amber-100 px-3 py-2 text-xs text-amber-700">
              <span className="font-bold">הערת מנהלת: </span>{req.admin_note}
            </div>
          )}
          {req.supplier_name && (
            <p className="text-xs text-slate-400"><Building className="h-3 w-3 inline ml-1" />{req.supplier_name}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — MAINTENANCE (תחזוקה)
// ══════════════════════════════════════════════════════════════════════════════
function MaintenanceTab({ user, isAdmin, isAbBayit }) {
  const qc = useQueryClient();
  const [showForm,   setShowForm]   = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const { data: allTickets = [] } = useQuery({
    queryKey: ['maintTickets'],
    queryFn: () => base44.entities.MaintenanceTicket.filter({ ticket_type: 'general' }),
    enabled: !!user,
  });

  const myTickets      = allTickets.filter(t => t.user_email === user?.email);
  const newTickets     = allTickets.filter(t => t.status === 'new');
  const forwardedTickets = allTickets.filter(t => ['forwarded','in_progress','waiting'].includes(t.status));
  const myTasks        = allTickets.filter(t => ['forwarded','in_progress','waiting'].includes(t.status));

  const createTicket = useMutation({
    mutationFn: d => base44.entities.MaintenanceTicket.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintTickets'] }); setShowForm(false); toast.success('הדיווח נשלח'); },
    onError: () => toast.error('שגיאה בשליחה'),
  });

  const updateTicket = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MaintenanceTicket.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintTickets'] }); toast.success('עודכן'); },
    onError: () => toast.error('שגיאה'),
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold rounded-xl transition-colors">
          <Plus className="h-4 w-4" /> דווחי ליקוי
        </button>
      </div>

      {showForm && (
        <NewTicketForm
          user={user} ticketType="general"
          onSubmit={d => createTicket.mutate(d)}
          onClose={() => setShowForm(false)}
          pending={createTicket.isPending}
        />
      )}

      {/* Admin: new tickets + clarification pending */}
      {isAdmin && [...newTickets, ...allTickets.filter(t => t.status === 'clarification')].length > 0 && (
        <TicketList
          title="ליקויים חדשים" icon={<AlertTriangle className="h-4 w-4 text-amber-500" />}
          badge={[...newTickets, ...allTickets.filter(t => t.status === 'clarification')].length} badgeColor="bg-amber-500"
          tickets={[...newTickets, ...allTickets.filter(t => t.status === 'clarification')]} expandedId={expandedId}
          onToggle={id => setExpandedId(prev => prev === id ? null : id)}
          actions={(t) => (
            <div className="flex flex-wrap gap-2">
              <button onClick={() => updateTicket.mutate({ id: t.id, data: { status: 'forwarded' } })}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors">
                העבר לאב הבית
              </button>
              <button onClick={() => { const q = prompt('מה ההבהרה הנדרשת?'); if (q) updateTicket.mutate({ id: t.id, data: { status: 'clarification', clarification_request: q } }); }}
                className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-bold rounded-xl transition-colors">
                בקשי הבהרה
              </button>
              <button onClick={() => { const reason = prompt('סיבת סגירה:'); if (reason !== null) updateTicket.mutate({ id: t.id, data: { status: 'closed', close_reason: reason } }); }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors">
                סגור
              </button>
            </div>
          )}
        />
      )}

      {/* Admin: forwarded/in-progress */}
      {isAdmin && forwardedTickets.length > 0 && (
        <TicketList
          title="בתהליך טיפול" icon={<Clock className="h-4 w-4 text-blue-500" />}
          tickets={forwardedTickets} expandedId={expandedId}
          onToggle={id => setExpandedId(prev => prev === id ? null : id)}
        />
      )}

      {/* Ab-bayit: my tasks */}
      {isAbBayit && (
        <TicketList
          title="המשימות שלי" icon={<Wrench className="h-4 w-4 text-orange-500" />}
          tickets={myTasks} expandedId={expandedId}
          onToggle={id => setExpandedId(prev => prev === id ? null : id)}
          actions={(t) => (
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => updateTicket.mutate({ id: t.id, data: { status: 'in_progress' } })}
                className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs font-bold rounded-xl transition-colors">
                בתהליך
              </button>
              <button onClick={() => { const fix = prompt('תיאור קצר של הפתרון:'); if (fix) updateTicket.mutate({ id: t.id, data: { status: 'done', fix_description: fix } }); }}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-colors">
                בוצע ✓
              </button>
              <button onClick={() => { const reason = prompt('מה ממתינים?'); if (reason) updateTicket.mutate({ id: t.id, data: { status: 'waiting', wait_reason: reason } }); }}
                className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 text-xs font-bold rounded-xl transition-colors">
                ממתין לחלקים
              </button>
            </div>
          )}
        />
      )}

      {/* Teacher: my reports */}
      {!isAdmin && !isAbBayit && (
        <TicketList
          title="הדיווחים שלי" icon={<User className="h-4 w-4 text-slate-500" />}
          tickets={myTickets} expandedId={expandedId}
          onToggle={id => setExpandedId(prev => prev === id ? null : id)}
          emptyText="לא דיווחת על ליקויים"
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — TECH SUPPORT (תקשוב)
// ══════════════════════════════════════════════════════════════════════════════
function TechTab({ user, isAdmin, isTechCoord, specialRoles }) {
  const qc = useQueryClient();
  const [showForm,      setShowForm]      = useState(false);
  const [expandedId,    setExpandedId]    = useState(null);
  const [chatTicket,    setChatTicket]    = useState(null);
  const [externalModal, setExternalModal] = useState(null); // { ticketId } | null

  const canHandle = isAdmin || isTechCoord;

  const { data: allTickets = [] } = useQuery({
    queryKey: ['techTickets'],
    queryFn: () => base44.entities.MaintenanceTicket.filter({ ticket_type: 'computer' }),
    enabled: !!user,
  });

  const myTickets    = allTickets.filter(t => t.user_email === user?.email);
  const openTickets  = allTickets.filter(t => ['new','claimed','external'].includes(t.status));
  const doneTickets  = allTickets.filter(t => ['resolved','irreparable'].includes(t.status));

  const createTicket = useMutation({
    mutationFn: d => base44.entities.MaintenanceTicket.create(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['techTickets'] }); setShowForm(false); toast.success('הדיווח נשלח'); },
    onError: () => toast.error('שגיאה'),
  });

  const updateTicket = useMutation({
    mutationFn: ({ id, data }) => base44.entities.MaintenanceTicket.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['techTickets'] }); toast.success('עודכן'); },
    onError: () => toast.error('שגיאה'),
  });

  const sendMsg = (ticket, msg) => {
    const msgs = parseJSON(ticket.messages_json);
    msgs.push({ sender: user.full_name, sender_email: user.email, msg, at: new Date().toISOString() });
    updateTicket.mutate({ id: ticket.id, data: { messages_json: JSON.stringify(msgs) } });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors">
          <Plus className="h-4 w-4" /> דווחי תקלה
        </button>
      </div>

      {showForm && (
        <NewTicketForm
          user={user} ticketType="computer"
          onSubmit={d => createTicket.mutate(d)}
          onClose={() => setShowForm(false)}
          pending={createTicket.isPending}
        />
      )}

      {/* Chat modal */}
      {chatTicket && (
        <ChatModal
          ticket={chatTicket}
          user={user}
          onClose={() => setChatTicket(null)}
          onSend={msg => sendMsg(chatTicket, msg)}
        />
      )}

      {/* External technician modal */}
      {externalModal && (
        <ExternalTechModal
          onClose={() => setExternalModal(null)}
          onSave={(tech, date) => {
            updateTicket.mutate({ id: externalModal.ticketId, data: { status: 'external', external_tech: tech, external_est_date: date } });
            setExternalModal(null);
          }}
        />
      )}

      {/* Handler panel */}
      {canHandle && openTickets.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <h2 className="font-bold text-slate-800">תקלות פתוחות</h2>
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{openTickets.length}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {openTickets.map(t => (
              <TechTicketCard
                key={t.id} ticket={t} user={user}
                canHandle={canHandle}
                expanded={expandedId === t.id}
                onToggle={() => setExpandedId(id => id === t.id ? null : id)}
                onChat={() => setChatTicket(t)}
                onClaim={() => updateTicket.mutate({ id: t.id, data: { status: 'claimed', claimed_by: user.email, claimed_by_name: user.full_name } })}
                onResolve={() => { const desc = prompt('תיאור קצר של הפתרון:'); if (desc) updateTicket.mutate({ id: t.id, data: { status: 'resolved', fix_description: desc } }); }}
                onExternal={() => setExternalModal({ ticketId: t.id })}
                onIrreparable={() => { if(confirm('לסמן כ"לא ניתן לתקן"?')) updateTicket.mutate({ id: t.id, data: { status: 'irreparable' } }); }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Teacher: my reports */}
      {!canHandle && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800">הדיווחים שלי</h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{myTickets.length}</span>
          </div>
          {myTickets.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-14">לא דיווחת על תקלות</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {myTickets.map(t => (
                <TechTicketCard
                  key={t.id} ticket={t} user={user}
                  expanded={expandedId === t.id}
                  onToggle={() => setExpandedId(id => id === t.id ? null : id)}
                  onChat={() => setChatTicket(t)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resolved */}
      {canHandle && doneTickets.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-800 text-sm">תקלות שטופלו ({doneTickets.length})</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {doneTickets.slice(0, 10).map(t => (
              <TechTicketCard
                key={t.id} ticket={t} user={user}
                expanded={expandedId === t.id}
                onToggle={() => setExpandedId(id => id === t.id ? null : id)}
                onChat={() => setChatTicket(t)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TechTicketCard({ ticket: t, user, canHandle, expanded, onToggle, onChat, onClaim, onResolve, onExternal, onIrreparable }) {
  const msgs = parseJSON(t.messages_json);
  const unread = msgs.filter(m => m.sender_email !== user.email).length;

  return (
    <div className={`px-4 py-3.5 transition-colors ${expanded ? 'bg-slate-50' : 'hover:bg-slate-50/60'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggle}>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-800 text-sm">{t.location}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TECH_STATUS_COLOR[t.status] || 'bg-slate-100 text-slate-500'}`}>
              {TECH_STATUS[t.status] || t.status}
            </span>
            {t.urgency === 'urgent' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">🔴 דחוף</span>}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{t.issue_type} · {t.user_name} · {fmtDate(t.created_date)}</p>
          {t.claimed_by_name && <p className="text-xs text-blue-600 font-medium mt-0.5">מטפלת: {t.claimed_by_name}</p>}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={onChat}
            className="relative p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors">
            <MessageSquare className="h-4 w-4" />
            {unread > 0 && <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">{unread}</span>}
          </button>
          {canHandle && t.status === 'new' && onClaim && (
            <button onClick={onClaim}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors">
              אני מטפלת
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-3 mr-1 space-y-2">
          <p className="text-sm text-slate-600 bg-white rounded-xl border border-slate-100 px-3 py-2">{t.description}</p>
          {t.fix_description && (
            <div className="bg-green-50 rounded-xl border border-green-100 px-3 py-2 text-xs text-green-700">
              <span className="font-bold">פתרון: </span>{t.fix_description}
            </div>
          )}
          {t.external_tech && (
            <div className="bg-orange-50 rounded-xl border border-orange-100 px-3 py-2 text-xs text-orange-700">
              <span className="font-bold">טכנאי חיצוני: </span>{t.external_tech}
              {t.external_est_date && <span className="mr-2 text-slate-500">· תאריך משוער: {fmtDate(t.external_est_date)}</span>}
            </div>
          )}
          {canHandle && t.status === 'claimed' && (
            <div className="flex flex-wrap gap-2">
              <button onClick={onResolve}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-colors">
                נפתר ✓
              </button>
              <button onClick={onExternal}
                className="px-3 py-1.5 bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs font-bold rounded-xl transition-colors">
                הועבר לטכנאי
              </button>
              <button onClick={onIrreparable}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-colors">
                לא ניתן לתקן
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExternalTechModal({ onClose, onSave }) {
  const [tech, setTech] = useState('');
  const [date, setDate] = useState('');

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" dir="rtl">
        <div className="bg-gradient-to-l from-orange-500 to-orange-400 px-5 py-4 flex items-start justify-between rounded-t-2xl">
          <div>
            <h3 className="font-bold text-white">העברה לטכנאי חיצוני</h3>
            <p className="text-orange-100 text-xs mt-0.5">פרטי הטכנאי ותאריך משוער לחזרה</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-xl">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">שם הטכנאי / חברה <span className="text-red-400">*</span></label>
            <input className={inp} autoFocus value={tech} onChange={e => setTech(e.target.value)} placeholder="למשל: אלי מחשבים, IT-PRO..." />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">תאריך משוער לתיקון</label>
            <input type="date" className={inp} value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <button onClick={() => { if (!tech.trim()) return; onSave(tech.trim(), date); }}
            disabled={!tech.trim()}
            className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-colors">
            שמרי
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatModal({ ticket: t, user, onClose, onSend }) {
  const [msg, setMsg] = useState('');
  const msgs = parseJSON(t.messages_json);

  const send = () => {
    if (!msg.trim()) return;
    onSend(msg.trim());
    setMsg('');
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col" style={{ maxHeight: '80vh' }} dir="rtl">
        <div className="bg-gradient-to-l from-blue-600 to-blue-500 px-5 py-4 flex items-start justify-between rounded-t-2xl">
          <div>
            <h3 className="font-bold text-white text-sm">{t.location} — {t.issue_type}</h3>
            <p className="text-blue-100 text-xs mt-0.5">{t.user_name}</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-xl">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-[150px]">
          {msgs.length === 0 && <p className="text-center text-slate-400 text-sm py-6">אין הודעות עדיין</p>}
          {msgs.map((m, i) => {
            const isMe = m.sender_email === user.email;
            return (
              <div key={i} className={`flex ${isMe ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-slate-100 text-slate-800 rounded-tl-sm'}`}>
                  <p className={`text-[10px] font-bold mb-1 ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>{m.sender}</p>
                  <p>{m.msg}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-3 border-t border-slate-100 flex gap-2">
          <input className={`${inp} flex-1`} value={msg} onChange={e => setMsg(e.target.value)}
            placeholder="הקלידי הודעה..." onKeyDown={e => e.key === 'Enter' && send()} autoFocus />
          <button onClick={send} disabled={!msg.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl disabled:opacity-50 transition-colors flex-shrink-0">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Shared: New Ticket Form ──────────────────────────────────────────────────
function NewTicketForm({ user, ticketType, onSubmit, onClose, pending }) {
  const isGeneral = ticketType === 'general';
  const [location,  setLocation]  = useState('');
  const [locOther,  setLocOther]  = useState('');
  const [issueType, setIssueType] = useState('');
  const [desc,      setDesc]      = useState('');
  const [urgency,   setUrgency]   = useState(isGeneral ? 'normal' : 'normal');

  const types = isGeneral ? MAINT_TYPES : TECH_TYPES;
  const urgencies = isGeneral
    ? [['normal','רגיל'],['urgent','דחוף'],['safety','סכנה בטיחותית']]
    : [['normal','רגיל (עד מחר)'],['urgent','דחוף (עכשיו)']];

  const submit = () => {
    const loc = location === 'אחר' ? locOther : location;
    if (!loc || !issueType || !desc.trim()) { toast.error('אנא מלאי את כל שדות החובה'); return; }
    onSubmit({
      ticket_type: ticketType,
      user_email: user.email, user_name: user.full_name, reporter_name: user.full_name,
      location: loc, issue_type: issueType, description: desc, issue: desc,
      urgency, status: 'new',
      created_date: new Date().toISOString(),
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h2 className="font-bold text-slate-800">{isGeneral ? 'דיווח ליקוי חדש' : 'דיווח תקלת מחשב'}</h2>
        <button onClick={onClose}><X className="h-4 w-4 text-slate-400" /></button>
      </div>
      <div className="p-5 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">מיקום <span className="text-red-400">*</span></label>
            <select className={inp} value={location} onChange={e => setLocation(e.target.value)} autoFocus>
              <option value="">— בחרי —</option>
              {MAINT_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1.5">דחיפות</label>
            <select className={inp} value={urgency} onChange={e => setUrgency(e.target.value)}>
              {urgencies.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>

        {location === 'אחר' && (
          <input className={inp} value={locOther} onChange={e => setLocOther(e.target.value)} placeholder="תיאור מיקום..." />
        )}

        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1.5">סוג {isGeneral ? 'ליקוי' : 'תקלה'} <span className="text-red-400">*</span></label>
          <select className={inp} value={issueType} onChange={e => setIssueType(e.target.value)}>
            <option value="">— בחרי —</option>
            {types.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1.5">תיאור מפורט <span className="text-red-400">*</span></label>
          <textarea className={textarea} rows={3} value={desc} onChange={e => setDesc(e.target.value)}
            placeholder={isGeneral ? 'תארי את הליקוי בפירוט...' : 'תארי את התקלה. מה ניסית? מה קרה?'} />
        </div>

        {urgency === 'safety' && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700 font-semibold">
            ⚠️ דיווח סכנה בטיחותית — יישלח התראה דחופה למנהלת
          </div>
        )}

        <button onClick={submit} disabled={pending}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm disabled:opacity-50 transition-colors">
          {pending ? 'שולח...' : 'שלחי דיווח'}
        </button>
      </div>
    </div>
  );
}

// ── Shared: Ticket List ──────────────────────────────────────────────────────
function TicketList({ title, icon, badge, badgeColor = 'bg-blue-500', tickets, expandedId, onToggle, actions, emptyText = 'אין דיווחים' }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        {icon}
        <h2 className="font-bold text-slate-800">{title}</h2>
        {badge != null && (
          <span className={`${badgeColor} text-white text-xs font-bold px-2 py-0.5 rounded-full`}>{badge}</span>
        )}
      </div>
      {tickets.length === 0 ? (
        <p className="text-center text-slate-400 text-sm py-12">{emptyText}</p>
      ) : (
        <div className="divide-y divide-slate-50">
          {tickets.map(t => (
            <TicketRow
              key={t.id} ticket={t}
              expanded={expandedId === t.id}
              onToggle={() => onToggle(t.id)}
              actions={actions ? actions(t) : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TicketRow({ ticket: t, expanded, onToggle, actions }) {
  return (
    <div className={`px-4 py-3.5 transition-colors ${expanded ? 'bg-slate-50' : 'hover:bg-slate-50/60'}`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggle}>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-slate-800 text-sm">{t.location}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${MAINT_STATUS_COLOR[t.status] || 'bg-slate-100 text-slate-500'}`}>
              {MAINT_STATUS[t.status] || t.status}
            </span>
            {t.urgency !== 'normal' && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${URGENCY_COLOR[t.urgency]}`}>
                {URGENCY_LABEL[t.urgency]}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{t.issue_type} · {t.user_name || t.reporter_name} · {fmtDate(t.created_date)}</p>
        </div>
      </div>
      {expanded && (
        <div className="mt-3 mr-1 space-y-2">
          <p className="text-sm text-slate-600 bg-white rounded-xl border border-slate-100 px-3 py-2">{t.description || t.issue}</p>
          {t.fix_description && (
            <div className="bg-green-50 rounded-xl border border-green-100 px-3 py-2 text-xs text-green-700">
              <span className="font-bold">טופל: </span>{t.fix_description}
            </div>
          )}
          {t.close_reason && (
            <div className="bg-slate-50 rounded-xl border border-slate-100 px-3 py-2 text-xs text-slate-500">
              <span className="font-bold">נסגר: </span>{t.close_reason}
            </div>
          )}
          {t.wait_reason && (
            <div className="bg-purple-50 rounded-xl border border-purple-100 px-3 py-2 text-xs text-purple-700">
              <span className="font-bold">ממתין: </span>{t.wait_reason}
            </div>
          )}
          {t.clarification_request && (
            <ClarificationReply ticket={t} />
          )}
          {actions && <div className="flex flex-wrap gap-2 pt-1">{actions}</div>}
        </div>
      )}
    </div>
  );
}

function ClarificationReply({ ticket: t }) {
  const qc = useQueryClient();
  const [reply, setReply] = useState('');
  const [sent,  setSent]  = useState(false);

  const sendReply = useMutation({
    mutationFn: () => base44.entities.MaintenanceTicket.update(t.id, {
      status: 'new',
      clarification_reply: reply,
      clarification_request: t.clarification_request,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['maintTickets'] }); setSent(true); toast.success('ההבהרה נשלחה'); },
  });

  if (sent || t.clarification_reply) {
    return (
      <div className="bg-amber-50 rounded-xl border border-amber-100 px-3 py-2 text-xs space-y-1">
        <p className="text-amber-700"><span className="font-bold">בקשת הבהרה: </span>{t.clarification_request}</p>
        <p className="text-green-700"><span className="font-bold">תשובתך: </span>{t.clarification_reply || reply}</p>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 rounded-xl border border-amber-200 px-3 py-3 space-y-2">
      <p className="text-xs font-bold text-amber-800">⚠️ המנהלת ביקשה הבהרה:</p>
      <p className="text-xs text-amber-700">{t.clarification_request}</p>
      <div className="flex gap-2">
        <input className={`${inp} flex-1 text-xs`} value={reply} onChange={e => setReply(e.target.value)}
          placeholder="תשובתך..." />
        <button onClick={() => sendReply.mutate()} disabled={!reply.trim() || sendReply.isPending}
          className="flex-shrink-0 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50">
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
