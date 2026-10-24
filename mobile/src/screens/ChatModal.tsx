import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { chatService, disputeService, Message, mockStore } from '@part/shared';
import {
  X,
  Send,
  Image as ImageIcon,
  CheckCheck,
  Shield,
  Smile,
  MoreVertical,
  Flag,
  UserX,
  MapPin,
  Clock,
  IndianRupee,
  GraduationCap,
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export const ChatModal: React.FC = () => {
  const { activeChatTaskId, closeChat, currentProfile } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [conversationId, setConversationId] = useState<string>('');
  const [showMenu, setShowMenu] = useState(false);
  const [safetyNotice, setSafetyNotice] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const task = activeChatTaskId ? mockStore.tasks.get(activeChatTaskId) : null;

  // Resolve other participant
  const assignment = activeChatTaskId
    ? Array.from(mockStore.assignments.values()).find((a) => a.task_id === activeChatTaskId)
    : null;
  const otherParticipantId =
    task && currentProfile
      ? task.requester_id === currentProfile.id
        ? assignment?.worker_id || (task as any)?.assigned_worker_id || ''
        : task.requester_id
      : '';

  // Participant authorization check
  const isAuthorized =
    Boolean(currentProfile && task && (
      task.requester_id === currentProfile.id ||
      assignment?.worker_id === currentProfile.id ||
      (task as any).assigned_worker_id === currentProfile.id ||
      Array.from(mockStore.applications.values()).some(
        (a) => a.task_id === task.id && a.worker_id === currentProfile.id
      )
    ));

  useEffect(() => {
    if (!activeChatTaskId || !currentProfile) return;

    const initChat = async () => {
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
  }, [activeChatTaskId, currentProfile?.id, otherParticipantId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!activeChatTaskId || !task || !currentProfile) return null;

  if (!isAuthorized) {
    return (
      <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
        <div className="bg-white w-full max-w-sm rounded-3xl p-5 text-center space-y-3">
          <Shield className="w-8 h-8 text-rose-500 mx-auto" />
          <h3 className="font-heading font-black text-sm text-neutral-900">
            Unauthorized Conversation
          </h3>
          <p className="text-xs text-neutral-500">
            Only verified participants of this task can access this chat.
          </p>
          <button
            type="button"
            onClick={closeChat}
            className="w-full py-2 bg-neutral-900 text-white font-heading font-bold text-xs rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const handleSend = async (contentToSend?: string) => {
    const text = contentToSend || inputText;
    if (!text.trim() && !attachedImage) return;

    let payload = text.trim();
    if (attachedImage) {
      payload = `[IMAGE:${attachedImage}]\n${payload}`.trim();
      setAttachedImage(null);
    }

    setInputText('');

    const newMsg = await chatService.sendMessage(
      conversationId,
      currentProfile.id,
      payload
    );

    setMessages((prev) => [...prev, newMsg]);
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBlockUser = async () => {
    setShowMenu(false);
    if (otherParticipantId && currentProfile) {
      await disputeService.blockUser(currentProfile.id, otherParticipantId);
      setSafetyNotice('User has been blocked. They can no longer contact you.');
    }
  };

  const handleReportUser = async () => {
    setShowMenu(false);
    if (currentProfile && task) {
      await disputeService.submitReport({
        reporterId: currentProfile.id,
        reportedUserId: otherParticipantId || undefined,
        reportedTaskId: task.id,
        reason: 'Safety concern / inappropriate behavior in chat',
        details: `Report filed by ${currentProfile.full_name} during task "${task.title}".`,
      });
      setSafetyNotice('Report submitted to Chennai Safety Officers. Evidence logged.');
    }
  };

  const quickReplies = [
    'I have arrived at the campus spot.',
    'Where should we meet?',
    'PPT slides look ready!',
    'Notes collected, on my way.',
    'Thank you so much!',
  ];

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <div className="bg-white w-full max-w-md md:max-w-xl h-[90vh] sm:h-[650px] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-white px-4 py-3 border-b border-neutral-200/90 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-brand-yellow text-neutral-950 font-heading font-black text-xs flex items-center justify-center shrink-0">
              {task.is_campus_task ? '🎓' : 'P'}
            </div>
            <div className="min-w-0">
              <h3 className="font-heading font-black text-xs sm:text-sm text-neutral-900 leading-tight truncate">
                {task.is_campus_task ? `${task.college_name || 'Campus'} Messenger` : 'Task Messenger'}
              </h3>
              <span className="text-[10px] text-part-green font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-part-green animate-pulse" />
                Live Authorized Conversation
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 relative shrink-0">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="w-8 h-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-500 cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-9 w-44 bg-white rounded-2xl shadow-card border border-neutral-200 p-1.5 text-xs z-30 animate-fade-in space-y-1">
                <button
                  type="button"
                  onClick={handleReportUser}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-neutral-700 hover:bg-neutral-50 rounded-xl cursor-pointer"
                >
                  <Flag className="w-3.5 h-3.5 text-amber-600" />
                  <span>Report User</span>
                </button>
                <button
                  type="button"
                  onClick={handleBlockUser}
                  className="w-full px-3 py-2 text-left flex items-center gap-2 text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5" />
                  <span>Block User</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={closeChat}
              className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center cursor-pointer transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Task Context Card & Live Status Updates */}
        <div className="bg-[#F7F8FA] px-4 py-2 border-b border-neutral-200/60 flex items-center justify-between text-xs gap-2">
          <div className="truncate min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-bold text-neutral-900 truncate">
                {task.title}
              </span>
              <StatusBadge status={task.status} />
            </div>
            <span className="text-[10px] text-neutral-500 flex items-center gap-1 truncate">
              {task.is_campus_task ? (
                <>
                  <GraduationCap className="w-3 h-3 text-part-green shrink-0" />
                  <span>{task.campus_location || task.college_name || 'Campus'}</span>
                </>
              ) : (
                <>
                  <MapPin className="w-3 h-3 text-part-green shrink-0" />
                  <span>{task.location?.locality || 'Chennai'}</span>
                </>
              )}
            </span>
          </div>
          <span className="font-heading font-black text-part-green shrink-0 text-sm">
            ₹{task.budget_inr}
          </span>
        </div>

        {safetyNotice && (
          <div className="bg-amber-50 text-amber-900 text-[11px] p-2 text-center border-b border-amber-200 font-medium">
            {safetyNotice}
          </div>
        )}

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F7F8FA]">
          {messages.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <div className="w-10 h-10 rounded-full bg-brand-yellow/20 text-neutral-950 flex items-center justify-center mx-auto">
                <Smile className="w-5 h-5 text-part-green" />
              </div>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                Say hello! Coordinate campus meetup, pickup timing, or document proofs safely.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMine = m.sender_id === currentProfile.id;
              const hasEmbeddedImage = m.content.startsWith('[IMAGE:');
              let imgUrl: string | null = null;
              let textContent = m.content;

              if (hasEmbeddedImage) {
                const endIdx = m.content.indexOf(']');
                imgUrl = m.content.slice(7, endIdx);
                textContent = m.content.slice(endIdx + 1).trim();
              }

              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[78%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      isMine
                        ? 'bg-part-green text-white rounded-br-none'
                        : 'bg-white text-neutral-900 rounded-bl-none border border-neutral-200/80'
                    }`}
                  >
                    {imgUrl && (
                      <div className="mb-2 rounded-xl overflow-hidden border border-black/10">
                        <img
                          src={imgUrl}
                          alt="Attachment"
                          className="max-h-48 w-full object-cover rounded-xl"
                        />
                      </div>
                    )}
                    {textContent && <p className="whitespace-pre-line">{textContent}</p>}
                    <div
                      className={`flex items-center justify-end gap-1 text-[9px] mt-1 ${
                        isMine ? 'text-emerald-100' : 'text-neutral-400'
                      }`}
                    >
                      <span>
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isMine && <CheckCheck className="w-3 h-3 text-white" />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="bg-white px-3 py-1.5 border-t border-neutral-100 flex gap-1.5 overflow-x-auto scrollbar-none">
          {quickReplies.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(r)}
              className="text-[10px] font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 transition cursor-pointer"
            >
              {r}
            </button>
          ))}
        </div>

        {/* Attached Image Preview Bar */}
        {attachedImage && (
          <div className="px-4 py-2 bg-neutral-100 border-t border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src={attachedImage}
                alt="Upload preview"
                className="w-10 h-10 object-cover rounded-lg border border-neutral-300"
              />
              <span className="text-[11px] text-neutral-700 font-semibold">
                Photo ready to send
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAttachedImage(null)}
              className="text-neutral-400 hover:text-rose-600 text-xs font-bold cursor-pointer"
            >
              ✕ Remove
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-neutral-200/90 flex items-center gap-2"
        >
          {/* Image Attachment Button */}
          <label className="w-9 h-9 rounded-2xl bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer shrink-0 transition">
            <ImageIcon className="w-4 h-4 text-neutral-600" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImagePick}
            />
          </label>

          <input
            type="text"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-[#F7F8FA] text-xs sm:text-sm px-3.5 py-2.5 rounded-2xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-part-green font-medium"
          />

          <button
            type="submit"
            disabled={!inputText.trim() && !attachedImage}
            className="w-10 h-10 rounded-2xl bg-part-green hover:bg-part-green-dark disabled:opacity-40 text-white flex items-center justify-center shadow-green transition cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
