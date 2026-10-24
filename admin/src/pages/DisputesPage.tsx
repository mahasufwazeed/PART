import React, { useState } from 'react';
import { mockStore, disputeService, Dispute, DisputeStatus } from '@part/shared';
import { AlertTriangle, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';

export const DisputesPage: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>(
    Array.from(mockStore.disputes.values())
  );
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);

  const handleResolve = async (disputeId: string, resolution: DisputeStatus) => {
    const notes = resolutionNotes || 'Resolved after admin inspection of task evidence.';
    await disputeService.resolveDispute(
      disputeId,
      'c3333333-3333-4333-8333-333333333333', // Arun Admin
      resolution,
      notes
    );
    setDisputes(Array.from(mockStore.disputes.values()));
    setSelectedDisputeId(null);
    setResolutionNotes('');
  };

  return (
    <div className="space-y-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
      <div className="pb-4 border-b border-slate-100">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <span>Dispute Resolution & Evidence Center</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Review evidence from task participants, enforce cancellation policies, and settle funds.
        </p>
      </div>

      {disputes.length === 0 ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center text-xs text-emerald-800 font-medium">
          ✓ No open disputes. All Chennai transactions operating smoothly.
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => {
            const task = mockStore.tasks.get(dispute.task_id);
            const isSelected = selectedDisputeId === dispute.id;

            return (
              <div
                key={dispute.id}
                className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded uppercase tracking-wider">
                      Dispute #{dispute.id.slice(-6)} • Status: {dispute.status}
                    </span>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                      {dispute.reason}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Task Reference: "{task?.title || 'Task'}" (Budget: ₹{task?.budget_inr})
                    </p>
                  </div>

                  <span className="text-[10px] text-slate-400">
                    Opened {new Date(dispute.created_at).toLocaleString()}
                  </span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
                  <span className="font-bold text-slate-900 block mb-1">
                    Participant Statement:
                  </span>
                  <p className="leading-relaxed whitespace-pre-line">{dispute.details}</p>
                </div>

                {dispute.status === 'OPEN' ? (
                  <div className="pt-2 space-y-2">
                    {isSelected ? (
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-3">
                        <label className="block text-xs font-bold text-slate-800">
                          Admin Resolution Audit Notes:
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Mutual consent achieved; evidence confirmed delivery."
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleResolve(dispute.id, 'RESOLVED_PAY_WORKER')}
                            className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition"
                          >
                            Pay Worker (Release Funds)
                          </button>
                          <button
                            onClick={() => handleResolve(dispute.id, 'RESOLVED_REFUND')}
                            className="bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-rose-700 transition"
                          >
                            Refund Requester
                          </button>
                          <button
                            onClick={() => setSelectedDisputeId(null)}
                            className="text-xs text-slate-500 px-3 py-1.5"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedDisputeId(dispute.id)}
                        className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl shadow hover:bg-primaryDark transition"
                      >
                        Take Adjudication Action
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-2.5 rounded-xl text-xs flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-accent" />
                    <span>
                      Resolved: {dispute.resolution_notes || 'Case closed by admin.'}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
