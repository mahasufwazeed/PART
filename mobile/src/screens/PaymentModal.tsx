import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { paymentService, calculateTaskFees, mockStore, PaymentMethod } from '@part/shared';
import {
  X,
  Banknote,
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export const PaymentModal: React.FC = () => {
  const {
    activePaymentTaskId,
    closePayment,
    currentProfile,
    openReview,
    language,
  } = useAppStore();

  const [method, setMethod] = useState<PaymentMethod>('CASH_ON_COMPLETION');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const task = activePaymentTaskId ? mockStore.tasks.get(activePaymentTaskId) : null;
  if (!activePaymentTaskId || !task) return null;

  const fees = calculateTaskFees(task.budget_inr, 10);

  const handleSettlePayment = async () => {
    setIsProcessing(true);
    await paymentService.recordPayment({
      taskId: task.id,
      payerId: task.requester_id,
      payeeId: task.assigned_worker_id || '',
      totalAmountInr: task.budget_inr,
      paymentMethod: method,
    });

    setIsProcessing(false);
    setPaymentSuccess(true);

    setTimeout(() => {
      closePayment();
      openReview(task.id);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-slide-up">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-900">
            {language === 'ta' ? 'பணம் செலுத்துதல்' : 'Task Payment & Settlement'}
          </h3>
          <button
            onClick={closePayment}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {paymentSuccess ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-black text-slate-900">
              Payment Settled Successfully!
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Payment record saved in database. Opening review form...
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-3">
            {/* Transparent Fee Breakdown */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Task Agreed Budget:</span>
                <span className="font-bold text-slate-900">{fees.formattedTotal}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Platform Service Fee ({fees.platformFeePercent}%):</span>
                <span className="font-medium text-slate-700">{fees.formattedFee}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-black text-sm text-slate-900">
                <span>Net Worker Payout:</span>
                <span className="text-accent">{fees.formattedWorkerPayout}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                Choose Settlement Method:
              </label>

              <div className="space-y-2">
                <label
                  onClick={() => setMethod('CASH_ON_COMPLETION')}
                  className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                    method === 'CASH_ON_COMPLETION'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-accent" />
                  <div className="flex-1">
                    <span className="text-xs font-bold block">
                      Cash on Completion (Recommended for Chennai)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Hand cash directly to worker upon task inspection.
                    </span>
                  </div>
                  <input
                    type="radio"
                    name="method"
                    checked={method === 'CASH_ON_COMPLETION'}
                    onChange={() => setMethod('CASH_ON_COMPLETION')}
                    className="accent-primary"
                  />
                </label>

                <label
                  onClick={() => setMethod('SANDBOX_ONLINE')}
                  className={`flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                    method === 'SANDBOX_ONLINE'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-secondary" />
                  <div className="flex-1">
                    <span className="text-xs font-bold block">
                      Sandbox Online Payment (UPI / Cards Test)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Simulated authenticated sandbox gateway transaction.
                    </span>
                  </div>
                  <input
                    type="radio"
                    name="method"
                    checked={method === 'SANDBOX_ONLINE'}
                    onChange={() => setMethod('SANDBOX_ONLINE')}
                    className="accent-primary"
                  />
                </label>
              </div>
            </div>

            <button
              onClick={handleSettlePayment}
              disabled={isProcessing}
              className="w-full bg-primary text-white font-black text-xs py-3.5 rounded-xl shadow-lg hover:bg-primaryDark active:scale-[0.99] transition disabled:opacity-50"
            >
              {isProcessing
                ? 'Confirming Transaction...'
                : `Confirm Settlement of ₹${task.budget_inr}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
