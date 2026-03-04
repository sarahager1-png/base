import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock, Calendar, CheckCircle, XCircle, AlertCircle, Users, FileText, Plus, X } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { toast } from 'sonner';

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState('absences');
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [showSubstituteForm, setShowSubstituteForm] = useState(false);
  const [absenceForm, setAbsenceForm] = useState({ absence_reason: 'sick_child', start_date: '', end_date: '', notes: '' });
  const [subForm, setSubForm] = useState({ date: '', hours_count: 1, original_teacher: '', class_name: '', subject: '' });
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: allAbsences = [] } = useQuery({
    queryKey: ['absences'],
    queryFn: () => base44.entities.Absence.list('-created_date'),
    enabled: !!user && ['admin', 'vice_principal', 'secretary'].includes(user.role),
  });

  const { data: myAbsences = [] } = useQuery({
    queryKey: ['myAbsences', user?.email],
    queryFn: () => base44.entities.Absence.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user,
  });

  const { data: allSubstitutes = [] } = useQuery({
    queryKey: ['substitutes'],
    queryFn: () => base44.entities.SubstituteReport.list('-created_date'),
    enabled: !!user && ['admin', 'vice_principal', 'secretary'].includes(user.role),
  });

  const { data: mySubstitutes = [] } = useQuery({
    queryKey: ['mySubstitutes', user?.email],
    queryFn: () => base44.entities.SubstituteReport.filter({ reporter_email: user.email }, '-created_date'),
    enabled: !!user,
  });

  const queryClient = useQueryClient();

  const createAbsenceMutation = useMutation({
    mutationFn: (data) => base44.entities.Absence.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAbsences'] });
      queryClient.invalidateQueries({ queryKey: ['absences'] });
      setShowAbsenceForm(false);
      setAbsenceForm({ absence_reason: 'sick_child', start_date: '', end_date: '', notes: '' });
      toast.success('דיווח ההיעדרות נשלח');
    },
    onError: () => toast.error('שגיאה בשליחת הדיווח'),
  });

  const createSubMutation = useMutation({
    mutationFn: (data) => base44.entities.SubstituteReport.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mySubstitutes'] });
      queryClient.invalidateQueries({ queryKey: ['substitutes'] });
      setShowSubstituteForm(false);
      setSubForm({ date: '', hours_count: 1, original_teacher: '', class_name: '', subject: '' });
      toast.success('דיווח מילוי המקום נשלח');
    },
    onError: () => toast.error('שגיאה בשליחת הדיווח'),
  });

  useEffect(() => {
    const unsubAbsence = base44.entities.Absence.subscribe((event) => {
      if (['create', 'update', 'delete'].includes(event.type)) {
        queryClient.invalidateQueries({ queryKey: ['absences'] });
        queryClient.invalidateQueries({ queryKey: ['myAbsences'] });
      }
    });
    const unsubSubstitute = base44.entities.SubstituteReport.subscribe((event) => {
      if (['create', 'update', 'delete'].includes(event.type)) {
        queryClient.invalidateQueries({ queryKey: ['substitutes'] });
        queryClient.invalidateQueries({ queryKey: ['mySubstitutes'] });
      }
    });
    return () => { unsubAbsence(); unsubSubstitute(); };
  }, [queryClient]);

  const isManager = user && ['admin', 'vice_principal', 'secretary'].includes(user.role);
  const displayAbsences = isManager ? allAbsences : myAbsences;
  const displaySubstitutes = isManager ? allSubstitutes : mySubstitutes;

  const absenceStatusConfig = {
    pending: { icon: Clock, badgeClass: 'bg-amber-100 text-amber-700', iconClass: 'text-amber-600', labelClass: 'text-amber-700', label: 'ממתין' },
    approved: { icon: CheckCircle, badgeClass: 'bg-green-100 text-green-700', iconClass: 'text-green-600', labelClass: 'text-green-700', label: 'מאושר' },
    rejected: { icon: XCircle, badgeClass: 'bg-red-100 text-red-700', iconClass: 'text-red-600', labelClass: 'text-red-700', label: 'נדחה' },
    awaiting_certificate: { icon: AlertCircle, badgeClass: 'bg-orange-100 text-orange-700', iconClass: 'text-orange-600', labelClass: 'text-orange-700', label: 'ממתין לאישור רפואי' }
  };

  const substituteStatusConfig = {
    reported: { icon: Clock, iconClass: 'text-blue-600', labelClass: 'text-blue-700', label: 'דווח' },
    approved: { icon: CheckCircle, iconClass: 'text-green-600', labelClass: 'text-green-700', label: 'מאושר' },
    paid: { icon: CheckCircle, iconClass: 'text-purple-600', labelClass: 'text-purple-700', label: 'שולם' }
  };

  const reasonLabels = {
    sick_child: 'ילד חולה',
    choice_day: 'יום בחירה',
    declaration_days: 'יום הצהרה',
    other: 'אחר'
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in" dir="rtl">
      <PageHeader
        icon={Clock}
        iconColor="#ef4444"
        iconColor2="#dc2626"
        title="היעדרויות ודיווח"
        subtitle={isManager ? 'צפייה וניהול כל דיווחי ההיעדרות ומילויי המקום' : 'דיווחי ההיעדרות ומילויי המקום שלי'}
        actions={!isManager && (
          <div className="flex gap-2">
            <button onClick={() => { setActiveTab('absences'); setShowAbsenceForm(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
              <Plus className="h-3.5 w-3.5" />דווח היעדרות
            </button>
            <button onClick={() => { setActiveTab('substitutes'); setShowSubstituteForm(true); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all"
                    style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
              <Plus className="h-3.5 w-3.5" />דווח מילוי מקום
            </button>
          </div>
        )}
      />

      {/* Tabs */}
      <div className="mb-6 flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex-wrap">
        <button
          onClick={() => setActiveTab('absences')}
          className={`flex-1 min-w-fit flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold transition-all text-sm ${
            activeTab === 'absences' 
              ? 'bg-slate-800 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Clock className="h-4 w-4" />
          היעדרויות
        </button>
        <button
          onClick={() => setActiveTab('substitutes')}
          className={`flex-1 min-w-fit flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold transition-all text-sm ${
            activeTab === 'substitutes' 
              ? 'bg-slate-800 text-white shadow-sm' 
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Users className="h-4 w-4" />
          מילויי מקום
        </button>
        {isManager && (
          <button
            onClick={() => setActiveTab('statistics')}
            className={`flex-1 min-w-fit flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold transition-all text-sm ${
              activeTab === 'statistics' 
                ? 'bg-slate-800 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText className="h-4 w-4" />
            סטטיסטיקה
          </button>
        )}
      </div>

      {activeTab === 'absences' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-2 md:p-3 bg-amber-100 rounded-full">
                  <Clock className="h-5 w-5 md:h-6 md:w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">ממתינים</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {displayAbsences.filter(a => a.status === 'pending').length}
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
                    {displayAbsences.filter(a => a.status === 'approved').length}
                  </p>
                </div>
              </div>
            </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-full">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">נדחו</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {displayAbsences.filter(a => a.status === 'rejected').length}
                  </p>
                </div>
              </div>
            </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-full">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">ממתינים לאישור</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {displayAbsences.filter(a => a.status === 'awaiting_certificate').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      {activeTab === 'substitutes' && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">דווחו</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {displaySubstitutes.filter(s => s.status === 'reported').length}
                  </p>
                </div>
              </div>
            </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">מאושרים</p>
                <p className="text-2xl font-bold text-slate-800">
                  {displaySubstitutes.filter(s => s.status === 'approved').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">שולמו</p>
                  <p className="text-2xl font-bold text-slate-800">
                    {displaySubstitutes.filter(s => s.status === 'paid').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

      {activeTab === 'absences' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-4 md:p-6 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
              רשימת היעדרויות
            </h2>
          </div>
            <div className="p-6">
              <div className="space-y-3">
                {displayAbsences.length > 0 ? (
                  displayAbsences.map(absence => {
                    const config = absenceStatusConfig[absence.status] || absenceStatusConfig.pending;
                    const StatusIcon = config.icon;
                    
                    return (
                      <div key={absence.id} className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-200 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {isManager && (
                              <p className="font-bold text-slate-800">{absence.user_name}</p>
                            )}
                            <div className={`px-3 py-1 rounded-full text-xs font-bold ${config.badgeClass}`}>
                              {reasonLabels[absence.absence_reason] || absence.absence_reason}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {absence.start_date} - {absence.end_date}
                            </span>
                            <span>{absence.lesson_hours?.length || 0} שעות שיעור</span>
                          </div>
                          {absence.notes && (
                            <p className="text-sm text-slate-500 mt-2">{absence.notes}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`h-5 w-5 ${config.iconClass}`} />
                          <span className={`text-xs font-bold ${config.labelClass}`}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-400 text-center py-12">אין דיווחי היעדרות</p>
                )}
              </div>
            </div>
          </div>
        )}

      {activeTab === 'substitutes' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-4 md:p-6 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <div className="p-2 bg-purple-50 rounded-xl border border-purple-100">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              רשימת מילויי מקום
            </h2>
          </div>
            <div className="p-6">
              <div className="space-y-3">
                {displaySubstitutes.length > 0 ? (
                  displaySubstitutes.map(sub => {
                    const config = substituteStatusConfig[sub.status] || substituteStatusConfig.reported;
                    const StatusIcon = config.icon;

                    return (
                      <div key={sub.id} className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-purple-200 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {isManager && (
                              <p className="font-bold text-slate-800">{sub.reporter_name}</p>
                            )}
                            <div className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">
                              {sub.hours_count} שעות
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {sub.date}
                            </span>
                            {sub.original_teacher && (
                              <span>במקום: {sub.original_teacher}</span>
                            )}
                          </div>
                          {sub.class_name && (
                            <p className="text-sm text-slate-500 mt-1">כיתות: {sub.class_name}</p>
                          )}
                          {sub.subject && (
                            <p className="text-sm text-slate-500">נושאים: {sub.subject}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <StatusIcon className={`h-5 w-5 ${config.iconClass}`} />
                          <span className={`text-xs font-bold ${config.labelClass}`}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-400 text-center py-12">אין דיווחי מילוי מקום</p>
                )}
              </div>
            </div>
          </div>
        )}

      {activeTab === 'statistics' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-4 md:p-6 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
                <FileText className="h-4 w-4 text-blue-600" />
              </div>
              סטטיסטיקה - היעדרויות לפי עובד
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {(() => {
                const staffStats = {};
                allAbsences.forEach(absence => {
                  if (!staffStats[absence.user_email]) {
                    staffStats[absence.user_email] = { name: absence.user_name, total: 0, approved: 0, pending: 0, rejected: 0 };
                  }
                  const days = new Date(absence.end_date) - new Date(absence.start_date);
                  staffStats[absence.user_email].total += Math.ceil(days / (1000 * 60 * 60 * 24)) + 1;
                  staffStats[absence.user_email][absence.status] += 1;
                });

                return Object.values(staffStats).length > 0 ? (
                  Object.values(staffStats).sort((a, b) => b.total - a.total).map((stat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-200 transition-colors">
                      <div className="flex-1">
                        <p className="font-bold text-slate-800">{stat.name}</p>
                        <div className="flex gap-4 text-xs text-slate-600 mt-1">
                          <span>אושרו: {stat.approved}</span>
                          <span>ממתינים: {stat.pending}</span>
                          <span>נדחו: {stat.rejected}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-600">{stat.total}</p>
                        <p className="text-xs text-slate-500">ימים בסה"כ</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-12">אין נתונים סטטיסטיים</p>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Absence Report Modal */}
      {showAbsenceForm && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
                  <Clock className="h-4 w-4 text-white" />
                </div>
                דיווח היעדרות
              </h2>
              <button onClick={() => setShowAbsenceForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <form className="p-5 space-y-4" onSubmit={(e) => {
              e.preventDefault();
              createAbsenceMutation.mutate({
                user_email: user.email,
                user_name: user.full_name,
                status: 'pending',
                ...absenceForm,
              });
            }}>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">סיבת היעדרות</label>
                <select value={absenceForm.absence_reason}
                        onChange={e => setAbsenceForm({ ...absenceForm, absence_reason: e.target.value })}
                        className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
                  <option value="sick_child">ילד חולה</option>
                  <option value="choice_day">יום בחירה</option>
                  <option value="declaration_days">יום הצהרה</option>
                  <option value="other">אחר</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1.5">מתאריך</label>
                  <input type="date" required value={absenceForm.start_date}
                         onChange={e => setAbsenceForm({ ...absenceForm, start_date: e.target.value })}
                         className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1.5">עד תאריך</label>
                  <input type="date" required value={absenceForm.end_date}
                         onChange={e => setAbsenceForm({ ...absenceForm, end_date: e.target.value })}
                         className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">הערות (אופציונלי)</label>
                <textarea value={absenceForm.notes}
                          onChange={e => setAbsenceForm({ ...absenceForm, notes: e.target.value })}
                          rows={2} placeholder="פרטים נוספים..."
                          className="w-full p-2.5 border border-slate-300 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-400" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowAbsenceForm(false)}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">
                  ביטול
                </button>
                <button type="submit" disabled={createAbsenceMutation.isPending}
                        className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
                  {createAbsenceMutation.isPending ? 'שולח...' : 'שלח דיווח'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Substitute Report Modal */}
      {showSubstituteForm && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <div className="p-2 rounded-lg" style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>
                  <Users className="h-4 w-4 text-white" />
                </div>
                דיווח מילוי מקום
              </h2>
              <button onClick={() => setShowSubstituteForm(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>
            <form className="p-5 space-y-4" onSubmit={(e) => {
              e.preventDefault();
              createSubMutation.mutate({
                reporter_email: user.email,
                reporter_name: user.full_name,
                status: 'reported',
                ...subForm,
              });
            }}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1.5">תאריך</label>
                  <input type="date" required value={subForm.date}
                         onChange={e => setSubForm({ ...subForm, date: e.target.value })}
                         className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1.5">מספר שעות</label>
                  <input type="number" min="1" max="12" required value={subForm.hours_count}
                         onChange={e => setSubForm({ ...subForm, hours_count: parseInt(e.target.value) })}
                         className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">במקום (שם המורה הנעדרת)</label>
                <input type="text" required value={subForm.original_teacher}
                       onChange={e => setSubForm({ ...subForm, original_teacher: e.target.value })}
                       placeholder="שם המורה שהחלפת"
                       className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1.5">כיתה</label>
                  <input type="text" value={subForm.class_name}
                         onChange={e => setSubForm({ ...subForm, class_name: e.target.value })}
                         placeholder="לדוגמה: ז׳1"
                         className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1.5">מקצוע</label>
                  <input type="text" value={subForm.subject}
                         onChange={e => setSubForm({ ...subForm, subject: e.target.value })}
                         placeholder="לדוגמה: מתמטיקה"
                         className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowSubstituteForm(false)}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50">
                  ביטול
                </button>
                <button type="submit" disabled={createSubMutation.isPending}
                        className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' }}>
                  {createSubMutation.isPending ? 'שולח...' : 'שלח דיווח'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}