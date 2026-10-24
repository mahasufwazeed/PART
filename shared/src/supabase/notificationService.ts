import { supabase, isLiveSupabaseConfigured } from './client';
import { mockStore } from './mockStore';
import { Notification } from '../types';

export const notificationService = {
  /**
   * Create a new notification for a user
   */
  async createNotification(params: {
    userId: string;
    title: string;
    body: string;
    eventType: string;
    referenceType?: string | null;
    referenceId?: string | null;
  }): Promise<Notification> {
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newNotif: Notification = {
      id: notifId,
      user_id: params.userId,
      title: params.title,
      body: params.body,
      event_type: params.eventType,
      reference_type: params.referenceType || null,
      reference_id: params.referenceId || null,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .insert(newNotif)
          .select()
          .maybeSingle();

        if (!error && data) {
          mockStore.notifications.set(data.id, data as Notification);
          return data as Notification;
        }
      } catch (err) {
        console.warn('Supabase createNotification error, fallback to mockStore:', err);
      }
    }

    mockStore.notifications.set(notifId, newNotif);
    return newNotif;
  },

  /**
   * Get all notifications for a user, sorted newest first
   */
  async getNotifications(userId: string): Promise<Notification[]> {
    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data) {
          return data as Notification[];
        }
      } catch (err) {
        console.warn('Supabase getNotifications error, fallback to mockStore:', err);
      }
    }

    return Array.from(mockStore.notifications.values())
      .filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    if (isLiveSupabaseConfigured) {
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_read', false);

        if (!error && typeof count === 'number') {
          return count;
        }
      } catch (err) {
        console.warn('Supabase getUnreadCount error, fallback to mockStore:', err);
      }
    }

    return Array.from(mockStore.notifications.values()).filter(
      (n) => n.user_id === userId && !n.is_read
    ).length;
  },

  /**
   * Mark a single notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    if (isLiveSupabaseConfigured) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('id', notificationId);
      } catch (err) {
        console.warn('Supabase markAsRead error:', err);
      }
    }

    const notif = mockStore.notifications.get(notificationId);
    if (notif) {
      notif.is_read = true;
    }
  },

  /**
   * Mark all notifications for a user as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    if (isLiveSupabaseConfigured) {
      try {
        await supabase
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', userId)
          .eq('is_read', false);
      } catch (err) {
        console.warn('Supabase markAllAsRead error:', err);
      }
    }

    for (const [_, notif] of mockStore.notifications.entries()) {
      if (notif.user_id === userId) {
        notif.is_read = true;
      }
    }
  },
};
