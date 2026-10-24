export interface FeeBreakdown {
  totalAmountInr: number;
  platformFeePercent: number;
  platformFeeInr: number;
  workerPayoutInr: number;
  formattedTotal: string;
  formattedFee: string;
  formattedWorkerPayout: string;
}

export const DEFAULT_PLATFORM_FEE_PERCENT = 10;

/**
 * Calculate transparent fee breakdown for a task
 */
export function calculateTaskFees(
  budgetInr: number,
  platformFeePercent: number = DEFAULT_PLATFORM_FEE_PERCENT
): FeeBreakdown {
  if (budgetInr < 0) {
    throw new Error('Budget cannot be negative');
  }
  if (platformFeePercent < 0 || platformFeePercent > 50) {
    throw new Error('Platform fee must be between 0% and 50%');
  }

  // Calculate platform fee rounded to nearest rupee
  const platformFeeInr = Math.round((budgetInr * platformFeePercent) / 100);
  const workerPayoutInr = budgetInr - platformFeeInr;

  return {
    totalAmountInr: budgetInr,
    platformFeePercent,
    platformFeeInr,
    workerPayoutInr,
    formattedTotal: `₹${budgetInr.toLocaleString('en-IN')}`,
    formattedFee: `₹${platformFeeInr.toLocaleString('en-IN')}`,
    formattedWorkerPayout: `₹${workerPayoutInr.toLocaleString('en-IN')}`,
  };
}
