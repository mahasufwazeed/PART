import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { notificationService, Notification } from '@part/shared';
import {
  X,
  Bell,
  CheckCheck,
  Briefcase,
  MessageSquare,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const NotificationsModal: React.FC = () => {
  const {
    isNotificationsOpen,
    closeNotifications,
    currentProfile,
    openTaskDetails,
    setUnreadNotificationsCount,
    language,
  } = useAppStore();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = async () => {
    if (!currentProfile) return;
    setIsLoading(true);
    const list = await notificationService.getNotifications(currentProfile.id);
    setNotifications(list);
    const unread = list.filter((n) => !n.is_read).length;
    setUnreadNotificationsCount(unread);
    setIsLoading(false);
  };

  useEffect(() => {
    if (isNotificationsOpen && currentProfile) {
      loadNotifications();
    }
  }, [isNotificationsOpen, currentProfile?.id]);

  if (!isNotificationsOpen || !currentProfile) return null;

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead(currentProfile.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadNotificationsCount(0);
  };

  const handleItemClick = async (notif: Notification) => {
    if (!notif.is_read) {
      await notificationService.markAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
      );
      setUnreadNotificationsCount(
        notifications.filter((n) => !n.is_read && n.id !== notif.id).length
      );
    }

    if (notif.reference_type === 'task' && notif.reference_id) {
      closeNotifications();
      openTaskDetails(notif.reference_id);
    }
  };

  const getNotificationIcon = (eventType: string) => {
    switch (eventType) {
      case 'TASK_APPLICATION':
      case 'TASK_ASSIGNED':
        return <Briefcase className="w-4 h-4 text-part-green" />;
      case 'CHAT_MESSAGE':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'REVIEW_RECEIVED':
        return <Star className="w-4 h-4 text-amber-500 fill-amber-400" />;
      case 'TASK_COMPLETED':
      case 'COMPLETION_SUBMITTED':
        return <CheckCircle2 className="w-4 h-4 text-part-green" />;
      default:
        return <Bell className="w-4 h-4 text-neutral-600" />;
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return new Date(isoString).toLocaleDateString();
    } catch {
      return 'Recent';
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <div className="bg-white w-full max-w-md md:max-w-xl max-h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        {/* Header */}
        <div className="bg-white px-4 py-3.5 border-b border-neutral-200/90 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-brand-yellow/30 text-neutral-900 flex items-center justify-center">
              <Bell className="w-4 h-4 text-neutral-900" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-heading font-black text-sm text-neutral-900">
                  {language === 'ta' ? 'அறிவிப்புகள்' : 'Notifications'}
                </h3>
                {unreadCount > 0 && (
                  <span className="bg-brand-yellow text-neutral-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-[10px] text-neutral-400 font-medium">
                {language === 'ta'
                  ? 'பணி மற்றும் அரட்டை புதுப்பிப்புகள்'
                  : 'Task and message updates'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] font-heading font-bold text-part-green hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark read</span>
              </button>
            )}

            <button
              type="button"
              onClick={closeNotifications}
              className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center font-bold text-xs transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="p-3 overflow-y-auto flex-1 space-y-2">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-neutral-400">
              <div className="w-6 h-6 border-2 border-part-green border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-14 text-center space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6 text-neutral-400" />
              </div>
              <h4 className="font-heading font-bold text-sm text-neutral-900">
                All caught up!
              </h4>
              <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                You have no notifications right now. Activity on your tasks and messages will appear here.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleItemClick(notif)}
                className={`p-3 rounded-2xl border transition cursor-pointer flex items-start gap-3 ${
                  notif.is_read
                    ? 'bg-white border-neutral-200/80 hover:bg-neutral-50/80 text-neutral-600'
                    : 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50 text-neutral-900 shadow-xs'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    notif.is_read ? 'bg-neutral-100' : 'bg-white shadow-xs'
                  }`}
                >
                  {getNotificationIcon(notif.event_type)}
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <h5
                      className={`text-xs truncate ${
                        notif.is_read
                          ? 'font-heading font-semibold text-neutral-800'
                          : 'font-heading font-black text-neutral-950'
                      }`}
                    >
                      {notif.title}
                    </h5>
                    <span className="text-[10px] text-neutral-400 shrink-0 font-medium">
                      {formatRelativeTime(notif.created_at)}
                    </span>
                  </div>

                  <p className="text-[11px] leading-relaxed text-neutral-600 line-clamp-2">
                    {notif.body}
                  </p>

                  {notif.reference_type === 'task' && (
                    <span className="inline-block text-[10px] text-part-green font-bold hover:underline pt-0.5">
                      Tap to open task details →
                    </span>
                  )}
                </div>

                {!notif.is_read && (
                  <span className="w-2 h-2 rounded-full bg-part-green shrink-0 mt-2" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
