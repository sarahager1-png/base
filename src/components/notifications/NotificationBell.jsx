import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, X, Check, AlertTriangle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

export default function NotificationBell({ userEmail }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userEmail],
    queryFn: () => base44.entities.Notification.filter({ user_email: userEmail }, '-created_date', 50),
    enabled: !!userEmail,
  });

  const unreadCount = notifications.filter(n => !n.read).length;

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
    },
  });

  const typeIcons = {
    maintenance: AlertTriangle,
    absence: Clock,
    purchase: '🛒',
    print: '🖨️',
    meeting: '📅',
    general: Bell
  };

  const priorityColors = {
    urgent: 'bg-red-50 border-red-200',
    important: 'bg-amber-50 border-amber-200',
    normal: 'bg-slate-50 border-slate-200'
  };

  useEffect(() => {
    if (!userEmail) return;
    
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.type === 'create' && event.data?.user_email === userEmail) {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      }
    });

    return unsubscribe;
  }, [userEmail, queryClient]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-blue-50 rounded-lg transition-colors"
      >
        <Bell className="h-6 w-6 text-blue-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white text-sm font-bold rounded-full flex items-center justify-center shadow-lg ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 max-h-[600px] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">התראות</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead.mutate()}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    סמן הכל כנקרא
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-200 rounded">
                  <X className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length > 0 ? (
                notifications.map(notif => {
                  const Icon = typeIcons[notif.type];
                  const isIcon = typeof Icon !== 'string';
                  
                  return (
                    <div
                      key={notif.id}
                      className={`p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${priorityColors[notif.priority]}`}>
                          {isIcon ? <Icon className="h-4 w-4" /> : <span>{Icon}</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`text-sm font-bold ${!notif.read ? 'text-slate-900' : 'text-slate-700'}`}>
                              {notif.title}
                            </h4>
                            {!notif.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead.mutate(notif.id);
                                }}
                                className="p-1 hover:bg-slate-200 rounded"
                              >
                                <Check className="h-3 w-3 text-green-600" />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
                          <p className="text-xs text-slate-400 mt-2">
                            {formatDistanceToNow(new Date(notif.created_date), { addSuffix: true, locale: he })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center">
                  <Bell className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-400">אין התראות</p>
                </div>
              )}
            </div>

            {notifications.length > 10 && (
              <div className="p-3 border-t border-slate-200 bg-slate-50 text-center">
                <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                  צפה בכל ההתראות
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}