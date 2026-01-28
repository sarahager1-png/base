import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { X, Send, Heart, MessageCircle, Lightbulb, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';

export default function SendMessageModal({ user, isOpen, onClose, recipientRole }) {
  const [content, setContent] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [messageType, setMessageType] = useState('personal');
  const [sendToAll, setSendToAll] = useState(false);
  const queryClient = useQueryClient();

  const messageTypeIcons = {
    personal: { icon: Heart, label: 'הודעה אישית', color: 'pink' },
    feedback: { icon: ThumbsUp, label: 'משוב', color: 'blue' },
    suggestion: { icon: Lightbulb, label: 'הצעה', color: 'amber' },
  };

  const { data: staffMembers = [] } = useQuery({
    queryKey: ['staff-members'],
    queryFn: () => base44.entities.User.list(),
  });

  // Filter recipients based on role
  const getRecipients = () => {
    if (recipientRole === 'leadership') {
      // Staff can message leadership
      return staffMembers.filter(m => ['admin', 'vice_principal', 'counselor'].includes(m.role));
    } else {
      // Leadership can message staff
      return staffMembers.filter(m => m.role === 'user');
    }
  };

  const sendMessage = useMutation({
    mutationFn: async (messageData) => {
      if (Array.isArray(messageData)) {
        return base44.entities.Message.bulkCreate(messageData);
      }
      return base44.entities.Message.create(messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      toast.success('ההודעה נשלחה בהצלחה! 💙', {
        icon: '✉️'
      });
      setContent('');
      setSelectedRecipient('');
      setSendToAll(false);
      onClose();
    },
  });

  const handleSend = () => {
    if (!content.trim() || (!sendToAll && !selectedRecipient)) {
      toast.error('אנא מלא את כל השדות');
      return;
    }

    if (sendToAll) {
      const messages = getRecipients().map(recipient => ({
        sender_email: user.email,
        sender_name: user.full_name,
        sender_role: user.role,
        recipient_email: recipient.email,
        recipient_name: recipient.full_name,
        recipient_role: recipient.role,
        content: content.trim(),
        message_type: messageType
      }));
      sendMessage.mutate(messages);
    } else {
      const recipient = staffMembers.find(m => m.email === selectedRecipient);
      sendMessage.mutate({
        sender_email: user.email,
        sender_name: user.full_name,
        sender_role: user.role,
        recipient_email: recipient.email,
        recipient_name: recipient.full_name,
        recipient_role: recipient.role,
        content: content.trim(),
        message_type: messageType
      });
    }
  };

  if (!isOpen) return null;

  const recipients = getRecipients();

  return (
    <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-t-2xl p-6 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            שלח הודעה
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Message Type Selection */}
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">סוג הודעה:</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(messageTypeIcons).map(([type, { icon: Icon, label, color }]) => (
                <button
                  key={type}
                  onClick={() => setMessageType(type)}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-1 ${
                    messageType === type
                      ? `bg-${color}-50 border-${color}-500`
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${messageType === type ? `text-${color}-600` : 'text-slate-600'}`} />
                  <span className="text-xs font-medium text-slate-700">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">שלח אל:</label>
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setSendToAll(false)}
                className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all ${
                  !sendToAll
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                אדם אחד
              </button>
              <button
                onClick={() => setSendToAll(true)}
                className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all ${
                  sendToAll
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                כל הצוות
              </button>
            </div>
            {!sendToAll && (
              <select
                value={selectedRecipient}
                onChange={(e) => setSelectedRecipient(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- בחר משתקל/ת --</option>
                {recipients.map(member => (
                  <option key={member.id} value={member.email}>
                    {member.full_name}
                  </option>
                ))}
              </select>
            )}
            {sendToAll && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <p className="text-sm text-purple-800 font-medium">
                  📢 ההודעה תשלח ל-{recipients.length} משתקלים/ות
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">הודעה:</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="כתוב הודעה חם ומעצימה..."
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="4"
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition-colors font-medium"
            >
              ביטול
            </button>
            <button
              onClick={handleSend}
              disabled={!content.trim() || !selectedRecipient || sendMessage.isPending}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4" />
              שלח
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}