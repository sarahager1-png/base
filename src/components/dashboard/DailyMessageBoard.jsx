import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Shield, Megaphone, X, Bell, Edit2 } from 'lucide-react';

export default function DailyMessageBoard({ user }) {
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const queryClient = useQueryClient();

  const getGreetingByHour = () => {
    const hour = new Date().getHours();
    const name = user?.full_name || '';
    const greeting =
      hour >= 6 && hour < 12 ? `בוקר טוב ${name}` :
      hour >= 12 && hour < 17 ? `צהריים טובים ${name}` :
      hour >= 17 && hour < 19 ? `ערב טוב ${name}` :
      `לילה טוב ${name}`;
    return greeting;
  };

  const { data: dailyMessage } = useQuery({
    queryKey: ['dailyMessage'],
    queryFn: async () => {
      const messages = await base44.entities.DailyMessage.filter({ active: true }, '-created_date', 1);
      return messages[0] || null;
    },
    initialData: null,
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
      const activeMessages = await base44.entities.DailyMessage.filter({ active: true });
      for (const msg of activeMessages) {
        await base44.entities.DailyMessage.update(msg.id, { active: false });
      }
      return base44.entities.DailyMessage.create({
        content,
        active: true,
        created_by_name: user?.full_name || ''
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyMessage'] });
      queryClient.invalidateQueries({ queryKey: ['allMessages'] });
      setMessageText('');
      setEditingMessageId(null);
      setShowMessageModal(false);
    },
  });

  const updateMessageStatus = useMutation({
    mutationFn: ({ id, active }) => base44.entities.DailyMessage.update(id, { active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyMessage'] });
      queryClient.invalidateQueries({ queryKey: ['allMessages'] });
    },
  });

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-900 to-indigo-800 p-8 text-white">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="w-20 h-20 bg-white/10 rounded-lg flex items-center justify-center border border-white/30 cursor-pointer hover:bg-white/20 transition-colors">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  id="logoUpload"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        // TODO: Save logo to storage
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <label htmlFor="logoUpload" className="cursor-pointer flex items-center justify-center w-full h-full">
                  <Shield className="h-8 w-8 text-blue-100" />
                </label>
              </div>
              <p className="text-blue-100 text-xs mt-2">לחץ להעלאת לוגו</p>
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">ברוך הבא,</p>
              <p className="text-xl font-bold">{user?.full_name}</p>
            </div>
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
                  className="flex-1 md:flex-none text-xs bg-white text-red-600 px-4 py-2 rounded-lg font-bold border border-red-200 hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                >
                  ❌ ביטול
                </button>
              )}
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if (dailyMessage) {
                    setEditingMessageId(dailyMessage.id);
                    setMessageText(dailyMessage.content);
                  } else {
                    setMessageText('');
                    setEditingMessageId(null);
                  }
                  setShowMessageModal(true);
                }}
                className="flex-1 md:flex-none text-xs bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-1"
              >
                {dailyMessage ? <><Edit2 className="h-3 w-3" /> ערוך</> : <><Bell className="h-3 w-3" /> הודעה חדשה</>}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
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
    </>
  );
}