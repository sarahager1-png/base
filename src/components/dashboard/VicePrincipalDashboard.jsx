import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import StatCard from '../StatCard';
import ReportingModal from '../modals/ReportingModal';
import AbsenceReportModal from '../modals/AbsenceReportModal';
import AbsenceApprovalPanel from './AbsenceApprovalPanel';
import AddMeeting from '../meetings/AddMeeting';
import MeetingsList from '../meetings/MeetingsList';
import { 
  AlertTriangle, UserCheck, Clock, ShoppingCart, Shield,
  CheckCircle, XCircle, Calendar, Printer, Map, Users, Plus
} from 'lucide-react';

export default function VicePrincipalDashboard({ user, setView }) {
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);
  const [absenceModalOpen, setAbsenceModalOpen] = useState(false);
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
      <AbsenceReportModal 
        isOpen={absenceModalOpen}
        onClose={() => setAbsenceModalOpen(false)}
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
        <button onClick={() => setAbsenceModalOpen(true)} className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm border border-slate-100 hover:border-red-300 hover:bg-red-50 transition-all group text-center h-24 justify-center">
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
          <AbsenceApprovalPanel />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              יומן פגישות
            </h3>
            <button
              onClick={() => setShowAddMeeting(true)}
              className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              פגישה חדשה
            </button>
          </div>
          <MeetingsList user={user} />
        </div>
      </div>

      {showAddMeeting && (
        <AddMeeting user={user} onClose={() => setShowAddMeeting(false)} />
      )}
    </div>
  );
}