import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock, Briefcase, Upload, AlertCircle, Edit2, CheckCircle, XCircle } from 'lucide-react';

export default function SubstituteDashboard({ user }) {
  const [isFirstTime, setIsFirstTime] = useState(null); // null = לא שאלנו עדיין, true/false = תשובה
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

  const uploadFile = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      return file_url;
    },
  });

  const createDocument = useMutation({
    mutationFn: (data) => base44.entities.OnboardingDocument.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });

  const updateName = useMutation({
    mutationFn: (name) => base44.auth.updateMe({ full_name: name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      setEditingName(false);
    },
  });

  const handleFileUpload = async (docType, file) => {
    const fileUrl = await uploadFile.mutateAsync(file);
    await createDocument.mutateAsync({
      user_email: user.email,
      user_name: user.full_name,
      document_type: docType,
      file_url: fileUrl,
      is_additional_work: docType === 'tax_coordination' ? isAdditionalWork : false,
    });
    setUploadedFiles({ ...uploadedFiles, [docType]: fileUrl });
  };

  // שאלה ראשונית - האם זו פעם ראשונה?
  if (isFirstTime === null) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in py-8">
        <div className="bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 text-center">
            <h2 className="text-3xl font-bold mb-2">שלום, {user.full_name}!</h2>
            <p className="text-amber-100 text-lg">ממלאת מקום - מערכת BASE</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 text-center">
          <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-slate-800 mb-4">האם זו הפעם הראשונה שלך כממלאת מקום?</h3>
          <p className="text-slate-600 mb-8">אם כן, נצטרך להשלים טפסי קליטה לפני שתוכלי להתחיל לדווח שעות</p>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setIsFirstTime(true)}
              className="py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg"
            >
              כן, פעם ראשונה
            </button>
            <button
              onClick={() => setIsFirstTime(false)}
              className="py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg"
            >
              לא, כבר עבדתי
            </button>
          </div>
        </div>
      </div>
    );
  }

  // תהליך קליטה - טפסים
  if (isFirstTime === true) {
    const allDocsApproved = myDocuments.length >= 3 && myDocuments.every(doc => doc.status === 'approved');
    const hasPendingDocs = myDocuments.some(doc => doc.status === 'pending');
    const hasRejectedDocs = myDocuments.some(doc => doc.status === 'rejected');

    const requiredDocs = [
      { type: 'id_card', label: 'צילום תעודת זהות', icon: '🆔' },
      { type: 'form_101', label: 'טופס 101', icon: '📋' },
      { type: 'bank_details', label: 'פרטי בנק', icon: '🏦' },
    ];

    if (isAdditionalWork) {
      requiredDocs.push({ type: 'tax_coordination', label: 'תאום מס', icon: '💼' });
    }

    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in py-6">
        <div className="bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">קליטת ממלאת מקום - {user.full_name}</h2>
            <p className="text-amber-100">נא להעלות את כל המסמכים הנדרשים</p>
          </div>
        </div>

        {hasPendingDocs && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600" />
            <span className="text-amber-800 font-medium">הטפסים שלך ממתינים לאישור מנהלת/מזכירה</span>
          </div>
        )}

        {hasRejectedDocs && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <XCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800 font-medium">חלק מהטפסים נדחו - נא לעדכן ולהעלות מחדש</span>
          </div>
        )}

        {allDocsApproved && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <span className="text-green-800 font-bold block">כל הטפסים אושרו! 🎉</span>
              <span className="text-green-700 text-sm">כעת ניתן להתחיל לדווח שעות</span>
            </div>
            <button
              onClick={() => setIsFirstTime(false)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
            >
              למעבר לדיווח
            </button>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={isAdditionalWork}
              onChange={(e) => setIsAdditionalWork(e.target.checked)}
              className="w-4 h-4"
            />
            <label className="text-sm font-medium text-slate-700">זו עבודה נוספת (נדרש תאום מס)</label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requiredDocs.map(doc => {
              const uploaded = myDocuments.find(d => d.document_type === doc.type);
              return (
                <div key={doc.type} className="border-2 border-slate-200 rounded-xl p-6">
                  <div className="text-center mb-4">
                    <div className="text-4xl mb-2">{doc.icon}</div>
                    <p className="font-bold text-slate-800">{doc.label}</p>
                    {uploaded && (
                      <span className={`text-xs px-2 py-1 rounded-full inline-block mt-2 ${
                        uploaded.status === 'approved' ? 'bg-green-100 text-green-700' :
                        uploaded.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {uploaded.status === 'approved' ? '✓ אושר' :
                         uploaded.status === 'rejected' ? '✗ נדחה' : '⏳ ממתין'}
                      </span>
                    )}
                  </div>
                  <label className="block">
                    <input
                      type="file"
                      className="hidden"
                      accept="application/pdf,image/*"
                      onChange={(e) => handleFileUpload(doc.type, e.target.files[0])}
                      disabled={uploaded?.status === 'approved'}
                    />
                    <div className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                      uploaded?.status === 'approved' 
                        ? 'bg-green-50 border-green-300' 
                        : 'bg-blue-50 border-blue-300 hover:bg-blue-100'
                    }`}>
                      <Upload className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                      <p className="text-xs text-blue-700 font-medium">
                        {uploaded?.status === 'approved' ? 'הועלה ואושר' : 'לחצי להעלאה'}
                      </p>
                    </div>
                  </label>
                </div>
              );
            })}
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-bold mb-1">💡 חשוב לדעת:</p>
            <ul className="space-y-1 text-xs">
              <li>• הטפסים יועברו למנהלת/מזכירה לאישור</li>
              <li>• לאחר אישור ניתן יהיה לשלוח אותם לגזברות משרד החינוך</li>
              <li>• דיווח שעות יתאפשר רק לאחר אישור כל הטפסים</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // דשבורד רגיל - דיווח שעות
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with name edit */}
      <div className="bg-gradient-to-br from-orange-600 via-amber-600 to-yellow-600 rounded-2xl p-6 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          {editingName ? (
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg text-slate-800 font-bold"
                placeholder="שם מלא"
              />
              <button
                onClick={() => updateName.mutate(newName)}
                className="px-4 py-2 bg-white text-amber-600 rounded-lg font-bold hover:bg-amber-50"
              >
                שמור
              </button>
              <button
                onClick={() => setEditingName(false)}
                className="px-4 py-2 bg-white/20 text-white rounded-lg font-bold hover:bg-white/30"
              >
                ביטול
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">שלום, {user.full_name}!</h2>
                <p className="text-amber-100">ממלאת מקום - מערכת BASE</p>
              </div>
              <button
                onClick={() => setEditingName(true)}
                className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
              >
                <Edit2 className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            דיווח מילוי מקום
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">תאריך</label>
                <input type="date" className="w-full p-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">שעות</label>
                <select className="w-full p-2 border border-slate-300 rounded-lg">
                  <option>שעה 1 (08:00-08:45)</option>
                  <option>שעה 2 (08:45-09:30)</option>
                  <option>יום מלא</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1 block">במקום מי?</label>
              <select className="w-full p-2 border border-slate-300 rounded-lg">
                <option>בחרי מורה...</option>
                <option>חנה מורה</option>
                <option>שרה רכזת</option>
              </select>
            </div>
            <button className="w-full py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-sm">
              שלחי דיווח
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-blue-500" />
            קריאות פתוחות לשיבוץ
          </h3>
          <div className="space-y-3">
            {openRequests.length > 0 ? (
              openRequests.map(req => (
                <div key={req.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center group hover:border-blue-300 transition-colors">
                  <div>
                    <p className="font-bold text-slate-800">{req.date} | {req.hours_count} שעות</p>
                    <p className="text-sm text-slate-600">כיתה {req.class_name} - {req.subject}</p>
                    <p className="text-xs text-slate-400">במקום: {req.original_teacher}</p>
                  </div>
                  <button className="px-4 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-600 hover:text-white transition-colors">
                    אני רוצה
                  </button>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-8">אין קריאות פתוחות כרגע</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}