import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import { Clock, Briefcase, Upload, AlertCircle, Edit2, CheckCircle, XCircle, HelpCircle } from 'lucide-react';

export default function SubstituteDashboard({ user }) {
  const [isFirstTime, setIsFirstTime] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [isAdditionalWork, setIsAdditionalWork] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user.full_name || '');
  const queryClient = useQueryClient();

  const { data: openRequests = [] } = useQuery({
    queryKey: ['substitutes', 'open'],
    queryFn: () => base44.entities.SubstituteReport.filter({ status: 'reported' }),
    enabled: isFirstTime === false,
  });
  const { data: myDocuments = [] } = useQuery({
    queryKey: ['onboarding', user.email],
    queryFn: () => base44.entities.OnboardingDocument.filter({ user_email: user.email }),
    enabled: isFirstTime === true,
  });

  const uploadFile    = useMutation({ mutationFn: async (file) => { const { file_url } = await base44.integrations.Core.UploadFile({ file }); return file_url; } });
  const createDocument= useMutation({ mutationFn: (data) => base44.entities.OnboardingDocument.create(data), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['onboarding'] }) });
  const updateName    = useMutation({ mutationFn: (name) => base44.auth.updateMe({ full_name: name }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['user'] }); setEditingName(false); } });

  const handleFileUpload = async (docType, file) => {
    const fileUrl = await uploadFile.mutateAsync(file);
    await createDocument.mutateAsync({ user_email: user.email, user_name: user.full_name, document_type: docType, file_url: fileUrl, is_additional_work: docType === 'tax_coordination' ? isAdditionalWork : false });
    setUploadedFiles({ ...uploadedFiles, [docType]: fileUrl });
  };

  /* ── First-time question ── */
  if (isFirstTime === null) {
    return (
      <div className="max-w-lg mx-auto space-y-5 animate-fade-in py-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-5">
            <HelpCircle className="h-7 w-7 text-white" />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">שלום, {user.full_name}!</h2>
          <p className="text-slate-500 text-sm mb-1 font-medium">ממלאת מקום — Smart Base</p>
          <p className="text-slate-400 text-sm mb-8">האם זו הפעם הראשונה שלך כממלאת מקום?</p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setIsFirstTime(true)}
              className="py-3 rounded-xl font-bold text-sm bg-slate-900 text-white hover:bg-slate-700 transition-colors">
              כן, פעם ראשונה
            </button>
            <button onClick={() => setIsFirstTime(false)}
              className="py-3 rounded-xl font-bold text-sm border-2 border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">
              לא, כבר עבדתי
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-slate-400">אם כן, נצטרך להשלים טפסי קליטה לפני דיווח שעות</p>
      </div>
    );
  }

  /* ── Onboarding flow ── */
  if (isFirstTime === true) {
    const allDocsApproved = myDocuments.length >= 3 && myDocuments.every(d => d.status === 'approved');
    const hasPendingDocs  = myDocuments.some(d => d.status === 'pending');
    const hasRejectedDocs = myDocuments.some(d => d.status === 'rejected');

    const requiredDocs = [
      { type: 'id_card',      label: 'תעודת זהות', icon: '🆔' },
      { type: 'form_101',     label: 'טופס 101',   icon: '📋' },
      { type: 'bank_details', label: 'פרטי בנק',   icon: '🏦' },
    ];
    if (isAdditionalWork) requiredDocs.push({ type: 'tax_coordination', label: 'תאום מס', icon: '💼' });

    return (
      <div className="max-w-3xl mx-auto space-y-5 animate-fade-in py-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-base font-bold text-slate-800 mb-0.5">קליטת ממלאת מקום</h2>
          <p className="text-sm text-slate-400">{user.full_name} — נא להעלות את כל המסמכים הנדרשים</p>
        </div>

        {/* Status banners */}
        {hasPendingDocs && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-amber-200 bg-amber-50">
            <Clock className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm font-medium text-amber-800">הטפסים שלך ממתינים לאישור מנהלת / מזכירה</p>
          </div>
        )}
        {hasRejectedDocs && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 bg-red-50">
            <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm font-medium text-red-700">חלק מהטפסים נדחו — נא לעדכן ולהעלות מחדש</p>
          </div>
        )}
        {allDocsApproved && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-200 bg-emerald-50">
            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-emerald-800">כל הטפסים אושרו!</p>
              <p className="text-xs text-emerald-600">כעת ניתן להתחיל לדווח שעות</p>
            </div>
            <button onClick={() => setIsFirstTime(false)}
              className="text-sm font-bold px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">
              לדיווח
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={isAdditionalWork} onChange={e => setIsAdditionalWork(e.target.checked)} className="w-4 h-4 rounded" />
              <span className="text-sm font-medium text-slate-700">זו עבודה נוספת (נדרש תאום מס)</span>
            </label>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {requiredDocs.map(doc => {
              const uploaded = myDocuments.find(d => d.document_type === doc.type);
              const approved = uploaded?.status === 'approved';
              return (
                <div key={doc.type} className={`rounded-2xl border-2 p-5 ${approved ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl">{doc.icon}</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-800">{doc.label}</p>
                      {uploaded && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                          approved ? 'bg-emerald-100 text-emerald-700' :
                          uploaded.status === 'rejected' ? 'bg-red-100 text-red-600' :
                          'bg-amber-100 text-amber-700'}`}>
                          {approved ? '✓ אושר' : uploaded.status === 'rejected' ? '✗ נדחה' : '⏳ ממתין'}
                        </span>
                      )}
                    </div>
                  </div>
                  <label className="block cursor-pointer">
                    <input type="file" className="hidden" accept="application/pdf,image/*"
                      onChange={e => handleFileUpload(doc.type, e.target.files[0])} disabled={approved} />
                    <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${approved ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'}`}>
                      <Upload className={`h-5 w-5 mx-auto mb-1.5 ${approved ? 'text-emerald-400' : 'text-slate-400'}`} />
                      <p className="text-xs font-medium text-slate-500">{approved ? 'הועלה ואושר' : 'לחצי להעלאה'}</p>
                    </div>
                  </label>
                </div>
              );
            })}
          </div>
          <div className="mx-5 mb-5 p-4 rounded-xl bg-blue-50 border border-blue-100">
            <p className="text-xs font-bold text-blue-700 mb-1.5">חשוב לדעת:</p>
            <ul className="space-y-1 text-xs text-blue-600">
              <li>· הטפסים יועברו למנהלת/מזכירה לאישור</li>
              <li>· לאחר אישור ניתן יהיה לשלוח לגזברות משרד החינוך</li>
              <li>· דיווח שעות יתאפשר רק לאחר אישור כל הטפסים</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  /* ── Regular dashboard ── */
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Name card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        {editingName ? (
          <div className="flex items-center gap-3">
            <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            <button onClick={() => updateName.mutate(newName)}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors">שמור</button>
            <button onClick={() => setEditingName(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">ביטול</button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-base flex-shrink-0">
                {user.full_name?.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{user.full_name}</p>
                <p className="text-xs text-slate-400">ממלאת מקום — Smart Base</p>
              </div>
            </div>
            <button onClick={() => setEditingName(true)}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <Edit2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Report form */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
            <div className="h-7 w-7 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
              <Clock className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">דיווח מילוי מקום</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">תאריך</label>
                <input type="date" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">שעות</label>
                <select className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                  <option>שעה 1 (08:00–08:45)</option>
                  <option>שעה 2 (08:45–09:30)</option>
                  <option>יום מלא</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1.5 block">במקום מי?</label>
              <select className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100">
                <option>בחרי מורה...</option>
                <option>חנה מורה</option>
                <option>שרה רכזת</option>
              </select>
            </div>
            <button className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-700 transition-colors">
              שלחי דיווח
            </button>
          </div>
        </div>

        {/* Open requests */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100">
            <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Briefcase className="h-3.5 w-3.5 text-white" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">קריאות פתוחות לשיבוץ</h3>
            {openRequests.length > 0 && (
              <span className="mr-auto text-[10px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded-full">{openRequests.length}</span>
            )}
          </div>
          <div className="p-4 space-y-2.5">
            {openRequests.length > 0 ? openRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
                <div>
                  <p className="text-[13px] font-bold text-slate-700">{req.date} · {req.hours_count} שעות</p>
                  <p className="text-[11px] text-slate-500">כיתה {req.class_name} — {req.subject}</p>
                  <p className="text-[10px] text-slate-400">במקום: {req.original_teacher}</p>
                </div>
                <button className="text-[11px] font-bold px-3 py-1.5 rounded-lg border-2 border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white transition-all">
                  אני רוצה
                </button>
              </div>
            )) : (
              <div className="flex items-center justify-center py-10 text-slate-400">
                <p className="text-sm font-medium">אין קריאות פתוחות כרגע</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
