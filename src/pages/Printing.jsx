import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Printer, AlertCircle, Upload, BarChart2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PrintStats } from '@/components/printing/PrintStats';
import { PrintUploadForm } from '@/components/printing/PrintUploadForm';
import { AdminRequestCard, SecretaryRequestCard, TeacherRequestCard } from '@/components/printing/PrintRequestCard';

export default function PrintingPage() {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState([]);
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
  const isAdmin = user?.role === 'admin' || user?.role === 'vice_principal';
  const isTeacher = ['teacher', 'coordinator', 'counselor'].includes(user?.role);

  const pendingRequests = allPrintRequests.filter(r => r.status === 'pending');
  const approvedRequests = allPrintRequests.filter(r => r.status === 'approved');
  const printingRequests = allPrintRequests.filter(r => r.status === 'printing');
  const completedRequests = allPrintRequests.filter(r => r.status === 'completed');
  const totalPages = allPrintRequests.reduce((sum, r) => sum + (r.total_pages || 0), 0);
  const myTotalPages = myPrintRequests.reduce((sum, r) => sum + (r.total_pages || 0), 0);

  const approveMutation = useMutation({
    mutationFn: (id) => base44.entities.PrintRequest.update(id, {
      status: 'approved', approved_by: user.full_name,
      approval_date: new Date().toISOString().split('T')[0]
    }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['prints'] }); toast.success('הבקשה אושרה'); },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ ids, status }) => Promise.all(ids.map(id => base44.entities.PrintRequest.update(id, { status }))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prints'] });
      setSelectedRequests([]);
      toast.success('הסטטוס עודכן בהצלחה');
    },
  });

  const toggleSelection = (id) => {
    setSelectedRequests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Build printing summary by teacher → class → subject
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

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2">מרכז צילומים והדפסות</h1>
            <p className="text-slate-600">
              {isSecretary ? 'ניהול תור ההדפסות' : isAdmin ? 'אישור בקשות הדפסה' : `סה״כ צילמת: ${myTotalPages} דפים`}
            </p>
          </div>
          {isTeacher && (
            <Button onClick={() => setShowUploadForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" />בקשת צילום חדשה
            </Button>
          )}
        </div>

        <PrintStats
          pending={pendingRequests.length} approved={approvedRequests.length}
          printing={printingRequests.length} completed={completedRequests.length}
          totalPages={totalPages}
        />

        {showUploadForm && <PrintUploadForm user={user} onClose={() => setShowUploadForm(false)} />}

        {isAdmin && pendingRequests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                בקשות ממתינות לאישור
              </h2>
            </div>
            <div className="p-6 space-y-3">
              {pendingRequests.map(r => (
                <AdminRequestCard key={r.id} request={r} onApprove={(id) => approveMutation.mutate(id)} />
              ))}
            </div>
          </div>
        )}

        {isSecretary && approvedRequests.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <Printer className="h-5 w-5 text-green-500" />
                מאושר להדפסה ({approvedRequests.length})
              </h2>
              {selectedRequests.length > 0 && (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline"
                    onClick={() => updateStatusMutation.mutate({ ids: selectedRequests, status: 'printing' })}>
                    סמן בהדפסה ({selectedRequests.length})
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700"
                    onClick={() => updateStatusMutation.mutate({ ids: selectedRequests, status: 'completed' })}>
                    סמן הושלם ({selectedRequests.length})
                  </Button>
                </div>
              )}
            </div>
            <div className="p-6 space-y-3">
              {approvedRequests.map(r => (
                <SecretaryRequestCard key={r.id} request={r}
                  isSelected={selectedRequests.includes(r.id)} onToggle={() => toggleSelection(r.id)} />
              ))}
            </div>
          </div>
        )}

        {isTeacher && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-blue-900">הבקשות שלי</h2>
            </div>
            <div className="p-6 space-y-3">
              {myPrintRequests.length > 0
                ? myPrintRequests.map(r => <TeacherRequestCard key={r.id} request={r} />)
                : <p className="text-slate-400 text-center py-12">אין בקשות הדפסה</p>}
            </div>
          </div>
        )}

        {/* מעקב צילומים לפי מורה/כיתה/מקצוע — נראה למנהל ומזכירה */}
        {(isAdmin || isSecretary) && printingSummary.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-50">
                <BarChart2 className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-blue-900">מעקב צילומים לפי מורה</h2>
                <p className="text-sm text-slate-400">סה״כ דפים לפי מורה, כיתה ומקצוע</p>
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
                        {/* שורת מורה — לחיץ */}
                        <tr
                          className="border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => setExpandedTeacher(isExpanded ? null : teacherName)}
                        >
                          <td className="p-4 font-bold text-slate-800 flex items-center gap-2">
                            {isExpanded
                              ? <ChevronUp className="h-4 w-4 text-indigo-500" />
                              : <ChevronDown className="h-4 w-4 text-slate-400" />}
                            {teacherName}
                          </td>
                          <td className="p-4 text-slate-400 text-sm" colSpan={2}>
                            {rows.length} שילובי כיתה/מקצוע
                          </td>
                          <td className="p-4 text-left">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                              {data.total} דפים
                            </span>
                          </td>
                        </tr>
                        {/* שורות פירוט */}
                        {isExpanded && rows.map(([key, pages]) => {
                          const [className, subject] = key.split('|');
                          return (
                            <tr key={key} className="border-b border-slate-50 bg-indigo-50/30">
                              <td className="p-3 pr-10 text-slate-400 text-xs"></td>
                              <td className="p-3 text-sm text-slate-700 font-medium">{className}</td>
                              <td className="p-3 text-sm text-slate-700">{subject}</td>
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
                    <td className="p-4 text-left font-bold text-indigo-700">{totalPages} דפים</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
