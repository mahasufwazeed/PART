import { supabase, isLiveSupabaseConfigured } from './client';
import { mockStore } from './mockStore';
import { Payment, PaymentMethod, PaymentStatus } from '../types';
import { calculateTaskFees } from '../utils/feeCalculator';

export interface WorkerEarningsSummary {
  totalEarnedInr: number;
  pendingPaymentInr: number;
  completedTasksCount: number;
  platformFeesPaidInr: number;
  payments: Payment[];
}

export const paymentService = {
  /**
   * Record a settlement payment for completed task
   */
  async recordPayment(params: {
    taskId: string;
    payerId: string;
    payeeId: string;
    totalAmountInr: number;
    paymentMethod: PaymentMethod;
    platformFeePercent?: number;
    notes?: string;
  }): Promise<{ payment: Payment; error?: string }> {
    const {
      taskId,
      payerId,
      payeeId,
      totalAmountInr,
      paymentMethod,
      platformFeePercent = 10,
      notes,
    } = params;

    const fees = calculateTaskFees(totalAmountInr, platformFeePercent);
    const initialStatus: PaymentStatus =
      paymentMethod === 'CASH_ON_COMPLETION' ? 'SUCCESS' : 'SUCCESS'; // Sandbox auto-settles in dev mode

    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase
        .from('payments')
        .insert({
          task_id: taskId,
          payer_id: payerId,
          payee_id: payeeId,
          total_amount_inr: totalAmountInr,
          platform_fee_inr: fees.platformFeeInr,
          worker_amount_inr: fees.workerPayoutInr,
          platform_fee_percent: platformFeePercent,
          status: initialStatus,
          payment_method: paymentMethod,
          notes,
          settled_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) return { payment: null as any, error: error.message };
      return { payment: data as Payment };
    }

    const paymentId = `pay-${Date.now()}`;
    const newPayment: Payment = {
      id: paymentId,
      task_id: taskId,
      payer_id: payerId,
      payee_id: payeeId,
      total_amount_inr: totalAmountInr,
      platform_fee_inr: fees.platformFeeInr,
      worker_amount_inr: fees.workerPayoutInr,
      platform_fee_percent: platformFeePercent,
      status: initialStatus,
      payment_method: paymentMethod,
      notes: notes || (paymentMethod === 'CASH_ON_COMPLETION' ? 'Settled via direct cash in Chennai' : 'Sandbox online settlement'),
      created_at: new Date().toISOString(),
      settled_at: new Date().toISOString(),
    };

    mockStore.payments.set(paymentId, newPayment);
    return { payment: newPayment };
  },

  /**
   * Calculate worker earnings breakdown
   */
  async getWorkerEarnings(workerId: string): Promise<WorkerEarningsSummary> {
    const payments = Array.from(mockStore.payments.values()).filter(
      (p) => p.payee_id === workerId
    );

    let totalEarnedInr = 0;
    let pendingPaymentInr = 0;
    let platformFeesPaidInr = 0;
    let completedTasksCount = 0;

    for (const p of payments) {
      if (p.status === 'SUCCESS') {
        totalEarnedInr += p.worker_amount_inr;
        platformFeesPaidInr += p.platform_fee_inr;
        completedTasksCount += 1;
      } else if (p.status === 'PENDING' || p.status === 'INITIATED') {
        pendingPaymentInr += p.worker_amount_inr;
      }
    }

    return {
      totalEarnedInr,
      pendingPaymentInr,
      completedTasksCount,
      platformFeesPaidInr,
      payments: payments.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    };
  },

  /**
   * Get all payments for platform admin
   */
  async getAllPayments(): Promise<Payment[]> {
    return Array.from(mockStore.payments.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },
};
