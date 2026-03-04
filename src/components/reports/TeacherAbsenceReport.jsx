import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Printer, X, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

const REASON_LABELS = {
  sick_child:       'מחלת ילד',
  choice_day:       'יום בחירה',
  declaration_days: 'ימי הצהרה',
  sick:             'מחלה',
  family:           'אירוע משפחתי',
  other:            'אחר',
};

const STATUS_CONFIG = {
  pending:              { label: 'ממתין לאישור', icon: Clock,        color: '#f59e0b', bg: '#fffbeb' },
  approved:             { label: 'אושר',          icon: CheckCircle,  color: '#10b981', bg: '#ecfdf5' },
  rejected:             { label: 'נדחה',           icon: XCircle,      color: '#ef4444', bg: '#fef2f2' },
  awaiting_certificate: { label: 'ממתין אישור רפואי', icon: AlertCircle, color: '#8b5cf6', bg: '#f5f3ff' },
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('he-IL');
}

export default function TeacherAbsenceReport({ user, isOpen, onClose }) {
  const printRef = useRef();

  const { data: absences = [], isLoading } = useQuery({
    queryKey: ['my-absences', user?.email],
    queryFn: () => base44.entities.Absence.filter({ user_email: user?.email }),
    enabled: isOpen && !!user?.email,
  });

  const sorted = [...absences].sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

  // Summary
  const total = sorted.length;
  const approved = sorted.filter(a => a.status === 'approved').length;
  const pending = sorted.filter(a => a.status === 'pending').length;
  const totalDays = sorted.reduce((sum, a) => {
    if (!a.start_date || !a.end_date) return sum + 1;
    const diff = (new Date(a.end_date) - new Date(a.start_date)) / 86400000 + 1;
    return sum + Math.max(1, diff);
  }, 0);

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8"/>
        <title>דוח היעדרויות – ${user?.full_name}</title>
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; margin: 2cm; color: #1e293b; font-size: 13px; }
          h1 { color: #4f46e5; margin-bottom: 4px; }
          .subtitle { color: #64748b; font-size: 12px; margin-bottom: 20px; }
          .summary { display: flex; gap: 16px; margin-bottom: 24px; }
          .stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; flex: 1; text-align: center; }
          .stat .num { font-size: 24px; font-weight: 900; color: #4f46e5; }
          .stat .lbl { font-size: 11px; color: #64748b; }
          table { width: 100%; border-collapse: collapse; }
          th { background: #f1f5f9; text-align: right; padding: 10px 12px; font-size: 11px; font-weight: 700; color: #475569; border-bottom: 2px solid #e2e8f0; }
          td { padding: 9px 12px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
          tr:nth-child(even) td { background: #fafafa; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; }
          .badge-approved  { background: #ecfdf5; color: #047857; }
          .badge-pending   { background: #fffbeb; color: #b45309; }
          .badge-rejected  { background: #fef2f2; color: #b91c1c; }
          .badge-awaiting  { background: #f5f3ff; color: #6d28d9; }
          .footer { margin-top: 32px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 12px; }
        </style>
      </head>
      <body>
        <h1>דוח היעדרויות</h1>
        <div class="subtitle">${user?.full_name} | ${user?.title || user?.role} | הופק: ${new Date().toLocaleDateString('he-IL')}</div>
        <div class="summary">
          <div class="stat"><div class="num">${total}</div><div class="lbl">סה"כ דיווחים</div></div>
          <div class="stat"><div class="num">${totalDays}</div><div class="lbl">ימי היעדרות</div></div>
          <div class="stat"><div class="num">${approved}</div><div class="lbl">אושרו</div></div>
          <div class="stat"><div class="num">${pending}</div><div class="lbl">ממתינים</div></div>
        </div>
        <table>
          <thead><tr>
            <th>תאריך התחלה</th><th>תאריך סיום</th><th>סיבה</th><th>ממלא מקום</th><th>אישור רפואי</th><th>סטטוס</th>
          </tr></thead>
          <tbody>
            ${sorted.map(a => `<tr>
              <td>${formatDate(a.start_date)}</td>
              <td>${formatDate(a.end_date) || formatDate(a.start_date)}</td>
              <td>${REASON_LABELS[a.absence_reason] || a.absence_reason || '—'}</td>
              <td>${a.substitute_teacher_name || '—'}</td>
              <td>${a.medical_certificate_required ? (a.medical_certificate_url ? '✓ הוגש' : '✗ חסר') : 'לא נדרש'}</td>
              <td><span class="badge badge-${a.status}">${STATUS_CONFIG[a.status]?.label || a.status}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
        <div class="footer">SMART BASE · מערכת ניהול חכמה</div>
      </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">דוח היעדרויות אישי</h2>
              <p className="text-xs text-slate-500">{user?.full_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-md"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}>
              <Printer className="h-4 w-4" />
              הדפס / PDF
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-3 p-4 border-b border-slate-100 dark:border-slate-700">
          {[
            { label: 'סה"כ דיווחים', value: total,     color: '#6366f1' },
            { label: 'ימי היעדרות',  value: totalDays,  color: '#8b5cf6' },
            { label: 'אושרו',        value: approved,   color: '#10b981' },
            { label: 'ממתינים',      value: pending,    color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-700">
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto p-4" ref={printRef}>
          {isLoading ? (
            <div className="text-center py-12 text-slate-400">טוען...</div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-400" />
              <p>אין היעדרויות מדווחות</p>
            </div>
          ) : (
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b-2 border-slate-200 dark:border-slate-600">
                  {['תאריך התחלה','תאריך סיום','סיבה','ממלא מקום','אישור רפואי','סטטוס'].map(h => (
                    <th key={h} className="py-3 px-2 text-xs font-bold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((a, i) => {
                  const sc = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending;
                  const StatusIcon = sc.icon;
                  return (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="py-3 px-2 font-medium text-slate-700 dark:text-slate-200">{formatDate(a.start_date)}</td>
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-300">{formatDate(a.end_date) || formatDate(a.start_date)}</td>
                      <td className="py-3 px-2 text-slate-700 dark:text-slate-200">{REASON_LABELS[a.absence_reason] || a.absence_reason || '—'}</td>
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-300">{a.substitute_teacher_name || '—'}</td>
                      <td className="py-3 px-2">
                        {a.medical_certificate_required
                          ? <span className={`text-xs font-semibold ${a.medical_certificate_url ? 'text-green-600' : 'text-red-500'}`}>
                              {a.medical_certificate_url ? '✓ הוגש' : '✗ חסר'}
                            </span>
                          : <span className="text-xs text-slate-400">לא נדרש</span>}
                      </td>
                      <td className="py-3 px-2">
                        <span className="flex items-center gap-1.5 text-xs font-semibold w-fit px-2 py-1 rounded-full"
                              style={{ background: sc.bg, color: sc.color }}>
                          <StatusIcon className="h-3 w-3" />
                          {sc.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
