import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Upload, AlertCircle, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AbsenceReportModal({ isOpen, onClose, user }) {
  const [absenceReason, setAbsenceReason] = useState('sick_child');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [lessonHours, setLessonHours] = useState([]);
  const [certificateFile, setCertificateFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [substituteEmail, setSubstituteEmail] = useState('');
  const [substituteName, setSubstituteName] = useState('');

  const queryClient = useQueryClient();

  const { data: choiceDaysUsed = 0 } = useQuery({
    queryKey: ['choiceDays', user.email, new Date().getFullYear()],
    queryFn: async () => {
      const absences = await base44.entities.Absence.filter({ 
        user_email: user.email, 
        absence_reason: 'choice_day' 
      });
      return absences.length;
    },
  });

  const { data: declarationDaysUsed = 0 } = useQuery({
    queryKey: ['declarationDays', user.email, new Date().getFullYear()],
    queryFn: async () => {
      const absences = await base44.entities.Absence.filter({ 
        user_email: user.email, 
        absence_reason: 'declaration_days' 
      });
      return absences.reduce((sum, a) => sum + (a.declaration_days_used || 0), 0);
    },
  });

  const createAbsence = useMutation({
    mutationFn: async (data) => base44.entities.Absence.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absences'] });
      onClose();
      resetForm();
    },
  });

  const resetForm = () => {
    setAbsenceReason('sick_child');
    setStartDate('');
    setEndDate('');
    setLessonHours([]);
    setCertificateFile(null);
    setSubstituteEmail('');
    setSubstituteName('');
  };

  const addLessonHour = () => {
    setLessonHours([...lessonHours, { date: startDate, hour_number: 1, subject: '', class_name: '' }]);
  };

  const updateLessonHour = (index, field, value) => {
    const updated = [...lessonHours];
    updated[index][field] = value;
    setLessonHours(updated);
  };

  const removeLessonHour = (index) => {
    setLessonHours(lessonHours.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const requiresCertificate = ['sick_child', 'other'].includes(absenceReason);
    
    // Check limits
    if (absenceReason === 'choice_day' && choiceDaysUsed >= 2) {
      alert('ניצלת כבר 2 ימי בחירה השנה');
      return;
    }
    
    if (absenceReason === 'declaration_days' && declarationDaysUsed >= 2) {
      alert('ניצלת כבר 2 ימי הצהרה השנה');
      return;
    }

    let certificateUrl = null;
    if (requiresCertificate && certificateFile) {
      setUploading(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file: certificateFile });
      certificateUrl = file_url;
      setUploading(false);
    }

    const absenceData = {
      user_email: user.email,
      user_name: user.full_name,
      absence_reason: absenceReason,
      start_date: startDate,
      end_date: endDate,
      lesson_hours: lessonHours,
      medical_certificate_required: requiresCertificate,
      medical_certificate_url: certificateUrl,
      substitute_teacher_name: substituteName,
      status: requiresCertificate && !certificateUrl ? 'awaiting_certificate' : 'pending',
      choice_days_used: absenceReason === 'choice_day' ? 1 : 0,
      declaration_days_used: absenceReason === 'declaration_days' ? 2 : 0,
    };

    createAbsence.mutate(absenceData);
  };

  const reasonLabels = {
    sick_child: 'מחלת ילד (נדרש אישור)',
    other: 'אחר (נדרש אישור)',
    choice_day: `יום בחירה (נוצלו ${choiceDaysUsed}/2)`,
    declaration_days: `יומיים הצהרה (נוצלו ${declarationDaysUsed}/2)`,
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-red-600 to-pink-600 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">דיווח היעדרות</h2>
            <p className="text-red-100 text-sm">מלאי את כל הפרטים הנדרשים</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Reason Type */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">סיבת ההיעדרות</label>
            <select
              value={absenceReason}
              onChange={(e) => setAbsenceReason(e.target.value)}
              className="w-full p-3 border border-slate-300 rounded-lg bg-white"
            >
              {Object.entries(reasonLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">תאריך התחלה</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">תאריך סיום</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Lesson Hours */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-bold text-slate-700">היעדרות</label>
              <div className="flex gap-2">
                <Button onClick={() => setLessonHours([{ date: startDate, hour_number: 0, subject: 'כל היום', class_name: '' }])} variant="outline" size="sm">
                  כל היום
                </Button>
                <Button onClick={addLessonHour} variant="outline" size="sm">
                  <Clock className="h-4 w-4 mr-1" />
                  הוסף שעה
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              {lessonHours.map((hour, index) => (
                <div key={index} className="grid grid-cols-5 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <input
                    type="date"
                    value={hour.date}
                    onChange={(e) => updateLessonHour(index, 'date', e.target.value)}
                    className="p-2 border border-slate-300 rounded text-sm"
                  />
                  {hour.subject !== 'כל היום' ? (
                    <>
                      <input
                        type="number"
                        placeholder="שעה"
                        min="1"
                        max="8"
                        value={hour.hour_number}
                        onChange={(e) => updateLessonHour(index, 'hour_number', parseInt(e.target.value))}
                        className="p-2 border border-slate-300 rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="מקצוע"
                        value={hour.subject}
                        onChange={(e) => updateLessonHour(index, 'subject', e.target.value)}
                        className="p-2 border border-slate-300 rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="כיתה"
                        value={hour.class_name}
                        onChange={(e) => updateLessonHour(index, 'class_name', e.target.value)}
                        className="p-2 border border-slate-300 rounded text-sm"
                      />
                    </>
                  ) : (
                    <div className="col-span-3 flex items-center justify-center text-slate-600 font-bold">
                      כל היום
                    </div>
                  )}
                  <button
                    onClick={() => removeLessonHour(index)}
                    className="text-red-600 hover:bg-red-50 rounded p-2 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Substitute Teacher */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <h4 className="font-bold text-purple-900 mb-3">ממלאת מקום</h4>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">שם ממלאת המקום</label>
              <input
                type="text"
                value={substituteName}
                onChange={(e) => setSubstituteName(e.target.value)}
                placeholder="לדוגמה: רחל לוי"
                className="w-full p-2 border border-purple-300 rounded-lg bg-white"
              />
            </div>
          </div>

          {/* Medical Certificate Upload */}
          {['sick_child', 'other', 'declaration_days'].includes(absenceReason) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900">נדרש אישור/מסמך</h4>
                  <p className="text-sm text-amber-700">
                    {absenceReason === 'declaration_days' 
                      ? 'יש לצרף מסמך תומך להצהרה'
                      : 'יש לצרף אישור רפואי. אם לא יצורף, תתקבל התראה יומית ב-8 בבוקר'}
                  </p>
                </div>
              </div>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setCertificateFile(e.target.files[0])}
                className="w-full p-3 border-2 border-dashed border-amber-300 rounded-lg bg-white hover:border-amber-400 transition-colors"
              />
              {certificateFile && (
                <p className="text-sm text-green-600 mt-2 font-medium">✓ {certificateFile.name}</p>
              )}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
            <Button onClick={onClose} variant="outline" className="flex-1">
              ביטול
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!startDate || !endDate || lessonHours.length === 0 || uploading}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
            >
              {uploading ? 'מעלה קובץ...' : 'שלח דיווח'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}