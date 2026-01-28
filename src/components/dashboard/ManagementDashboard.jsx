import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import StatCard from '../StatCard';
import AddMeeting from '../meetings/AddMeeting';
import MeetingsList from '../meetings/MeetingsList';
import DailyMessageBoard from './DailyMessageBoard';
import { 
  AlertTriangle, UserCheck, Users, ShoppingCart, 
  Shield, UserPlus, Clock, Plus
} from 'lucide-react';

export default function ManagementDashboard({ user }) {
  const [showAddMeeting, setShowAddMeeting] = useState(false);

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



  const urgentSubRequests = substituteReports.filter(s => !s.original_teacher);

  return (
    <div className="space-y-8 animate-fade-in">
      <DailyMessageBoard user={user} />

      {/* Control Center */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            {user.role === 'admin' ? 'מרכז בקרה וחריגים' : 'שולחן עבודה - סגנית'}
          </h3>
          <span className="text-xs font-medium bg-red-50 text-red-600 px-3 py-1 rounded-full border border-red-100">
            {onboardingDocs.length + absences.length} אירועים בטיפול
          </span>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
            <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
              <UserPlus className="h-4 w-4" /> טפסי קליטה לאישור
            </h4>
            <div className="space-y-2">
              {onboardingDocs.length > 0 ? (
                onboardingDocs.slice(0, 3).map(doc => (
                  <div key={doc.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-purple-100 shadow-sm">
                    <span className="text-sm">{doc.user_name} - {doc.document_type}</span>
                    <button className="text-xs bg-purple-600 text-white px-3 py-1 rounded hover:bg-purple-700 transition-colors">
                      צפה ואשר
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-purple-600 text-center py-4">אין טפסים ממתינים</p>
              )}
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-blue-900 flex items-center gap-2">
                <Users className="h-4 w-4" /> יומן פגישות
              </h4>
              <button
                onClick={() => setShowAddMeeting(true)}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                פגישה חדשה
              </button>
            </div>
            <MeetingsList user={user} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="מילוי מקום נדרש" 
          value={urgentSubRequests.length} 
          icon={AlertTriangle} 
          color="red" 
          subtext={urgentSubRequests.length > 0 ? "דחוף: טרם שובץ" : "הכל מכוסה"} 
        />
        <StatCard 
          title="טפסים לאישור" 
          value={onboardingDocs.length} 
          icon={UserCheck} 
          color="purple" 
          subtext="עובדים חדשים ממתינים" 
        />
        <StatCard 
          title="היעדרויות ממתינות" 
          value={absences.length} 
          icon={Clock} 
          color="amber" 
          subtext="לאישור מנהלת" 
        />
        <StatCard 
          title="בקשות רכש" 
          value={purchaseRequests.length} 
          icon={ShoppingCart} 
          color="blue" 
          subtext="ממתינות לאישור תקציבי" 
        />
      </div>

      {showAddMeeting && (
        <AddMeeting user={user} onClose={() => setShowAddMeeting(false)} />
      )}
    </div>
  );
}