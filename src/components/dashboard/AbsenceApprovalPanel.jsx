import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Clock, CheckCircle, XCircle, AlertCircle, FileText, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AbsenceApprovalPanel() {
  const queryClient = useQueryClient();

  const { data: absences = [] } = useQuery({
    queryKey: ['absences', 'pending'],
    queryFn: () => base44.entities.Absence.filter({ status: 'pending' }),
  });

  const { data: awaitingCerts = [] } = useQuery({
    queryKey: ['absences', 'awaiting'],
    queryFn: () => base44.entities.Absence.filter({ status: 'awaiting_certificate' }),
  });

  const updateAbsence = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Absence.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absences'] });
    },
  });

  const reportToMinistry = useMutation({
    mutationFn: ({ id }) => base44.entities.Absence.update(id, { reported_to_ministry: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absences'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Awaiting Certificates */}
      {awaitingCerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h4 className="font-bold text-amber-900 mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            ממתינות לאישור רפואי ({awaitingCerts.length})
          </h4>
          <div className="space-y-2 text-sm">
            {awaitingCerts.map(absence => (
              <div key={absence.id} className="bg-white p-3 rounded-lg flex justify-between items-center border border-amber-200">
                <div>
                  <p className="font-bold text-slate-800">{absence.user_name}</p>
                  <p className="text-xs text-slate-600">{absence.start_date} - {absence.end_date}</p>
                </div>
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">ממתין לאישור</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Approvals */}
      <div>
        <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          היעדרויות לאישור ({absences.length})
        </h4>
        <div className="space-y-3">
          {absences.length > 0 ? (
            absences.map(absence => (
              <div key={absence.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-slate-800">{absence.user_name}</p>
                    <p className="text-sm text-slate-600">{absence.absence_reason} | {absence.start_date} - {absence.end_date}</p>
                    <p className="text-xs text-slate-500 mt-1">{absence.lesson_hours?.length || 0} שעות מערכת</p>
                  </div>
                  {absence.medical_certificate_url && (
                    <a 
                      href={absence.medical_certificate_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1 hover:bg-green-200"
                    >
                      <FileText className="h-3 w-3" />
                      אישור רפואי
                    </a>
                  )}
                </div>

                {absence.substitute_teacher_name && (
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 mb-3">
                    <p className="text-xs text-purple-900">
                      <User className="h-3 w-3 inline mr-1" />
                      ממלאת מקום: {absence.substitute_teacher_name}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={() => updateAbsence.mutate({ id: absence.id, status: 'approved' })}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 flex-1"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    אשר
                  </Button>
                  <Button 
                    onClick={() => updateAbsence.mutate({ id: absence.id, status: 'rejected' })}
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-300 hover:bg-red-50 flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    דחה
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-center py-8">אין היעדרויות לאישור</p>
          )}
        </div>
      </div>
    </div>
  );
}