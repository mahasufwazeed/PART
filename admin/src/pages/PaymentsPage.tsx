import React, { useState } from 'react';
import { mockStore, Payment } from '@part/shared';
import { CreditCard, Banknote, ShieldCheck, IndianRupee } from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>(
    Array.from(mockStore.payments.values())
  );

  return (
    <div className="space-y-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">
            Payment & Escrow Transaction Audit
          </h2>
          <p className="text-xs text-slate-400">
            Real-time ledger of Cash on Completion and Sandbox Online settlements across Chennai.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
            Total Settled
          </span>
          <span className="text-base font-black text-slate-900">
            ₹{payments.reduce((sum, p) => sum + p.total_amount_inr, 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 border-b border-slate-100 uppercase text-[10px] tracking-wider">
              <th className="pb-3">Transaction ID</th>
              <th className="pb-3">Method</th>
              <th className="pb-3">Gross Budget</th>
              <th className="pb-3">Platform Fee (10%)</th>
              <th className="pb-3">Worker Payout</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right">Settled At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                  No payment transactions recorded yet. Complete tasks in mobile app to populate ledger.
                </td>
              </tr>
            ) : (
              payments.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 font-mono text-[11px] text-slate-600">
                    {pay.id.slice(-8)}
                  </td>

                  <td className="py-3.5 font-bold text-slate-800 flex items-center gap-1.5">
                    {pay.payment_method === 'CASH_ON_COMPLETION' ? (
                      <Banknote className="w-4 h-4 text-accent" />
                    ) : (
                      <CreditCard className="w-4 h-4 text-secondary" />
                    )}
                    <span>{pay.payment_method}</span>
                  </td>

                  <td className="py-3.5 font-bold text-slate-900">
                    ₹{pay.total_amount_inr}
                  </td>

                  <td className="py-3.5 text-primary font-semibold">
                    ₹{pay.platform_fee_inr}
                  </td>

                  <td className="py-3.5 text-accent font-extrabold">
                    ₹{pay.worker_amount_inr}
                  </td>

                  <td className="py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {pay.status}
                    </span>
                  </td>

                  <td className="py-3.5 text-right text-slate-500">
                    {new Date(pay.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
