import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Clock, Calendar, CheckCircle, XCircle, AlertCircle, Users,
  FileText, Download, Plus, BookOpen, Bell, X, Save
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';

const REASON_LABELS = {
  sick_child: 'ילד חולה', sick: 'מחלה', choice_day: 'יום בחירה',
  declaration_days: 'ימי הצהרה', family: 'אירוע משפחתי', other: 'אחר',
};
const STATUS_CONFIG = {
  pending:              { icon: Clock,         badgeClass: 'bg-amber-100 text-amber-700',  iconClass: 'text-amber-600',  label: 'ממתין' },
  approved:             { icon: CheckCircle,   badgeClass: 'bg-green-100 text-green-700',  iconClass: 'text-green-600',  label: 'מאושר' },
  rejected:             { icon: XCircle,       badgeClass: 'bg-red-100 text-red-700',      iconClass: 'text-red-600',    label: 'נדחה' },
  awaiting_certificate: { icon: AlertCircle,   badgeClass: 'bg-orange-100 text-orange-700', iconClass: 'text-orange-600', label: 'ממתין לאישור רפואי' },
};
const SUB_STATUS = {
  reported: { icon: Clock,       iconClass: 'text-blue-600',   label: 'דווח' },
  approved: { icon: CheckCircle, iconClass: 'text-green-600',  label: 'מאושר' },
  paid:     { icon: CheckCircle, iconClass: 'text-purple-600', label: 'שולם' },
};

