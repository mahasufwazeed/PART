import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { taskService, Task, TaskApplication, TaskAssignment } from '@part/shared';
import { StatusBadge } from '../components/StatusBadge';
import {
  X,
  MapPin,
  Clock,
  IndianRupee,
  Star,
  ShieldCheck,
  MessageSquare,
  AlertTriangle,
  UserCheck,
  Send,
  CheckCircle,
  Lock,
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
    if (!selectedTaskId) return;
    const details = await taskService.getTaskById(
      selectedTaskId,
      currentProfile.id
    );
    setTaskData(details);
  };

  useEffect(() => {
    loadDetails();
  }, [selectedTaskId, currentProfile.id]);

  if (!selectedTaskId || !taskData?.task) return null;

  const { task, applications, assignments, isRequester, isAssignedWorker } = taskData;
  const hasAlreadyApplied = applications.some(
    (a) => a.worker_id === currentProfile.id
  );

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
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md max-h-[90vh] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-y-auto flex flex-col animate-slide-up">
        {/* Sticky Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-slate-100 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">
              {task.category?.name_en}
            </span>
            <StatusBadge status={task.status} />
          </div>
          <button
            onClick={closeTaskDetails}
            className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4 flex-1">
          {actionError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {actionSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-3 rounded-xl flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0 text-accent" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* Title & Budget Bar */}
          <div>
            <h2 className="text-base font-extrabold text-slate-900 leading-snug">
              {task.title}
            </h2>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">
                  Agreed Payment
                </span>
                <span className="text-xl font-black text-primary">
                  ₹{task.budget_inr.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium">
                  Estimated Time
                </span>
                <span className="text-xs font-bold text-slate-700 flex items-center justify-end gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {task.estimated_duration_minutes} mins
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <h4 className="text-xs font-bold text-slate-800 mb-1">
              {language === 'ta' ? 'பணி விவரம்' : 'Task Scope & Description'}
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
              {task.description}
            </p>
          </div>

          {/* Location details & Safe disclosure */}
          <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-100 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <MapPin className="w-4 h-4 text-secondary" />
              <span>{task.location?.locality}, Chennai</span>
            </div>
            <p className="text-xs text-slate-600">
              <span className="font-semibold">Public Landmark:</span>{' '}
              {task.location?.address_approximate}
            </p>

            {task.location?.address_exact ? (
              <div className="bg-emerald-100/70 border border-emerald-300 p-2 rounded-xl mt-2">
                <span className="text-[11px] font-bold text-emerald-900 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                  Exact Address (Shared with you):
                </span>
                <p className="text-xs text-emerald-950 font-medium mt-0.5">
                  {task.location.address_exact}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Exact address revealed only to the confirmed worker.</span>
              </div>
            )}
          </div>

          {/* Requester Profile Snapshot */}
          {task.requester && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                  {task.requester.full_name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    {task.requester.full_name}
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    Task Requester • {task.requester.general_location}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                <span>{task.requester.rating_as_requester.toFixed(1)}</span>
              </div>
            </div>
          )}

          {/* Communication & Active Execution Actions */}
          {(isRequester || isAssignedWorker) && (
            <div className="space-y-2">
              <button
                onClick={() => openChat(task.id)}
                className="w-full bg-slate-900 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-800 transition"
              >
                <MessageSquare className="w-4 h-4 text-accent" />
                <span>Open Task In-App Chat</span>
              </button>

              {/* Progress State Actions */}
              {task.status === 'ASSIGNED' && isAssignedWorker && (
                <button
                  onClick={async () => {
                    await taskService.startTask(task.id, currentProfile.id);
                    await loadDetails();
                  }}
                  className="w-full bg-secondary text-white text-xs font-bold py-2.5 rounded-xl shadow"
                >
                  Start Task (Begin Work)
                </button>
              )}

              {task.status === 'IN_PROGRESS' && isAssignedWorker && (
                <button
                  onClick={async () => {
                    await taskService.submitCompletion(
                      task.id,
                      assignments[0]?.id || 'asgn-default',
                      currentProfile.id,
                      'Work finished successfully on location.'
                    );
                    await loadDetails();
                  }}
                  className="w-full bg-accent text-slate-950 font-black text-xs py-2.5 rounded-xl shadow"
                >
                  Submit Completion Evidence
                </button>
              )}

              {task.status === 'COMPLETION_SUBMITTED' && isRequester && (
                <button
                  onClick={async () => {
                    await taskService.confirmCompletion(task.id, currentProfile.id);
                    await loadDetails();
                    openPayment(task.id);
                  }}
                  className="w-full bg-emerald-600 text-white font-bold text-xs py-2.5 rounded-xl shadow"
                >
                  Confirm Completion & Settle Payment
                </button>
              )}

              {task.status === 'COMPLETED' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => openPayment(task.id)}
                    className="bg-indigo-50 border border-indigo-200 text-primary font-bold text-xs py-2 rounded-xl text-center"
                  >
                    Payment Details
                  </button>
                  <button
                    onClick={() => openReview(task.id)}
                    className="bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs py-2 rounded-xl text-center"
                  >
                    ★ Submit Review
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Requester Applicant Management Section */}
          {isRequester && task.status === 'OPEN' && (
            <div className="border-t border-slate-200 pt-3">
              <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center justify-between">
                <span>Task Applicants ({applications.length})</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Select 1 verified worker
                </span>
              </h4>

              {applications.length === 0 ? (
                <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-xl text-center">
                  Waiting for nearby workers to apply.
                </p>
              ) : (
                <div className="space-y-2">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">
                            {app.worker?.full_name}
                          </span>
                          <span className="text-[10px] text-amber-600 font-semibold">
                            ★ {app.worker?.rating_as_worker.toFixed(1)}
                          </span>
                        </div>
                        {app.pitch_message && (
                          <p className="text-[11px] text-slate-600 italic mt-0.5">
                            "{app.pitch_message}"
                          </p>
                        )}
                      </div>

                      <button
                        onClick={() => handleSelectWorker(app.worker_id, app.id)}
                        className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow hover:bg-primaryDark transition shrink-0"
                      >
                        Select Worker
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Worker Apply Flow */}
          {!isRequester && task.status === 'OPEN' && (
            <div className="border-t border-slate-200 pt-3 space-y-3">
              {hasAlreadyApplied ? (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-center text-xs text-blue-900 font-medium">
                  ✓ You have applied for this task. Waiting for requester selection.
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Send an Application Pitch (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. I am in the same locality on two-wheeler and can finish in 30 mins."
                    value={pitchMessage}
                    onChange={(e) => setPitchMessage(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleApply}
                    disabled={isApplying}
                    className="w-full bg-gradient-to-r from-accent to-emerald-600 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg hover:shadow-xl active:scale-[0.99] transition flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Apply for Task (₹{task.budget_inr})</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Dispute & Safety Help Button */}
          <div className="pt-2 text-center">
            <button
              onClick={() => openDispute(task.id)}
              className="text-[11px] text-slate-400 hover:text-rose-600 transition flex items-center justify-center gap-1 mx-auto"
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
