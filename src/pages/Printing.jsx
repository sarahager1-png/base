import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Printer, AlertCircle, Upload } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PrintStats } from '@/components/printing/PrintStats';
import { PrintUploadForm } from '@/components/printing/PrintUploadForm';
import { AdminRequestCard, SecretaryRequestCard, TeacherRequestCard } from '@/components/printing/PrintRequestCard';

export default function PrintingPage() {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({ queryKey: ['user'], queryFn: () => base44.auth.me() });

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

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <PageHeader
          icon={Printer}
          iconColor="#6366f1"
          iconColor2="#4f46e5"
          title="מרכז צילומים והדפסות"
          subtitle={isSecretary ? 'ניהול תור ההדפסות' : isAdmin ? 'אישור בקשות הדפסה' : `סה״כ צילמת: ${myTotalPages} דפים`}
          actions={isTeacher && (
            <Button onClick={() => setShowUploadForm(true)} className="bg-indigo-500 hover:bg-indigo-400 text-white text-sm">
              <Upload className="h-4 w-4 ml-1" />בקשת צילום חדשה
            </Button>
          )}
        />

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
      </div>
    </div>
  );
}
