import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import {
  Clock, Calendar, CheckCircle, XCircle, AlertCircle, Users,
  FileText, Download, Plus, BookOpen, Bell, X, Save, FileSpreadsheet, Timer, Sparkles, Link2, Trash2, Upload, Paperclip,
  ThumbsUp, ThumbsDown, UserCheck, Send, ClipboardCheck, Printer
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { notify } from '@/lib/notify';

const REASON_LABELS = {
  sick_child: 'ילד חולה', sick: 'מחלה', sick_certificate: 'מחלה עם אישור רפואי',
  choice_day: 'יום בחירה', declaration_days: 'ימי הצהרה', family: 'אירוע משפחתי',
  unjustified: 'לא מוצדקת', other: 'אחר',
};
const STATUS_CONFIG = {
  pending:              { icon: Clock,         badgeClass: 'bg-yellow-100 text-yellow-700',  iconClass: 'text-yellow-700',  label: 'ממתין' },
  approved:             { icon: CheckCircle,   badgeClass: 'bg-green-100 text-green-700',  iconClass: 'text-green-600',  label: 'מאושר' },
  rejected:             { icon: XCircle,       badgeClass: 'bg-yellow-100 text-yellow-700',      iconClass: 'text-yellow-700',    label: 'נדחה' },
  awaiting_certificate: { icon: AlertCircle,   badgeClass: 'bg-yellow-100 text-yellow-700', iconClass: 'text-yellow-700', label: 'ממתין לאישור רפואי' },
  unjustified:          { icon: XCircle,       badgeClass: 'bg-red-100 text-red-700',       iconClass: 'text-red-600',    label: 'לא מוצדקת' },
};
const SUB_STATUS = {
  reported: { icon: Clock,       iconClass: 'text-blue-600',   label: 'דווח' },
  approved: { icon: CheckCircle, iconClass: 'text-green-600',  label: 'מאושר' },
  paid:     { icon: CheckCircle, iconClass: 'text-yellow-700', label: 'שולם' },
  rejected: { icon: XCircle,     iconClass: 'text-red-500',    label: 'נדחה' },
};

// ─── File Upload Field ─────────────────────────────────────────────────────────
function CertificateUpload({ value, onChange }) {
  const ref = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadFile({ file });
      onChange({ url: res.file_url, name: file.name });
      toast.success('הקובץ הועלה בהצלחה');
    } catch { toast.error('שגיאה בהעלאת קובץ'); }
    finally { setUploading(false); }
  };

  return (
    <div>
      <label className="text-xs font-bold text-slate-500 block mb-1">
        אישור רפואי <span className="text-red-500">*</span>
      </label>
      <div
        onClick={() => ref.current?.click()}
        className={`flex items-center gap-2 p-3 border-2 border-dashed rounded-xl cursor-pointer transition-colors
          ${value ? 'border-green-400 bg-green-50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'}`}
      >
        <Upload className="h-4 w-4 text-slate-400 flex-shrink-0" />
        <span className="text-sm text-slate-600 truncate">
          {uploading ? 'מעלה...' : value ? value.name : 'לחצי להעלאת קובץ (PDF / תמונה)'}
        </span>
        {value && <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mr-auto" />}
      </div>
      <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFile} />
    </div>
  );
}

