import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import { Printer, AlertCircle, Upload, BarChart2, ChevronDown, ChevronUp, FileSpreadsheet, Pause, X, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { PrintStats } from '@/components/printing/PrintStats';
import { PrintUploadForm } from '@/components/printing/PrintUploadForm';
import { AdminRequestCard, SecretaryRequestCard, TeacherRequestCard } from '@/components/printing/PrintRequestCard';

// Sort order: immediate > urgent > normal, then by date
const URGENCY_ORDER = { immediate: 0, urgent: 1, normal: 2 };
const sortByUrgency = (arr) =>
  [...arr].sort((a, b) => {
    const ua = URGENCY_ORDER[a.urgency_level] ?? 2;
    const ub = URGENCY_ORDER[b.urgency_level] ?? 2;
    if (ua !== ub) return ua - ub;
    return new Date(a.created_date) - new Date(b.created_date);
  });

const STATUS_LABEL = {
  pending: 'ממתינה', held: 'בהמתנה', approved: 'מאושרת',
  approval_cancelled: 'אישור בוטל', printing: 'בהדפסה',
  completed: 'הושלמה', rejected: 'נדחתה', cancelled: 'בוטלה',
};

export default function PrintingPage() {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [prefillData, setPrefillData] = useState(null);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: allPrintRequests = [] } = useQuery({
    queryKey: ['prints'],
    queryFn: () => base44.entities.PrintRequest.list('-created_date'),
    enabled: !!user,
  });

  const { data: myPrintRequests = [] } = useQuery({
    queryKey: ['myPrints', user?.email],
    queryFn: () => base44.entities.PrintRequest.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user,
  });

  const isSecretary = user?.role === 'secretary';
  const isAdmin     = ['admin', 'vice_principal'].includes(user?.role);
  const isTeacher   = !isAdmin && !isSecretary;

  // Status buckets
  const pendingRequests   = sortByUrgency(allPrintRequests.filter(r => r.status === 'pending'));
  const heldRequests      = sortByUrgency(allPrintRequests.filter(r => r.status === 'held'));
  const approvedRequests  = sortByUrgency(allPrintRequests.filter(r => r.status === 'approved'));
  const cancelledApproval = allPrintRequests.filter(r => r.status === 'approval_cancelled');
  const completedRequests = allPrintRequests.filter(r => r.status === 'completed');
  const totalPages        = allPrintRequests.reduce((s, r) => s + (r.total_pages || 0), 0);
  const myTotalPages      = myPrintRequests.reduce((s, r) => s + (r.total_pages || 0), 0);

  const cancelMutation = useMutation({
    mutationFn: (id) => base44.entities.PrintRequest.update(id, { status: 'cancelled' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['prints', 'myPrints'] }); toast.success('הבקשה בוטלה'); },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ ids, status }) => Promise.all(ids.map(id => base44.entities.PrintRequest.update(id, { status }))),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['prints'] }); setSelectedRequests([]); toast.success('הסטטוס עודכן'); },
  });

  function exportExcel() {
    const data = allPrintRequests.map(r => ({
      'שם מורה':     r.user_name,
      'קובץ':        r.file_name,
      'מקצוע':       r.subject || '',
      'כיתה':        r.class_name || '',
      'נושא שיעור': r.lesson_topic || '',
      'עותקים':      r.copies,
      'עמודים':      r.pages_per_copy,
      'סה"כ דפים':   r.total_pages,
      'גודל':        r.paper_size,
      'צבע':         r.color_mode === 'color' ? 'צבעוני' : 'שחור-לבן',
      'סוג נייר':    r.paper_type === 'bristol' ? 'בריסטול' : 'רגיל',
      'דו-צדדי':     r.double_sided ? 'כן' : 'לא',
      'כריכה':       r.binding === 'stapled' ? 'מהודק' : 'ללא',
      'דחיפות':      { normal: 'רגיל', urgent: 'דחוף', immediate: 'מיידי' }[r.urgency_level] || 'רגיל',
      'סטטוס':       STATUS_LABEL[r.status] || r.status,
      'סיבת דחייה': r.rejection_reason || '',
      'תאריך':       r.created_date ? new Date(r.created_date).toLocaleDateString('he-IL') : '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'הדפסות');
    XLSX.writeFile(wb, `prints-${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('קובץ Excel הורד');
  }

  // Printing summary (admin/secretary)
  const printingSummary = useMemo(() => {
    const byTeacher = {};
    allPrintRequests.forEach(r => {
      const name = r.user_name || r.user_email || 'לא ידוע';
      if (!byTeacher[name]) byTeacher[name] = { total: 0, rows: {} };
      const key = `${r.class_name || '—'}|${r.subject || '—'}`;
      if (!byTeacher[name].rows[key]) byTeacher[name].rows[key] = 0;
      byTeacher[name].rows[key] += r.total_pages || 0;
      byTeacher[name].total += r.total_pages || 0;
    });
    return Object.entries(byTeacher).sort((a, b) => b[1].total - a[1].total);
  }, [allPrintRequests]);

  const [expandedTeacher, setExpandedTeacher] = useState(null);

  const toggleSelection = (id) =>
    setSelectedRequests(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const handleDuplicate = (r) => {
    setPrefillData({
      subject: r.subject, class_name: r.class_name, lesson_topic: r.lesson_topic || '',
      copies: r.copies, pages_per_copy: r.pages_per_copy,
      paper_size: r.paper_size, color_mode: r.color_mode,
      paper_type: r.paper_type || 'regular', double_sided: r.double_sided,
      binding: r.binding || 'none', urgency_level: r.urgency_level || 'normal',
    });
    setShowUploadForm(true);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-blue-900">מרכז צילומים והדפסות</h1>
          <p className="text-slate-500 mt-1">
            {isSecretary ? 'ניהול תור ההדפסות' : isAdmin ? 'אישור וניהול בקשות' : `סה״כ צילמת: ${myTotalPages} דפים`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(isAdmin || isSecretary) && (
            <button onClick={exportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-sm shadow-sm">
              <FileSpreadsheet className="h-4 w-4" />יצוא Excel
            </button>
          )}
          {isTeacher && (
            <Button onClick={() => { setPrefillData(null); setShowUploadForm(true); }} className="bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" />בקשת צילום חדשה
            </Button>
          )}
        </div>
      </div>

      <PrintStats
        pending={pendingRequests.length} approved={approvedRequests.length}
        printing={allPrintRequests.filter(r => r.status === 'printing').length}
        completed={completedRequests.length} totalPages={totalPages}
      />

      {/* Upload form */}
      {showUploadForm && (
        <PrintUploadForm user={user} prefill={prefillData} onClose={() => { setShowUploadForm(false); setPrefillData(null); }} />
      )}

      {/* ── ADMIN sections ─────────────────────────────────────────── */}
      {isAdmin && (
        <>
          {/* Pending */}
          {pendingRequests.length > 0 && (
            <Section title="ממתינות לאישור" icon={<AlertCircle className="h-5 w-5 text-yellow-600" />} count={pendingRequests.length} bg="bg-yellow-50 border-yellow-200">
              {pendingRequests.map(r => <AdminRequestCard key={r.id} request={r} onAction={() => queryClient.invalidateQueries({ queryKey: ['prints'] })} />)}
            </Section>
          )}

          {/* Held */}
          {heldRequests.length > 0 && (
            <Section title="בהמתנה זמנית" icon={<Pause className="h-5 w-5 text-purple-500" />} count={heldRequests.length} bg="bg-purple-50 border-purple-200">
              {heldRequests.map(r => <AdminRequestCard key={r.id} request={r} onAction={() => queryClient.invalidateQueries({ queryKey: ['prints'] })} />)}
            </Section>
          )}

          {/* Approved — can cancel */}
          {approvedRequests.length > 0 && (
            <Section title="מאושרות (ניתן לבטל לפני הדפסה)" icon={<CheckCircle className="h-5 w-5 text-green-500" />} count={approvedRequests.length} bg="bg-green-50 border-green-200">
              {approvedRequests.map(r => <AdminRequestCard key={r.id} request={r} onAction={() => queryClient.invalidateQueries({ queryKey: ['prints'] })} />)}
            </Section>
          )}
        </>
      )}

      {/* ── SECRETARY section ──────────────────────────────────────── */}
      {isSecretary && approvedRequests.length > 0 && (
        <Section
          title="מאושרות להדפסה"
          icon={<Printer className="h-5 w-5 text-green-500" />}
          count={approvedRequests.length}
          bg="bg-green-50 border-green-200"
          extra={selectedRequests.length > 0 && (
            <div className="flex gap-2">
              <Button size="sm" variant="outline"
                onClick={() => updateStatusMutation.mutate({ ids: selectedRequests, status: 'printing' })}>
                בהדפסה ({selectedRequests.length})
              </Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700"
                onClick={() => updateStatusMutation.mutate({ ids: selectedRequests, status: 'completed' })}>
                הושלם ({selectedRequests.length})
              </Button>
            </div>
          )}
        >
          {approvedRequests.map(r => (
            <SecretaryRequestCard key={r.id} request={r}
              isSelected={selectedRequests.includes(r.id)}
              onToggle={() => toggleSelection(r.id)}
            />
          ))}
        </Section>
      )}

      {/* ── TEACHER section ────────────────────────────────────────── */}
      {isTeacher && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">הבקשות שלי</h2>
          </div>
          <div className="p-5 space-y-3">
            {myPrintRequests.length > 0
              ? myPrintRequests.map(r => (
                  <TeacherRequestCard key={r.id} request={r}
                    onCancel={r.status === 'pending' ? (id) => cancelMutation.mutate(id) : null}
                    onDuplicate={handleDuplicate}
                  />
                ))
              : <p className="text-slate-400 text-center py-12 text-sm">אין בקשות הדפסה</p>}
          </div>
        </div>
      )}

      {/* ── Summary table (admin / secretary) ─────────────────────── */}
      {(isAdmin || isSecretary) && printingSummary.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="p-5 border-b border-slate-100 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50"><BarChart2 className="h-5 w-5 text-blue-600" /></div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">מעקב צילומים לפי מורה</h2>
              <p className="text-xs text-slate-400">סה״כ דפים לפי מורה, כיתה ומקצוע</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="p-4 text-xs font-bold text-slate-500">מורה</th>
                  <th className="p-4 text-xs font-bold text-slate-500">כיתה</th>
                  <th className="p-4 text-xs font-bold text-slate-500">מקצוע</th>
                  <th className="p-4 text-xs font-bold text-slate-500 text-left">סה״כ דפים</th>
                </tr>
              </thead>
              <tbody>
                {printingSummary.map(([teacherName, data]) => {
                  const rows = Object.entries(data.rows);
                  const isExpanded = expandedTeacher === teacherName;
                  return (
                    <React.Fragment key={teacherName}>
                      <tr className="border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => setExpandedTeacher(isExpanded ? null : teacherName)}>
                        <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-blue-500" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                          {teacherName}
                        </td>
                        <td className="p-4 text-slate-400 text-sm" colSpan={2}>{rows.length} שילובי כיתה/מקצוע</td>
                        <td className="p-4 text-left">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">{data.total} דפים</span>
                        </td>
                      </tr>
                      {isExpanded && rows.map(([key, pages]) => {
                        const [cls, subj] = key.split('|');
                        return (
                          <tr key={key} className="border-b border-slate-50 bg-blue-50/30">
                            <td className="p-3 pr-10 text-slate-400 text-xs"></td>
                            <td className="p-3 text-sm text-slate-700 font-medium">{cls}</td>
                            <td className="p-3 text-sm text-slate-700">{subj}</td>
                            <td className="p-3 text-left text-sm text-slate-600">{pages} דפים</td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td className="p-4 font-bold text-slate-800" colSpan={3}>סה״כ כולל</td>
                  <td className="p-4 text-left font-bold text-blue-700">{totalPages} דפים</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Reusable section wrapper ───────────────────────────────────────────────────
function Section({ title, icon, count, bg = 'bg-white border-slate-100', extra, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
      <div className={`p-5 border-b border-slate-100 flex justify-between items-center rounded-t-2xl ${bg}`}>
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          {icon}{title} <span className="text-sm font-normal text-slate-500">({count})</span>
        </h2>
        {extra}
      </div>
      <div className="p-5 space-y-3">{children}</div>
    </div>
  );
}
