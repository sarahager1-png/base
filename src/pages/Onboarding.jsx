import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import { UserPlus, FileText, CheckCircle, XCircle, Clock, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { getStatusBadgeClass } from '@/lib/utils';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import { useApprovalSettings } from '@/hooks/useApprovalSettings';

export default function OnboardingPage() {
  const { user } = useAuth();

  const { data: allDocs = [] } = useQuery({
    queryKey: ['onboarding'],
    queryFn: () => base44.entities.OnboardingDocument.list('-created_date'),
    enabled: !!user && ['admin', 'vice_principal'].includes(user.role),
  });

  const { data: myDocs = [] } = useQuery({
    queryKey: ['myOnboarding', user?.email],
    queryFn: () => base44.entities.OnboardingDocument.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user,
  });

  const isManager = user && ['admin', 'vice_principal'].includes(user.role);
  const displayDocs = isManager ? allDocs : myDocs;
  const { require_onboarding_approval } = useApprovalSettings();

  const qc = useQueryClient();
  const [expandedHistories, setExpandedHistories] = useState({});
  const toggleHistory = (email) => setExpandedHistories(p => ({ ...p, [email]: !p[email] }));

  const docTypeLabels = {
    id_card: 'תעודת זהות',
    form_101: 'טופס 101',
    bank_details: 'פרטי בנק',
    tax_coordination: 'תיאום מס',
    other: 'אחר',
  };

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, documentType }) => {
      const res = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.OnboardingDocument.create({
        user_email: user.email,
        user_name: user.full_name,
        document_type: documentType,
        file_url: res.file_url,
        file_name: file.name,
        status: require_onboarding_approval ? 'pending' : 'approved',
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myOnboarding', user?.email] });
      toast.success('המסמך הועלה בהצלחה — ממתין לאישור');
    },
    onError: () => toast.error('שגיאה בהעלאת המסמך'),
  });

  const approveMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.OnboardingDocument.update(id, {
      status, reviewed_by: user.full_name, reviewed_at: new Date().toISOString(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding'] });
      toast.success('הסטטוס עודכן');
    },
    onError: () => toast.error('שגיאה בעדכון'),
  });

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-2">טפסי קליטה ומסמכים</h1>
          <p className="text-slate-600">
            {isManager ? 'ניהול מסמכי קליטה לעובדים חדשים' : 'המסמכים שלי'}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-700" />
              </div>
              <div>
                <p className="text-sm text-slate-500">ממתינים</p>
                <p className="text-2xl font-bold text-slate-800">
                  {displayDocs.filter(d => d.status === 'pending').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">מאושרים</p>
                <p className="text-2xl font-bold text-slate-800">
                  {displayDocs.filter(d => d.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-full">
                <XCircle className="h-6 w-6 text-yellow-700" />
              </div>
              <div>
                <p className="text-sm text-slate-500">נדחו</p>
                <p className="text-2xl font-bold text-slate-800">
                  {displayDocs.filter(d => d.status === 'rejected').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-full">
                <FileText className="h-6 w-6 text-yellow-700" />
              </div>
              <div>
                <p className="text-sm text-slate-500">סה״כ מסמכים</p>
                <p className="text-2xl font-bold text-slate-800">{displayDocs.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload panel for non-managers */}
        {!isManager && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
              <Upload className="h-5 w-5 text-blue-600" />העלאת מסמך חדש
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(docTypeLabels).filter(([k]) => k !== 'other').map(([type, label]) => {
                const latest = [...myDocs].filter(d => d.document_type === type)
                  .sort((a, b) => (b.created_date || '').localeCompare(a.created_date || ''))[0];
                const isApproved = latest?.status === 'approved';
                return (
                  <label key={type} className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors
                    ${isApproved ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50'}`}>
                    <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadMutation.mutate({ file: f, documentType: type }); e.target.value = ''; }} />
                    <FileText className={`h-6 w-6 ${isApproved ? 'text-green-500' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-slate-700 text-center">{label}</span>
                    {isApproved && <span className="text-[10px] text-green-600 font-bold">✓ מאושר</span>}
                    {latest?.status === 'pending' && <span className="text-[10px] text-yellow-600 font-bold">ממתין לאישור</span>}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-yellow-600" />
              מסמכים
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {displayDocs.length > 0 ? (() => {
                // Group by employee for manager view to show 101 history
                if (isManager) {
                  const byEmployee = {};
                  displayDocs.forEach(d => {
                    const key = d.user_email || d.user_name || 'unknown';
                    if (!byEmployee[key]) byEmployee[key] = { name: d.user_name, docs: [] };
                    byEmployee[key].docs.push(d);
                  });
                  return Object.entries(byEmployee).map(([email, { name, docs }]) => {
                    const form101s = docs.filter(d => d.document_type === 'form_101').sort((a, b) => (b.created_date||'').localeCompare(a.created_date||''));
                    const otherDocs = docs.filter(d => d.document_type !== 'form_101');
                    return (
                      <div key={email} className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
                          <p className="font-bold text-slate-800">{name}</p>
                        </div>
                        <div className="p-3 space-y-2">
                          {otherDocs.map(doc => (
                            <DocRow key={doc.id} doc={doc} docTypeLabels={docTypeLabels} isManager={isManager} approveMutation={approveMutation} />
                          ))}
                          {form101s.length > 0 && (
                            <div>
                              <DocRow doc={form101s[0]} docTypeLabels={docTypeLabels} isManager={isManager} approveMutation={approveMutation}
                                badge={<span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">נוכחי</span>} />
                              {form101s.length > 1 && (
                                <div>
                                  <button onClick={() => toggleHistory(email)}
                                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mt-1 px-2">
                                    {expandedHistories[email] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                    היסטוריית טפסי 101 ({form101s.length - 1})
                                  </button>
                                  {expandedHistories[email] && form101s.slice(1).map(doc => (
                                    <DocRow key={doc.id} doc={doc} docTypeLabels={docTypeLabels} isManager={isManager} approveMutation={approveMutation}
                                      badge={<span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">{doc.created_date?.slice(0,4)}</span>} />
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  });
                }
                // Non-manager: group form_101 by year
                const form101s = displayDocs.filter(d => d.document_type === 'form_101').sort((a, b) => (b.created_date||'').localeCompare(a.created_date||''));
                const otherDocs = displayDocs.filter(d => d.document_type !== 'form_101');
                return (
                  <>
                    {otherDocs.map(doc => (
                      <DocRow key={doc.id} doc={doc} docTypeLabels={docTypeLabels} isManager={isManager} approveMutation={approveMutation} />
                    ))}
                    {form101s.map(doc => (
                      <DocRow key={doc.id} doc={doc} docTypeLabels={docTypeLabels} isManager={isManager} approveMutation={approveMutation} />
                    ))}
                  </>
                );
              })() : (
                <p className="text-slate-400 text-center py-12">אין מסמכים</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocRow({ doc, docTypeLabels, isManager, approveMutation, badge }) {
  const sb = getStatusBadgeClass(doc.status);
  return (
    <div className="p-3 rounded-xl border transition-colors bg-slate-50 border-slate-200 hover:border-yellow-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {isManager && <p className="font-bold text-slate-800 text-sm mb-0.5">{doc.user_name}</p>}
          <div className="flex items-center gap-2 flex-wrap">
            <FileText className="h-3.5 w-3.5 text-yellow-600 flex-shrink-0" />
            <span className="text-sm font-medium text-slate-700">{docTypeLabels[doc.document_type] || doc.document_type}</span>
            {badge}
          </div>
          <p className="text-xs text-slate-400 mt-1">הועלה: {doc.created_date ? new Date(doc.created_date).toLocaleDateString('he-IL') : '—'}</p>
          {doc.reviewed_by && <p className="text-xs text-slate-500">נבדק ע״י: {doc.reviewed_by}</p>}
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${sb.badgeClass}`}>{sb.label}</span>
          {doc.file_url && (
            <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">צפייה</a>
          )}
          {isManager && doc.status === 'pending' && (
            <div className="flex gap-1">
              <button onClick={() => approveMutation.mutate({ id: doc.id, status: 'approved' })}
                className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold hover:bg-green-200">אשר</button>
              <button onClick={() => approveMutation.mutate({ id: doc.id, status: 'rejected' })}
                className="px-2 py-0.5 bg-red-100 text-red-600 rounded text-xs font-bold hover:bg-red-200">דחה</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}