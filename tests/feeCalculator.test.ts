import { describe, it, expect } from 'vitest';
import { calculateTaskFees, DEFAULT_PLATFORM_FEE_PERCENT } from '../shared/src/utils/feeCalculator';

describe('Platform Fee & Payout Calculator', () => {
  it('correctly calculates 10% fee on standard ₹500 task', () => {
    const breakdown = calculateTaskFees(500, 10);
    expect(breakdown.totalAmountInr).toBe(500);
    expect(breakdown.platformFeePercent).toBe(10);
    expect(breakdown.platformFeeInr).toBe(50);
    expect(breakdown.workerPayoutInr).toBe(450);
    expect(breakdown.formattedTotal).toBe('₹500');
    expect(breakdown.formattedFee).toBe('₹50');
    expect(breakdown.formattedWorkerPayout).toBe('₹450');
  });

  it('handles custom fee percentage and rounds to nearest rupee', () => {
    // ₹150 with 10% fee = 15 fee, 135 worker
    const b1 = calculateTaskFees(150, 10);
    expect(b1.platformFeeInr).toBe(15);
    expect(b1.workerPayoutInr).toBe(135);

    // ₹175 with 7.5% fee = 13.125 -> 13
    const b2 = calculateTaskFees(175, 7.5);
    expect(b2.platformFeeInr).toBe(13);
    expect(b2.workerPayoutInr).toBe(162);
  });

  it('uses default platform fee when not specified', () => {
    const breakdown = calculateTaskFees(1000);
    expect(breakdown.platformFeePercent).toBe(DEFAULT_PLATFORM_FEE_PERCENT);
    expect(breakdown.platformFeeInr).toBe(100);
    expect(breakdown.workerPayoutInr).toBe(900);
  });

  it('rejects negative budgets and invalid percentages', () => {
    expect(() => calculateTaskFees(-100)).toThrow('Budget cannot be negative');
    expect(() => calculateTaskFees(100, -5)).toThrow('Platform fee must be between 0% and 50%');
    expect(() => calculateTaskFees(100, 60)).toThrow('Platform fee must be between 0% and 50%');
  });
});