// ─── Manual Entry Modal ────────────────────────────────────────────────────────
function ManualEntryModal({ onClose, managers }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    user_email: '', user_name: '', absence_reason: 'sick',
    start_date: '', end_date: '', notes: '',
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });
  const teachingStaff = teachers.filter(u =>
    ['teacher', 'coordinator', 'counselor', 'vice_principal', 'admin', 'assistant'].includes(u.role)
  );

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Absence.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['absences'] });
      toast.success('היעדרות נוצרה בהצלחה');
      onClose();
    },
    onError: () => toast.error('שגיאה ביצירת ההיעדרות'),
  });

  const handleTeacherChange = (email) => {
    const t = teachingStaff.find(u => u.email === email);
    setForm(f => ({ ...f, user_email: email, user_name: t?.full_name || '' }));
  };

  const handleSubmit = () => {
    if (!form.user_email || !form.start_date) {
      toast.error('יש לבחור מורה ותאריך');
      return;
    }
    createMutation.mutate({
      ...form,
      end_date: form.end_date || form.start_date,
      status: 'approved',
      manually_entered: true,
      entered_by: managers?.full_name || 'הנהלה',
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">הזנה ידנית — היעדרות</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
        <div className="p-6 space-y-4" dir="rtl">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">בחרי מורה</label>
            <select
              value={form.user_email}
              onChange={(e) => handleTeacherChange(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— בחרי מורה —</option>
              {teachingStaff.map(u => (
                <option key={u.email} value={u.email}>{u.full_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">סיבת היעדרות</label>
            <select
              value={form.absence_reason}
              onChange={(e) => setForm(f => ({ ...f, absence_reason: e.target.value }))}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
            >
              {Object.entries(REASON_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">תאריך התחלה</label>
              <input type="date" value={form.start_date}
                onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">תאריך סיום</label>
              <input type="date" value={form.end_date}
                onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">הערה (אופציונלי)</label>
            <textarea value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} placeholder="הערה נוספת..."
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50">
              ביטול
            </button>
            <button onClick={handleSubmit} disabled={createMutation.isPending}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <Save className="h-4 w-4" />
              {createMutation.isPending ? 'שומר...' : 'שמור היעדרות'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Ministry (Ofek) Report Tab ────────────────────────────────────────────────
function OfekReportTab({ absences }) {
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());

  const markOfek = useMutation({
    mutationFn: ({ id, val }) => base44.entities.Absence.update(id, { reported_to_ofek: val }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['absences'] }),
  });

  const filtered = useMemo(() => {
    return absences.filter(a => {
      if (!a.start_date) return false;
      const d = new Date(a.start_date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });
  }, [absences, month, year]);

  const reported   = filtered.filter(a => a.reported_to_ofek).length;
  const unreported = filtered.filter(a => !a.reported_to_ofek).length;

  const exportCSV = () => {
    const headers = ['שם', 'סיבה', 'התחלה', 'סיום', 'ימים', 'סטטוס', 'דווח באופקית'];
    const rows = filtered.map(a => {
      const days = a.start_date && a.end_date
        ? Math.ceil((new Date(a.end_date) - new Date(a.start_date)) / 86400000) + 1 : 1;
      return [
        a.user_name || '',
        REASON_LABELS[a.absence_reason] || a.absence_reason || '',
        a.start_date || '',
        a.end_date || '',
        days,
        STATUS_CONFIG[a.status]?.label || a.status || '',
        a.reported_to_ofek ? 'כן' : 'לא',
      ];
    });
    const csv = '\uFEFF' + [headers, ...rows].map(r =>
      r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `דוח_אופקית_${year}_${String(month).padStart(2,'0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50">
              <BookOpen className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">דוח משרד החינוך — אופקית</h2>
              <p className="text-xs text-slate-400">סמני וי על כל היעדרות שדווחה במערכת אופקית</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select value={month} onChange={e => setMonth(+e.target.value)}
              className="p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500">
              {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(+e.target.value)}
              className="p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700">
              <Download className="h-4 w-4" />ייצוא
            </button>
          </div>
        </div>

        {/* Summary pills */}
        <div className="flex gap-3 flex-wrap">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            סה״כ: {filtered.length} היעדרויות
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
            ✓ דווח באופקית: {reported}
          </span>
          {unreported > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
              ⚠ טרם דווח: {unreported}
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm" dir="rtl">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500">מורה</th>
                <th className="p-4 text-xs font-bold text-slate-500">סיבה</th>
                <th className="p-4 text-xs font-bold text-slate-500">תאריך</th>
                <th className="p-4 text-xs font-bold text-slate-500">ימים</th>
                <th className="p-4 text-xs font-bold text-slate-500">סטטוס</th>
                <th className="p-4 text-xs font-bold text-emerald-700 text-center">דווח באופקית ✓</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? filtered.map(a => {
                const days = a.start_date && a.end_date
                  ? Math.ceil((new Date(a.end_date) - new Date(a.start_date)) / 86400000) + 1 : 1;
                const sc = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending;
                return (
                  <tr key={a.id} className={`hover:bg-slate-50 transition-colors ${a.reported_to_ofek ? 'bg-emerald-50/30' : ''}`}>
                    <td className="p-4 font-semibold text-slate-800">{a.user_name || '—'}</td>
                    <td className="p-4 text-slate-600">{REASON_LABELS[a.absence_reason] || a.absence_reason}</td>
                    <td className="p-4 text-slate-500 text-xs">{a.start_date}{a.end_date && a.end_date !== a.start_date ? ` — ${a.end_date}` : ''}</td>
                    <td className="p-4 text-slate-600 font-medium">{days}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${sc.badgeClass}`}>{sc.label}</span>
                    </td>
                    <td className="p-4 text-center">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!a.reported_to_ofek}
                          onChange={(e) => markOfek.mutate({ id: a.id, val: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-4 peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all rtl:peer-checked:after:-translate-x-4"></div>
                      </label>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6} className="text-center py-12 text-slate-400">אין היעדרויות לחודש זה</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState('absences');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: allAbsences = [] } = useQuery({
    queryKey: ['absences'],
    queryFn: () => base44.entities.Absence.list('-created_date'),
    enabled: !!user && ['admin', 'vice_principal', 'secretary'].includes(user.role),
  });

  const { data: myAbsences = [] } = useQuery({
    queryKey: ['myAbsences', user?.email],
    queryFn: () => base44.entities.Absence.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user,
  });

  const { data: allSubstitutes = [] } = useQuery({
    queryKey: ['substitutes'],
    queryFn: () => base44.entities.SubstituteReport.list('-created_date'),
    enabled: !!user && ['admin', 'vice_principal', 'secretary'].includes(user.role),
  });

  const { data: mySubstitutes = [] } = useQuery({
    queryKey: ['mySubstitutes', user?.email],
    queryFn: () => base44.entities.SubstituteReport.filter({ reporter_email: user.email }, '-created_date'),
    enabled: !!user,
  });

  useEffect(() => {
    const u1 = base44.entities.Absence.subscribe((e) => {
      if (['create', 'update', 'delete'].includes(e.type)) {
        qc.invalidateQueries({ queryKey: ['absences'] });
        qc.invalidateQueries({ queryKey: ['myAbsences'] });
      }
    });
    const u2 = base44.entities.SubstituteReport.subscribe((e) => {
      if (['create', 'update', 'delete'].includes(e.type)) {
        qc.invalidateQueries({ queryKey: ['substitutes'] });
        qc.invalidateQueries({ queryKey: ['mySubstitutes'] });
      }
    });
    return () => { u1(); u2(); };
  }, [qc]);

  const isManager = user && ['admin', 'vice_principal', 'secretary'].includes(user.role);
  const displayAbsences    = isManager ? allAbsences    : myAbsences;
  const displaySubstitutes = isManager ? allSubstitutes : mySubstitutes;

  // ─── Alerts ───────────────────────────────────────────────────────────────
  const alerts = useMemo(() => {
    if (!isManager) return [];
    const list = [];
    // Unjustified absences (awaiting certificate)
    const awaitingCert = allAbsences.filter(a => a.status === 'awaiting_certificate');
    if (awaitingCert.length > 0)
      list.push({ type: 'warning', msg: `${awaitingCert.length} היעדרויות ממתינות לאישור רפואי ועלולות להיחשב כ"לא מוצדקות"` });
    // Substitutes not linked to any absence
    const absenceDates = new Set(allAbsences.map(a => a.start_date));
    const unlinked = allSubstitutes.filter(s => s.date && !absenceDates.has(s.date));
    if (unlinked.length > 0)
      list.push({ type: 'info', msg: `${unlinked.length} דיווחי מ"מ שלא שויכו להיעדרות מוכרת — בדקי שהמורה הנעדרת דיווחה` });
    return list;
  }, [allAbsences, allSubstitutes, isManager]);

  const exportAbsencesToCSV = () => {
    const headers = ['שם', 'סיבה', 'תאריך התחלה', 'תאריך סיום', 'סטטוס', 'ממלאת מקום'];
    const rows = displayAbsences.map(a => [
      a.user_name || '', REASON_LABELS[a.absence_reason] || a.absence_reason || '',
      a.start_date || '', a.end_date || '',
      STATUS_CONFIG[a.status]?.label || a.status || '',
      a.substitute_teacher_name || '',
    ]);
    const csv = '\uFEFF' + [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `היעדרויות_${new Date().toLocaleDateString('he-IL')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
    </div>
  );

  return (
    <div className="space-y-4 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-1">היעדרויות ודיווח</h1>
          <p className="text-slate-500 text-sm">
            {isManager ? 'צפייה וניהול כל דיווחי ההיעדרות ומילויי המקום' : 'דיווחי ההיעדרות ומילויי המקום שלי'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isManager && (
            <button onClick={() => setShowManualEntry(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-sm">
              <Plus className="h-4 w-4" />הזנה ידנית
            </button>
          )}
          {isManager && (
            <button onClick={exportAbsencesToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 shadow-sm">
              <Download className="h-4 w-4" />ייצוא CSV
            </button>
          )}
        </div>
      </div>

      {/* Alert banners */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((al, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border text-sm font-medium
              ${al.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
              <Bell className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {al.msg}
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex-wrap">
        {[
          { id: 'absences',    label: 'היעדרויות',        icon: Clock },
          { id: 'substitutes', label: 'מילויי מקום',       icon: Users },
          ...(isManager ? [
            { id: 'statistics', label: 'סטטיסטיקה',        icon: FileText },
            { id: 'ofek',       label: 'דוח אופקית',       icon: BookOpen },
          ] : []),
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-fit flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-semibold transition-all text-sm
              ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Absences tab ─────────────────────────────────── */}
      {activeTab === 'absences' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { key: 'pending',              label: 'ממתינים',            color: 'amber',  Icon: Clock },
              { key: 'approved',             label: 'מאושרים',            color: 'green',  Icon: CheckCircle },
              { key: 'rejected',             label: 'נדחו',               color: 'red',    Icon: XCircle },
              { key: 'awaiting_certificate', label: 'ממתינים לאישור',     color: 'orange', Icon: AlertCircle },
            ].map(({ key, label, color, Icon }) => (
              <div key={key} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-${color}-100 rounded-full`}>
                    <Icon className={`h-5 w-5 text-${color}-600`} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-2xl font-bold text-slate-800">
                      {displayAbsences.filter(a => a.status === key).length}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-xl"><Calendar className="h-4 w-4 text-blue-600" /></div>
              <h2 className="font-bold text-slate-800">רשימת היעדרויות</h2>
            </div>
            <div className="p-4 space-y-3">
              {displayAbsences.length > 0 ? displayAbsences.map(a => {
                const sc = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending;
                const Icon = sc.icon;
                return (
                  <div key={a.id}
                    className={`flex items-start justify-between p-4 rounded-xl border hover:border-blue-200 transition-colors
                      ${a.manually_entered ? 'bg-indigo-50/40 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {isManager && <p className="font-bold text-slate-800">{a.user_name}</p>}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${sc.badgeClass}`}>
                          {REASON_LABELS[a.absence_reason] || a.absence_reason}
                        </span>
                        {a.manually_entered && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">הזנה ידנית</span>
                        )}
                        {a.reported_to_ofek && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">✓ אופקית</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{a.start_date}{a.end_date && a.end_date !== a.start_date ? ` — ${a.end_date}` : ''}</span>
                        <span>{a.lesson_hours?.length || 0} שעות</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Icon className={`h-4 w-4 ${sc.iconClass}`} />
                      <span className={`text-xs font-bold ${sc.iconClass}`}>{sc.label}</span>
                    </div>
                  </div>
                );
              }) : <p className="text-slate-400 text-center py-12">אין דיווחי היעדרות</p>}
            </div>
          </div>
        </>
      )}

      {/* ── Substitutes tab ───────────────────────────────── */}
      {activeTab === 'substitutes' && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'reported', label: 'דווחו',   color: 'blue',   Icon: Clock },
              { key: 'approved', label: 'מאושרים', color: 'green',  Icon: CheckCircle },
              { key: 'paid',     label: 'שולמו',   color: 'purple', Icon: CheckCircle },
            ].map(({ key, label, color, Icon }) => (
              <div key={key} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className={`p-2 bg-${color}-100 rounded-full`}>
                    <Icon className={`h-5 w-5 text-${color}-600`} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-2xl font-bold text-slate-800">{displaySubstitutes.filter(s => s.status === key).length}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center gap-2">
              <div className="p-2 bg-purple-50 rounded-xl"><Users className="h-4 w-4 text-purple-600" /></div>
              <h2 className="font-bold text-slate-800">רשימת מילויי מקום</h2>
            </div>
            <div className="p-4 space-y-3">
              {displaySubstitutes.length > 0 ? displaySubstitutes.map(sub => {
                const sc = SUB_STATUS[sub.status] || SUB_STATUS.reported;
                const Icon = sc.icon;
                // Alert: substitute not linked to absence
                const isUnlinked = isManager && sub.date && !allAbsences.some(a => a.start_date === sub.date);
                return (
                  <div key={sub.id}
                    className={`flex items-start justify-between p-4 rounded-xl border hover:border-purple-200 transition-colors
                      ${isUnlinked ? 'bg-amber-50/40 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {isManager && <p className="font-bold text-slate-800">{sub.reporter_name}</p>}
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                          {sub.hours_count} שעות
                        </span>
                        {isUnlinked && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
                            ⚠ לא משויך להיעדרות
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{sub.date}</span>
                        {sub.original_teacher && <span>במקום: {sub.original_teacher}</span>}
                      </div>
                      {sub.class_name && <p className="text-xs text-slate-400 mt-1">כיתות: {sub.class_name}</p>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Icon className={`h-4 w-4 ${sc.iconClass}`} />
                      <span className={`text-xs font-bold ${sc.iconClass}`}>{sc.label}</span>
                    </div>
                  </div>
                );
              }) : <p className="text-slate-400 text-center py-12">אין דיווחי מילוי מקום</p>}
            </div>
          </div>
        </>
      )}

      {/* ── Statistics tab ────────────────────────────────── */}
      {activeTab === 'statistics' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-xl"><FileText className="h-4 w-4 text-blue-600" /></div>
            <h2 className="font-bold text-slate-800">סטטיסטיקה — היעדרויות לפי עובד</h2>
          </div>
          <div className="p-4 space-y-3">
            {(() => {
              const stats = {};
              allAbsences.forEach(a => {
                if (!stats[a.user_email]) stats[a.user_email] = { name: a.user_name, total: 0, approved: 0, pending: 0, rejected: 0 };
                const days = a.end_date ? Math.ceil((new Date(a.end_date) - new Date(a.start_date)) / 86400000) + 1 : 1;
                stats[a.user_email].total += days;
                stats[a.user_email][a.status] = (stats[a.user_email][a.status] || 0) + 1;
              });
              return Object.values(stats).length > 0 ? (
                Object.values(stats).sort((a, b) => b.total - a.total).map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="font-bold text-slate-800">{s.name}</p>
                      <div className="flex gap-4 text-xs text-slate-500 mt-1">
                        <span>אושרו: {s.approved || 0}</span>
                        <span>ממתינים: {s.pending || 0}</span>
                        <span>נדחו: {s.rejected || 0}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">{s.total}</p>
                      <p className="text-xs text-slate-400">ימים</p>
                    </div>
                  </div>
                ))
              ) : <p className="text-slate-400 text-center py-12">אין נתונים</p>;
            })()}
          </div>
        </div>
      )}

      {/* ── Ofek Report tab ───────────────────────────────── */}
      {activeTab === 'ofek' && <OfekReportTab absences={allAbsences} />}

      {/* Manual entry modal */}
      {showManualEntry && (
        <ManualEntryModal onClose={() => setShowManualEntry(false)} managers={user} />
      )}
    </div>
  );
}