// ─── Manual Entry Modal ────────────────────────────────────────────────────────
function ManualEntryModal({ onClose, enteredBy, defaultReason }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    user_email: '', user_name: '', absence_reason: defaultReason || 'sick',
    start_date: '', end_date: '', notes: '',
  });
  const [certificate, setCertificate] = useState(null);

  const { data: teachers = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list(),
  });
  const teachingStaff = teachers.filter(u =>
    ['teacher', 'coordinator', 'counselor', 'vice_principal', 'admin', 'assistant'].includes(u.role)
  );

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Absence.create(data),
    onSuccess: async (absence) => {
      qc.invalidateQueries({ queryKey: ['absences'] });
      // Notify the teacher
      if (form.user_email) {
        const teacher = teachingStaff.find(u => u.email === form.user_email);
        await notify({
          user_email: form.user_email,
          phone: teacher?.phone,
          title: form.absence_reason === 'unjustified' ? 'היעדרות לא מוצדקת נרשמה' : 'היעדרות נרשמה עבורך',
          message: form.absence_reason === 'unjustified'
            ? `היעדרותך מ-${form.start_date} נרשמה כ"לא מוצדקת" על ידי ${enteredBy || 'ההנהלה'}.`
            : `היעדרות מ-${form.start_date} נרשמה עבורך על ידי ${enteredBy || 'ההנהלה'}.`,
          type: 'absence_created',
          read: false,
        }).catch(() => {});
      }
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
    if (form.absence_reason === 'sick_certificate' && !certificate) {
      toast.error('יש להעלות אישור רפואי');
      return;
    }
    const statusMap = {
      sick_certificate: 'awaiting_certificate',
      unjustified:      'unjustified',
    };
    createMutation.mutate({
      ...form,
      end_date: form.end_date || form.start_date,
      status: statusMap[form.absence_reason] || 'approved',
      manually_entered: true,
      entered_by: enteredBy || 'הנהלה',
      ...(certificate ? { certificate_url: certificate.url, certificate_name: certificate.name } : {}),
    });
  };

  const isUnjustified = form.absence_reason === 'unjustified';

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className={`p-6 border-b border-slate-200 flex justify-between items-center rounded-t-2xl ${isUnjustified ? 'bg-gradient-to-r from-red-600 to-orange-500' : 'bg-gradient-to-r from-blue-600 to-yellow-600'}`}>
          <h2 className="text-xl font-bold text-white">הזנה ידנית — היעדרות</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
        <div className="p-6 space-y-4" dir="rtl">
          {isUnjustified && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              היעדרות זו תסומן כ"לא מוצדקת" ותישלח הודעה למורה.
            </div>
          )}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">בחרי מורה</label>
            <select
              value={form.user_email}
              onChange={(e) => handleTeacherChange(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
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
              className={`w-full p-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-blue-500 ${isUnjustified ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
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
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">תאריך סיום</label>
              <input type="date" value={form.end_date}
                onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {form.absence_reason === 'sick_certificate' && (
            <CertificateUpload value={certificate} onChange={setCertificate} />
          )}
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">הערה (אופציונלי)</label>
            <textarea value={form.notes}
              onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={2} placeholder="הערה נוספת..."
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50">
              ביטול
            </button>
            <button onClick={handleSubmit} disabled={createMutation.isPending}
              className={`flex-1 py-2.5 text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 ${isUnjustified ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
              <Save className="h-4 w-4" />
              {createMutation.isPending ? 'שומר...' : 'שמור היעדרות'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Self Report Modal (teacher) ──────────────────────────────────────────────
function SelfReportModal({ user, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    absence_reason: 'sick', start_date: '', end_date: '', notes: '',
  });
  const [certificate, setCertificate] = useState(null);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Absence.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myAbsences'] });
      toast.success('ההיעדרות דווחה בהצלחה');
      onClose();
    },
    onError: () => toast.error('שגיאה בדיווח ההיעדרות'),
  });

  const handleSubmit = () => {
    if (!form.start_date) { toast.error('יש לבחור תאריך'); return; }
    if (form.absence_reason === 'sick_certificate' && !certificate) {
      toast.error('יש להעלות אישור רפואי'); return;
    }
    if (form.absence_reason === 'other' && !form.notes.trim()) {
      toast.error('יש להזין פירוט לסיבת "אחר"'); return;
    }
    createMutation.mutate({
      user_email: user.email,
      user_name: user.full_name,
      ...form,
      end_date: form.end_date || form.start_date,
      status: form.absence_reason === 'sick_certificate' ? 'awaiting_certificate' : 'pending',
      ...(certificate ? { certificate_url: certificate.url, certificate_name: certificate.name } : {}),
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl">
          <h2 className="text-xl font-bold text-white">דיווח היעדרות</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
        <div className="p-6 space-y-4" dir="rtl">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">סיבת היעדרות</label>
            <select
              value={form.absence_reason}
              onChange={(e) => { setForm(f => ({ ...f, absence_reason: e.target.value })); setCertificate(null); }}
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(REASON_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          {form.absence_reason === 'sick_certificate' && (
            <CertificateUpload value={certificate} onChange={setCertificate} />
          )}
          {form.absence_reason === 'other' && (
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">
                פירוט הסיבה <span className="text-red-500">*</span>
              </label>
              <textarea value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="פרטי הסיבה להיעדרות..."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">תאריך התחלה</label>
              <input type="date" value={form.start_date}
                onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">תאריך סיום</label>
              <input type="date" value={form.end_date}
                onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          {form.absence_reason !== 'other' && (
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">הערה (אופציונלי)</label>
              <textarea value={form.notes}
                onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                rows={2} placeholder="הערה נוספת..."
                className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 border border-slate-300 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50">
              ביטול
            </button>
            <button onClick={handleSubmit} disabled={createMutation.isPending}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <Save className="h-4 w-4" />
              {createMutation.isPending ? 'שומר...' : 'שלחי דיווח'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Approve Absence Modal ────────────────────────────────────────────────────
function ApproveAbsenceModal({ absence, managers, onClose }) {
  const qc = useQueryClient();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const approveMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Absence.update(absence.id, {
        status: 'approved',
        approved_by: managers?.full_name || 'הנהלה',
        approved_at: new Date().toISOString(),
      });
      // Notify the teacher their absence was approved
      await notify({
        user_email: absence.user_email,
        title: 'היעדרות אושרה',
        message: `היעדרותך מ-${absence.start_date} אושרה. כעת מלאי פרטי מ"מ לשעות.`,
        type: 'absence_approved',
        read: false,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['absences'] });
      qc.invalidateQueries({ queryKey: ['myAbsences'] });
      toast.success('ההיעדרות אושרה — המורה תקבל התראה למלא פרטי מ"מ');
      onClose();
    },
    onError: (e) => toast.error('שגיאה: ' + (e?.message || 'נסי שוב')),
  });

  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!rejectionReason.trim()) throw new Error('יש לרשום סיבת דחייה');
      await base44.entities.Absence.update(absence.id, {
        status: 'rejected',
        approved_by: managers?.full_name || 'הנהלה',
        rejection_reason: rejectionReason.trim(),
      });
      await notify({
        user_email: absence.user_email,
        title: 'היעדרות נדחתה',
        message: `היעדרותך מ-${absence.start_date} נדחתה. סיבה: ${rejectionReason.trim()}`,
        type: 'absence_rejected',
        read: false,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['absences'] });
      qc.invalidateQueries({ queryKey: ['myAbsences'] });
      toast.success('ההיעדרות נדחתה והמורה קיבלה הודעה');
      onClose();
    },
    onError: (e) => toast.error('שגיאה: ' + (e?.message || 'נסי שוב')),
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-white">אישור היעדרות</h2>
            <p className="text-green-100 text-xs mt-0.5">
              {absence.user_name} · {REASON_LABELS[absence.absence_reason] || absence.absence_reason} · {absence.start_date}{absence.end_date && absence.end_date !== absence.start_date ? `–${absence.end_date}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        <div className="p-6 space-y-4" dir="rtl">
          <div className="bg-slate-50 rounded-xl p-4 space-y-1.5 text-sm">
            <p><span className="font-bold text-slate-600">מורה: </span>{absence.user_name}</p>
            <p><span className="font-bold text-slate-600">סיבה: </span>{REASON_LABELS[absence.absence_reason] || absence.absence_reason}</p>
            <p><span className="font-bold text-slate-600">תאריכים: </span>{absence.start_date}{absence.end_date && absence.end_date !== absence.start_date ? ` — ${absence.end_date}` : ''}</p>
            {absence.notes && <p><span className="font-bold text-slate-600">הערה: </span>{absence.notes}</p>}
            {absence.rejection_reason && <p className="text-red-600"><span className="font-bold">סיבת דחייה: </span>{absence.rejection_reason}</p>}
          </div>

          {absence.certificate_url && (
            <a href={absence.certificate_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
              <Paperclip className="h-4 w-4" />{absence.certificate_name || 'אישור מצורף'}
            </a>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
            לאחר האישור — המורה תמלא בעצמה את פרטי המ"מ לכל שעה ותשלח לאחראי/ת המערכת.
          </div>

          {!showRejectForm ? (
            <div className="flex gap-3">
              <button onClick={() => setShowRejectForm(true)}
                className="flex-1 py-2.5 border border-red-300 text-red-600 rounded-xl font-semibold text-sm hover:bg-red-50 flex items-center justify-center gap-2">
                <ThumbsDown className="h-4 w-4" />דחה
              </button>
              <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                <ThumbsUp className="h-4 w-4" />{approveMutation.isPending ? 'מאשר...' : 'אשר'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">סיבת דחייה <span className="text-red-500">*</span></label>
                <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)}
                  rows={3} placeholder="פרטי הסיבה לדחייה..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-400 resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowRejectForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50">
                  חזרה
                </button>
                <button onClick={() => rejectMutation.mutate()} disabled={!rejectionReason.trim() || rejectMutation.isPending}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  <ThumbsDown className="h-4 w-4" />{rejectMutation.isPending ? 'דוחה...' : 'דחה היעדרות'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Fill Substitute Modal (teacher fills after approval) ─────────────────────
function FillSubstituteModal({ absence, user, onClose }) {
  const qc = useQueryClient();

  const dates = [];
  if (absence.start_date) {
    const start = new Date(absence.start_date);
    const end   = new Date(absence.end_date || absence.start_date);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay();
      if (dow !== 5 && dow !== 6)
        dates.push(d.toISOString().split('T')[0]);
    }
  }

  const [subs, setSubs] = useState(() => {
    const init = {};
    dates.forEach(d => {
      init[d] = {};
      for (let h = 1; h <= 7; h++) init[d][h] = { teacher: '', class_name: '' };
    });
    return init;
  });
  const [certificate, setCertificate] = useState(null);
  // Certificate required for all except choice_day
  const needsCertificate = absence.absence_reason !== 'choice_day' && !absence.certificate_url;

  const { data: coordinators = [] } = useQuery({
    queryKey: ['system-coordinators'],
    queryFn: async () => {
      const all = await base44.entities.User.list();
      return all.filter(u => ['admin', 'vice_principal', 'secretary'].includes(u.role) || u.is_system_coordinator);
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (needsCertificate && !certificate) throw new Error('יש לצרף אישור');
      const updates = { substitute_filled: true, substitute_filled_at: new Date().toISOString() };
      if (certificate) { updates.certificate_url = certificate.url; updates.certificate_name = certificate.name; }
      await base44.entities.Absence.update(absence.id, updates);

      for (const [date, hours] of Object.entries(subs)) {
        for (const [hour, data] of Object.entries(hours)) {
          if (!data.teacher.trim()) continue;
          await base44.entities.SubstituteReport.create({
            date,
            hour_number: Number(hour),
            reporter_name: data.teacher.trim(),
            reporter_email: '',
            class_name: data.class_name.trim(),
            original_teacher: absence.user_name,
            original_teacher_email: absence.user_email,
            absence_id: absence.id,
            hours_count: 1,
            status: 'reported',
            entered_by: user.full_name,
          });
        }
      }

      const subsText = Object.entries(subs)
        .flatMap(([date, hours]) =>
          Object.entries(hours)
            .filter(([, d]) => d.teacher.trim())
            .map(([h, d]) => `${new Date(date).toLocaleDateString('he-IL')} שעה ${h}: ${d.teacher}${d.class_name ? ` (${d.class_name})` : ''}`)
        ).join(' | ');

      for (const coord of coordinators) {
        await notify({
          user_email: coord.email,
          phone: coord.phone,
          title: `פרטי מ"מ דווחו — ${absence.user_name}`,
          message: `${absence.user_name} מילאה פרטי מ"מ להיעדרות (${REASON_LABELS[absence.absence_reason] || absence.absence_reason}) ${absence.start_date}${absence.end_date && absence.end_date !== absence.start_date ? `–${absence.end_date}` : ''}.${subsText ? ` פרטים: ${subsText}` : ' לא הוזן מ"מ.'}`,
          type: 'substitute_filled',
          read: false,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['absences'] });
      qc.invalidateQueries({ queryKey: ['myAbsences'] });
      qc.invalidateQueries({ queryKey: ['substitutes'] });
      toast.success('פרטי המ"מ נשלחו לאחראי/ת המערכת');
      onClose();
    },
    onError: (e) => toast.error('שגיאה: ' + (e?.message || 'נסי שוב')),
  });

  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">מילוי שעות מ"מ</h2>
            <p className="text-blue-100 text-xs mt-0.5">
              {REASON_LABELS[absence.absence_reason] || absence.absence_reason} · {absence.start_date}{absence.end_date && absence.end_date !== absence.start_date ? `–${absence.end_date}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-5" dir="rtl">
          <p className="text-sm text-slate-500 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            מלאי לכל שעה את שם המורה שמילאה מקום והכיתה. לאחר השליחה תישלח הודעה לאחראי/ת המערכת.
          </p>

          {dates.map(date => {
            const dow = new Date(date).getDay();
            return (
              <div key={date} className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                  <span className="font-bold text-slate-700 text-sm">
                    יום {dayNames[dow] || ''} · {new Date(date).toLocaleDateString('he-IL')}
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  {[1,2,3,4,5,6,7].map(h => (
                    <div key={h} className="grid grid-cols-[3rem_1fr_1fr] gap-2 items-center">
                      <span className="text-xs font-bold text-slate-500 text-center">שעה {h}</span>
                      <input type="text" placeholder="שם המורה המחליפה"
                        value={subs[date]?.[h]?.teacher || ''}
                        onChange={e => setSubs(prev => ({
                          ...prev,
                          [date]: { ...prev[date], [h]: { ...prev[date][h], teacher: e.target.value } }
                        }))}
                        className="px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400" />
                      <input type="text" placeholder="כיתה"
                        value={subs[date]?.[h]?.class_name || ''}
                        onChange={e => setSubs(prev => ({
                          ...prev,
                          [date]: { ...prev[date], [h]: { ...prev[date][h], class_name: e.target.value } }
                        }))}
                        className="px-2.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400" />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

              {/* Hour limit warnings & blocking */}
          {(() => {
            const perDay = Object.entries(subs).map(([date, hours]) => ({
              date,
              count: Object.values(hours).filter(d => d.teacher.trim()).length,
            }));
            const overLimit = perDay.filter(d => d.count > 8);
            const warnings  = perDay.filter(d => d.count > 0 && d.count <= 8 && d.count >= 7);
            return (
              <>
                {overLimit.map(d => (
                  <div key={d.date} className="flex items-center gap-2 bg-red-50 border border-red-300 rounded-xl px-4 py-3 text-sm text-red-700 font-bold">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {new Date(d.date).toLocaleDateString('he-IL')}: {d.count} שעות מ"מ — חורג מהמגבלה (מקסימום 8). יש להפחית.
                  </div>
                ))}
                {warnings.map(d => (
                  <div key={d.date} className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2 text-xs text-yellow-800 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                    {new Date(d.date).toLocaleDateString('he-IL')}: {d.count} שעות מ"מ — מתקרב/ת למגבלה
                  </div>
                ))}
              </>
            );
          })()}

          {needsCertificate && (
            <CertificateUpload value={certificate} onChange={setCertificate} />
          )}
          {!needsCertificate && absence.absence_reason !== 'choice_day' && absence.certificate_url && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
              <CheckCircle className="h-4 w-4" />אישור רפואי כבר מצורף
            </div>
          )}

          {coordinators.length > 0 && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-xs text-indigo-700">
              <span className="font-bold">הודעה תישלח ל: </span>
              {coordinators.map(c => c.full_name).join(', ')}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 flex-shrink-0 flex-wrap">
          <button onClick={onClose}
            className="py-2.5 px-4 border border-slate-300 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50">
            ביטול
          </button>
          <button onClick={() => {
            const rows = Object.entries(subs).flatMap(([date, hours]) =>
              Object.entries(hours)
                .filter(([, d]) => d.teacher.trim())
                .map(([h, d]) => `<tr><td>${new Date(date).toLocaleDateString('he-IL')}</td><td style="text-align:center">${h}</td><td>${d.teacher}</td><td>${d.class_name || '—'}</td></tr>`)
            ).join('');
            printHtml(`שינוי מערכת — ${absence.user_name}`,
              `<h2>שינוי מערכת — ${absence.user_name}</h2>
               <p>סיבה: ${REASON_LABELS[absence.absence_reason] || absence.absence_reason} · ${absence.start_date}${absence.end_date && absence.end_date !== absence.start_date ? `–${absence.end_date}` : ''}</p>
               <table><thead><tr><th>תאריך</th><th>שעה</th><th>מורה מחליפה</th><th>כיתה</th></tr></thead>
               <tbody>${rows || '<tr><td colspan="4" style="text-align:center;color:#999">לא הוזן מ"מ</td></tr>'}</tbody></table>`
            );
          }}
            className="py-2.5 px-4 bg-slate-700 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 flex items-center gap-2">
            <Printer className="h-4 w-4" />הדפסה
          </button>
          {(() => {
            const exceedsLimit = Object.values(subs).some(hours =>
              Object.values(hours).filter(d => d.teacher.trim()).length > 8
            );
            return (
              <button onClick={() => submitMutation.mutate()}
                disabled={submitMutation.isPending || exceedsLimit}
                title={exceedsLimit ? 'יש לתקן חריגת שעות לפני השליחה' : ''}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                <Send className="h-4 w-4" />{submitMutation.isPending ? 'שולח...' : 'שלחי לאחראי/ת המערכת'}
              </button>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

// ─── Reject Substitute Modal ──────────────────────────────────────────────────
function RejectSubModal({ sub, manager, onClose }) {
  const qc = useQueryClient();
  const [reason, setReason] = useState('');

  const rejectMutation = useMutation({
    mutationFn: async () => {
      if (!reason.trim()) throw new Error('יש לרשום סיבת דחייה');
      await base44.entities.SubstituteReport.update(sub.id, {
        status: 'rejected',
        rejection_reason: reason.trim(),
        rejected_by: manager?.full_name || 'אחראי/ת מערכת',
        rejected_at: new Date().toISOString(),
      });
      // Notify the substitute teacher
      if (sub.reporter_email) {
        await notify({
          user_email: sub.reporter_email,
          title: 'שעת מ"מ נדחתה',
          message: `שעת המ"מ שלך ב-${sub.date} (שעה ${sub.hour_number}${sub.original_teacher ? `, במקום ${sub.original_teacher}` : ''}) נדחתה. סיבה: ${reason.trim()}`,
          type: 'substitute_rejected',
          read: false,
        }).catch(() => {});
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['substitutes'] });
      qc.invalidateQueries({ queryKey: ['mySubstitutes'] });
      toast.success('שעת המ"מ נדחתה והמורה קיבלה הודעה');
      onClose();
    },
    onError: (e) => toast.error('שגיאה: ' + (e?.message || 'נסי שוב')),
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" dir="rtl">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-red-600 to-rose-600 rounded-t-2xl">
          <div>
            <h2 className="text-lg font-bold text-white">דחיית שעת מ"מ</h2>
            <p className="text-red-100 text-xs mt-0.5">
              {sub.reporter_name} · {sub.date}{sub.hour_number ? ` · שעה ${sub.hour_number}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="h-5 w-5 text-white" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1">
            <p><span className="font-bold text-slate-600">מ"מ: </span>{sub.reporter_name}</p>
            {sub.original_teacher && <p><span className="font-bold text-slate-600">במקום: </span>{sub.original_teacher}</p>}
            {sub.class_name && <p><span className="font-bold text-slate-600">כיתה: </span>{sub.class_name}</p>}
            <p><span className="font-bold text-slate-600">תאריך: </span>{sub.date}{sub.hour_number ? ` שעה ${sub.hour_number}` : ''}</p>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">סיבת דחייה <span className="text-red-500">*</span></label>
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              rows={3} placeholder="פרטי הסיבה לדחייה..."
              className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-red-400 resize-none" />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50">
              ביטול
            </button>
            <button onClick={() => rejectMutation.mutate()} disabled={!reason.trim() || rejectMutation.isPending}
              className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
              <XCircle className="h-4 w-4" />{rejectMutation.isPending ? 'דוחה...' : 'דחה שעה'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Print helper ─────────────────────────────────────────────────────────────
function printHtml(title, html) {
  const w = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html dir="rtl" lang="he"><head><meta charset="UTF-8"><title>${title}</title>
    <style>
      body{font-family:Arial,sans-serif;direction:rtl;padding:20px;font-size:13px}
      h2{margin-bottom:6px}p{color:#555;margin-bottom:12px}
      table{width:100%;border-collapse:collapse}
      th,td{border:1px solid #ccc;padding:7px 10px;text-align:right}
      th{background:#f5f5f5;font-weight:bold}
      tr:nth-child(even){background:#fafafa}
      .ok{color:green}.no{color:#c00}.badge{padding:2px 8px;border-radius:9px;font-size:11px;font-weight:bold}
    </style></head><body>${html}</body></html>`);
  w.document.close();
  w.print();
}

