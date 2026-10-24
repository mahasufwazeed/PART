import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { chatService, Message, mockStore } from '@part/shared';
import {
  X,
  Send,
  Paperclip,
  CheckCheck,
  Shield,
  Smile,
} from 'lucide-react';

export const ChatModal: React.FC = () => {
  const { activeChatTaskId, closeChat, currentProfile } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [conversationId, setConversationId] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const task = activeChatTaskId ? mockStore.tasks.get(activeChatTaskId) : null;

  useEffect(() => {
    if (!activeChatTaskId) return;

    const initChat = async () => {
      const otherParticipantId =
        task?.requester_id === currentProfile.id
          ? 'b2222222-2222-4222-8222-222222222222' // Worker
          : task?.requester_id || 'a1111111-1111-4111-8111-111111111111'; // Requester

      const conv = await chatService.getOrCreateTaskConversation(
        activeChatTaskId,
        currentProfile.id,
        otherParticipantId
      );

      setConversationId(conv.id);
      const history = await chatService.getMessages(conv.id);
      setMessages(history);
    };

    initChat();
  }, [activeChatTaskId, currentProfile.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeChatTaskId || !task) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const content = inputText;
    setInputText('');

    const newMsg = await chatService.sendMessage(
      conversationId,
      currentProfile.id,
      content
    );

    setMessages((prev) => [...prev, newMsg]);
  };

  const quickReplies = [
    'I have arrived at the location.',
    'Where exactly is the delivery package?',
    'Work finished, please review!',
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col animate-slide-up overflow-hidden">
        {/* Chat Header */}
        <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-accent">
              💬
            </div>
            <div>
              <h3 className="text-xs font-bold leading-tight line-clamp-1">
                {task.title}
              </h3>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Shield className="w-2.5 h-2.5 text-accent" />
                Verified PART Conversation (Encrypted)
              </span>
            </div>
          </div>

          <button
            onClick={closeChat}
            className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          <div className="text-center my-2">
            <span className="text-[10px] bg-slate-200/80 text-slate-600 px-2.5 py-1 rounded-full font-medium">
              Task assigned: Coordinates shared securely.
            </span>
          </div>

          {messages.map((msg) => {
            const isMe = msg.sender_id === currentProfile.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                    isMe
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  <p>{msg.content}</p>
                  <div
                    className={`flex items-center justify-end gap-1 text-[9px] mt-1 ${
                      isMe ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isMe && <CheckCheck className="w-3 h-3 text-accent" />}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-1.5 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto scrollbar-none">
          {quickReplies.map((r, idx) => (
            <button
              key={idx}
              onClick={() => setInputText(r)}
              className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap hover:bg-slate-200 transition"
            >
              {r}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow hover:bg-primaryDark active:scale-95 transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
