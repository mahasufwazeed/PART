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
  FileText,
  UserCheck,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  X,
  Share2,
} from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const { currentProfile, language, setLanguage, setTab, logout } = useAppStore();
  const [earnings, setEarnings] = useState<WorkerEarningsSummary | null>(null);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);

  useEffect(() => {
    if (currentProfile) {
      paymentService.getWorkerEarnings(currentProfile.id).then(setEarnings);
    }
  }, [currentProfile?.id]);

  if (!currentProfile) return null;

  return (
    <div className="pb-28 px-4 pt-4 max-w-md mx-auto space-y-4 select-none">
      {/* 1. Header Card (Photo/Initials, Name, Location, Rating, Completed Gigs) */}
      <div className="bg-white p-5 rounded-3xl border border-neutral-200/90 shadow-quick relative overflow-hidden">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-brand-yellow text-neutral-950 font-heading font-black text-xl flex items-center justify-center shadow-xs border border-brand-yellow-hover">
            {currentProfile.full_name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <h2 className="font-heading font-black text-base text-neutral-900">
                {currentProfile.full_name}
              </h2>
              {currentProfile.verification_status === 'verified' && (
                <ShieldCheck className="w-4 h-4 text-part-green fill-part-green-mint" />
              )}
            </div>

            <p className="text-xs text-neutral-500 font-medium">
              {currentProfile.general_location || 'Chennai, Tamil Nadu'}
            </p>

            <div className="flex items-center gap-3 mt-1.5 text-xs">
              <span className="flex items-center gap-1 text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-md">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                {currentProfile.rating_as_worker.toFixed(1)} Helper
              </span>
              <span className="text-neutral-300">•</span>
              <span className="text-neutral-600 font-semibold">
                {currentProfile.completed_tasks_as_worker} completed gigs
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary Earnings Highlight Card (Direct Tap to Earnings Dashboard) */}
      <div
        onClick={() => setShowEarningsModal(true)}
        className="bg-gradient-to-r from-part-green to-part-green-forest text-white p-4 rounded-3xl shadow-green cursor-pointer hover:shadow-lg transition-transform active:scale-[0.99] flex items-center justify-between"
      >
        <div className="space-y-0.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-part-green-mint block">
            MY EARNINGS
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-heading font-black text-2xl">
              ₹{earnings?.totalEarnedInr || 0}
            </span>
            <span className="text-xs text-emerald-100 font-medium">confirmed</span>
          </div>
          <span className="text-[11px] text-emerald-100 block">
            {earnings?.completedTasksCount || 0} settled gigs • Tap to view ledger
          </span>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* 3. Rounded List Cards Sections */}
      <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-quick divide-y divide-neutral-100 overflow-hidden text-xs">
        <button
          type="button"
          onClick={() => setTab('activity')}
          className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-part-green-mint text-part-green flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="font-heading font-bold text-neutral-900">My Tasks</h4>
              <p className="text-[11px] text-neutral-500">View tasks you have posted</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </button>

        <button
          type="button"
          onClick={() => setTab('activity')}
          className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-yellow-subtle text-neutral-900 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="font-heading font-bold text-neutral-900">My Applications</h4>
              <p className="text-[11px] text-neutral-500">Jobs you have applied for</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </button>

        <button
          type="button"
          onClick={() => setShowEarningsModal(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-part-green flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="font-heading font-bold text-neutral-900">My Earnings</h4>
              <p className="text-[11px] text-neutral-500">Ledger & payout statements</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </button>

        <button
          type="button"
          onClick={() => setShowReviewsModal(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Star className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="font-heading font-bold text-neutral-900">My Reviews & Badges</h4>
              <p className="text-[11px] text-neutral-500">Ratings from neighbors</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </button>

        <button
          type="button"
          onClick={() => setShowNotificationsModal(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="font-heading font-bold text-neutral-900">Notifications</h4>
              <p className="text-[11px] text-neutral-500">Real-time alerts & status updates</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </button>

        <button
          type="button"
          onClick={() => setShowHelpModal(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="font-heading font-bold text-neutral-900">Help Center & Safety</h4>
              <p className="text-[11px] text-neutral-500">Emergency support & guidelines</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </button>
      </div>

      {/* Account Sign Out Action */}
      <div className="pt-2">
        <button
          type="button"
          onClick={logout}
          className="w-full bg-white hover:bg-neutral-100 text-rose-600 font-heading font-black text-xs py-3.5 rounded-2xl border border-neutral-200/90 shadow-quick flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* 4. Earnings Dashboard Modal (Section 10) */}
      {showEarningsModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-slide-up space-y-4 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-part-green">
                  STATEMENT
                </span>
                <h3 className="font-heading font-black text-base text-neutral-900">
                  My Earnings
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEarningsModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Main Confirmed Card */}
            <div className="bg-brand-yellow/20 p-4 rounded-3xl border border-brand-yellow/50 text-center space-y-1">
              <span className="text-[11px] font-bold text-neutral-700 uppercase tracking-wider block">
                Confirmed Earnings
              </span>
              <span className="font-heading font-black text-3xl text-neutral-950 block">
                ₹{earnings?.totalEarnedInr?.toFixed(2) || '0.00'}
              </span>
              <span className="text-[11px] text-neutral-500 block">
                Settled transparently via Cash or verified Escrow
              </span>
            </div>

            {/* Additional Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-[#F7F8FA] p-3 rounded-2xl border border-neutral-200">
                <span className="text-[10px] text-neutral-400 font-bold block">Pending</span>
                <span className="font-heading font-black text-sm text-amber-700">
                  ₹{earnings?.pendingPaymentInr || 0}
                </span>
              </div>
              <div className="bg-[#F7F8FA] p-3 rounded-2xl border border-neutral-200">
                <span className="text-[10px] text-neutral-400 font-bold block">Completed</span>
                <span className="font-heading font-black text-sm text-neutral-900">
                  {earnings?.completedTasksCount || 0}
                </span>
              </div>
              <div className="bg-[#F7F8FA] p-3 rounded-2xl border border-neutral-200">
                <span className="text-[10px] text-neutral-400 font-bold block">Fee (10%)</span>
                <span className="font-heading font-black text-sm text-neutral-600">
                  ₹{earnings?.platformFeesPaidInr || 0}
                </span>
              </div>
            </div>

            {/* Transaction Ledger */}
            <div className="space-y-2">
              <h4 className="font-heading font-bold text-xs text-neutral-900">
                Transaction History
              </h4>
              {(!earnings || earnings.payments.length === 0) ? (
                <p className="text-xs text-neutral-400 italic p-4 text-center bg-[#F7F8FA] rounded-2xl">
                  No verified earnings transactions recorded yet. Complete tasks to earn!
                </p>
              ) : (
                earnings.payments.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-[#F7F8FA] border border-neutral-200 rounded-2xl flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-bold text-neutral-900 block">{p.payment_method}</span>
                      <span className="text-[10px] text-neutral-400">
                        {new Date(p.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <span className="font-heading font-black text-part-green">
                      +₹{p.worker_amount_inr}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Notifications Modal (Section 13) */}
      {showNotificationsModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-slide-up space-y-3 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="font-heading font-black text-base text-neutral-900">
                Notifications
              </h3>
              <button
                type="button"
                onClick={() => setShowNotificationsModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  title: 'Welcome to PART Chennai',
                  desc: 'Your account is active for Velachery and neighboring localities.',
                  time: 'Just now',
                  icon: Sparkles,
                  unread: true,
                },
                {
                  title: 'Neighborhood Safety Guidelines',
                  desc: 'Cash on completion and zero advance payments enforced.',
                  time: '1h ago',
                  icon: ShieldCheck,
                  unread: false,
                },
              ].map((n, i) => {
                const Icon = n.icon;
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-2xl border text-xs flex gap-3 ${
                      n.unread
                        ? 'bg-brand-yellow-light border-brand-yellow/40'
                        : 'bg-[#F7F8FA] border-neutral-200'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-part-green-mint text-part-green flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-heading font-bold text-neutral-900">{n.title}</h4>
                        <span className="text-[10px] text-neutral-400">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-neutral-600 mt-0.5">{n.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. Help Center Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-slide-up space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="font-heading font-black text-base text-neutral-900">
                Help Center & Safety
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-neutral-600 space-y-2">
              <p>PART Customer Support Helpline: <strong>+91 44 2827 0000</strong></p>
              <p>Email: <strong>support@part-app.in</strong></p>
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900">
                ✓ 24/7 automated dispute resolution and emergency neighborhood contact hotline.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Reviews Modal */}
      {showReviewsModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-slide-up space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="font-heading font-black text-base text-neutral-900">
                My Reviews & Trust Score
              </h3>
              <button
                type="button"
                onClick={() => setShowReviewsModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>
            <div className="text-center p-4 space-y-1">
              <div className="flex justify-center items-center gap-1 text-2xl font-black text-amber-500">
                ★ {currentProfile.rating_as_worker.toFixed(1)}
              </div>
              <p className="text-xs text-neutral-500">Based on verified completed tasks across Chennai.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