// ─── Ministry (Ofek) Report Tab ────────────────────────────────────────────────
function OfekReportTab({ absences, substitutes }) {
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear]   = useState(now.getFullYear());

  const hasCoverage = (absence) =>
    absence.substitute_filled ||
    substitutes.some(s => s.absence_id === absence.id || (
      s.original_teacher_email === absence.user_email &&
      s.date >= absence.start_date && s.date <= (absence.end_date || absence.start_date)
    ));

  const markOfek = useMutation({
    mutationFn: async ({ id, val, absence }) => {
      if (val && !hasCoverage(absence)) {
        throw new Error('אין הלימה בין ההיעדרות למילוי המקום — לא ניתן לדווח לאופקית');
      }
      await base44.entities.Absence.update(id, { reported_to_ofek: val });
      if (val && absence?.user_email) {
        await notify({
          user_email: absence.user_email,
          title: 'דיווח למשרד החינוך',
          message: `היעדרותך מ-${absence.start_date} (${REASON_LABELS[absence.absence_reason] || absence.absence_reason}) דווחה למשרד החינוך (אופקית).`,
          type: 'ofek_reported',
          read: false,
        }).catch(() => {});
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['absences'] }),
    onError: (e) => toast.error(e.message),
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

  const exportExcel = () => {
    const data = filtered.map(a => {
      const days = a.start_date && a.end_date
        ? Math.ceil((new Date(a.end_date) - new Date(a.start_date)) / 86400000) + 1 : 1;
      return {
        'שם': a.user_name || '',
        'סיבה': REASON_LABELS[a.absence_reason] || a.absence_reason || '',
        'תאריך התחלה': a.start_date || '',
        'תאריך סיום': a.end_date || '',
        'ימים': days,
        'סטטוס': STATUS_CONFIG[a.status]?.label || a.status || '',
        'דווח באופקית': a.reported_to_ofek ? 'כן' : 'לא',
        'הערות': a.notes || '',
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'אופקית');
    XLSX.writeFile(wb, `דוח_אופקית_${year}_${String(month).padStart(2,'0')}.xlsx`);
    toast.success('קובץ Excel הורד');
  };

  const MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

  const printOfek = () => {
    const rows = filtered.map(a => {
      const days = a.start_date && a.end_date ? Math.ceil((new Date(a.end_date) - new Date(a.start_date)) / 86400000) + 1 : 1;
      const covered = hasCoverage(a);
      return `<tr>
        <td>${a.user_name || '—'}</td>
        <td>${REASON_LABELS[a.absence_reason] || a.absence_reason || ''}</td>
        <td>${a.start_date}${a.end_date && a.end_date !== a.start_date ? ` — ${a.end_date}` : ''}</td>
        <td style="text-align:center">${days}</td>
        <td>${STATUS_CONFIG[a.status]?.label || a.status || ''}</td>
        <td style="text-align:center">${covered ? '<span class="ok">✓ כן</span>' : '<span class="no">✗ לא</span>'}</td>
        <td style="text-align:center">${a.reported_to_ofek ? '<span class="ok">✓ דווח</span>' : '<span class="no">ממתין</span>'}</td>
      </tr>`;
    }).join('');
    printHtml(`דוח אופקית ${MONTHS[month-1]} ${year}`,
      `<h2>דוח אופקית — ${MONTHS[month-1]} ${year}</h2>
       <p>דווח: ${reported} | ממתין: ${unreported} | סה"כ: ${filtered.length}</p>
       <table><thead><tr><th>מורה</th><th>סיבה</th><th>תאריך</th><th>ימים</th><th>סטטוס</th><th>כיסוי מ"מ</th><th>דווח לאופקית</th></tr></thead>
       <tbody>${rows}</tbody></table>`
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-50">
              <BookOpen className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">דוח משרד החינוך — אופקית</h2>
              <p className="text-xs text-slate-400">דיווח לאופקית מחייב כיסוי מ"מ. סמני וי לאחר הדיווח.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select value={month} onChange={e => setMonth(+e.target.value)}
              className="p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500">
              {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
            <select value={year} onChange={e => setYear(+e.target.value)}
              className="p-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={printOfek}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-xl font-bold text-sm hover:bg-slate-800">
              <Printer className="h-4 w-4" />הדפסה
            </button>
            <button onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold text-sm hover:bg-green-700">
              <Download className="h-4 w-4" />CSV
            </button>
            <button onClick={exportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-xl font-bold text-sm hover:bg-green-800">
              <FileSpreadsheet className="h-4 w-4" />Excel
            </button>
          </div>
        </div>

        {/* Summary pills */}
        <div className="flex gap-3 flex-wrap">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            סה״כ: {filtered.length} היעדרויות
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
            ✓ דווח באופקית: {reported}
          </span>
          {unreported > 0 && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
              ⚠ טרם דווח: {unreported}
            </span>
          )}
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
            ✗ ללא כיסוי: {filtered.filter(a => !hasCoverage(a)).length}
          </span>
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
                <th className="p-4 text-xs font-bold text-slate-500 text-center">כיסוי מ"מ</th>
                <th className="p-4 text-xs font-bold text-green-700 text-center">דווח באופקית ✓</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? filtered.map(a => {
                const days = a.start_date && a.end_date
                  ? Math.ceil((new Date(a.end_date) - new Date(a.start_date)) / 86400000) + 1 : 1;
                const sc = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending;
                const covered = hasCoverage(a);
                return (
                  <tr key={a.id} className={`hover:bg-slate-50 transition-colors ${a.reported_to_ofek ? 'bg-green-50/30' : ''}`}>
                    <td className="p-4 font-semibold text-slate-800">{a.user_name || '—'}</td>
                    <td className="p-4 text-slate-600">{REASON_LABELS[a.absence_reason] || a.absence_reason}</td>
                    <td className="p-4 text-slate-500 text-xs">{a.start_date}{a.end_date && a.end_date !== a.start_date ? ` — ${a.end_date}` : ''}</td>
                    <td className="p-4 text-slate-600 font-medium">{days}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${sc.badgeClass}`}>{sc.label}</span>
                    </td>
                    <td className="p-4 text-center">
                      {covered
                        ? <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-bold">✓ מכוסה</span>
                        : <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">✗ חסר מ"מ</span>
                      }
                    </td>
                    <td className="p-4 text-center">
                      <label className={`relative inline-flex items-center ${covered ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                        title={!covered ? 'אין כיסוי מ"מ — לא ניתן לדווח לאופקית' : ''}>
                        <input
                          type="checkbox"
                          checked={!!a.reported_to_ofek}
                          disabled={!covered && !a.reported_to_ofek}
                          onChange={(e) => markOfek.mutate({ id: a.id, val: e.target.checked, absence: a })}
                          className="sr-only peer"
                        />
                        <div className="w-10 h-6 bg-slate-200 peer-focus:ring-2 peer-focus:ring-green-500 rounded-full peer peer-checked:after:translate-x-4 peer-checked:bg-green-600 after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all rtl:peer-checked:after:-translate-x-4"></div>
                      </label>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">אין היעדרויות לחודש זה</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Overtime Management Tab ──────────────────────────────────────────────────
function OvertimeManagementTab({ overtime, specialOvertime }) {
  const ACTIVITY_LABELS = { tzomchim: 'צומחים מחדש', duty: 'תורנות' };

  const exportOvertimeExcel = () => {
    const regularData = overtime.map(r => ({
      'שם': r.user_name || '',
      'תאריך': r.date || '',
      'שעות': r.hours || 0,
      'פירוט': r.reason || '',
      'סטטוס': r.status || 'דווח',
      'סוג': 'שעות נוספות רגילות',
    }));
    const specialData = specialOvertime.map(r => ({
      'שם': r.user_name || '',
      'תאריך': '',
      'שעות': r.total_hours || 0,
      'פירוט': r.details || '',
      'סטטוס': r.status || 'דווח',
      'סוג': ACTIVITY_LABELS[r.activity_type] || r.activity_type || 'מיוחד',
    }));
    const allData = [...regularData, ...specialData];
    const ws = XLSX.utils.json_to_sheet(allData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'שעות נוספות');
    XLSX.writeFile(wb, `שעות_נוספות_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('קובץ Excel הורד');
  };

  const regularByEmployee = useMemo(() => {
    const map = {};
    overtime.forEach(r => {
      if (!map[r.user_email]) map[r.user_email] = { name: r.user_name, regular: 0, count: 0 };
      map[r.user_email].regular += r.hours || 0;
      map[r.user_email].count += 1;
    });
    specialOvertime.forEach(r => {
      if (!map[r.user_email]) map[r.user_email] = { name: r.user_name, regular: 0, count: 0 };
      map[r.user_email].special = (map[r.user_email].special || 0) + (r.total_hours || 0);
      map[r.user_email].count += 1;
    });
    return Object.values(map).sort((a, b) => (b.regular + (b.special||0)) - (a.regular + (a.special||0)));
  }, [overtime, specialOvertime]);

  const totalRegular = overtime.reduce((s, r) => s + (r.hours || 0), 0);
  const totalSpecial = specialOvertime.reduce((s, r) => s + (r.total_hours || 0), 0);

  return (
    <div className="space-y-4">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-full"><Timer className="h-5 w-5 text-yellow-700" /></div>
            <div>
              <p className="text-xs text-slate-500">שעות נוספות רגילות</p>
              <p className="text-2xl font-bold text-yellow-700">{totalRegular}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full"><Sparkles className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-slate-500">שעות מיוחדות</p>
              <p className="text-2xl font-bold text-blue-600">{totalSpecial}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-full"><CheckCircle className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-xs text-slate-500">סה״כ שעות</p>
              <p className="text-2xl font-bold text-green-600">{totalRegular + totalSpecial}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Per-employee summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-50 rounded-xl"><Timer className="h-4 w-4 text-yellow-700" /></div>
            <h2 className="font-bold text-slate-800">שעות נוספות לפי עובד</h2>
          </div>
          <button onClick={exportOvertimeExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-xl font-bold text-sm hover:bg-green-800">
            <FileSpreadsheet className="h-4 w-4" />יצוא Excel
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm" dir="rtl">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-500">עובד</th>
                <th className="p-4 text-xs font-bold text-slate-500 text-center">שעות רגילות</th>
                <th className="p-4 text-xs font-bold text-slate-500 text-center">שעות מיוחדות</th>
                <th className="p-4 text-xs font-bold text-slate-500 text-center">סה״כ</th>
                <th className="p-4 text-xs font-bold text-slate-500 text-center">דיווחים</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {regularByEmployee.length > 0 ? regularByEmployee.map((emp, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-semibold text-slate-800">{emp.name}</td>
                  <td className="p-4 text-center">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">{emp.regular} ש׳</span>
                  </td>
                  <td className="p-4 text-center">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">{emp.special || 0} ש׳</span>
                  </td>
                  <td className="p-4 text-center font-bold text-green-700">{emp.regular + (emp.special || 0)} ש׳</td>
                  <td className="p-4 text-center text-slate-500">{emp.count}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="text-center py-12 text-slate-400">אין דיווחי שעות נוספות</td></tr>
              )}
            </tbody>
            {regularByEmployee.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td className="p-4 font-bold text-slate-800">סה״כ כולל</td>
                  <td className="p-4 text-center font-bold text-yellow-700">{totalRegular} ש׳</td>
                  <td className="p-4 text-center font-bold text-blue-700">{totalSpecial} ש׳</td>
                  <td className="p-4 text-center font-bold text-green-700">{totalRegular + totalSpecial} ש׳</td>
                  <td className="p-4 text-center text-slate-500">{overtime.length + specialOvertime.length}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Detailed regular overtime */}
      {overtime.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <div className="p-2 bg-yellow-50 rounded-xl"><Timer className="h-4 w-4 text-yellow-700" /></div>
            <h2 className="font-bold text-slate-800">פירוט שעות נוספות רגילות</h2>
          </div>
          <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
            {overtime.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-yellow-50/40 rounded-xl border border-yellow-100">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{r.user_name}</p>
                  <p className="text-xs text-slate-500">{r.date} · {r.reason}</p>
                </div>
                <span className="font-bold text-yellow-700">{r.hours} ש׳</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed special overtime */}
      {specialOvertime.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-4 border-b border-slate-100 flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-xl"><Sparkles className="h-4 w-4 text-blue-600" /></div>
            <h2 className="font-bold text-slate-800">פירוט שעות נוספות מיוחדות</h2>
          </div>
          <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
            {specialOvertime.map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-blue-50/40 rounded-xl border border-blue-100">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{r.user_name}</p>
                  <p className="text-xs text-slate-500">{ACTIVITY_LABELS[r.activity_type] || r.activity_type} · {r.details}</p>
                </div>
                <span className="font-bold text-blue-700">{r.total_hours} ש׳</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Manual Link Modal ─────────────────────────────────────────────────────────
function LinkSubModal({ absence, substitutes, onLink, onClose }) {
  const [selected, setSelected] = useState('');

  // Show substitutes that fall within the absence date range (or all if no range)
  const abStart = absence.start_date ? new Date(absence.start_date) : null;
  const abEnd   = absence.end_date   ? new Date(absence.end_date)   : abStart;

  const candidates = substitutes.filter(s => {
    if (!s.date) return false;
    const sd = new Date(s.date);
    if (abStart && abEnd) return sd >= abStart && sd <= abEnd;
    return true;
  });

  // If no candidates in range, show all as fallback
  const list = candidates.length > 0 ? candidates : substitutes;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" dir="rtl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-800">שיוך ממלא/ת מקום ידנית</h2>
            <p className="text-xs text-slate-400 mt-0.5">היעדרות: {absence.user_name} · {absence.start_date}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          {list.length === 0 ? (
            <p className="text-center text-slate-400 py-6 text-sm">אין דיווחי מ"מ להשוואה בתאריך זה</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {list.map(s => (
                <label key={s.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors
                  ${selected === s.id ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <input type="radio" name="sub" value={s.id} checked={selected === s.id}
                    onChange={() => setSelected(s.id)} className="accent-blue-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-800">{s.reporter_name || '—'}</p>
                    <p className="text-xs text-slate-500">{s.date} · {s.hours_count || 0} שעות
                      {s.original_teacher ? ` · במקום: ${s.original_teacher}` : ''}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50">
              ביטול
            </button>
            <button
              onClick={() => selected && onLink(absence.id, selected)}
              disabled={!selected}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 flex items-center justify-center gap-2">
              <Link2 className="h-4 w-4" />שייך
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Onboarding Gate (prerequisite for substitute reporting) ─────────────────
function OnboardingGate({ user }) {
  const { data: myDocs = [] } = useQuery({
    queryKey: ['myOnboarding', user?.email],
    queryFn: () => base44.entities.OnboardingDocument.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });

  if (!user || user.role !== 'substitute') return null;

  const required = ['form_101', 'bank_details', 'id_card'];
  const approved = required.filter(type =>
    myDocs.some(d => d.document_type === type && d.status === 'approved')
  );
  const missing = required.filter(type =>
    !myDocs.some(d => d.document_type === type && d.status === 'approved')
  );
  const hasPending = required.some(type =>
    myDocs.some(d => d.document_type === type && d.status === 'pending')
  );

  if (missing.length === 0) return null;

  const typeLabels = { form_101: 'טופס 101', bank_details: 'פרטי בנק', id_card: 'תעודת זהות' };

  return (
    <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-5 mb-2">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-yellow-800 mb-1">נדרש להשלים טפסי קליטה לפני דיווח מ"מ</p>
          <p className="text-sm text-yellow-700 mb-2">
            {hasPending
              ? 'חלק מהטפסים ממתינים לאישור. לאחר האישור תוכלי לדווח שעות מ"מ.'
              : 'לא ניתן לדווח שעות מ"מ עד להשלמת הטפסים הבאים:'}
          </p>
          <div className="flex flex-wrap gap-2">
            {missing.map(type => (
              <span key={type} className="px-2.5 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full border border-yellow-200">
                ✗ {typeLabels[type]}
              </span>
            ))}
            {approved.map(type => (
              <span key={type} className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                ✓ {typeLabels[type]}
              </span>
            ))}
          </div>
          <p className="text-xs text-yellow-600 mt-2">עברי לדף "טפסי קליטה" להעלאת המסמכים החסרים.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Teacher Weekly Schedule Tab ─────────────────────────────────────────────
const DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי'];
const EMPTY_SCHEDULE = { frontal: 0, presence: 0, private: 0 };

function TeacherScheduleTab() {
  const qc = useQueryClient();
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [scheduleForm, setScheduleForm] = useState({
    assignment_start: '',
    assignment_end: '',
    days: Object.fromEntries([0,1,2,3,4].map(d => [d, { ...EMPTY_SCHEDULE }])),
  });
  const [saving, setSaving] = useState(false);

  const { data: teachers = [] } = useQuery({
    queryKey: ['users-teachers'],
    queryFn: () => base44.entities.User.list(),
  });

  const teachingStaff = teachers.filter(u =>
    ['teacher', 'counselor', 'coordinator', 'assistant', 'substitute'].includes(u.role)
  );

  const { data: schedules = [] } = useQuery({
    queryKey: ['teacher-schedules'],
    queryFn: () => base44.entities.InstitutionSettings.filter({ type: 'teacher_schedule' }),
  });

  const { data: scheduleHistory = [] } = useQuery({
    queryKey: ['teacher-schedules-history', selectedTeacher],
    queryFn: () => base44.entities.InstitutionSettings.filter({ type: 'teacher_schedule_history', teacher_email: selectedTeacher }),
    enabled: !!selectedTeacher,
  });

  const getTeacherSchedule = (email) =>
    schedules.find(s => s.teacher_email === email) || null;

  const loadTeacher = (email) => {
    setSelectedTeacher(email);
    const existing = getTeacherSchedule(email);
    if (existing) {
      setScheduleForm({
        assignment_start: existing.assignment_start || '',
        assignment_end:   existing.assignment_end   || '',
        days: existing.days || Object.fromEntries([0,1,2,3,4].map(d => [d, { ...EMPTY_SCHEDULE }])),
      });
    } else {
      setScheduleForm({
        assignment_start: '',
        assignment_end: '',
        days: Object.fromEntries([0,1,2,3,4].map(d => [d, { ...EMPTY_SCHEDULE }])),
      });
    }
  };

  const totalWeekly = Object.values(scheduleForm.days).reduce((sum, d) => ({
    frontal:  sum.frontal  + (Number(d.frontal)  || 0),
    presence: sum.presence + (Number(d.presence) || 0),
    private:  sum.private  + (Number(d.private)  || 0),
  }), { frontal: 0, presence: 0, private: 0 });

  const handleSave = async () => {
    if (!selectedTeacher) return toast.error('יש לבחור מורה');
    setSaving(true);
    try {
      const teacher = teachingStaff.find(t => t.email === selectedTeacher);
      const existing = getTeacherSchedule(selectedTeacher);
      const now = new Date().toISOString();
      const payload = {
        type: 'teacher_schedule',
        teacher_email: selectedTeacher,
        teacher_name: teacher?.full_name || '',
        assignment_start: scheduleForm.assignment_start,
        assignment_end:   scheduleForm.assignment_end,
        days: scheduleForm.days,
        updated_at: now,
      };
      if (existing) {
        // Archive the old version before updating
        await base44.entities.InstitutionSettings.create({
          type: 'teacher_schedule_history',
          teacher_email: selectedTeacher,
          teacher_name: teacher?.full_name || '',
          assignment_start: existing.assignment_start,
          assignment_end:   existing.assignment_end,
          days: existing.days,
          archived_at: now,
          replaced_at: now,
        });
        await base44.entities.InstitutionSettings.update(existing.id, payload);
      } else {
        await base44.entities.InstitutionSettings.create(payload);
      }
      qc.invalidateQueries({ queryKey: ['teacher-schedules'] });
      qc.invalidateQueries({ queryKey: ['teacher-schedules-history', selectedTeacher] });
      toast.success('המערכת השבועית נשמרה');
    } catch (e) { toast.error('שגיאה: ' + (e?.message || 'נסי שוב')); }
    setSaving(false);
  };

  const setDay = (day, field, val) =>
    setScheduleForm(f => ({ ...f, days: { ...f.days, [day]: { ...f.days[day], [field]: Number(val) || 0 } } }));

  return (
    <div className="space-y-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-bold text-slate-800 text-lg">מערכת שבועית למורה</h2>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4 text-xs text-blue-700 space-y-0.5">
          <p className="font-bold">מגבלות שעות עבודה:</p>
          <p>• מקסימום <strong>9 שעות ביום</strong> סה"כ (פרונטליות + שהייה + פרטני + מ"מ)</p>
          <p>• מקסימום <strong>8 שעות מ"מ</strong> ביום</p>
          <p>• שורות אדומות מסמנות חריגה מהמגבלה היומית</p>
        </div>

        {/* Teacher selector */}
        <div className="mb-5">
          <label className="text-xs font-bold text-slate-500 block mb-1">בחרי מורה</label>
          <select value={selectedTeacher} onChange={e => loadTeacher(e.target.value)}
            className="w-full md:w-80 p-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500">
            <option value="">— בחרי מורה —</option>
            {teachingStaff.map(t => (
              <option key={t.email} value={t.email}>
                {t.full_name}{getTeacherSchedule(t.email) ? ' ✓' : ''}
              </option>
            ))}
          </select>
        </div>

        {selectedTeacher && (
          <>
            {/* Assignment dates */}
            <div className="grid grid-cols-2 gap-3 mb-5 max-w-sm">
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">תאריך תחילת שיבוץ</label>
                <input type="date" value={scheduleForm.assignment_start}
                  onChange={e => setScheduleForm(f => ({ ...f, assignment_start: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">תאריך סיום שיבוץ</label>
                <input type="date" value={scheduleForm.assignment_end}
                  onChange={e => setScheduleForm(f => ({ ...f, assignment_end: e.target.value }))}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-400" />
              </div>
            </div>

            {/* Daily schedule table */}
            <div className="overflow-x-auto mb-5">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="p-3 text-right text-xs font-bold text-slate-500 border border-slate-200">יום</th>
                    <th className="p-3 text-center text-xs font-bold text-blue-700 border border-slate-200">שעות פרונטליות</th>
                    <th className="p-3 text-center text-xs font-bold text-green-700 border border-slate-200">שעות שהייה</th>
                    <th className="p-3 text-center text-xs font-bold text-purple-700 border border-slate-200">שעות פרטני</th>
                    <th className="p-3 text-center text-xs font-bold text-slate-500 border border-slate-200">סה"כ יום</th>
                  </tr>
                </thead>
                <tbody>
                  {[0,1,2,3,4].map(day => {
                    const d = scheduleForm.days[day] || EMPTY_SCHEDULE;
                    const total = (Number(d.frontal)||0) + (Number(d.presence)||0) + (Number(d.private)||0);
                    const overLimit = total > 9;
                    return (
                      <tr key={day} className={overLimit ? 'bg-red-50' : 'hover:bg-slate-50'}>
                        <td className="p-2 border border-slate-200 font-semibold text-slate-700">יום {DAY_NAMES[day]}</td>
                        {['frontal','presence','private'].map(field => (
                          <td key={field} className="p-2 border border-slate-200">
                            <input type="number" min="0" max="9" value={d[field] || 0}
                              onChange={e => setDay(day, field, e.target.value)}
                              className="w-16 p-1.5 border border-slate-200 rounded-lg text-center text-sm focus:ring-2 focus:ring-blue-400 mx-auto block" />
                          </td>
                        ))}
                        <td className={`p-2 border border-slate-200 text-center font-bold ${overLimit ? 'text-red-600' : 'text-slate-700'}`}>
                          {total}{overLimit && <span className="text-xs mr-1">⚠</span>}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-slate-100 font-bold">
                    <td className="p-2 border border-slate-200 text-slate-700">סה"כ שבועי</td>
                    <td className="p-2 border border-slate-200 text-center text-blue-700">{totalWeekly.frontal}</td>
                    <td className="p-2 border border-slate-200 text-center text-green-700">{totalWeekly.presence}</td>
                    <td className="p-2 border border-slate-200 text-center text-purple-700">{totalWeekly.private}</td>
                    <td className="p-2 border border-slate-200 text-center text-slate-700">{totalWeekly.frontal + totalWeekly.presence + totalWeekly.private}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 disabled:opacity-50">
              <Save className="h-4 w-4" />{saving ? 'שומר...' : 'שמור מערכת שבועית'}
            </button>

            {/* Schedule history */}
            {scheduleHistory.length > 0 && (
              <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                  <p className="text-xs font-bold text-slate-500">היסטוריית שינויים ({scheduleHistory.length})</p>
                </div>
                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {[...scheduleHistory].sort((a, b) => (b.archived_at || '').localeCompare(a.archived_at || '')).map(h => {
                    const weekly = h.days ? Object.values(h.days).reduce((sum, d) => sum + (Number(d.frontal)||0) + (Number(d.presence)||0) + (Number(d.private)||0), 0) : 0;
                    return (
                      <div key={h.id} className="px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
                        <span>{h.assignment_start ? `שיבוץ: ${h.assignment_start}${h.assignment_end ? ` — ${h.assignment_end}` : ''}` : 'ללא תאריך'}</span>
                        <span>{weekly} ש׳/שבוע</span>
                        <span className="text-slate-400">{h.archived_at ? new Date(h.archived_at).toLocaleDateString('he-IL') : ''}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Summary list */}
      {schedules.filter(s => s.type === 'teacher_schedule').length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-bold text-slate-700 mb-3">מערכות שבועיות שהוגדרו</h3>
          <div className="space-y-2">
            {schedules.filter(s => s.type === 'teacher_schedule').map(s => {
              const weekly = s.days ? Object.values(s.days).reduce((sum, d) => sum + (Number(d.frontal)||0) + (Number(d.presence)||0) + (Number(d.private)||0), 0) : 0;
              return (
                <div key={s.id} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors
                  ${selectedTeacher === s.teacher_email ? 'bg-blue-50 border-blue-300' : 'bg-slate-50 border-slate-200 hover:border-blue-200'}`}
                  onClick={() => loadTeacher(s.teacher_email)}>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{s.teacher_name}</p>
                    <p className="text-xs text-slate-500">
                      {s.assignment_start ? `שיבוץ: ${s.assignment_start}` : 'ללא תאריך שיבוץ'}
                      {s.assignment_end ? ` — ${s.assignment_end}` : ''}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-600">{weekly} ש׳/שבוע</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Manager Report Tab ────────────────────────────────────────────────────────
function ManagerReportTab({ absences, substitutes }) {
  const [filterMonth, setFilterMonth] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [linkTarget, setLinkTarget] = useState(null); // absence to manually link
  const qc = useQueryClient();

  const MONTHS = ['ינואר','פברואר','מרץ','אפריל','מאי','יוני','יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'];

  // Cross-reference: for each absence, find matching substitutes (same date range)
  const merged = useMemo(() => {
    return absences.map(ab => {
      // Find substitutes whose date falls within this absence's range
      const abStart = ab.start_date ? new Date(ab.start_date) : null;
      const abEnd   = ab.end_date   ? new Date(ab.end_date)   : abStart;
      const matched = substitutes.filter(s => {
        if (!s.date) return false;
        const sd = new Date(s.date);
        // Check if substitute date is within absence range, AND teacher name matches (if set)
        const inRange = abStart && abEnd && sd >= abStart && sd <= abEnd;
        const nameMatch = !ab.user_name || !s.original_teacher ||
          s.original_teacher.trim() === ab.user_name.trim();
        return inRange && nameMatch;
      });
      const totalHours = matched.reduce((sum, s) => sum + (s.hours_count || 0), 0);
      return { ...ab, substitutes: matched, totalHours, covered: matched.length > 0 };
    });
  }, [absences, substitutes]);

  const filtered = useMemo(() => {
    let list = merged;
    if (filterMonth) {
      const [y, m] = filterMonth.split('-').map(Number);
      list = list.filter(a => {
        const d = new Date(a.start_date);
        return d.getFullYear() === y && d.getMonth() + 1 === m;
      });
    }
    if (filterStatus === 'covered')   list = list.filter(a => a.covered);
    if (filterStatus === 'uncovered') list = list.filter(a => !a.covered);
    return list;
  }, [merged, filterMonth, filterStatus]);

  const totalCovered   = filtered.filter(a => a.covered).length;
  const totalUncovered = filtered.filter(a => !a.covered).length;
  const totalHours     = filtered.reduce((s, a) => s + a.totalHours, 0);

  const linkMutation = useMutation({
    mutationFn: async ({ absenceId, subId }) => {
      await Promise.all([
        base44.entities.Absence.update(absenceId, { substitute_id: subId }),
        base44.entities.SubstituteReport.update(subId, { absence_id: absenceId }),
      ]);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['absences'] });
      qc.invalidateQueries({ queryKey: ['substitutes'] });
      setLinkTarget(null);
      toast.success('השיוך בוצע בהצלחה');
    },
    onError: () => toast.error('שגיאה בשיוך'),
  });

  const exportExcel = () => {
    const rows = filtered.map(a => ({
      'מורה נעדרת':  a.user_name || '',
      'סיבה':        REASON_LABELS[a.absence_reason] || a.absence_reason || '',
      'מתאריך':      a.start_date || '',
      'עד תאריך':    a.end_date   || '',
      'סטטוס':       STATUS_CONFIG[a.status]?.label || '',
      'מ"מ':          a.substitutes.map(s => s.reporter_name || '').join(', '),
      'שעות כיסוי':  a.totalHours,
      'מכוסה':       a.covered ? 'כן' : 'לא',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'דוח מנהלת');
    XLSX.writeFile(wb, `דוח_מנהלת_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('קובץ Excel הורד');
  };

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-xs text-slate-500 mb-1">סה״כ היעדרויות</p>
          <p className="text-2xl font-bold text-slate-800">{filtered.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-100">
          <p className="text-xs text-slate-500 mb-1">מכוסות במ"מ</p>
          <p className="text-2xl font-bold text-green-600">{totalCovered}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-red-100">
          <p className="text-xs text-slate-500 mb-1">ללא כיסוי</p>
          <p className="text-2xl font-bold text-red-500">{totalUncovered}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100">
          <p className="text-xs text-slate-500 mb-1">שעות כיסוי סה״כ</p>
          <p className="text-2xl font-bold text-blue-600">{totalHours}</p>
        </div>
      </div>

      {/* Filters + export */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 flex flex-wrap items-center gap-3">
        <input
          type="month"
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
          className="p-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="p-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">כל ההיעדרויות</option>
          <option value="covered">מכוסות בלבד</option>
          <option value="uncovered">ללא כיסוי בלבד</option>
        </select>
        <button
          onClick={exportExcel}
          className="flex items-center gap-2 px-4 py-2 bg-green-700 text-white rounded-xl font-bold text-sm hover:bg-green-800 mr-auto"
        >
          <FileSpreadsheet className="h-4 w-4" />יצוא Excel
        </button>
      </div>

      {/* Main table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-2">
          <div className="p-2 bg-indigo-50 rounded-xl">
            <FileText className="h-4 w-4 text-indigo-600" />
          </div>
          <h2 className="font-bold text-slate-800">היעדרויות ומילויי מקום — תצוגה מאוחדת</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right" dir="rtl">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-3 text-xs font-bold text-slate-500">מורה נעדרת</th>
                <th className="p-3 text-xs font-bold text-slate-500">סיבה</th>
                <th className="p-3 text-xs font-bold text-slate-500">תאריך</th>
                <th className="p-3 text-xs font-bold text-slate-500">סטטוס</th>
                <th className="p-3 text-xs font-bold text-slate-500">ממלא/ת מקום</th>
                <th className="p-3 text-xs font-bold text-slate-500 text-center">שעות</th>
                <th className="p-3 text-xs font-bold text-slate-500 text-center">כיסוי</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? filtered.map(a => {
                const sc = STATUS_CONFIG[a.status] || STATUS_CONFIG.pending;
                return (
                  <tr key={a.id} className={`hover:bg-slate-50 transition-colors ${!a.covered ? 'bg-red-50/20' : ''}`}>
                    <td className="p-3 font-semibold text-slate-800">{a.user_name || '—'}</td>
                    <td className="p-3 text-slate-600">{REASON_LABELS[a.absence_reason] || a.absence_reason}</td>
                    <td className="p-3 text-slate-500 text-xs">
                      {a.start_date}{a.end_date && a.end_date !== a.start_date ? ` — ${a.end_date}` : ''}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${sc.badgeClass}`}>{sc.label}</span>
                    </td>
                    <td className="p-3">
                      {a.substitutes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {a.substitutes.map((s, i) => (
                            <span key={i} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                              {s.reporter_name || '—'} ({s.date})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <button
                          onClick={() => setLinkTarget(a)}
                          className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-dashed border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                          <Link2 className="h-3 w-3" />שייך מ"מ
                        </button>
                      )}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-700">
                      {a.totalHours > 0 ? `${a.totalHours} ש׳` : '—'}
                    </td>
                    <td className="p-3 text-center">
                      {a.covered
                        ? <span className="inline-flex w-5 h-5 rounded-full bg-green-500 text-white text-xs items-center justify-center">✓</span>
                        : <span className="inline-flex w-5 h-5 rounded-full bg-red-400 text-white text-xs items-center justify-center">✗</span>
                      }
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">אין נתונים</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual link modal */}
      {linkTarget && (
        <LinkSubModal
          absence={linkTarget}
          substitutes={substitutes}
          onClose={() => setLinkTarget(null)}
          onLink={(absenceId, subId) => linkMutation.mutate({ absenceId, subId })}
        />
      )}
    </div>
  );
}

// ─── Teacher Personal Summary ─────────────────────────────────────────────────
function TeacherPersonalSummary({ user, myAbsences, mySubstitutes }) {
  const { data: myDocs = [] } = useQuery({
    queryKey: ['myOnboarding', user?.email],
    queryFn: () => base44.entities.OnboardingDocument.filter({ user_email: user.email }),
    enabled: !!user?.email,
  });
  const { data: schedules = [] } = useQuery({
    queryKey: ['teacher-schedules'],
    queryFn: () => base44.entities.InstitutionSettings.filter({ type: 'teacher_schedule' }),
    enabled: !!user?.email,
  });

  const mySchedule = schedules.find(s => s.teacher_email === user?.email);
  const currentYear = new Date().getFullYear();
  const yearAbsences = myAbsences.filter(a => a.start_date?.startsWith(String(currentYear)));
  const totalAbsenceDays = yearAbsences.reduce((sum, a) => {
    const days = a.end_date ? Math.ceil((new Date(a.end_date) - new Date(a.start_date)) / 86400000) + 1 : 1;
    return sum + days;
  }, 0);
  const totalSubHours = mySubstitutes.reduce((sum, s) => sum + (s.hours_count || 1), 0);

  const typeLabels = { form_101: 'טופס 101', bank_details: 'פרטי בנק', id_card: 'תעודת זהות' };
  const docStatuses = ['form_101', 'bank_details', 'id_card'].map(type => {
    const doc = myDocs.filter(d => d.document_type === type).sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''))[0];
    const statusColor = !doc ? 'bg-red-100 text-red-700' : doc.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700';
    const statusLabel = !doc ? 'חסר' : doc.status === 'approved' ? '✓ מאושר' : 'ממתין לאישור';
    return { type, label: typeLabels[type], statusColor, statusLabel };
  });

  const weeklyTotal = mySchedule
    ? Object.values(mySchedule.days || {}).reduce((s, d) => s + (Number(d.frontal)||0) + (Number(d.presence)||0) + (Number(d.private)||0), 0)
    : null;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 mb-1">
      <h3 className="font-bold text-slate-700 mb-3 text-sm">הפרופיל שלי — {new Date().getFullYear()}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-blue-600">{totalAbsenceDays}</p>
          <p className="text-xs text-slate-500 mt-0.5">ימי היעדרות השנה</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-600">{yearAbsences.filter(a => a.status === 'approved').length}</p>
          <p className="text-xs text-slate-500 mt-0.5">היעדרויות מאושרות</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-purple-600">{totalSubHours}</p>
          <p className="text-xs text-slate-500 mt-0.5">שעות מ"מ שביצעתי</p>
        </div>
        <div className="bg-white rounded-xl p-3 text-center shadow-sm">
          <p className="text-2xl font-bold text-slate-700">{weeklyTotal !== null ? weeklyTotal : '—'}</p>
          <p className="text-xs text-slate-500 mt-0.5">שעות שבועיות במערכת</p>
        </div>
      </div>
      {/* Onboarding status */}
      {user?.role === 'substitute' && (
        <div>
          <p className="text-xs font-bold text-slate-500 mb-2">סטטוס טפסי קליטה</p>
          <div className="flex flex-wrap gap-2">
            {docStatuses.map(({ type, label, statusColor, statusLabel }) => (
              <span key={type} className={`px-2.5 py-1 rounded-full text-xs font-bold ${statusColor}`}>
                {label}: {statusLabel}
              </span>
            ))}
          </div>
        </div>
      )}
      {mySchedule && (
        <p className="text-xs text-slate-400 mt-2">
          שיבוץ נוכחי: {mySchedule.assignment_start || '—'}{mySchedule.assignment_end ? ` עד ${mySchedule.assignment_end}` : ''}
        </p>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState('absences');
  const [showManualEntry, setShowManualEntry] = useState(null); // null | 'normal' | 'unjustified'
  const [showSelfReport, setShowSelfReport] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [fillSubTarget, setFillSubTarget] = useState(null);
  const [rejectSubTarget, setRejectSubTarget] = useState(null);
  const { user } = useAuth();
  const qc = useQueryClient();

  const deleteAbsence = useMutation({
    mutationFn: (id) => base44.entities.Absence.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['absences'] });
      qc.invalidateQueries({ queryKey: ['myAbsences'] });
      setConfirmDeleteId(null);
      toast.success('ההיעדרות נמחקה');
    },
    onError: () => toast.error('שגיאה במחיקה'),
  });

  const approveSubMutation = useMutation({
    mutationFn: async (sub) => {
      await base44.entities.SubstituteReport.update(sub.id, {
        status: 'approved',
        approved_by: user?.full_name,
        approved_at: new Date().toISOString(),
      });
      if (sub.reporter_email) {
        await notify({
          user_email: sub.reporter_email,
          title: 'שעת מ"מ אושרה',
          message: `שעת המ"מ שלך ב-${sub.date}${sub.hour_number ? ` (שעה ${sub.hour_number})` : ''} אושרה.`,
          type: 'substitute_approved',
          read: false,
        }).catch(() => {});
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['substitutes'] });
      qc.invalidateQueries({ queryKey: ['mySubstitutes'] });
      toast.success('שעת המ"מ אושרה');
    },
    onError: () => toast.error('שגיאה באישור'),
  });


  // Fetch system coordinator flag from User entity (may differ from cached session)
  const { data: currentUserRecord } = useQuery({
    queryKey: ['currentUserRecord', user?.email],
    queryFn: async () => {
      const list = await base44.entities.User.filter({ email: user.email });
      return list[0] || null;
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  });
  const isSystemCoordinator = currentUserRecord?.is_system_coordinator === true;

  const isManagerRole = user && ['admin', 'vice_principal', 'secretary', 'super_admin'].includes(user.role);
  const canViewAll   = isManagerRole || isSystemCoordinator;
  const canAddEntry  = isManagerRole || isSystemCoordinator;

  const { data: allAbsences = [] } = useQuery({
    queryKey: ['absences'],
    queryFn: () => base44.entities.Absence.list('-created_date'),
    enabled: !!user && canViewAll,
  });

  const { data: myAbsences = [] } = useQuery({
    queryKey: ['myAbsences', user?.email],
    queryFn: () => base44.entities.Absence.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user,
  });

  const { data: allSubstitutes = [] } = useQuery({
    queryKey: ['substitutes'],
    queryFn: () => base44.entities.SubstituteReport.list('-created_date'),
    enabled: !!user && canViewAll,
  });

  const { data: allOvertime = [] } = useQuery({
    queryKey: ['allOvertime'],
    queryFn: () => base44.entities.OvertimeReport.list('-created_date'),
    enabled: !!user && isManagerRole,
  });

  const { data: allSpecialOvertime = [] } = useQuery({
    queryKey: ['allSpecialOvertime'],
    queryFn: () => base44.entities.SpecialOvertimeReport.list('-created_date'),
    enabled: !!user && isManagerRole,
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

  const isManager = isManagerRole;
  const displayAbsences    = canViewAll ? allAbsences    : myAbsences;
  const displaySubstitutes = canViewAll ? allSubstitutes : mySubstitutes;

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
          {!canViewAll && (
            <button onClick={() => setShowSelfReport(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-sm">
              <Plus className="h-4 w-4" />דיווח היעדרות
            </button>
          )}
          {canAddEntry && !isSystemCoordinator && (
            <button onClick={() => setShowManualEntry('normal')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 shadow-sm">
              <Plus className="h-4 w-4" />הזנה ידנית
            </button>
          )}
          {canAddEntry && (
            <button onClick={() => setShowManualEntry('unjustified')}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 shadow-sm">
              <XCircle className="h-4 w-4" />היעדרות לא מוצדקת
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
                ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
              <Bell className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {al.msg}
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        {[
          { id: 'absences',    label: 'היעדרויות',        icon: Clock },
          { id: 'substitutes', label: 'מילויי מקום',       icon: Users },
          ...(canViewAll ? [
            { id: 'manager',    label: 'דוח מנהלת',        icon: FileText },
            { id: 'statistics', label: 'סטטיסטיקה',        icon: FileText },
          ] : []),
          ...(isManager ? [
            { id: 'schedule',   label: 'מערכת שבועית',     icon: Calendar },
            { id: 'ofek',       label: 'דוח אופקית',       icon: BookOpen },
            { id: 'overtime',   label: 'שעות נוספות',      icon: Timer },
          ] : []),
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-semibold transition-all text-sm whitespace-nowrap
              ${activeTab === tab.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Absences tab ─────────────────────────────────── */}
      {activeTab === 'absences' && (
        <>
          {/* Personal summary for non-managers */}
          {!canViewAll && (
            <TeacherPersonalSummary user={user} myAbsences={myAbsences} mySubstitutes={mySubstitutes} />
          )}
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
                      ${a.manually_entered ? 'bg-blue-50/40 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {canViewAll && <p className="font-bold text-slate-800">{a.user_name}</p>}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${sc.badgeClass}`}>
                          {REASON_LABELS[a.absence_reason] || a.absence_reason}
                        </span>
                        {a.manually_entered && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">הזנה ידנית</span>
                        )}
                        {a.reported_to_ofek && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700">✓ אופקית</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{a.start_date}{a.end_date && a.end_date !== a.start_date ? ` — ${a.end_date}` : ''}</span>
                        <span>{a.lesson_hours?.length || 0} שעות</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <Icon className={`h-4 w-4 ${sc.iconClass}`} />
                      <span className={`text-xs font-bold ${sc.iconClass}`}>{sc.label}</span>

                      {/* Manager: approve/reject pending absences */}
                      {isManager && a.status === 'pending' && (
                        <button
                          onClick={() => setApproveTarget(a)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors"
                        >
                          <UserCheck className="h-3 w-3" />אשר / דחה
                        </button>
                      )}

                      {/* Teacher: fill substitute hours after approval */}
                      {!isManager && a.status === 'approved' && !a.substitute_filled && (
                        <button
                          onClick={() => setFillSubTarget(a)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors animate-pulse"
                        >
                          <ClipboardCheck className="h-3 w-3" />מלאי מ"מ
                        </button>
                      )}
                      {!isManager && a.status === 'approved' && a.substitute_filled && (
                        <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full font-semibold">
                          <CheckCircle className="h-3 w-3" />מ"מ דווח
                        </span>
                      )}

                      {isManager && (
                        confirmDeleteId === a.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-red-600 font-semibold">למחוק?</span>
                            <button
                              onClick={() => deleteAbsence.mutate(a.id)}
                              disabled={deleteAbsence.isPending}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                            >כן</button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1 text-xs border border-slate-300 text-slate-600 rounded-lg font-bold hover:bg-slate-50"
                            >לא</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(a.id)}
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="מחק היעדרות"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )
                      )}
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
          {/* Intake prerequisite warning for substitute role */}
          <OnboardingGate user={user} />
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
              <div className="p-2 bg-yellow-50 rounded-xl"><Users className="h-4 w-4 text-yellow-700" /></div>
              <h2 className="font-bold text-slate-800">רשימת מילויי מקום</h2>
            </div>
            <div className="p-4 space-y-3">
              {displaySubstitutes.length > 0 ? displaySubstitutes.map(sub => {
                const sc = SUB_STATUS[sub.status] || SUB_STATUS.reported;
                const Icon = sc.icon;
                const isUnlinked = isManager && sub.date && !allAbsences.some(a => a.start_date === sub.date);
                const isRejected = sub.status === 'rejected';
                return (
                  <div key={sub.id}
                    className={`flex items-start justify-between p-4 rounded-xl border hover:border-yellow-200 transition-colors
                      ${isRejected ? 'bg-red-50/40 border-red-200' : isUnlinked ? 'bg-yellow-50/40 border-yellow-200' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {canViewAll && <p className="font-bold text-slate-800">{sub.reporter_name}</p>}
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                          שעה {sub.hour_number || sub.hours_count}
                        </span>
                        {isUnlinked && !isRejected && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">
                            ⚠ לא משויך להיעדרות
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{sub.date}</span>
                        {sub.original_teacher && <span>במקום: {sub.original_teacher}</span>}
                      </div>
                      {sub.class_name && <p className="text-xs text-slate-400 mt-1">כיתה: {sub.class_name}</p>}
                      {isRejected && sub.rejection_reason && (
                        <p className="text-xs text-red-600 mt-1 font-medium">סיבת דחייה: {sub.rejection_reason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${sc.iconClass}`} />
                      <span className={`text-xs font-bold ${sc.iconClass}`}>{sc.label}</span>
                      {(isManager || isSystemCoordinator) && sub.status === 'reported' && (
                        <>
                          <button
                            onClick={() => approveSubMutation.mutate(sub)}
                            disabled={approveSubMutation.isPending}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-lg font-bold hover:bg-green-200 transition-colors disabled:opacity-50">
                            <CheckCircle className="h-3 w-3" />אשר
                          </button>
                          <button onClick={() => setRejectSubTarget(sub)}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-lg font-bold hover:bg-red-200 transition-colors">
                            <XCircle className="h-3 w-3" />דחה
                          </button>
                        </>
                      )}
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

      {/* ── Weekly Schedule tab ──────────────────────────── */}
      {activeTab === 'schedule' && isManager && <TeacherScheduleTab />}

      {/* ── Manager Report tab ───────────────────────────── */}
      {activeTab === 'manager' && canViewAll && (
        <ManagerReportTab absences={allAbsences} substitutes={allSubstitutes} />
      )}

      {/* ── Ofek Report tab ───────────────────────────────── */}
      {activeTab === 'ofek' && <OfekReportTab absences={allAbsences} substitutes={allSubstitutes} />}

      {/* ── Overtime tab ──────────────────────────────────── */}
      {activeTab === 'overtime' && isManager && (
        <OvertimeManagementTab overtime={allOvertime} specialOvertime={allSpecialOvertime} />
      )}

      {showManualEntry && (
        <ManualEntryModal
          onClose={() => setShowManualEntry(null)}
          enteredBy={user?.full_name}
          defaultReason={showManualEntry === 'unjustified' ? 'unjustified' : 'sick'}
        />
      )}
      {showSelfReport && (
        <SelfReportModal user={user} onClose={() => setShowSelfReport(false)} />
      )}
      {approveTarget && (
        <ApproveAbsenceModal
          absence={approveTarget}
          managers={user}
          onClose={() => setApproveTarget(null)}
        />
      )}
      {fillSubTarget && (
        <FillSubstituteModal
          absence={fillSubTarget}
          user={user}
          onClose={() => setFillSubTarget(null)}
        />
      )}
      {rejectSubTarget && (
        <RejectSubModal
          sub={rejectSubTarget}
          manager={user}
          onClose={() => setRejectSubTarget(null)}
        />
      )}
    </div>
  );
}
