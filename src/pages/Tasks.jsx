import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckSquare, Clock, FileText, ShoppingCart, UserCheck } from 'lucide-react';
import { getStatusBadgeClass } from '@/lib/utils';
import PageHeader from '../components/PageHeader';

export default function TasksPage() {
  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: absences = [] } = useQuery({
    queryKey: ['absences', 'pending'],
    queryFn: () => base44.entities.Absence.filter({ status: 'pending' }),
    enabled: !!user && ['admin', 'vice_principal'].includes(user.role),
  });

  const { data: myAbsences = [] } = useQuery({
    queryKey: ['myAbsences', user?.email],
    queryFn: () => base44.entities.Absence.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const { data: purchaseRequests = [] } = useQuery({
    queryKey: ['purchases', 'pending'],
    queryFn: () => base44.entities.PurchaseRequest.filter({ status: 'pending' }),
    enabled: !!user && ['admin', 'vice_principal'].includes(user.role),
  });

  const { data: myPurchases = [] } = useQuery({
    queryKey: ['myPurchases', user?.email],
    queryFn: () => base44.entities.PurchaseRequest.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const { data: onboardingDocs = [] } = useQuery({
    queryKey: ['onboarding', 'pending'],
    queryFn: () => base44.entities.OnboardingDocument.filter({ status: 'pending' }),
    enabled: !!user && ['admin', 'vice_principal'].includes(user.role),
  });

  const { data: myOnboarding = [] } = useQuery({
    queryKey: ['myOnboarding', user?.email],
    queryFn: () => base44.entities.OnboardingDocument.filter({ user_email: user.email }),
    enabled: !!user,
  });

  const isManager = user && ['admin', 'vice_principal'].includes(user.role);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <PageHeader
          icon={CheckSquare}
          iconColor="#8b5cf6"
          iconColor2="#7c3aed"
          title="משימות ואישורים"
          subtitle="מעקב אחר משימות, בקשות ואישורים בהמתנה"
        />

        {isManager ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-amber-100 rounded-full">
                  <Clock className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">היעדרויות לאישור</p>
                  <p className="text-3xl font-bold text-slate-800">{absences.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <ShoppingCart className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">בקשות רכש</p>
                  <p className="text-3xl font-bold text-slate-800">{purchaseRequests.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-purple-100 rounded-full">
                  <UserCheck className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">טפסי קליטה</p>
                  <p className="text-3xl font-bold text-slate-800">{onboardingDocs.length}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              ההיעדרויות שלי
            </h2>
            <div className="space-y-3">
              {myAbsences.length > 0 ? (
                myAbsences.map(absence => (
                  <div key={absence.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="font-bold text-slate-800">{absence.start_date} - {absence.end_date}</p>
                      <p className="text-sm text-slate-500">סיבה: {absence.absence_reason}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(absence.status).badgeClass}`}>
                      {getStatusBadgeClass(absence.status).label}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-8">אין דיווחי היעדרות</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
              בקשות הרכש שלי
            </h2>
            <div className="space-y-3">
              {myPurchases.length > 0 ? (
                myPurchases.map(purchase => (
                  <div key={purchase.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                      <p className="font-bold text-slate-800">{purchase.item_name}</p>
                      <p className="text-sm text-slate-500">{purchase.reason}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      purchase.status === 'approved' ? 'bg-green-100 text-green-700' :
                      purchase.status === 'rejected' ? 'bg-red-100 text-red-700' :
                      purchase.status === 'ordered' ? 'bg-blue-100 text-blue-700' :
                      purchase.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {purchase.status === 'approved' ? 'מאושר' :
                       purchase.status === 'rejected' ? 'נדחה' :
                       purchase.status === 'ordered' ? 'הוזמן' :
                       purchase.status === 'completed' ? 'הושלם' : 'ממתין'}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-center py-8">אין בקשות רכש</p>
              )}
            </div>
          </div>

          {user?.role === 'substitute' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                טפסי הקליטה שלי
              </h2>
              <div className="space-y-3">
                {myOnboarding.length > 0 ? (
                  myOnboarding.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <p className="font-bold text-slate-800">{doc.document_type}</p>
                        <p className="text-sm text-slate-500">הועלה: {new Date(doc.created_date).toLocaleDateString('he-IL')}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(doc.status).badgeClass}`}>
                        {getStatusBadgeClass(doc.status).label}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-8">אין טפסים</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}