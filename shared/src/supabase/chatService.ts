import { supabase, isLiveSupabaseConfigured } from './client';
import { mockStore } from './mockStore';
import { Conversation, Message } from '../types';
import { disputeService } from './disputeService';
import { notificationService } from './notificationService';

export const chatService = {
  /**
   * Get or create a conversation for a task
   */
  async getOrCreateTaskConversation(
    taskId: string,
    currentUserId: string,
    participantId: string
  ): Promise<Conversation> {
    if (isLiveSupabaseConfigured) {
      // Find existing
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('task_id', taskId)
        .maybeSingle();

      if (existing) return existing as Conversation;

      const { data: created } = await supabase
        .from('conversations')
        .insert({ task_id: taskId })
        .select()
        .single();

      await supabase.from('conversation_participants').insert([
        { conversation_id: created.id, user_id: currentUserId },
        { conversation_id: created.id, user_id: participantId },
      ]);

      return created as Conversation;
    }

    // Local Sandbox
    let conv = Array.from(mockStore.conversations.values()).find(
      (c) => c.task_id === taskId
    );

    if (!conv) {
      conv = {
        id: `conv-${taskId}`,
        task_id: taskId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      mockStore.conversations.set(conv.id, conv);

      // Add initial greeting message
      const welcomeMsg: Message = {
        id: `msg-welcome-${Date.now()}`,
        conversation_id: conv.id,
        sender_id: participantId,
        content: 'Hi! Thanks for selecting me. I am ready to assist with this task.',
        created_at: new Date().toISOString(),
        sender: mockStore.profiles.get(participantId),
      };
      mockStore.messages.set(welcomeMsg.id, welcomeMsg);
    }

    return conv;
  },

  /**
   * Fetch message history
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    if (isLiveSupabaseConfigured) {
      const { data } = await supabase
        .from('messages')
        .select('*, sender:profiles(*), attachments:message_attachments(*)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      return (data || []) as Message[];
    }

    return Array.from(mockStore.messages.values())
      .filter((m) => m.conversation_id === conversationId)
      .map((m) => ({
        ...m,
        sender: mockStore.profiles.get(m.sender_id),
      }))
      .sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
  },

  /**
   * Send a new message
   */
  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string
  ): Promise<Message> {
    // Resolve other participant
    let otherParticipantId: string | null = null;
    const conv = mockStore.conversations.get(conversationId);
    if (conv?.task_id) {
      const task = mockStore.tasks.get(conv.task_id);
      if (task) {
        if (task.requester_id === senderId) {
          const asgn = Array.from(mockStore.assignments.values()).find(
            (a) => a.task_id === task.id
          );
          otherParticipantId = asgn?.worker_id || null;
        } else {
          otherParticipantId = task.requester_id;
        }
      }
    }

    if (otherParticipantId && (await disputeService.isUserBlocked(senderId, otherParticipantId))) {
      throw new Error('Cannot send message: communication between these users is restricted.');
    }

    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: senderId,
          content,
        })
        .select('*, sender:profiles(*)')
        .single();

      if (error) throw new Error(error.message);

      if (otherParticipantId) {
        const sender = mockStore.profiles.get(senderId);
        await notificationService.createNotification({
          userId: otherParticipantId,
          title: 'New Message',
          body: `${sender?.full_name || 'User'}: ${content.slice(0, 50)}`,
          eventType: 'CHAT_MESSAGE',
          referenceType: 'task',
          referenceId: conv?.task_id,
        });
      }

      return data as Message;
    }

    const msgId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const newMsg: Message = {
      id: msgId,
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      created_at: new Date().toISOString(),
      sender: mockStore.profiles.get(senderId),
    };

    mockStore.messages.set(msgId, newMsg);

    if (otherParticipantId) {
      const sender = mockStore.profiles.get(senderId);
      await notificationService.createNotification({
        userId: otherParticipantId,
        title: 'New Message',
        body: `${sender?.full_name || 'User'}: ${content.slice(0, 50)}`,
        eventType: 'CHAT_MESSAGE',
        referenceType: 'task',
        referenceId: conv?.task_id,
      });
    }

    return newMsg;
  },
};
