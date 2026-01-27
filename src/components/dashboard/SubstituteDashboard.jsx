import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock, Briefcase, Upload } from 'lucide-react';

export default function SubstituteDashboard({ user }) {
  const [onboardingStep, setOnboardingStep] = useState(user.is_new ? 1 : 0);
  const queryClient = useQueryClient();

  const { data: openRequests = [] } = useQuery({
    queryKey: ['substitutes', 'open'],
    queryFn: () => base44.entities.SubstituteReport.filter({ status: 'reported' }),
    enabled: onboardingStep === 0,
  });

  const completeOnboarding = useMutation({
    mutationFn: () => base44.auth.updateMe({ is_new: false, onboarding_status: 'approved' }),
    onSuccess: () => {
      setOnboardingStep(0);
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });

  if (onboardingStep > 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-fade-in py-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-blue-900 mb-2">ברוכה הבאה ל-BASE!</h2>
          <p className="text-slate-500">לפני שנוכל להתחיל, עלייך להשלים את תהליך הקליטה הדיגיטלי.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2 text-blue-600 font-bold">
              <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">1</span>
              פרטים אישיים
            </div>
            <div className="h-1 flex-1 bg-slate-100 mx-4"></div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200">2</span>
              טופס 101
            </div>
            <div className="h-1 flex-1 bg-slate-100 mx-4"></div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-200">3</span>
              פרטי בנק
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-2 border-dashed border-blue-200 bg-blue-50 rounded-xl p-8 text-center cursor-pointer hover:bg-blue-100 transition-colors">
              <Upload className="h-10 w-10 text-blue-400 mx-auto mb-3" />
              <p className="font-bold text-blue-900">העלי צילום תעודת זהות</p>
              <p className="text-xs text-blue-600">כולל ספח פתוח</p>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg text-sm text-slate-600 border border-slate-200">
              <p className="font-bold mb-1">הנחיות:</p>
              לאחר העלאת הקבצים, הנתונים יעברו לאישור סגנית המנהלת. רק לאחר האישור תוכלי להתחיל לדווח שעות במערכת.
            </div>

            <button 
              onClick={() => completeOnboarding.mutate()}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
            >
              שלחי לאישור והמשיכי
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
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