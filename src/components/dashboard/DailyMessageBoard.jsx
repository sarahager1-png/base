import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/firebaseClient';
import { Megaphone, X, Bell, Edit2, Plus } from 'lucide-react';

export default function DailyMessageBoard({ user }) {
  const [showModal, setShowModal]         = useState(false);
  const [messageText, setMessageText]     = useState('');
  const [editingId, setEditingId]         = useState(null);
  const qc = useQueryClient();

  useEffect(() => {
    const unsub = base44.entities.DailyMessage.subscribe((e) => {
      if (['create', 'update', 'delete'].includes(e.type)) {
        qc.invalidateQueries({ queryKey: ['dailyMessage'] });
        qc.invalidateQueries({ queryKey: ['allMessages'] });
      }
    });
    return unsub;
  }, [qc]);

  const { data: msg } = useQuery({
    queryKey: ['dailyMessage'],
    queryFn: async () => {
      const list = await base44.entities.DailyMessage.filter({ active: true }, '-created_date', 1);
      return list[0] || null;
    },
    initialData: null,
  });

  const saveMsg = useMutation({
    mutationFn: async (content) => {
      if (editingId) return base44.entities.DailyMessage.update(editingId, { content });
      const active = await base44.entities.DailyMessage.filter({ active: true });
      for (const m of active) await base44.entities.DailyMessage.update(m.id, { active: false });
      return base44.entities.DailyMessage.create({ content, active: true, created_by_name: user?.full_name || '' });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dailyMessage'] });
      qc.invalidateQueries({ queryKey: ['allMessages'] });
      setMessageText(''); setEditingId(null); setShowModal(false);
    },
  });

  const deactivate = useMutation({
    mutationFn: () => base44.entities.DailyMessage.update(msg.id, { active: false }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dailyMessage'] }),
  });

  const openEdit = () => {
    setEditingId(msg?.id || null);
    setMessageText(msg?.content || '');
    setShowModal(true);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50">
              <Megaphone className="h-4 w-4 text-blue-600" />
            </div>
            <span className="font-bold text-slate-700 text-sm">הודעה יומית לצוות</span>
            {msg && (
              <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-semibold border border-emerald-100">
                פעיל
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {msg && (
              <button
                onClick={() => deactivate.mutate()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="הסר הודעה"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={openEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
            >
              {msg ? <><Edit2 className="h-3 w-3" />ערוך</> : <><Plus className="h-3 w-3" />הוסף</>}
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          onClick={openEdit}
          className="px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors min-h-[56px] flex items-center"
        >
          {msg ? (
            <p className="text-slate-700 text-sm font-medium leading-relaxed">{msg.content}</p>
          ) : (
            <p className="text-slate-400 text-sm italic">לחצי כאן להוספת הודעה יומית לצוות...</p>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50">
                  <Bell className="h-4 w-4 text-blue-600" />
                </div>
                {editingId ? 'עריכת הודעה' : 'הודעה חדשה לדשבורד'}
              </h3>
              <button onClick={() => { setShowModal(false); setEditingId(null); setMessageText(''); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <textarea
              placeholder="לדוגמה: בוקר טוב, רשת חינוך חב״ד..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full p-3.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none h-28 mb-4 transition-colors"
              dir="rtl"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setShowModal(false); setEditingId(null); setMessageText(''); }}
                className="flex-1 px-4 py-2.5 text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors font-semibold text-sm"
              >
                ביטול
              </button>
              <button
                onClick={() => saveMsg.mutate(messageText)}
                disabled={!messageText.trim() || saveMsg.isPending}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors font-semibold text-sm"
              >
                {saveMsg.isPending ? 'שומר...' : editingId ? 'עדכן' : 'פרסם'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
