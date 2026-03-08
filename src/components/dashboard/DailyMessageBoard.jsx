import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Megaphone, X, Bell, Edit2 } from 'lucide-react';

export default function DailyMessageBoard({ user }) {
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = base44.entities.DailyMessage.subscribe((event) => {
      if (['create', 'update', 'delete'].includes(event.type)) {
        queryClient.invalidateQueries({ queryKey: ['dailyMessage'] });
        queryClient.invalidateQueries({ queryKey: ['allMessages'] });
      }
    });
    return unsubscribe;
  }, [queryClient]);

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
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
           style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
              <Megaphone className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-700 text-sm">הודעה יומית לצוות</span>
            {dailyMessage && (
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium border border-blue-100">פעיל</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {dailyMessage && (
              <button
                onClick={() => updateMessageStatus.mutate({ id: dailyMessage.id, active: false })}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => {
                if (dailyMessage) {
                  setEditingMessageId(dailyMessage.id);
                  setMessageText(dailyMessage.content);
                } else {
                  setMessageText('');
                  setEditingMessageId(null);
                }
                setShowMessageModal(true);
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors flex items-center gap-1"
            >
              {dailyMessage ? <><Edit2 className="h-3 w-3" /> ערוך</> : <><Bell className="h-3 w-3" /> הוסף הודעה</>}
            </button>
          </div>
        </div>
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
          className="px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <p className={`text-base leading-relaxed ${dailyMessage ? 'text-slate-700 font-medium' : 'text-slate-400 italic'}`}>
            {dailyMessage?.content || 'לחץ כאן להוספת הודעה יומית לצוות...'}
          </p>
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