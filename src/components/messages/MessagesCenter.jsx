import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mail, Heart, CheckCircle2, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function MessagesCenter({ user }) {
  const [filter, setFilter] = useState('unread'); // unread, all
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', user.email],
    queryFn: () => base44.entities.Message.filter({ recipient_email: user.email }, '-created_date', 50),
  });

  const markAsRead = useMutation({
    mutationFn: (messageId) => base44.entities.Message.update(messageId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });

  const deleteMessage = useMutation({
    mutationFn: (messageId) => base44.entities.Message.delete(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success('ההודעה נמחקה');
    },
  });

  const filteredMessages = filter === 'unread' 
    ? messages.filter(m => !m.is_read)
    : messages;

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Mail className="h-5 w-5 text-blue-600" />
          הודעות אישיות
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            חדש ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            הכל
          </button>
        </div>
      </div>

      {/* Messages list */}
      <div className="space-y-3">
        {filteredMessages.length > 0 ? (
          filteredMessages.map(message => (
            <div
              key={message.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                message.is_read
                  ? 'bg-slate-50 border-slate-200'
                  : 'bg-blue-50 border-blue-200 shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-bold text-slate-800">{message.sender_name}</h4>
                  <p className="text-xs text-slate-500">{message.sender_role}</p>
                </div>
                <div className="flex items-center gap-2">
                  {!message.is_read && (
                    <button
                      onClick={() => markAsRead.mutate(message.id)}
                      className="p-1 hover:bg-blue-200 rounded-lg transition-colors"
                      title="סמן כנקרא"
                    >
                      <CheckCircle2 className="h-4 w-4 text-blue-600" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteMessage.mutate(message.id)}
                    className="p-1 hover:bg-red-200 rounded-lg transition-colors"
                    title="מחק"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              </div>
              <p className="text-slate-700 text-sm mb-2 leading-relaxed">{message.content}</p>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(message.created_date).toLocaleDateString('he-IL')}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-400">
            <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>אין הודעות עדיין</p>
          </div>
        )}
      </div>
    </div>
  );
}