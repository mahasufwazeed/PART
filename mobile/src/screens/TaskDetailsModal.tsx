import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  taskService,
  Task,
  TaskApplication,
  TaskAssignment,
  TASK_CATEGORIES,
} from '@part/shared';
import { StatusBadge } from '../components/StatusBadge';
import { LiveTrackingSheet } from '../components/LiveTrackingSheet';

import {
  X,
  MapPin,
  Clock,
  IndianRupee,
  Star,
  ShieldCheck,
  MessageSquare,
  AlertTriangle,
  Send,
  CheckCircle,
  Lock,
  Calendar,
  Sparkles,
  Package,
  ShoppingCart,
  Home,
  GraduationCap,
  Cpu,
  Briefcase,
} from 'lucide-react';

export const TaskDetailsModal: React.FC = () => {
  const {
    selectedTaskId,
    closeTaskDetails,
    currentProfile,
    openChat,
    openPayment,
    openReview,
    openDispute,
    language,
  } = useAppStore();

  const [taskData, setTaskData] = useState<{
    task: Task | null;
    applications: TaskApplication[];
    assignments: TaskAssignment[];
    isRequester: boolean;
    isAssignedWorker: boolean;
  } | null>(null);

  const [pitchMessage, setPitchMessage] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadDetails = async () => {
    if (!selectedTaskId || !currentProfile) return;
    const details = await taskService.getTaskById(
      selectedTaskId,
      currentProfile.id
    );
    setTaskData(details);
  };

  useEffect(() => {
    loadDetails();
  }, [selectedTaskId, currentProfile?.id]);

  if (!selectedTaskId || !taskData?.task || !currentProfile) return null;

  const { task, applications, assignments, isRequester, isAssignedWorker } = taskData;
  const hasAlreadyApplied = applications.some(
    (a) => a.worker_id === currentProfile.id
  );

  const categoryDef = TASK_CATEGORIES.find((c) => c.id === task.category_id);
  const categoryName =
    language === 'ta' && categoryDef?.name_ta
      ? categoryDef.name_ta
      : categoryDef?.name_en || task.category?.name_en || 'Task';

  const handleApply = async () => {
    setIsApplying(true);
    setActionError(null);
    const { application, error } = await taskService.applyForTask(
      task.id,
      currentProfile.id,
      pitchMessage
    );

    if (error) {
      setActionError(error);
    } else {
      setActionSuccess('Application submitted successfully!');
      setPitchMessage('');
      await loadDetails();
    }
    setIsApplying(false);
  };

  const handleSelectWorker = async (workerId: string, appId?: string) => {
    setActionError(null);
    const { assignment, error } = await taskService.assignWorker(
      task.id,
      workerId,
      appId,
      currentProfile.id
    );

    if (error) {
      setActionError(error);
    } else {
      setActionSuccess('Worker assigned! Conversation started.');
      await loadDetails();
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
      <div className="bg-white w-full max-w-md max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto flex flex-col animate-slide-up">
        {/* Category Banner & Close Button */}
        <div
          style={{
            backgroundColor: categoryDef?.pastelBg || '#FFF7ED',
          }}
          className="px-4 py-3.5 border-b border-neutral-200/80 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md"
        >
          <div className="flex items-center gap-2">
            <span
              style={{ color: categoryDef?.accentColor || '#EA580C' }}
              className="text-xs font-heading font-black uppercase tracking-wider"
            >
              {categoryName}
            </span>
            <StatusBadge status={task.status} />
          </div>

          <button
            type="button"
            onClick={closeTaskDetails}
            className="w-8 h-8 rounded-full bg-white/90 hover:bg-white text-neutral-700 flex items-center justify-center font-bold text-sm shadow-xs transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-4 flex-1">
          {actionError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-2xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{actionError}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-2xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-part-green" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Title & Prominent Reward Badge */}
          <div className="bg-[#F7F8FA] p-4 rounded-3xl border border-neutral-200/80 shadow-quick">
            <h2 className="font-heading font-black text-lg text-neutral-950 leading-snug">
              {task.title}
            </h2>

            <div className="flex items-end justify-between mt-3 pt-3 border-t border-neutral-200/60">
              <div>
                <span className="text-[10px] text-neutral-400 font-black uppercase tracking-wider block">
                  Guaranteed Reward
                </span>
                <span className="font-heading font-black text-2xl text-part-green">
                  ₹{task.budget_inr.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-neutral-400 font-black uppercase tracking-wider block">
                  Est. Duration
                </span>
                <span className="font-heading font-bold text-xs text-neutral-800 inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-neutral-200 shadow-xs">
                  <Clock className="w-3 h-3 text-part-green" />
                  {task.estimated_duration_minutes} min
                </span>
              </div>
            </div>
          </div>

          {/* Task Scope & Details */}
          <div className="space-y-1">
            <h4 className="font-heading font-bold text-xs text-neutral-800">
              {language === 'ta' ? 'பணி விளக்கம்' : 'Task Description'}
            </h4>
            <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 text-xs text-neutral-700 leading-relaxed whitespace-pre-line">
              {task.description}
            </div>
          </div>

          {/* Location & Safe Address Disclosure */}
          <div className="bg-white p-3.5 rounded-2xl border border-neutral-200/80 space-y-1.5 shadow-quick">
            <div className="flex items-center gap-1.5 text-xs font-heading font-black text-neutral-900">
              <MapPin className="w-4 h-4 text-part-green" />
              <span>{task.location?.locality || 'Chennai'}</span>
            </div>

            <p className="text-xs text-neutral-600">
              <span className="font-semibold text-neutral-800">Public Landmark:</span>{' '}
              {task.location?.address_approximate || 'Nearby area'}
            </p>

            {task.location?.address_exact ? (
              <div className="bg-emerald-50 border border-emerald-300 p-2.5 rounded-xl mt-2 text-xs">
                <span className="font-heading font-bold text-part-green flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-part-green" />
                  Exact Residential Address (Revealed for Assigned Work):
                </span>
                <p className="text-neutral-950 font-medium mt-0.5">
                  {task.location.address_exact}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-500 bg-neutral-50 p-2 rounded-xl mt-1">
                <Lock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span>Exact address is safely masked until worker is formally assigned.</span>
              </div>
            )}
          </div>

          {/* Requester Information */}
          {task.requester && (
            <div className="flex items-center justify-between p-3.5 bg-white rounded-2xl border border-neutral-200/80 shadow-quick">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-brand-yellow/30 text-neutral-950 font-heading font-black flex items-center justify-center text-xs">
                  {task.requester.full_name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-heading font-bold text-xs text-neutral-900">
                    {task.requester.full_name}
                  </h4>
                  <span className="text-[10px] text-neutral-500">
                    Neighborhood Requester • {task.requester.general_location}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-xl border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>{task.requester.rating_as_requester.toFixed(1)}</span>
              </div>
            </div>
          )}

          {/* Direct In-App Chat Action if Participant */}
          {(isRequester || isAssignedWorker) && (
            <button
              type="button"
              onClick={() => openChat(task.id)}
              className="w-full bg-neutral-900 hover:bg-neutral-800 text-white font-heading font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-brand-yellow" />
              <span>Open Task Chat</span>
            </button>
          )}

          {/* Live Worker Tracking & Route Navigation */}
          {(task.status === 'ASSIGNED' || task.status === 'IN_PROGRESS') &&
            (isRequester || isAssignedWorker) &&
            task.location && (
              <LiveTrackingSheet
                taskId={task.id}
                isWorker={isAssignedWorker}
                taskStatus={task.status}
                taskLocation={{
                  latitude: task.location.latitude,
                  longitude: task.location.longitude,
                  locality: task.location.locality,
                  address_exact: task.location.address_exact,
                }}
                taskTitle={task.title}
              />
            )}


          {/* Worker Actions in Progress */}
          {task.status === 'ASSIGNED' && isAssignedWorker && (
            <button
              type="button"
              onClick={async () => {
                await taskService.startTask(task.id, currentProfile.id);
                await loadDetails();
              }}
              className="w-full bg-part-green hover:bg-part-green-dark text-white font-heading font-black text-xs py-3.5 rounded-2xl shadow-green transition cursor-pointer"
            >
              Start Task (Begin Work)
            </button>
          )}

          {task.status === 'IN_PROGRESS' && isAssignedWorker && (
            <button
              type="button"
              onClick={async () => {
                await taskService.submitCompletion(
                  task.id,
                  assignments[0]?.id || 'asgn-default',
                  currentProfile.id,
                  'Work finished successfully on location.'
                );
                await loadDetails();
              }}
              className="w-full bg-brand-yellow hover:bg-brand-yellow-hover text-neutral-950 font-heading font-black text-xs py-3.5 rounded-2xl shadow-yellow transition cursor-pointer"
            >
              Submit Completion Evidence
            </button>
          )}

          {task.status === 'COMPLETION_SUBMITTED' && isRequester && (
            <button
              type="button"
              onClick={async () => {
                await taskService.confirmCompletion(task.id, currentProfile.id);
                await loadDetails();
                openPayment(task.id);
              }}
              className="w-full bg-part-green hover:bg-part-green-dark text-white font-heading font-black text-xs py-3.5 rounded-2xl shadow-green transition cursor-pointer"
            >
              Confirm Completion & Settle Payment
            </button>
          )}

          {task.status === 'COMPLETED' && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => openPayment(task.id)}
                className="bg-emerald-50 border border-emerald-200 text-part-green font-heading font-bold text-xs py-2.5 rounded-xl text-center"
              >
                Payment Ledger
              </button>
              <button
                type="button"
                onClick={() => openReview(task.id)}
                className="bg-amber-50 border border-amber-200 text-amber-900 font-heading font-bold text-xs py-2.5 rounded-xl text-center"
              >
                ★ Submit Review
              </button>
            </div>
          )}

          {/* Requester View: Manage Applicants */}
          {isRequester && task.status === 'OPEN' && (
            <div className="border-t border-neutral-200 pt-3 space-y-2">
              <h4 className="font-heading font-bold text-xs text-neutral-900 flex items-center justify-between">
                <span>Task Applicants ({applications.length})</span>
                <span className="text-[10px] text-neutral-400 font-normal">
                  Select 1 verified worker
                </span>
              </h4>

              {applications.length === 0 ? (
                <p className="text-xs text-neutral-500 italic bg-neutral-50 p-3 rounded-2xl text-center">
                  Waiting for nearby workers to apply.
                </p>
              ) : (
                <div className="space-y-2">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="p-3 bg-neutral-50 border border-neutral-200/80 rounded-2xl flex items-center justify-between gap-2 shadow-xs"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-heading font-bold text-xs text-neutral-900">
                            {app.worker?.full_name}
                          </span>
                          <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.2 rounded">
                            ★ {app.worker?.rating_as_worker.toFixed(1)}
                          </span>
                        </div>
                        {app.pitch_message && (
                          <p className="text-[11px] text-neutral-600 italic mt-0.5">
                            "{app.pitch_message}"
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSelectWorker(app.worker_id, app.id)}
                        className="bg-part-green hover:bg-part-green-dark text-white font-heading font-bold text-xs px-3 py-1.5 rounded-xl shadow-green transition shrink-0 cursor-pointer"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Worker View: Apply Flow */}
          {!isRequester && task.status === 'OPEN' && (
            <div className="border-t border-neutral-200 pt-3 space-y-3">
              {hasAlreadyApplied ? (
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-center text-xs text-emerald-900 font-bold">
                  ✓ Application Sent! The requester will review your profile.
                </div>
              ) : (
                <div className="space-y-2.5">
                  <label className="block text-xs font-heading font-bold text-neutral-800">
                    Application Note (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Nearby with bike, can complete in 20 minutes."
                    value={pitchMessage}
                    onChange={(e) => setPitchMessage(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-part-green"
                  />
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={isApplying}
                    className="w-full bg-part-green hover:bg-part-green-dark text-white font-heading font-black text-xs py-3.5 rounded-2xl shadow-green hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Apply for Task (₹{task.budget_inr})</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Safety & Dispute Link */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => openDispute(task.id)}
              className="text-[11px] text-neutral-400 hover:text-rose-600 transition flex items-center justify-center gap-1 mx-auto cursor-pointer"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Report an issue or open dispute</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
