import React, { useState } from 'react';
import { mockStore, Task, TaskStatus } from '@part/shared';
import { Trash2, AlertCircle, MapPin, Eye, CheckCircle2 } from 'lucide-react';

export const TasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(
    Array.from(mockStore.tasks.values())
  );
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filtered = tasks.filter(
    (t) => filterStatus === 'ALL' || t.status === filterStatus
  );

  const handleRemoveTask = (taskId: string) => {
    if (confirm('Are you sure you want to remove this task for policy violation?')) {
      const t = mockStore.tasks.get(taskId);
      if (t) {
        t.status = 'CANCELLED';
        setTasks(Array.from(mockStore.tasks.values()));
      }
    }
  };

  const statuses = [
    'ALL',
    'OPEN',
    'ASSIGNED',
    'IN_PROGRESS',
    'COMPLETION_SUBMITTED',
    'COMPLETED',
    'CANCELLED',
    'DISPUTED',
  ];

  return (
    <div className="space-y-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="text-base font-extrabold text-slate-900">
            Task Marketplace Moderation
          </h2>
          <p className="text-xs text-slate-400">
            Monitor active gig postings and remove prohibited or hazardous requests.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                filterStatus === s
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-slate-400 border-b border-slate-100 uppercase text-[10px] tracking-wider">
              <th className="pb-3">Title & Scope</th>
              <th className="pb-3">Locality</th>
              <th className="pb-3">Budget</th>
              <th className="pb-3">Duration</th>
              <th className="pb-3">Status</th>
              <th className="pb-3 text-right">Moderation Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((task) => {
              const loc = mockStore.locations.get(task.id);
              return (
                <tr key={task.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 max-w-[260px]">
                    <span className="font-bold text-slate-900 block truncate">
                      {task.title}
                    </span>
                    <span className="text-[11px] text-slate-500 line-clamp-1">
                      {task.description}
                    </span>
                  </td>

                  <td className="py-3.5">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-secondary" />
                      {loc?.locality || 'Chennai'}
                    </span>
                  </td>

                  <td className="py-3.5 font-black text-slate-900">
                    ₹{task.budget_inr}
                  </td>

                  <td className="py-3.5 text-slate-600">
                    {task.estimated_duration_minutes} mins
                  </td>

                  <td className="py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                      {task.status}
                    </span>
                  </td>

                  <td className="py-3.5 text-right space-x-2">
                    <button
                      onClick={() => handleRemoveTask(task.id)}
                      className="text-xs font-bold text-rose-600 hover:underline inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Take Down</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
