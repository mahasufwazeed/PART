import React from 'react';
import { TaskStatus } from '@part/shared';

interface Props {
  status: TaskStatus;
}

export const StatusBadge: React.FC<Props> = ({ status }) => {
  switch (status) {
    case 'OPEN':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-yellow/25 text-neutral-900 border border-brand-yellow/50">
          ● Open
        </span>
      );
    case 'ASSIGNED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
          Assigned
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
          In Progress
        </span>
      );
    case 'COMPLETION_SUBMITTED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
          Pending Approval
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
          ✓ Completed
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-neutral-100 text-neutral-600 border border-neutral-200">
          Cancelled
        </span>
      );
    case 'DISPUTED':
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
          ⚠️ Disputed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700">
          {status}
        </span>
      );
  }
};
