import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { disputeService, mockStore } from '@part/shared';
import { X, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const DisputeModal: React.FC = () => {
  const { activeDisputeTaskId, closeDispute, currentProfile } = useAppStore();
  const [reason, setReason] = useState('Scope of work discrepancy');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const task = activeDisputeTaskId ? mockStore.tasks.get(activeDisputeTaskId) : null;
  if (!activeDisputeTaskId || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!details.trim()) return;

    setIsSubmitting(true);
    await disputeService.raiseDispute({
      taskId: task.id,
      raisedBy: currentProfile.id,
      reason,
      details,
    });

    setIsSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      closeDispute();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-slide-up">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-rose-600 font-extrabold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>Report Issue / Open Dispute</span>
          </div>
          <button
            onClick={closeDispute}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-black text-slate-900">
              Dispute Registered with Admin Team
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Our Chennai moderation team will review evidence within 2 hours.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-3">
            <p className="text-xs text-slate-600 leading-relaxed">
              We take safety and fairness seriously. Please state why you are disputing "{task.title}".
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Reason for Dispute *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white focus:outline-none"
              >
                <option value="Incomplete task delivery">Incomplete task delivery</option>
                <option value="Damaged or incorrect parcel">Damaged or incorrect parcel</option>
                <option value="Worker or requester did not arrive">Did not arrive on location</option>
                <option value="Inappropriate conduct or safety violation">
                  Inappropriate conduct or safety violation
                </option>
                <option value="Payment disagreement">Payment disagreement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Comprehensive Details *
              </label>
              <textarea
                rows={3}
                placeholder="Describe what occurred with specific timestamps and facts..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !details.trim()}
              className="w-full bg-rose-600 text-white font-bold text-xs py-3.5 rounded-xl shadow-lg hover:bg-rose-700 active:scale-[0.99] transition disabled:opacity-50"
            >
              {isSubmitting ? 'Registering Dispute...' : 'Submit Dispute to Admin'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
