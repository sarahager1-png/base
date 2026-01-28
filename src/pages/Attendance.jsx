import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock, Calendar, CheckCircle, XCircle, AlertCircle, Users, FileText } from 'lucide-react';

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState('absences');
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

  const isManager = user && ['admin', 'vice_principal', 'secretary'].includes(user.role);
  const displayAbsences = isManager ? allAbsences : myAbsences;
  const displaySubstitutes = isManager ? allSubstitutes : mySubstitutes;

  const absenceStatusConfig = {
    pending: { icon: Clock, color: 'amber', label: 'ממתין' },
    approved: { icon: CheckCircle, color: 'green', label: 'מאושר' },
    rejected: { icon: XCircle, color: 'red', label: 'נדחה' },
    awaiting_certificate: { icon: AlertCircle, color: 'orange', label: 'ממתין לאישור רפואי' }
  };

  const substituteStatusConfig = {
    reported: { icon: Clock, color: 'blue', label: 'דווח' },
    approved: { icon: CheckCircle, color: 'green', label: 'מאושר' },
    paid: { icon: CheckCircle, color: 'purple', label: 'שולם' }
  };

  const reasonLabels = {
    sick_child: 'ילד חולה',
    choice_day: 'יום בחירה',
    declaration_days: 'יום הצהרה',
    other: 'אחר'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-blue-900 mb-2">היעדרויות ודיווח</h1>
          <p className="text-slate-600">
            {isManager ? 'צפייה וניהול כל דיווחי ההיעדרות ומילויי המקום' : 'דיווחי ההיעדרות ומילויי המקום שלי'}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
          <button
            onClick={() => setActiveTab('absences')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold transition-all ${
              activeTab === 'absences' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Clock className="h-5 w-5" />
            היעדרויות
          </button>
          <button
            onClick={() => setActiveTab('substitutes')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold transition-all ${
              activeTab === 'substitutes' 
                ? 'bg-purple-600 text-white shadow-sm' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="h-5 w-5" />
            מילויי מקום
          </button>
        </div>

        {activeTab === 'absences' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 rounded-full">
                  <Clock className="h-6 w-6 text-amber-600" />
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

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
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

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
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

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
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

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
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
                            <div className={`px-3 py-1 rounded-full text-xs font-bold bg-${config.color}-100 text-${config.color}-700`}>
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
                          <StatusIcon className={`h-5 w-5 text-${config.color}-600`} />
                          <span className={`text-xs font-bold text-${config.color}-700`}>
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
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
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
                          <StatusIcon className={`h-5 w-5 text-${config.color}-600`} />
                          <span className={`text-xs font-bold text-${config.color}-700`}>
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
      </div>
    </div>
  );
}