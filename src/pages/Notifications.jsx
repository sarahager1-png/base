import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Check, Trash2, Filter, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { timeAgo } from '@/lib/utils';

export default function NotificationsPage() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showUnread, setShowUnread] = useState(false);

  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user.email }, '-created_date'),
    enabled: !!user,
  });

  const markAsRead = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.read);
      for (const notif of unread) {
        await base44.entities.Notification.update(notif.id, { read: true });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('כל ההתראות סומנו כנקראו');
    },
  });

  const deleteNotification = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('ההתראה נמחקה');
    },
  });

  const filteredNotifications = notifications.filter(n => {
    const typeMatch = typeFilter === 'all' || n.type === typeFilter;
    const priorityMatch = priorityFilter === 'all' || n.priority === priorityFilter;
    const readMatch = !showUnread || !n.read;
    return typeMatch && priorityMatch && readMatch;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const typeLabels = {
    maintenance: 'תחזוקה',
    absence: 'היעדרות',
    purchase: 'רכש',
    print: 'הדפסה',
    meeting: 'פגישה',
    general: 'כללי'
  };

  const typeIcons = {
    maintenance: AlertTriangle,
    absence: Clock,
    purchase: '🛒',
    print: '🖨️',
    meeting: '📅',
    general: Bell
  };

  const priorityColors = {
    urgent: 'bg-red-100 text-red-700 border-red-200',
    important: 'bg-amber-100 text-amber-700 border-amber-200',
    normal: 'bg-slate-100 text-slate-700 border-slate-200'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 mb-2">התראות</h1>
            <p className="text-slate-600">
              {unreadCount > 0 ? `יש לך ${unreadCount} התראות שלא נקראו` : 'כל ההתראות נקראו'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={() => markAllAsRead.mutate()}
              variant="outline"
            >
              <Check className="h-4 w-4 mr-2" />
              סמן הכל כנקרא
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-medium text-slate-600">סינון:</span>
            </div>
            
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="all">כל הסוגים</option>
              <option value="maintenance">תחזוקה</option>
              <option value="absence">היעדרות</option>
              <option value="purchase">רכש</option>
              <option value="print">הדפסה</option>
              <option value="meeting">פגישה</option>
              <option value="general">כללי</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
            >
              <option value="all">כל הדחיפויות</option>
              <option value="urgent">דחוף</option>
              <option value="important">חשוב</option>
              <option value="normal">רגיל</option>
            </select>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showUnread}
                onChange={(e) => setShowUnread(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-slate-600">רק לא נקרא</span>
            </label>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(notif => {
              const Icon = typeIcons[notif.type];
              const isIcon = typeof Icon !== 'string';
              
              return (
                <div
                  key={notif.id}
                  className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-all ${
                    !notif.read ? 'border-blue-300 bg-blue-50/30' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg border ${priorityColors[notif.priority]}`}>
                      {isIcon ? <Icon className="h-5 w-5" /> : <span className="text-xl">{Icon}</span>}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className={`font-bold ${!notif.read ? 'text-slate-900' : 'text-slate-700'}`}>
                          {notif.title}
                        </h3>
                        <div className="flex items-center gap-1">
                          <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[notif.priority]} border font-medium`}>
                            {notif.priority === 'urgent' ? 'דחוף' :
                             notif.priority === 'important' ? 'חשוב' : 'רגיל'}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-2">{notif.message}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>{typeLabels[notif.type]}</span>
                          <span>•</span>
                          <span>{timeAgo(notif.created_date)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!notif.read && (
                            <button
                              onClick={() => markAsRead.mutate(notif.id)}
                              className="p-1.5 hover:bg-green-100 rounded text-green-600 transition-colors"
                              title="סמן כנקרא"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm('האם למחוק התראה זו?')) {
                                deleteNotification.mutate(notif.id);
                              }
                            }}
                            className="p-1.5 hover:bg-red-100 rounded text-red-600 transition-colors"
                            title="מחק"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Bell className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">
                {typeFilter !== 'all' || priorityFilter !== 'all' || showUnread 
                  ? 'אין התראות התואמות את הסינון' 
                  : 'אין התראות'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}