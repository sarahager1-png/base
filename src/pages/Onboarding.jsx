import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { UserPlus, FileText, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

export default function OnboardingPage() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

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

  const docTypeLabels = {
    id_card: 'תעודת זהות',
    form_101: 'טופס 101',
    bank_details: 'פרטי בנק',
    other: 'אחר'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">טפסי קליטה ומסמכים</h1>
          <p className="text-slate-600">
            {isManager ? 'ניהול מסמכי קליטה לעובדים חדשים' : 'המסמכים שלי'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-full">
                <Clock className="h-6 w-6 text-amber-600" />
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
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="h-6 w-6 text-red-600" />
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
              <div className="p-3 bg-purple-100 rounded-full">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">סה״כ מסמכים</p>
                <p className="text-2xl font-bold text-slate-800">{displayDocs.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-500" />
              מסמכים
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {displayDocs.length > 0 ? (
                displayDocs.map(doc => (
                  <div key={doc.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-purple-200 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {isManager && (
                          <p className="font-bold text-slate-800 mb-1">{doc.user_name}</p>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-purple-500" />
                          <span className="text-sm font-medium text-slate-700">
                            {docTypeLabels[doc.document_type] || doc.document_type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          הועלה: {new Date(doc.created_date).toLocaleDateString('he-IL')}
                        </p>
                        {doc.reviewed_by && (
                          <p className="text-xs text-slate-500 mt-1">
                            נבדק ע״י: {doc.reviewed_by}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          doc.status === 'approved' ? 'bg-green-100 text-green-700' :
                          doc.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {doc.status === 'approved' ? 'מאושר' :
                           doc.status === 'rejected' ? 'נדחה' : 'ממתין'}
                        </div>
                        <a 
                          href={doc.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                        >
                          צפה במסמך
                        </a>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-12">אין מסמכים</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}