import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  authService,
  paymentService,
  locationService,
  WorkerEarningsSummary,
  SavedAddress,
} from '@part/shared';
import { LocationSelectorModal } from '../components/LocationSelectorModal';
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
  Camera,
  MapPin,
  Mail,
  Phone,
  Bookmark,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface ProfileScreenProps {
  onNavigateChangePassword?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigateChangePassword,
}) => {
  const { currentProfile, setCurrentProfile, language, setLanguage, setTab, logout } =
    useAppStore();

  const [earnings, setEarnings] = useState<WorkerEarningsSummary | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [activeRole, setActiveRole] = useState<'poster' | 'worker'>(
    currentProfile?.default_role || 'poster'
  );

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentProfile) {
      paymentService.getWorkerEarnings(currentProfile.id).then(setEarnings);
      locationService.getSavedAddresses(currentProfile.id).then(setSavedAddresses);
    }
  }, [currentProfile?.id]);

  if (!currentProfile) return null;

  // Handle Role Switch
  const handleToggleRole = async (newRole: 'poster' | 'worker') => {
    setActiveRole(newRole);
    const res = await authService.updateProfile(currentProfile.id, {
      default_role: newRole,
    });
    if (res.profile) {
      setCurrentProfile(res.profile);
    }
  };

  // Handle Avatar Upload to Supabase Storage
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      alert('Avatar image must be under 3MB.');
      return;
    }

    setIsUploadingAvatar(true);
    setStatusMessage(null);

    try {
      const { avatarUrl, error } = await authService.uploadAvatar(
        currentProfile.id,
        file,
        file.name
      );

      if (error) {
        alert(`Upload error: ${error}`);
      } else if (avatarUrl) {
        setCurrentProfile({
          ...currentProfile,
          avatar_url: avatarUrl,
        });
        setStatusMessage('Profile picture updated successfully!');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err: any) {
      alert(err.message || 'Avatar upload failed.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="pb-28 px-4 pt-4 max-w-md mx-auto space-y-4 select-none">
      {statusMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-part-green text-xs p-3 rounded-2xl flex items-center gap-2 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* 1. Header Card (Photo with Upload Trigger, Name, Email, Location) */}
      <div className="bg-white p-5 rounded-3xl border border-neutral-200/90 shadow-card relative overflow-hidden space-y-3.5">
        <div className="flex items-center gap-3.5">
          {/* Avatar with Upload Button */}
          <div className="relative group shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-brand-yellow text-neutral-950 font-heading font-black text-2xl flex items-center justify-center shadow-xs border-2 border-brand-yellow-hover overflow-hidden">
              {currentProfile.avatar_url ? (
                <img
                  src={currentProfile.avatar_url}
                  alt={currentProfile.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                currentProfile.full_name.charAt(0).toUpperCase()
              )}
            </div>

            {/* Camera Overlay Trigger */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingAvatar}
              title="Change Profile Photo"
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-part-green text-white flex items-center justify-center shadow-md border-2 border-white hover:scale-110 active:scale-95 transition cursor-pointer"
            >
              {isUploadingAvatar ? (
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Camera className="w-3 h-3" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-heading font-black text-base text-neutral-900 truncate">
                {currentProfile.full_name}
              </h2>
              {currentProfile.verification_status === 'verified' ? (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-part-green bg-part-green-mint px-1.5 py-0.2 rounded-full border border-part-green/20 shrink-0">
                  <ShieldCheck className="w-3 h-3 fill-part-green text-white" />
                  <span>Verified</span>
                </span>
              ) : (
                <span className="text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.2 rounded-full shrink-0">
                  Unverified
                </span>
              )}
            </div>

            {/* Verified Email */}
            {currentProfile.email && (
              <p className="text-[11px] text-neutral-500 font-medium truncate flex items-center gap-1 mt-0.5">
                <Mail className="w-3 h-3 text-neutral-400 shrink-0" />
                <span className="truncate">{currentProfile.email}</span>
              </p>
            )}

            {/* Location & Change Button */}
            <div className="flex items-center justify-between gap-1 mt-1 text-xs">
              <span className="text-[11px] text-neutral-600 font-semibold truncate flex items-center gap-1">
                <MapPin className="w-3 h-3 text-part-green shrink-0" />
                <span className="truncate">{currentProfile.general_location || 'Velachery, Chennai'}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowLocationModal(true)}
                className="text-[10px] font-heading font-bold text-part-green hover:underline shrink-0"
              >
                Change
              </button>
            </div>
          </div>
        </div>

        {/* 2. DUAL ROLE SWITCHER (Task Poster vs Task Worker) */}
        <div className="pt-2 border-t border-neutral-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-heading font-black text-neutral-400 uppercase tracking-wider">
              Current Activity Mode:
            </span>
            <span className="text-[10px] font-bold text-neutral-500">
              One account for both activities
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-neutral-100 p-1 rounded-2xl border border-neutral-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => handleToggleRole('poster')}
              className={`py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeRole === 'poster'
                  ? 'bg-brand-yellow text-neutral-950 shadow-xs font-heading font-black'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>I Need Help (Poster)</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleRole('worker')}
              className={`py-2 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                activeRole === 'worker'
                  ? 'bg-part-green text-white shadow-xs font-heading font-black'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>I Want to Earn (Helper)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Primary Earnings Highlight Card (for Helper / Worker Activity) */}
      <div
        onClick={() => setShowEarningsModal(true)}
        className="bg-gradient-to-r from-part-green to-part-green-forest text-white p-4 rounded-3xl shadow-green cursor-pointer hover:shadow-lg transition-transform active:scale-[0.99] flex items-center justify-between"
      >
        <div className="space-y-0.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-part-green-mint block">
            MY EARNINGS & SETTLEMENTS
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-heading font-black text-2xl">
              ₹{earnings?.totalEarnedInr || 0}
            </span>
            <span className="text-xs text-emerald-100 font-medium">settled</span>
          </div>
          <span className="text-[11px] text-emerald-100 block">
            {earnings?.completedTasksCount || 0} gigs completed • Tap to view ledger
          </span>
        </div>

        <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* 4. Saved Addresses Quick Tile */}
      <div
        onClick={() => setShowLocationModal(true)}
        className="bg-white p-4 rounded-3xl border border-neutral-200/90 shadow-card flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-xs text-neutral-900">
              Saved Addresses ({savedAddresses.length})
            </h4>
            <p className="text-[11px] text-neutral-500">
              Manage Home, Work, and neighborhood drop-offs
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-neutral-400" />
      </div>

      {/* 5. Account Navigation Menu */}
      <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-card divide-y divide-neutral-100 overflow-hidden text-xs">
        {/* My Tasks */}
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
              <h4 className="font-heading font-bold text-neutral-900">My Tasks & Gigs</h4>
              <p className="text-[11px] text-neutral-500">
                {activeRole === 'poster' ? 'Tasks you have posted' : 'Gigs you have accepted'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </button>

        {/* Reviews & Ratings */}
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
              <h4 className="font-heading font-bold text-neutral-900">My Reviews & Rating</h4>
              <p className="text-[11px] text-neutral-500">
                ★ {currentProfile.rating_as_worker.toFixed(1)} Helper • ★ {currentProfile.rating_as_requester.toFixed(1)} Poster
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </button>

        {/* Security / Password Reset */}
        <button
          type="button"
          onClick={onNavigateChangePassword}
          className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="font-heading font-bold text-neutral-900">Security & Password</h4>
              <p className="text-[11px] text-neutral-500">Update account password</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </button>

        {/* Help & Support */}
        <button
          type="button"
          onClick={() => setShowHelpModal(true)}
          className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="font-heading font-bold text-neutral-900">Help & Support</h4>
              <p className="text-[11px] text-neutral-500">Chennai support hotline & FAQs</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400" />
        </button>

        {/* Logout */}
        <button
          type="button"
          onClick={() => {
            if (confirm('Are you sure you want to log out of PART?')) {
              logout();
            }
          }}
          className="w-full p-4 flex items-center justify-between hover:bg-rose-50/50 transition cursor-pointer text-rose-600"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h4 className="font-heading font-bold">Log Out</h4>
              <p className="text-[11px] text-rose-500/80">Sign out from this device</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-400" />
        </button>
      </div>

      {/* Location Selector Modal */}
      <LocationSelectorModal
        isOpen={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
          locationService
            .getSavedAddresses(currentProfile.id)
            .then(setSavedAddresses);
        }}
      />
    </div>
  );
};
