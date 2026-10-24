import React, { useState, useEffect } from 'react';
import { mockStore, Task, Dispute, Payment } from '@part/shared';
import { MetricCard } from '../components/MetricCard';
import {
  Users,
  Briefcase,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  TrendingUp,
  MapPin,
  ExternalLink,
} from 'lucide-react';

interface Props {
  onNavigate: (tab: any) => void;
}

export const OverviewPage: React.FC<Props> = ({ onNavigate }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    setTasks(Array.from(mockStore.tasks.values()));
    setDisputes(Array.from(mockStore.disputes.values()));
    setPayments(Array.from(mockStore.payments.values()));
  }, []);

  const totalUsers = mockStore.profiles.size;
  const publishedTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const activeDisputes = disputes.filter((d) => d.status === 'OPEN').length;

  const totalVolumeInr = payments.reduce((acc, p) => acc + p.total_amount_inr, 0);
  const totalPlatformFeesInr = payments.reduce((acc, p) => acc + p.platform_fee_inr, 0);

  return (
    <div className="space-y-6">
      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Total Users"
          value={totalUsers}
          subtitle="Chennai Registered"
          icon={Users}
          variant="primary"
        />
        <MetricCard
          title="Total Tasks"
          value={publishedTasks}
          subtitle="All categories"
          icon={Briefcase}
          variant="secondary"
        />
        <MetricCard
          title="Completed"
          value={completedTasks}
          subtitle="Genuinely settled"
          icon={CheckCircle2}
          variant="accent"
        />
        <MetricCard
          title="Active Disputes"
          value={activeDisputes}
          subtitle="Requires review"
          icon={AlertTriangle}
          variant={activeDisputes > 0 ? 'danger' : 'warning'}
        />
        <MetricCard
          title="Gross Volume"
          value={`₹${totalVolumeInr.toLocaleString('en-IN')}`}
          subtitle="Settled Gigs"
          icon={IndianRupee}
          variant="secondary"
        />
        <MetricCard
          title="Platform Fees"
          value={`₹${totalPlatformFeesInr.toLocaleString('en-IN')}`}
          subtitle="10% Net Platform Rev"
          icon={TrendingUp}
          variant="accent"
        />
      </div>

      {/* Two Column Layout: Recent Tasks & Active Disputes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Task Listings */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Recent Chennai Marketplace Activity
              </h3>
              <p className="text-xs text-slate-400">
                Live task stream across Anna Nagar, Velachery, T. Nagar & OMR
              </p>
            </div>
            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>Manage all</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 uppercase text-[10px] tracking-wider">
                  <th className="pb-2">Task</th>
                  <th className="pb-2">Locality</th>
                  <th className="pb-2">Budget</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                      No marketplace tasks posted yet. Create tasks in the mobile app to populate live stream.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => {
                  const loc = mockStore.locations.get(task.id);
                  return (
                    <tr key={task.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 font-semibold text-slate-900 max-w-[200px] truncate">
                        {task.title}
                      </td>
                      <td className="py-3 text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-secondary" />
                        <span>{loc?.locality || 'Chennai'}</span>
                      </td>
                      <td className="py-3 font-bold text-slate-900">
                        ₹{task.budget_inr}
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                          {task.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => onNavigate('tasks')}
                          className="text-primary hover:underline font-bold text-xs"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Active Disputes & Moderation */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Trust & Disputes
              </h3>
              <p className="text-xs text-slate-400">
                Escalated incidents needing decision
              </p>
            </div>
            <button
              onClick={() => onNavigate('disputes')}
              className="text-xs font-bold text-rose-600 hover:underline"
            >
              Resolve ({activeDisputes})
            </button>
          </div>

          {disputes.length === 0 ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center text-xs text-emerald-800 font-medium">
              ✓ No active disputes. Platform health is optimal.
            </div>
          ) : (
            <div className="space-y-3">
              {disputes.map((d) => (
                <div
                  key={d.id}
                  className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-900">
                      {d.reason}
                    </span>
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                      {d.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2">
                    {d.details}
                  </p>
                  <button
                    onClick={() => onNavigate('disputes')}
                    className="text-xs font-bold text-rose-700 hover:underline pt-1 block"
                  >
                    Open Resolution Panel →
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Chennai Safety Policy Box */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <span className="font-bold text-slate-800 block">
              Automated Safety Engine:
            </span>
            <p className="text-[11px] leading-relaxed">
              Real-time PostGIS radius validation prevents fraudulent remote claims. Row-Level Security ensures confidential residential addresses are masked.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
