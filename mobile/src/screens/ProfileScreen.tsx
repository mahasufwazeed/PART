import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { paymentService, WorkerEarningsSummary } from '@part/shared';
import {
  ShieldCheck,
  Star,
  CheckCircle,
  Briefcase,
  IndianRupee,
  Wallet,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  Lock,
  ChevronRight,
  Globe,
  Trash2,
} from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const { currentProfile, language, setLanguage, setTab, logout } = useAppStore();
  const [earnings, setEarnings] = useState<WorkerEarningsSummary | null>(null);
  const [showEarningsModal, setShowEarningsModal] = useState(false);

  useEffect(() => {
    paymentService.getWorkerEarnings(currentProfile.id).then(setEarnings);
  }, [currentProfile.id]);

  return (
    <div className="pb-28 px-4 pt-4 max-w-md mx-auto space-y-4">
      {/* Profile Header Card */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-secondary text-white font-black text-xl flex items-center justify-center shadow-md">
            {currentProfile.full_name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="text-base font-extrabold text-slate-900">
                {currentProfile.full_name}
              </h2>
              {currentProfile.verification_status === 'verified' && (
                <ShieldCheck className="w-4 h-4 text-accent" />
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {currentProfile.general_location}
            </p>
            <div className="flex items-center gap-3 mt-1.5 text-xs">
              <span className="flex items-center gap-1 text-amber-600 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                {currentProfile.rating_as_worker.toFixed(1)} Worker
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-semibold">
                {currentProfile.completed_tasks_as_worker} completed
              </span>
            </div>
          </div>
        </div>

        {currentProfile.bio && (
          <p className="text-xs text-slate-600 mt-3 pt-3 border-t border-slate-100 leading-relaxed italic">
            "{currentProfile.bio}"
          </p>
        )}
      </div>

      {/* Quick Earnings Dashboard Banner */}
      <div
        onClick={() => setShowEarningsModal(true)}
        className="bg-gradient-to-br from-slate-900 via-indigo-950 to-primary text-white p-4 rounded-3xl shadow-lg cursor-pointer hover:shadow-xl transition-all active:scale-[0.99] flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-accent">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] text-indigo-200 uppercase tracking-wider block font-medium">
              Worker Earnings Dashboard
            </span>
            <span className="text-lg font-black text-white">
              ₹{(earnings?.totalEarnedInr || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-bold text-accent">
          <span>View Breakdown</span>
          <ChevronRight className="w-4 h-4" />
        </div>
      </div>

      {/* Navigation Options List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 overflow-hidden text-xs">
        <button
          onClick={() => setTab('activity')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition text-left"
        >
          <div className="flex items-center gap-3 text-slate-800 font-bold">
            <Briefcase className="w-4 h-4 text-primary" />
            <span>My Tasks & Applications</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition text-left"
        >
          <div className="flex items-center gap-3 text-slate-800 font-bold">
            <Globe className="w-4 h-4 text-secondary" />
            <span>Language / மொழி: {language === 'en' ? 'English' : 'தமிழ்'}</span>
          </div>
          <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
            Switch
          </span>
        </button>

        <button
          onClick={() => alert('Notifications are configured via Expo Push Service.')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition text-left"
        >
          <div className="flex items-center gap-3 text-slate-800 font-bold">
            <Bell className="w-4 h-4 text-slate-600" />
            <span>Notification Preferences</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => alert('Exact location coordinates are strictly private and masked from public search.')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition text-left"
        >
          <div className="flex items-center gap-3 text-slate-800 font-bold">
            <Lock className="w-4 h-4 text-slate-600" />
            <span>Privacy & Location Masking</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>

        <button
          onClick={() => alert('PART Chennai Emergency Helpline: +91 44 2827 0000 | Women Safety: 1091 | Police: 100')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition text-left"
        >
          <div className="flex items-center gap-3 text-slate-800 font-bold">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>Help, Safety & Emergency Guidelines</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Account Safety Actions */}
      <div className="space-y-2 pt-2">
        <button
          onClick={logout}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Detailed Earnings Modal */}
      {showEarningsModal && earnings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-slide-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Worker Earnings Statement
              </h3>
              <button
                onClick={() => setShowEarningsModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-medium block">Confirmed Net</span>
                <span className="text-base font-black text-accent">₹{earnings.totalEarnedInr}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-medium block">Completed Gigs</span>
                <span className="text-base font-black text-slate-900">{earnings.completedTasksCount}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-medium block">Platform Fees (10%)</span>
                <span className="text-base font-black text-slate-700">₹{earnings.platformFeesPaidInr}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-medium block">Pending Escrow</span>
                <span className="text-base font-black text-amber-600">₹{earnings.pendingPaymentInr}</span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-800">Settled Transactions</h4>
              {earnings.payments.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-3 text-center bg-slate-50 rounded-xl">
                  No payment settlements recorded yet. Complete tasks to earn!
                </p>
              ) : (
                earnings.payments.map((p) => (
                  <div key={p.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{p.payment_method}</span>
                      <span className="text-[10px] text-slate-400">{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className="font-extrabold text-accent">+₹{p.worker_amount_inr}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
