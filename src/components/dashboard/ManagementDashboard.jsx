import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import StatCard from '../StatCard';
import AddMeeting from '../meetings/AddMeeting';
import MeetingsList from '../meetings/MeetingsList';
import { 
  AlertTriangle, UserCheck, Users, ShoppingCart, 
  Shield, Megaphone, UserPlus, Clock, Plus, X
} from 'lucide-react';

export default function ManagementDashboard({ user }) {
  const [showAddMeeting, setShowAddMeeting] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const queryClient = useQueryClient();

  const getGreetingByHour = () => {
    const hour = new Date().getHours();
    const greeting = 
      hour >= 6 && hour < 12 ? `בוקר טוב ${user.full_name}` :
      hour >= 12 && hour < 17 ? `צהריים טובים ${user.full_name}` :
      hour >= 17 && hour < 19 ? `ערב טוב ${user.full_name}` :
      `לילה טוב ${user.full_name}`;
    return greeting;
  };

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

  const { data: dailyMessage } = useQuery({
    queryKey: ['dailyMessage'],
    queryFn: async () => {
      const messages = await base44.entities.DailyMessage.filter({ active: true }, '-created_date', 1);
      return messages[0];
    },
  });

  const { data: allMessages = [] } = useQuery({
    queryKey: ['allMessages'],
    queryFn: () => base44.entities.DailyMessage.list('-created_date'),
  });

  const createMessage = useMutation({
    mutationFn: async (content) => {
      if (editingMessageId) {
        return base44.entities.DailyMessage.update(editingMessageId, { content });
      }
      // Deactivate previous messages
      const activeMessages = await base44.entities.DailyMessage.filter({ active: true });
      for (const msg of activeMessages) {
        await base44.entities.DailyMessage.update(msg.id, { active: false });
      }
      // Create new active message
      return base44.entities.DailyMessage.create({
        content,
        active: true,
        created_by_name: user.full_name
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyMessage', 'allMessages'] });
      setMessageText('');
      setEditingMessageId(null);
      setShowMessageModal(false);
    },
  });

  const updateMessageStatus = useMutation({
    mutationFn: ({ id, active }) => base44.entities.DailyMessage.update(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyMessage', 'allMessages'] });
    },
  });

  const urgentSubRequests = substituteReports.filter(s => !s.original_teacher);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Daily Message Board */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-800 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">בוקר טוב, {user.full_name}!</h2>
            <p className="text-blue-100 text-sm opacity-90">"לכתחילה אריבער" - יום מוצלח ומלא עשייה.</p>
          </div>
          <div className="hidden md:block">
            <Shield className="h-10 w-10 text-blue-200 opacity-20" />
          </div>
        </div>
        <div className="p-6 bg-blue-50/50 border-b border-blue-100">
          <div className="flex flex-col md:flex-row items-start gap-4">
            <div className="p-3 bg-white rounded-full text-blue-600 shadow-sm border border-blue-100">
              <Megaphone className="h-6 w-6" />
            </div>
            <div className="flex-1 w-full">
              <h3 className="font-bold text-blue-900 text-lg mb-1 flex items-center justify-between w-full">
                <span>לוח הודעות יומי</span>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-normal">פעיל באתר</span>
              </h3>
              <div 
                onClick={() => {
                  if (dailyMessage) {
                    setEditingMessageId(dailyMessage.id);
                    setMessageText(dailyMessage.content);
                  } else {
                    setMessageText(getGreetingByHour());
                  }
                  setShowMessageModal(true);
                }}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mt-2 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
              >
                <p className="text-slate-800 font-serif text-lg leading-relaxed">
                  {dailyMessage?.content || 'אין הודעה פעילה כרגע'}
                </p>
              </div>
            </div>
            <div className="flex flex-row md:flex-col gap-2 mt-2 md:mt-0 w-full md:w-auto pointer-events-auto">
              {dailyMessage && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    updateMessageStatus.mutate({ id: dailyMessage.id, active: false });
                  }}
                  className="flex-1 md:flex-none text-xs bg-white text-red-600 px-4 py-2 rounded-lg font-bold border border-red-200 hover:bg-red-50 transition-colors"
                >
                  ביטול הודעה
                </button>
              )}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setMessageText('');
                  setEditingMessageId(null);
                  setShowMessageModal(true);
                }}
                className="flex-1 md:flex-none text-xs bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm"
              >
                הודעה חדשה
              </button>
            </div>
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

      {showAddMeeting && (
        <AddMeeting user={user} onClose={() => setShowAddMeeting(false)} />
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">
                {editingMessageId ? 'עריכת הודעה' : 'הודעה חדשה לדשבורד'}
              </h3>
              <button onClick={() => {
                setShowMessageModal(false);
                setEditingMessageId(null);
                setMessageText('');
              }} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <textarea
              placeholder="לדוגמה: בוקר טוב, רשת חינוך חב״ד..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-lg mb-4 text-sm focus:outline-none focus:border-blue-500 resize-none h-24"
            />
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowMessageModal(false);
                  setEditingMessageId(null);
                  setMessageText('');
                }}
                className="flex-1 px-4 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium"
              >
                ביטול
              </button>
              <button
                onClick={() => createMessage.mutate(messageText)}
                disabled={!messageText.trim() || createMessage.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-300 transition-colors font-medium"
              >
                {createMessage.isPending ? 'שומר...' : editingMessageId ? 'עדכן' : 'פרסום'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}