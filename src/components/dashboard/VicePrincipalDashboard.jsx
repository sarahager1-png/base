import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import StatCard from '../StatCard';
import ReportingModal from '../modals/ReportingModal';
import { 
  AlertTriangle, UserCheck, Clock, ShoppingCart, Shield,
  CheckCircle, XCircle, Calendar, Printer, Map
} from 'lucide-react';

export default function VicePrincipalDashboard({ user, setView }) {
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  const queryClient = useQueryClient();

  const { data: absences = [] } = useQuery({
    queryKey: ['absences', 'pending'],
    queryFn: () => base44.entities.Absence.filter({ status: 'pending' }),
  });

  const { data: onboardingDocs = [] } = useQuery({
    queryKey: ['onboarding', 'pending'],
    queryFn: () => base44.entities.OnboardingDocument.filter({ status: 'pending' }),
  });

  const { data: purchaseRequests = [] } = useQuery({
    queryKey: ['purchases', 'pending'],
    queryFn: () => base44.entities.PurchaseRequest.filter({ status: 'pending' }),
  });

  const { data: substituteReports = [] } = useQuery({
    queryKey: ['substitutes', 'reported'],
    queryFn: () => base44.entities.SubstituteReport.filter({ status: 'reported' }),
  });

  const { data: myDuty } = useQuery({
    queryKey: ['duty', user.email, new Date().getDate()],
    queryFn: async () => {
      const today = new Date().getDate();
      const duties = await base44.entities.DutyAssignment.filter({ 
        staff_email: user.email, 
        day: today 
      });
      return duties[0];
    },
  });

  const updateAbsence = useMutation({
    mutationFn: ({ id, status }) => base44.entities.Absence.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['absences'] });
    },
  });

  const openFeature = (feature) => {
    setActiveFeature(feature);
    setModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <ReportingModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        feature={activeFeature}
        user={user}
      />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white opacity-5 rounded-full -translate-x-10 -translate-y-10"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-2">בוקר טוב, {user.full_name}!</h2>
          <p className="text-blue-100 text-lg opacity-90 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            דשבורד סגנית מנהלת - "לכתחילה אריבער"
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="היעדרויות לאישור" 
          value={absences.length} 
          icon={Clock} 
          color="amber" 
          subtext="ממתינות להחלטה" 
        />
        <StatCard 
          title="טפסי קליטה" 
          value={onboardingDocs.length} 
          icon={UserCheck} 
          color="purple" 
          subtext="עובדים חדשים" 
        />
        <StatCard 
          title="בקשות רכש" 
          value={purchaseRequests.length} 
          icon={ShoppingCart} 
          color="blue" 
          subtext="לאישור תקציבי" 
        />
        <StatCard 
          title="מילוי מקום" 
          value={substituteReports.length} 
          icon={AlertTriangle} 
          color="red" 
          subtext="דוחות לאישור" 
        />
      </div>

      {/* My Duty Alert */}
      {myDuty && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-full text-amber-600">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900">תורנות היום שלי</h4>
              <p className="text-sm text-amber-800">{myDuty.duty_type} בשעה {myDuty.time}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        <button onClick={() => openFeature('absence')} className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-red-300 hover:bg-red-50 transition-all group text-center h-24 justify-center">
          <div className="p-3 bg-red-50 rounded-full text-red-500 group-hover:scale-110 transition-transform mb-2">
            <Clock className="h-6 w-6" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 leading-tight">דיווח היעדרות</span>
        </button>
        
        <button onClick={() => openFeature('substitute')} className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-purple-300 hover:bg-purple-50 transition-all group text-center h-24 justify-center">
          <div className="p-3 bg-purple-50 rounded-full text-purple-500 group-hover:scale-110 transition-transform mb-2">
            <Calendar className="h-6 w-6" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 leading-tight">מילוי מקום</span>
        </button>

        <button onClick={() => openFeature('external')} className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-green-300 hover:bg-green-50 transition-all group text-center h-24 justify-center">
          <div className="p-3 bg-green-50 rounded-full text-green-500 group-hover:scale-110 transition-transform mb-2">
            <Map className="h-6 w-6" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 leading-tight">פעילות חוץ</span>
        </button>

        <button onClick={() => openFeature('copies')} className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition-all group text-center h-24 justify-center">
          <div className="p-3 bg-blue-50 rounded-full text-blue-500 group-hover:scale-110 transition-transform mb-2">
            <Printer className="h-6 w-6" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 leading-tight">צילום</span>
        </button>

        <button onClick={() => openFeature('purchase')} className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-amber-300 hover:bg-amber-50 transition-all group text-center h-24 justify-center">
          <div className="p-3 bg-amber-50 rounded-full text-amber-500 group-hover:scale-110 transition-transform mb-2">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 leading-tight">רכש</span>
        </button>
      </div>

      {/* Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            היעדרויות לאישור
          </h3>
          <div className="space-y-3">
            {absences.length > 0 ? (
              absences.map(absence => (
                <div key={absence.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-800">{absence.user_name}</p>
                    <p className="text-sm text-slate-600">{absence.absence_type} | {absence.start_date} - {absence.end_date}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateAbsence.mutate({ id: absence.id, status: 'approved' })}
                      className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                    >
                      <CheckCircle className="h-5 w-5" />
                    </button>
                    <button 
                      onClick={() => updateAbsence.mutate({ id: absence.id, status: 'rejected' })}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                    >
                      <XCircle className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-8">אין היעדרויות ממתינות</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="text-xl font-bold text-blue-900 mb-6 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-purple-500" />
            טפסי קליטה לאישור
          </h3>
          <div className="space-y-3">
            {onboardingDocs.length > 0 ? (
              onboardingDocs.map(doc => (
                <div key={doc.id} className="p-4 bg-purple-50 rounded-xl border border-purple-200 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-purple-900">{doc.user_name}</p>
                    <p className="text-sm text-purple-700">{doc.document_type}</p>
                  </div>
                  <button className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 shadow-sm font-medium">
                    צפייה ואישור
                  </button>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-center py-8">אין טפסים לאישור</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}