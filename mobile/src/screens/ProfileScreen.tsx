import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  authService,
  paymentService,
  locationService,
  reviewService,
  WorkerEarningsSummary,
  SavedAddress,
  Review,
  CHENNAI_LOCALITIES,
  geoapifyService,
  calculateHaversineDistanceKm,
} from '@part/shared';
import { LocationSelectorModal } from '../components/LocationSelectorModal';
import { CollegeSelectorModal } from '../components/CollegeSelectorModal';
import PartLeafletMap from '../components/map/PartLeafletMap';
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
  ChevronDown,
  Globe,
  FileText,
  UserCheck,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  X,
  Camera,
  MapPin,
  Mail,
  Phone,
  Bookmark,
  Sparkles,
  ArrowRight,
  Trash2,
  Eye,
  EyeOff,
  MessageCircle,
  Check,
  Plus,
  ExternalLink,
  Info,
  Pencil,
  User,
  QrCode,
  GraduationCap,
  Navigation,
  Crosshair,
  Loader2,
  Compass,
} from 'lucide-react';

const PRESET_AVATARS = [
  { id: 'initials', label: 'Initials Only', url: '', emoji: '🔤' },
  { id: 'runner', label: 'Delivery Pro', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80', emoji: '🛵' },
  { id: 'handyman', label: 'Handyman Pro', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', emoji: '🛠️' },
  { id: 'tech', label: 'Tech Expert', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', emoji: '⚡' },
  { id: 'neighbor', label: 'Friendly Helper', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', emoji: '🌸' },
  { id: 'organizer', label: 'Organizer', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80', emoji: '💼' },
];

const POPULAR_SKILLS = [
  '📦 Delivery & Errands',
  '⚡ Electrical & Wiring',
  '🛠️ Plumbing & Handyman',
  '🧹 Home Deep Cleaning',
  '📦 Moving & Heavy Lifting',
  '🛒 Grocery & Market Shopping',
  '💻 Tech & Mobile Support',
  '🐕 Pet Care & Dog Walking',
  '🌿 Gardening & Plant Care',
  '🍳 Kitchen & Cooking Help',
  '🚗 Driver & Chauffeur',
  '🎨 Wall Painting & Repairs',
];

const getInitials = (name?: string | null) => {
  if (!name || !name.trim()) return 'P';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

interface ProfileScreenProps {
  onNavigateChangePassword?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onNavigateChangePassword,
}) => {
  const {
    currentProfile,
    setCurrentProfile,
    language,
    setLanguage,
    setTab,
    setUserLocation,
    userLocation,
    activeLocation,
    setActiveLocation,
    logout,
    selectedCollegeId,
    selectedCollegeName,
    isCollegeSelectorOpen,
    openCollegeSelector,
    closeCollegeSelector,
  } = useAppStore();

  const [earnings, setEarnings] = useState<WorkerEarningsSummary | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [activeRole, setActiveRole] = useState<'poster' | 'worker'>(
    currentProfile?.default_role || 'poster'
  );

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Avatar loading error fallback
  const [avatarImgError, setAvatarImgError] = useState(false);

  useEffect(() => {
    setAvatarImgError(false);
  }, [currentProfile?.avatar_url]);

  // Modal Visibility States
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSavedAddressesModal, setShowSavedAddressesModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Edit Profile Form State
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editLocality, setEditLocality] = useState(CHENNAI_LOCALITIES[0].name);
  const [editCity, setEditCity] = useState('Chennai');
  const [editLanguage, setEditLanguage] = useState<'en' | 'ta'>('en');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editUpiId, setEditUpiId] = useState('');
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [editIsAvailable, setEditIsAvailable] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editProfileError, setEditProfileError] = useState<string | null>(null);

  // Security Form State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Add Address Form State
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [newAddrLine, setNewAddrLine] = useState('');
  const [newAddrLocality, setNewAddrLocality] = useState(CHENNAI_LOCALITIES[0].name);
  const [newAddrCoords, setNewAddrCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Payout toast state
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentProfile) {
      paymentService.getWorkerEarnings(currentProfile.id).then(setEarnings);
      locationService.getSavedAddresses(currentProfile.id).then(setSavedAddresses);
      reviewService.getUserReviews(currentProfile.id).then(setUserReviews);
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

  // Open Edit Profile Modal with prefilled current data
  const handleOpenEditModal = () => {
    if (!currentProfile) return;
    setEditFullName(currentProfile.full_name || '');
    setEditPhone(currentProfile.phone || '');
    setEditBio(currentProfile.bio || '');
    setEditLocality(currentProfile.general_location || userLocation.locality || 'Velachery, Chennai');
    setEditCity(currentProfile.city || 'Chennai');
    setEditLanguage(currentProfile.preferred_language || 'en');
    setEditAvatarUrl(currentProfile.avatar_url || '');
    setEditUpiId(currentProfile.upi_id || '');
    setEditSkills(
      currentProfile.skills && currentProfile.skills.length > 0
        ? currentProfile.skills
        : ['📦 Delivery & Errands', '⚡ Electrical & Wiring']
    );
    setEditIsAvailable(currentProfile.is_worker_available ?? true);
    setEditProfileError(null);
    setShowEditProfileModal(true);
  };

  // Save updated profile details
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditProfileError(null);

    if (!editFullName.trim() || editFullName.trim().length < 2) {
      setEditProfileError('Full name must be at least 2 characters.');
      return;
    }

    const cleanPhone = editPhone.trim().replace(/\D/g, '');
    if (editPhone.trim() && cleanPhone.length !== 10) {
      setEditProfileError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (editUpiId.trim() && !editUpiId.includes('@')) {
      setEditProfileError('Please enter a valid UPI handle (e.g. username@okhdfcbank).');
      return;
    }

    setIsSavingProfile(true);
    try {
      const formattedPhone = cleanPhone
        ? `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`
        : null;

      const res = await authService.updateProfile(currentProfile.id, {
        full_name: editFullName.trim(),
        phone: formattedPhone || (editPhone.trim() ? editPhone.trim() : null),
        bio: editBio.trim() || null,
        city: editCity.trim() || 'Chennai',
        general_location: editLocality.trim(),
        preferred_language: editLanguage,
        avatar_url: editAvatarUrl.trim() || null,
        is_worker_available: editIsAvailable,
        upi_id: editUpiId.trim() || null,
        skills: editSkills,
      });

      if (res.error) {
        setEditProfileError(res.error);
      } else if (res.profile) {
        setCurrentProfile(res.profile);
        setLanguage(editLanguage);
        setUserLocation({
          locality: editLocality.trim(),
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        });
        setAvatarImgError(false);
        setShowEditProfileModal(false);
        setStatusMessage('Profile details updated successfully! 🎉');
        setTimeout(() => setStatusMessage(null), 3000);
      }
    } catch (err: any) {
      setEditProfileError(err.message || 'Failed to update profile details.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Avatar Upload to Supabase Storage
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

  // Handle In-Modal Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await authService.updatePassword(newPassword);
      if (res.error) {
        setPasswordError(res.error);
      } else {
        setPasswordSuccess('Password updated successfully!');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowSecurityModal(false);
          setPasswordSuccess(null);
        }, 1500);
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to update password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Detect live location via GPS and auto-fill address details
  const handleDetectLiveLocation = (openForm = true) => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingGps(true);
    setGpsError(null);
    if (openForm) {
      setIsAddingAddress(true);
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setGpsAccuracy(Math.round(accuracy));
        setNewAddrCoords({ latitude, longitude });

        try {
          setIsReverseGeocoding(true);
          const rev = await geoapifyService.reverseGeocode(latitude, longitude);

          // Find closest Chennai locality
          let closestLocality = CHENNAI_LOCALITIES[0].name;
          let minDistance = Infinity;
          for (const loc of CHENNAI_LOCALITIES) {
            const dist = calculateHaversineDistanceKm(
              latitude,
              longitude,
              loc.latitude,
              loc.longitude
            );
            if (dist < minDistance) {
              minDistance = dist;
              closestLocality = loc.name;
            }
          }

          setNewAddrLocality(closestLocality);

          // Format clean street / building address
          let street = rev.formatted || '';
          if (street) {
            const parts = street.split(',').map((p) => p.trim());
            street = parts.slice(0, Math.max(1, parts.length - 2)).join(', ');
          }

          setNewAddrLine(street || `Near ${closestLocality}`);
          setStatusMessage('Live GPS location detected!');
          setTimeout(() => setStatusMessage(null), 3000);
        } catch (err) {
          console.warn('Reverse geocode error:', err);
        } finally {
          setIsReverseGeocoding(false);
          setIsDetectingGps(false);
        }
      },
      (err) => {
        setIsDetectingGps(false);
        if (err.code === 1) {
          setGpsError('Location permission denied. Please allow location access or choose manually.');
        } else if (err.code === 3) {
          setGpsError('GPS acquisition timed out. Please try again.');
        } else {
          setGpsError('Unable to acquire live GPS location.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Handle dragging or clicking pin on the interactive Leaflet map
  const handleMapPinMoved = async (lat: number, lng: number) => {
    setNewAddrCoords({ latitude: lat, longitude: lng });
    try {
      setIsReverseGeocoding(true);
      const rev = await geoapifyService.reverseGeocode(lat, lng);

      // Find closest Chennai locality
      let closestLocality = CHENNAI_LOCALITIES[0].name;
      let minDistance = Infinity;
      for (const loc of CHENNAI_LOCALITIES) {
        const dist = calculateHaversineDistanceKm(lat, lng, loc.latitude, loc.longitude);
        if (dist < minDistance) {
          minDistance = dist;
          closestLocality = loc.name;
        }
      }

      setNewAddrLocality(closestLocality);
      if (rev.formatted) {
        const parts = rev.formatted.split(',').map((p) => p.trim());
        const street = parts.slice(0, Math.max(1, parts.length - 2)).join(', ');
        setNewAddrLine(street || rev.formatted);
      }
    } catch (err) {
      console.warn('Map pin reverse geocode error:', err);
    } finally {
      setIsReverseGeocoding(false);
    }
  };

  // Handle Save New Address with live coordinates
  const handleSaveNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrLine.trim()) return;

    const localityObj = CHENNAI_LOCALITIES.find((l) => l.name === newAddrLocality);
    // Use exact GPS coordinates if available, otherwise fallback to locality center
    const lat = newAddrCoords?.latitude ?? localityObj?.latitude ?? 12.9815;
    const lng = newAddrCoords?.longitude ?? localityObj?.longitude ?? 80.218;

    const res = await locationService.saveAddress(currentProfile.id, {
      label: newAddrLabel,
      title: `${newAddrLabel} Address`,
      address_line: newAddrLine.trim(),
      locality: `${newAddrLocality}, Chennai`,
      latitude: lat,
      longitude: lng,
    });

    if (res.address) {
      const updated = await locationService.getSavedAddresses(currentProfile.id);
      setSavedAddresses(updated);
      setIsAddingAddress(false);
      setShowMapPicker(false);
      setNewAddrLine('');
      setNewAddrCoords(null);
      setGpsAccuracy(null);
      setGpsError(null);
      setStatusMessage('New address saved!');
      setTimeout(() => setStatusMessage(null), 2500);
    }
  };

  // Handle Delete Address
  const handleDeleteAddress = async (addressId: string) => {
    await locationService.deleteSavedAddress(currentProfile.id, addressId);
    const updated = await locationService.getSavedAddresses(currentProfile.id);
    setSavedAddresses(updated);
  };

  // Handle Set Active Address
  const handleSelectAddress = (addr: SavedAddress) => {
    setUserLocation({
      locality: addr.locality || addr.address_line,
      latitude: addr.latitude,
      longitude: addr.longitude,
    });
    setActiveLocation?.({
      coordinates: { latitude: addr.latitude, longitude: addr.longitude },
      label: `${addr.address_line}, ${addr.locality}`,
      source: 'saved_address',
    });
    setShowSavedAddressesModal(false);
    setStatusMessage(`Active location set to ${addr.locality.split(',')[0]}!`);
    setTimeout(() => setStatusMessage(null), 2500);
  };

  return (
    <div className="pb-24 md:pb-18 px-3 sm:px-5 md:px-6 pt-3 sm:pt-4 w-full select-none">
      {statusMessage && (
        <div className="mb-3 bg-emerald-50 border border-emerald-200 text-part-green text-xs p-2.5 rounded-2xl flex items-center gap-2 animate-slide-up shadow-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Responsive Grid: Stacks on mobile, 2 clean columns on tablet and laptop */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-start">
        {/* Left Column (Identity, Dual Role, Earnings) */}
        <div className="md:col-span-5 lg:col-span-5 space-y-3">
          {/* 1. Header Card (Photo with Upload Trigger, Name, Email, Phone, Bio, Skills, UPI, Location) */}
          <div className="bg-white p-3.5 sm:p-4 md:p-4.5 rounded-3xl border border-neutral-200/90 shadow-card relative overflow-hidden space-y-3">
            <div className="flex items-start gap-3">
              {/* Avatar with Upload / Edit Button */}
              <div className="relative group shrink-0">
                <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-br from-brand-yellow via-amber-300 to-amber-400 text-neutral-950 font-heading font-black text-xl sm:text-2xl flex items-center justify-center shadow-xs border-2 border-brand-yellow-hover overflow-hidden select-none">
                  {currentProfile.avatar_url && !avatarImgError ? (
                    <img
                      src={currentProfile.avatar_url}
                      alt={currentProfile.full_name}
                      onError={() => setAvatarImgError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="font-heading font-black text-lg sm:text-xl text-neutral-950 tracking-wider">
                      {getInitials(currentProfile.full_name)}
                    </span>
                  )}
                </div>

                {/* Camera Overlay Trigger */}
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  title="Change Profile Photo or Pick Avatar"
                  className="absolute -bottom-1 -right-1 w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full bg-part-green text-white flex items-center justify-center shadow-md border-2 border-white hover:scale-110 active:scale-95 transition cursor-pointer"
                >
                  <Camera className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
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
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h2 className="font-heading font-black text-sm sm:text-base text-neutral-900 truncate">
                      {currentProfile.full_name}
                    </h2>
                    {currentProfile.verification_status === 'verified' ? (
                      <span className="flex items-center gap-0.5 text-[9.5px] sm:text-[10px] font-bold text-part-green bg-part-green-mint px-1.5 py-0.2 rounded-full border border-part-green/20 shrink-0">
                        <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-part-green text-white" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="text-[9.5px] sm:text-[10px] text-neutral-400 bg-neutral-100 px-1.5 py-0.2 rounded-full shrink-0">
                        Unverified
                      </span>
                    )}
                  </div>

                  {/* Edit Profile Button */}
                  <button
                    type="button"
                    id="btn-edit-profile-header"
                    onClick={handleOpenEditModal}
                    className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 text-[10px] sm:text-[11px] font-heading font-bold flex items-center gap-1 shadow-xs cursor-pointer active:scale-95 transition shrink-0"
                    title="Edit Profile & All Details"
                  >
                    <Pencil className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-brand-yellow" />
                    <span>Edit</span>
                  </button>
                </div>

                {/* Verified Email */}
                {currentProfile.email && (
                  <p className="text-[10.5px] sm:text-[11px] text-neutral-500 font-medium truncate flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3 text-neutral-400 shrink-0" />
                    <span className="truncate">{currentProfile.email}</span>
                  </p>
                )}

                {/* Phone Number */}
                <div className="text-[10.5px] sm:text-[11px] text-neutral-600 font-medium truncate flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-neutral-400 shrink-0" />
                  {currentProfile.phone ? (
                    <span className="font-mono">{currentProfile.phone}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleOpenEditModal}
                      className="text-part-green font-semibold hover:underline cursor-pointer"
                    >
                      + Add mobile number
                    </button>
                  )}
                </div>

                {/* Location & Change Button */}
                <div className="flex items-center justify-between gap-1 mt-0.5 text-xs">
                  <span className="text-[10.5px] sm:text-[11px] text-neutral-600 font-semibold truncate flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-part-green shrink-0" />
                    <span className="truncate">
                      {currentProfile.general_location || userLocation.locality || 'Velachery, Chennai'}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(true)}
                    className="text-[10px] font-heading font-bold text-part-green hover:underline shrink-0 cursor-pointer"
                  >
                    Change
                  </button>
                </div>

                {/* Campus & College Affiliation */}
                <div className="flex items-center justify-between gap-1 mt-1 text-[10.5px] sm:text-[11px] bg-purple-50/70 border border-purple-200/60 px-2.5 py-1 rounded-xl">
                  <span className="text-purple-900 font-semibold truncate flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                    <span className="truncate">
                      {currentProfile.college_name || selectedCollegeName}
                    </span>
                    {currentProfile.college_status === 'verified' ? (
                      <span className="text-[8.5px] font-black uppercase text-emerald-800 bg-emerald-100 border border-emerald-300 px-1 py-0.2 rounded-md">
                        Verified Student
                      </span>
                    ) : (
                      <span className="text-[8.5px] font-bold text-neutral-500 bg-neutral-100 px-1 py-0.2 rounded-md">
                        Member
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={openCollegeSelector}
                    className="text-[10px] font-heading font-bold text-purple-700 hover:underline shrink-0 cursor-pointer"
                  >
                    Switch
                  </button>
                </div>
              </div>
            </div>

            {/* Bio (if present) */}
            {currentProfile.bio && (
              <div className="bg-neutral-50 px-2.5 py-1.5 rounded-xl border border-neutral-100 text-[10.5px] sm:text-[11px] text-neutral-700 italic">
                "{currentProfile.bio}"
              </div>
            )}

            {/* Skills Chips (if present) */}
            {currentProfile.skills && currentProfile.skills.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-0.5">
                {currentProfile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-[9.5px] sm:text-[10px] font-semibold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-lg border border-neutral-200/60"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}

            {/* UPI & Availability Status Row */}
            <div className="flex items-center justify-between text-[10.5px] sm:text-[11px] pt-1 border-t border-neutral-100">
              <div className="flex items-center gap-2">
                {currentProfile.is_worker_available ? (
                  <span className="inline-flex items-center gap-1 text-[9.5px] sm:text-[10px] font-bold text-part-green bg-part-green-mint/80 px-2 py-0.5 rounded-full border border-part-green/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-part-green animate-pulse" />
                    Available for Gigs
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9.5px] sm:text-[10px] font-bold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                    Off-Duty
                  </span>
                )}
                <span className="text-[9.5px] sm:text-[10px] text-neutral-400 uppercase font-bold">
                  {currentProfile.preferred_language === 'ta' ? 'தமிழ்' : 'English'}
                </span>
              </div>

              {currentProfile.upi_id ? (
                <span className="text-[9.5px] sm:text-[10px] text-neutral-500 font-mono flex items-center gap-1">
                  <QrCode className="w-3 h-3 text-part-green" />
                  <span>{currentProfile.upi_id}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="text-[9.5px] sm:text-[10px] text-neutral-400 hover:text-part-green underline"
                >
                  + Add UPI handle
                </button>
              )}
            </div>

            {/* 2. DUAL ROLE SWITCHER (Task Poster vs Task Worker) */}
            <div className="pt-2 border-t border-neutral-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9.5px] font-heading font-black text-neutral-400 uppercase tracking-wider">
                  Current Activity Mode:
                </span>
                <span className="text-[9.5px] font-bold text-neutral-500">
                  One account for both
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 bg-neutral-100 p-1 rounded-2xl border border-neutral-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => handleToggleRole('poster')}
                  className={`py-1.5 sm:py-2 px-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeRole === 'poster'
                      ? 'bg-brand-yellow text-neutral-950 shadow-xs font-heading font-black'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="truncate">Need Help (Poster)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleRole('worker')}
                  className={`py-1.5 sm:py-2 px-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeRole === 'worker'
                      ? 'bg-part-green text-white shadow-xs font-heading font-black'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span className="truncate">Want to Earn (Helper)</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Primary Earnings Highlight Card */}
          <div
            id="btn-profile-earnings"
            role="button"
            tabIndex={0}
            onClick={() => setShowEarningsModal(true)}
            className="bg-gradient-to-r from-part-green to-part-green-forest text-white p-3.5 sm:p-4 rounded-3xl shadow-green cursor-pointer hover:shadow-lg transition-transform active:scale-[0.99] flex items-center justify-between"
          >
            <div className="space-y-0.5">
              <span className="text-[9.5px] font-black uppercase tracking-wider text-part-green-mint block">
                MY EARNINGS & SETTLEMENTS
              </span>
              <div className="flex items-baseline gap-1">
                <span className="font-heading font-black text-xl sm:text-2xl">
                  ₹{earnings?.totalEarnedInr || 0}
                </span>
                <span className="text-xs text-emerald-100 font-medium">settled</span>
              </div>
              <span className="text-[10.5px] sm:text-[11px] text-emerald-100 block">
                {earnings?.completedTasksCount || 0} gigs completed • Tap to view ledger
              </span>
            </div>

            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <Wallet className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Right Column on Tablet/Laptop (Saved Addresses & Navigation Menu) */}
        <div className="md:col-span-7 lg:col-span-7 space-y-3">
          {/* 4. Saved Addresses Quick Tile */}
          <div
            id="btn-profile-saved-addresses"
            role="button"
            tabIndex={0}
            onClick={() => setShowSavedAddressesModal(true)}
            className="bg-white p-3 sm:p-3.5 rounded-3xl border border-neutral-200/90 shadow-card flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-xs text-neutral-900">
                  Saved Addresses ({savedAddresses.length})
                </h4>
                <p className="text-[10.5px] sm:text-[11px] text-neutral-500">
                  Manage Home, Work, and neighborhood drop-offs
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          </div>

          {/* 5. Account Navigation Menu */}
          <div className="bg-white rounded-3xl border border-neutral-200/90 shadow-card divide-y divide-neutral-100 overflow-hidden text-xs">
            {/* Edit Profile & Details */}
            <button
              id="btn-profile-edit"
              type="button"
              onClick={handleOpenEditModal}
              className="w-full p-3 sm:p-3.5 flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-xl bg-brand-yellow/30 text-neutral-900 flex items-center justify-center shrink-0">
                  <Pencil className="w-3.5 h-3.5 text-neutral-900" />
                </div>
                <div className="text-left">
                  <h4 className="font-heading font-bold text-neutral-900">Edit Profile & Details</h4>
                  <p className="text-[10.5px] sm:text-[11px] text-neutral-500">
                    Name, mobile, bio, avatar, skills & UPI handle
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            {/* Campus & College */}
            <button
              id="btn-profile-college"
              type="button"
              onClick={openCollegeSelector}
              className="w-full p-3 sm:p-3.5 flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-heading font-bold text-neutral-900">Campus Community & College</h4>
                    <span className="text-[9px] font-black uppercase tracking-wider text-part-green bg-part-green-mint px-1.5 py-0.2 rounded-md">
                      {currentProfile.college_status === 'verified' ? 'Verified' : 'Member'}
                    </span>
                  </div>
                  <p className="text-[10.5px] sm:text-[11px] text-neutral-500">
                    {currentProfile.college_name || selectedCollegeName} • Tap to switch or verify
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            {/* My Tasks & Gigs */}
            <button
              id="btn-profile-my-tasks"
              type="button"
              onClick={() => setTab('activity')}
              className="w-full p-3 sm:p-3.5 flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-xl bg-part-green-mint text-part-green flex items-center justify-center shrink-0">
                  <Briefcase className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <h4 className="font-heading font-bold text-neutral-900">My Tasks & Gigs</h4>
                  <p className="text-[10.5px] sm:text-[11px] text-neutral-500">
                    {activeRole === 'poster' ? 'Tasks you have posted' : 'Gigs you have accepted'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            {/* Reviews & Ratings */}
            <button
              id="btn-profile-reviews"
              type="button"
              onClick={() => setShowReviewsModal(true)}
              className="w-full p-3 sm:p-3.5 flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Star className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <h4 className="font-heading font-bold text-neutral-900">My Reviews & Rating</h4>
                  <p className="text-[10.5px] sm:text-[11px] text-neutral-500">
                    ★ {currentProfile.rating_as_worker.toFixed(1)} Helper • ★ {currentProfile.rating_as_requester.toFixed(1)} Poster
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            {/* Security / Password Reset */}
            <button
              id="btn-profile-security"
              type="button"
              onClick={() => setShowSecurityModal(true)}
              className="w-full p-3 sm:p-3.5 flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center shrink-0">
                  <Lock className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <h4 className="font-heading font-bold text-neutral-900">Security & Password</h4>
                  <p className="text-[10.5px] sm:text-[11px] text-neutral-500">Update account password</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            {/* Help & Support */}
            <button
              id="btn-profile-help"
              type="button"
              onClick={() => setShowHelpModal(true)}
              className="w-full p-3 sm:p-3.5 flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <h4 className="font-heading font-bold text-neutral-900">Help & Support</h4>
                  <p className="text-[10.5px] sm:text-[11px] text-neutral-500">Chennai support hotline & FAQs</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-neutral-400" />
            </button>

            {/* Logout */}
            <button
              id="btn-profile-logout"
              type="button"
              onClick={() => setShowLogoutModal(true)}
              className="w-full p-3 sm:p-3.5 flex items-center justify-between hover:bg-rose-50/50 transition cursor-pointer text-rose-600"
            >
              <div className="flex items-center gap-3">
                <div className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <LogOut className="w-3.5 h-3.5" />
                </div>
                <div className="text-left">
                  <h4 className="font-heading font-bold">Log Out</h4>
                  <p className="text-[10.5px] sm:text-[11px] text-rose-500/80">Sign out from this device</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 1. SAVED ADDRESSES MODAL                                      */}
      {/* ============================================================== */}
      {showSavedAddressesModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
          <div className="bg-white w-full max-w-lg md:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up max-h-[85vh] flex flex-col">
            <div className="px-5 pt-4 pb-3 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-black text-base text-neutral-900 tracking-tight">
                  Saved Addresses
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Manage your pickup and delivery spots across Chennai
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSavedAddressesModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Existing Address List */}
              <div className="space-y-2.5">
                {savedAddresses.map((addr) => {
                  const isCurrent = userLocation.locality.includes(addr.locality);
                  return (
                    <div
                      key={addr.id}
                      className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 transition ${
                        isCurrent
                          ? 'border-part-green bg-emerald-50/50'
                          : 'border-neutral-200 bg-neutral-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-part-green-mint text-part-green flex items-center justify-center shrink-0 mt-0.5">
                          {addr.label === 'Home' ? (
                            <Bookmark className="w-4 h-4" />
                          ) : addr.label === 'Work' ? (
                            <Briefcase className="w-4 h-4" />
                          ) : (
                            <MapPin className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-heading font-bold text-xs text-neutral-900">
                              {addr.title || addr.label}
                            </span>
                            {isCurrent && (
                              <span className="text-[9px] font-black uppercase tracking-wider text-part-green bg-part-green-mint px-1.5 py-0.2 rounded-md">
                                Active Location
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-neutral-600 mt-0.5">
                            {addr.address_line}
                          </p>
                          <p className="text-[10px] text-neutral-400 font-medium">
                            {addr.locality}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleSelectAddress(addr)}
                            className="px-2.5 py-1 bg-part-green text-white font-heading font-bold text-[10px] rounded-lg shadow-xs hover:bg-part-green-dark cursor-pointer"
                          >
                            Use Now
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete address"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Action: Set Address from Live Location */}
              {!isAddingAddress && (
                <button
                  type="button"
                  onClick={() => handleDetectLiveLocation(true)}
                  disabled={isDetectingGps}
                  className="w-full p-3 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/90 rounded-2xl flex items-center justify-between gap-3 text-left transition shadow-2xs group cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-part-green text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition">
                      {isDetectingGps ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Navigation className="w-4 h-4 text-brand-yellow" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-heading font-extrabold text-xs text-neutral-900">
                          Set Address from Live Location
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-wider text-part-green bg-part-green-mint px-1.5 py-0.2 rounded-md">
                          Live GPS
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-600 truncate mt-0.5">
                        Auto-detect street & locality using your phone's GPS
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-part-green font-heading font-bold text-xs shrink-0">
                    <span>{isDetectingGps ? 'Locating...' : 'Set Now'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>
              )}

              {/* Add Address Form Toggle */}
              {!isAddingAddress ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingAddress(true);
                    setShowMapPicker(false);
                  }}
                  className="w-full py-2.5 border-2 border-dashed border-neutral-300 hover:border-part-green text-neutral-700 hover:text-part-green rounded-2xl font-heading font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Address Manually</span>
                </button>
              ) : (
                <form onSubmit={handleSaveNewAddress} className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-heading font-bold text-xs text-neutral-900">
                        Add Address Details
                      </span>
                      {newAddrCoords && (
                        <span className="text-[9px] font-black uppercase tracking-wider text-part-green bg-part-green-mint px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-part-green animate-pulse" />
                          Live GPS Synced
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingAddress(false);
                        setShowMapPicker(false);
                        setGpsError(null);
                      }}
                      className="text-neutral-400 hover:text-neutral-600 text-xs cursor-pointer font-medium"
                    >
                      Cancel
                    </button>
                  </div>

                  {/* Live GPS & Map Action Bar */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleDetectLiveLocation(false)}
                      disabled={isDetectingGps}
                      className="p-2.5 bg-emerald-100/70 hover:bg-emerald-200/80 text-part-green-dark border border-emerald-300/80 rounded-xl text-left transition flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isDetectingGps ? (
                        <Loader2 className="w-4 h-4 animate-spin shrink-0 text-part-green" />
                      ) : (
                        <Crosshair className="w-4 h-4 shrink-0 text-part-green" />
                      )}
                      <div className="min-w-0">
                        <span className="font-heading font-bold text-[11px] block leading-tight truncate">
                          {isDetectingGps ? 'Detecting...' : 'Use Live GPS'}
                        </span>
                        <span className="text-[9px] text-emerald-700/80 block leading-none">
                          Auto-fill address
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowMapPicker(!showMapPicker)}
                      className={`p-2.5 border rounded-xl text-left transition flex items-center gap-2 cursor-pointer ${
                        showMapPicker
                          ? 'bg-part-green text-white border-part-green shadow-xs'
                          : 'bg-white hover:bg-neutral-100 border-neutral-200 text-neutral-700'
                      }`}
                    >
                      <MapPin className={`w-4 h-4 shrink-0 ${showMapPicker ? 'text-brand-yellow' : 'text-neutral-500'}`} />
                      <div className="min-w-0">
                        <span className="font-heading font-bold text-[11px] block leading-tight truncate">
                          {showMapPicker ? 'Close Map' : 'Pick on Map'}
                        </span>
                        <span className={`text-[9px] block leading-none ${showMapPicker ? 'text-emerald-100' : 'text-neutral-400'}`}>
                          Pinpoint location
                        </span>
                      </div>
                    </button>
                  </div>

                  {/* GPS Feedback & Accuracy Badge */}
                  {newAddrCoords && (
                    <div className="bg-emerald-50 border border-emerald-200/90 rounded-xl p-2 flex items-center justify-between text-[11px] text-emerald-900 shadow-2xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <CheckCircle2 className="w-3.5 h-3.5 text-part-green shrink-0" />
                        <span className="truncate font-medium">
                          {newAddrCoords.latitude.toFixed(4)}, {newAddrCoords.longitude.toFixed(4)}
                          {gpsAccuracy ? ` (±${gpsAccuracy}m accuracy)` : ''}
                        </span>
                      </div>
                      {isReverseGeocoding && (
                        <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-bold shrink-0">
                          <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          Geocoding...
                        </span>
                      )}
                    </div>
                  )}

                  {/* GPS Error Message */}
                  {gpsError && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 text-xs text-amber-800 flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-tight">{gpsError}</span>
                    </div>
                  )}

                  {/* Embedded Interactive Leaflet Pin Picker Map */}
                  {showMapPicker && (
                    <div className="space-y-1 rounded-2xl overflow-hidden border border-neutral-200/90 shadow-sm bg-neutral-100">
                      <div className="h-[210px] w-full relative">
                        <PartLeafletMap
                          latitude={newAddrCoords?.latitude ?? userLocation.latitude ?? 12.9815}
                          longitude={newAddrCoords?.longitude ?? userLocation.longitude ?? 80.218}
                          isPickerMode={true}
                          onPickerLocationChange={handleMapPinMoved}
                          zoom={15}
                          userGpsCoords={
                            userLocation.latitude && userLocation.longitude
                              ? { latitude: userLocation.latitude, longitude: userLocation.longitude }
                              : null
                          }
                        />
                      </div>
                      <div className="p-2 bg-white text-[11px] text-neutral-600 flex items-center justify-between border-t border-neutral-100">
                        <span className="flex items-center gap-1 text-[10.5px] truncate">
                          <MapPin className="w-3 h-3 text-part-green shrink-0" />
                          <span className="truncate">{newAddrLine || 'Drag marker or click map'}</span>
                        </span>
                        <span className="text-[9px] font-black text-part-green uppercase bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                          Tap or drag pin
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Label selector */}
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">
                      Address Label
                    </label>
                    <div className="flex items-center gap-2">
                      {(['Home', 'Work', 'Other'] as const).map((lbl) => (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() => setNewAddrLabel(lbl)}
                          className={`flex-1 py-1.5 rounded-xl text-xs font-heading font-bold transition cursor-pointer ${
                            newAddrLabel === lbl
                              ? 'bg-part-green text-white shadow-xs'
                              : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                          }`}
                        >
                          {lbl === 'Home' ? '🏠 Home' : lbl === 'Work' ? '💼 Work' : '📍 Other'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold text-neutral-500 uppercase block">
                        Street / Apartment / Door No.
                      </label>
                      {newAddrCoords && (
                        <span className="text-[9px] text-part-green font-bold flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" />
                          GPS auto-filled
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="e.g. No. 42, 3rd Cross, Nehru Nagar"
                      value={newAddrLine}
                      onChange={(e) => setNewAddrLine(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-part-green font-medium"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">
                      Chennai Locality
                    </label>
                    <select
                      value={newAddrLocality}
                      onChange={(e) => {
                        setNewAddrLocality(e.target.value);
                        const loc = CHENNAI_LOCALITIES.find((l) => l.name === e.target.value);
                        if (loc && !newAddrCoords) {
                          setNewAddrCoords({ latitude: loc.latitude, longitude: loc.longitude });
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-part-green font-medium cursor-pointer"
                    >
                      {CHENNAI_LOCALITIES.map((loc) => (
                        <option key={loc.name} value={loc.name}>
                          {loc.name}, Chennai
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-part-green text-white font-heading font-black text-xs rounded-xl shadow-green hover:bg-part-green-dark transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.99]"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Save Address</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. REVIEWS & RATINGS MODAL                                     */}
      {/* ============================================================== */}
      {showReviewsModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
          <div className="bg-white w-full max-w-lg md:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up max-h-[85vh] flex flex-col">
            <div className="px-5 pt-4 pb-3 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-black text-base text-neutral-900 tracking-tight">
                  My Reviews & Reputation
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Verified feedback from Chennai task participants
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewsModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Dual Rating Scorecards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-amber-50/80 border border-amber-200/80 p-3.5 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                    Helper Rating
                  </span>
                  <div className="flex items-center justify-center gap-1 text-amber-500">
                    <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                    <span className="font-heading font-black text-2xl text-neutral-900">
                      {currentProfile.rating_as_worker.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500 block">
                    {currentProfile.total_reviews_as_worker} reviews received
                  </span>
                </div>

                <div className="bg-emerald-50/80 border border-emerald-200/80 p-3.5 rounded-2xl text-center space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-part-green-dark">
                    Poster Rating
                  </span>
                  <div className="flex items-center justify-center gap-1 text-part-green">
                    <Star className="w-5 h-5 fill-part-green text-part-green" />
                    <span className="font-heading font-black text-2xl text-neutral-900">
                      {currentProfile.rating_as_requester.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-500 block">
                    {currentProfile.total_reviews_as_requester} reviews received
                  </span>
                </div>
              </div>

              {/* Verified Trust Badges */}
              <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-200/80 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-neutral-800 font-semibold">
                  <ShieldCheck className="w-4 h-4 text-part-green shrink-0" />
                  <span>Aadhaar / Mobile Verified Profile</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-800 font-semibold">
                  <CheckCircle className="w-4 h-4 text-part-green shrink-0" />
                  <span>100% Escrow Task Completion Record</span>
                </div>
              </div>

              {/* Verified Review List */}
              <div className="space-y-3 pt-1">
                <span className="text-[11px] font-heading font-bold text-neutral-400 uppercase tracking-wider block">
                  Recent Community Reviews
                </span>

                {userReviews.length > 0 ? (
                  userReviews.map((rev) => (
                    <div key={rev.id} className="bg-white p-3.5 rounded-2xl border border-neutral-200/90 shadow-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-brand-yellow font-heading font-bold text-[10px] flex items-center justify-center">
                            {rev.reviewer?.full_name?.charAt(0) || 'U'}
                          </div>
                          <span className="font-heading font-bold text-xs text-neutral-900">
                            {rev.reviewer?.full_name || 'PART User'}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-500">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-neutral-700 italic">
                        "{rev.feedback}"
                      </p>
                      <span className="text-[10px] text-neutral-400 block">
                        Verified {rev.role_reviewed === 'worker' ? 'Helper' : 'Requester'} • {new Date(rev.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-center space-y-1.5">
                    <Star className="w-6 h-6 text-amber-400 mx-auto fill-amber-400" />
                    <p className="font-heading font-bold text-xs text-neutral-900">
                      Perfect 5.0 Rating Record
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      Complete tasks in Chennai to start collecting public neighborhood reviews!
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. SECURITY & PASSWORD MODAL                                   */}
      {/* ============================================================== */}
      {showSecurityModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
          <div className="bg-white w-full max-w-lg md:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up max-h-[85vh] flex flex-col">
            <div className="px-5 pt-4 pb-3 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-black text-base text-neutral-900 tracking-tight">
                  Security & Password
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Update your account password or trigger recovery
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSecurityModal(false);
                  setPasswordError(null);
                  setPasswordSuccess(null);
                }}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdatePassword} className="p-5 overflow-y-auto space-y-4">
              {passwordError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-2xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-part-green text-xs p-3 rounded-2xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Enter at least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-part-green focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-neutral-500 uppercase block mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Re-type your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-part-green focus:bg-white transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="w-full py-3 bg-part-green hover:bg-part-green-dark text-white font-heading font-black text-xs rounded-2xl shadow-green transition cursor-pointer flex items-center justify-center gap-2"
              >
                {isUpdatingPassword ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Update Password</span>
                  </>
                )}
              </button>

              <div className="pt-2 border-t border-neutral-100 text-center">
                <button
                  type="button"
                  onClick={async () => {
                    if (currentProfile.email) {
                      await authService.sendPasswordRecoveryEmail(currentProfile.email);
                      setPasswordSuccess(`Recovery link sent to ${currentProfile.email}`);
                    }
                  }}
                  className="text-xs font-heading font-bold text-part-green hover:underline cursor-pointer"
                >
                  Send recovery link to {currentProfile.email}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. HELP & SUPPORT MODAL                                        */}
      {/* ============================================================== */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
          <div className="bg-white w-full max-w-lg md:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up max-h-[85vh] flex flex-col">
            <div className="px-5 pt-4 pb-3 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-black text-base text-neutral-900 tracking-tight">
                  Help & Customer Support
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Chennai support desk • 7:00 AM – 11:00 PM IST
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Direct Action Contacts */}
              <div className="grid grid-cols-2 gap-2.5">
                <a
                  href="tel:+914428334455"
                  className="p-3 bg-emerald-50 border border-emerald-200 text-part-green-dark rounded-2xl flex items-center gap-2.5 hover:bg-emerald-100 transition shadow-xs"
                >
                  <div className="w-8 h-8 rounded-xl bg-part-green text-white flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-heading font-black text-xs block">Call Hotline</span>
                    <span className="text-[10px] text-neutral-500">+91 44 2833 4455</span>
                  </div>
                </a>

                <a
                  href="https://wa.me/919840123456?text=Hi%20PART%20Support%2C%20I%20need%20help%20with%20a%20task."
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-green-50 border border-green-200 text-green-900 rounded-2xl flex items-center gap-2.5 hover:bg-green-100 transition shadow-xs"
                >
                  <div className="w-8 h-8 rounded-xl bg-green-600 text-white flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-heading font-black text-xs block">WhatsApp Desk</span>
                    <span className="text-[10px] text-neutral-500">Instant Chat</span>
                  </div>
                </a>
              </div>

              {/* Email & Hub Info */}
              <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-neutral-900">Email Inquiries:</span>
                  <a href="mailto:support@part.in" className="text-part-green font-bold hover:underline">
                    support@part.in
                  </a>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-200/60">
                  <span>Chennai Hub:</span>
                  <span>Velachery / Taramani Tech Corridor</span>
                </div>
              </div>

              {/* Interactive Accordion FAQs */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-heading font-bold text-neutral-400 uppercase tracking-wider block">
                  Frequently Asked Questions
                </span>

                {[
                  {
                    q: 'How does escrow protection work?',
                    a: 'When you accept a task, funds are placed into platform escrow or settled directly via Cash on Completion. Workers are guaranteed full payout upon verified completion.',
                  },
                  {
                    q: 'How are workers verified in Chennai?',
                    a: 'All participants register with mobile OTP and email verification. Workers on high-value gigs provide verified government ID.',
                  },
                  {
                    q: 'What if a helper cancels or is delayed?',
                    a: 'You can chat or call the helper in real time. If the worker fails to arrive within 30 minutes, you can reassign the task with zero penalties.',
                  },
                  {
                    q: 'What are the platform fees?',
                    a: 'PART charges a transparent 5% platform fee on completed gigs to cover escrow guarantee, customer support, and insurance.',
                  },
                ].map((item, idx) => {
                  const isOpen = expandedFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-neutral-200 rounded-2xl overflow-hidden bg-white shadow-xs"
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedFaq(isOpen ? null : idx)}
                        className="w-full p-3 text-left font-heading font-bold text-xs text-neutral-900 flex items-center justify-between hover:bg-neutral-50 transition cursor-pointer"
                      >
                        <span>{item.q}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${
                            isOpen ? 'rotate-180 text-part-green' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="p-3 pt-0 text-[11px] text-neutral-600 border-t border-neutral-100 bg-neutral-50/50 leading-relaxed">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. EARNINGS & SETTLEMENTS LEDGER MODAL                         */}
      {/* ============================================================== */}
      {showEarningsModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
          <div className="bg-white w-full max-w-lg md:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up max-h-[85vh] flex flex-col">
            <div className="px-5 pt-4 pb-3 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="font-heading font-black text-base text-neutral-900 tracking-tight">
                  My Earnings Ledger
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Instant daily settlements to your connected UPI
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEarningsModal(false);
                  setPayoutMessage(null);
                }}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {payoutMessage && (
                <div className="bg-emerald-50 border border-emerald-200 text-part-green text-xs p-3 rounded-2xl flex items-center gap-2 animate-slide-up">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{payoutMessage}</span>
                </div>
              )}

              {/* Total Banner */}
              <div className="bg-gradient-to-r from-part-green to-part-green-dark text-white p-4 rounded-2xl shadow-green space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100">
                  Total Settled Balance
                </span>
                <div className="font-heading font-black text-3xl">
                  ₹{earnings?.totalEarnedInr || 0}
                </div>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-emerald-100">
                  <span>In Escrow: ₹{earnings?.pendingPaymentInr || 0}</span>
                  <span>•</span>
                  <span>Gigs Completed: {earnings?.completedTasksCount || 0}</span>
                </div>
              </div>

              {/* Connected UPI Settlement Details */}
              <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-heading font-bold text-neutral-900">Connected UPI Account:</span>
                  <span className="font-mono text-xs font-bold text-part-green bg-part-green-mint px-2 py-0.5 rounded-md">
                    {currentProfile.email?.split('@')[0] || 'worker'}@okhdfcbank
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Earnings are automatically disbursed every evening at 11:59 PM IST directly to your UPI ID.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPayoutMessage('Instant payout request received! Funds will reflect in your UPI within 15 minutes.');
                  }}
                  className="w-full py-2 bg-white hover:bg-neutral-100 text-neutral-900 font-heading font-bold text-xs rounded-xl border border-neutral-300 shadow-xs transition cursor-pointer"
                >
                  Request Instant Payout
                </button>
              </div>

              {/* Transaction List */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-heading font-bold text-neutral-400 uppercase tracking-wider block">
                  Recent Settlement Ledger
                </span>

                {earnings?.payments && earnings.payments.length > 0 ? (
                  earnings.payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 bg-white border border-neutral-200 rounded-2xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-heading font-bold text-neutral-900 block">
                          Gig Payout #{p.id.slice(-6)}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {new Date(p.created_at).toLocaleDateString()} • {p.payment_method.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-heading font-black text-part-green text-sm block">
                          +₹{p.worker_amount_inr}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-md uppercase">
                          {p.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-center text-xs text-neutral-500">
                    No transactions yet. Complete gigs to accumulate earnings in Chennai!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. LOG OUT CONFIRMATION MODAL                                  */}
      {/* ============================================================== */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 select-none">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-5 animate-scale-in text-center space-y-3.5 border border-neutral-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-black text-base text-neutral-900">
                Log Out of PART?
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                You will be signed out from this device. You can sign back in anytime with your email or Google account.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-heading font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  logout();
                }}
                className="py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-heading font-black text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. EDIT PROFILE & ALL DETAILS MODAL                            */}
      {/* ============================================================== */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 select-none">
          <div className="bg-white w-full max-w-lg md:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up max-h-[92vh] sm:max-h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-4 sm:px-5 pt-3.5 pb-2.5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-brand-yellow flex items-center justify-center text-neutral-950 font-bold shadow-xs shrink-0">
                  <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <h3 className="font-heading font-black text-sm sm:text-base text-neutral-900 tracking-tight">
                    Edit Profile Details
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-neutral-500">
                    Update identity, contact info, bio, avatar, skills & UPI
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-close-edit-profile"
                onClick={() => setShowEditProfileModal(false)}
                className="w-7.5 h-7.5 sm:w-8 sm:h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveProfile} className="overflow-y-auto p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 flex-1">
              {editProfileError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editProfileError}</span>
                </div>
              )}

              {/* 1. Avatar Chooser & Upload */}
              <div className="space-y-2">
                <label className="text-xs font-heading font-bold text-neutral-800 flex items-center justify-between">
                  <span>Profile Photo & Avatar</span>
                  <span className="text-[10px] sm:text-[11px] text-neutral-400 font-normal">Pick or upload photo</span>
                </label>

                <div className="flex items-center gap-3 bg-neutral-50 p-2.5 sm:p-3 rounded-2xl border border-neutral-200/80">
                  {/* Big Preview */}
                  <div className="relative shrink-0">
                    <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-br from-brand-yellow via-amber-300 to-amber-400 text-neutral-950 font-heading font-black text-xl flex items-center justify-center shadow-xs border-2 border-brand-yellow-hover overflow-hidden select-none">
                      {editAvatarUrl ? (
                        <img
                          src={editAvatarUrl}
                          alt="Preview"
                          onError={(e) => {
                            (e.target as any).src = '';
                            setEditAvatarUrl('');
                          }}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-heading font-black text-lg text-neutral-950">
                          {getInitials(editFullName || currentProfile.full_name)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="px-2.5 py-1 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-xl text-[11px] sm:text-xs font-heading font-bold text-neutral-800 flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Camera className="w-3 h-3 text-part-green" />
                        <span>{isUploadingAvatar ? 'Uploading...' : 'Upload Photo'}</span>
                      </button>
                      {editAvatarUrl && (
                        <button
                          type="button"
                          onClick={() => setEditAvatarUrl('')}
                          className="text-[10.5px] text-neutral-500 hover:text-rose-600 font-medium underline cursor-pointer"
                        >
                          Use Initials
                        </button>
                      )}
                    </div>
                    <p className="text-[9.5px] sm:text-[10px] text-neutral-500">
                      JPG, PNG, WebP up to 3MB. Or pick a preset below.
                    </p>
                  </div>
                </div>

                {/* Preset Avatars Chips */}
                <div className="space-y-1">
                  <span className="text-[9.5px] font-heading font-bold text-neutral-500 uppercase tracking-wider block">
                    Curated Avatars
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {PRESET_AVATARS.map((preset) => {
                      const isSelected =
                        (preset.id === 'initials' && !editAvatarUrl) ||
                        (preset.url && editAvatarUrl === preset.url);

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setEditAvatarUrl(preset.url)}
                          className={`p-1.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center gap-0.5 ${
                            isSelected
                              ? 'bg-amber-50 border-brand-yellow ring-2 ring-brand-yellow/30'
                              : 'bg-white border-neutral-200 hover:border-neutral-300'
                          }`}
                        >
                          <span className="text-base sm:text-lg">{preset.emoji}</span>
                          <span className="text-[9.5px] font-bold text-neutral-800 truncate w-full">
                            {preset.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 2. Personal Information (2 columns on tablet/laptop) */}
              <div className="space-y-2.5 pt-2 border-t border-neutral-100">
                <span className="text-xs font-heading font-black text-neutral-900 uppercase tracking-wider block">
                  Personal Information
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Full Name */}
                  <div className="space-y-0.5">
                    <label className="text-[10.5px] sm:text-[11px] font-bold text-neutral-700 flex items-center justify-between">
                      <span>Full Name *</span>
                      <span className="text-[9.5px] text-neutral-400">Public name</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        placeholder="e.g. Mahasuf Wazeed"
                        className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Mobile Phone Number */}
                  <div className="space-y-0.5">
                    <label className="text-[10.5px] sm:text-[11px] font-bold text-neutral-700 flex items-center justify-between">
                      <span>Mobile Phone</span>
                      <span className="text-[9.5px] text-emerald-600 font-semibold">For OTP & alerts</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-2.5 flex items-center gap-1 text-[11px] font-bold text-neutral-700 border-r border-neutral-200 pr-1.5">
                        <span>🇮🇳</span>
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="98401 23456"
                        maxLength={14}
                        className="w-full pl-18 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* Email (Verified badge) */}
                <div className="space-y-0.5">
                  <label className="text-[10.5px] sm:text-[11px] font-bold text-neutral-700 flex items-center justify-between">
                    <span>Email Address</span>
                    <span className="text-[9.5px] text-part-green font-bold flex items-center gap-0.5">
                      <ShieldCheck className="w-3 h-3 fill-part-green text-white" />
                      Verified
                    </span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      disabled
                      value={currentProfile.email || ''}
                      className="w-full pl-9 pr-3 py-2 bg-neutral-100 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-500 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Locality & App Language (2 columns on tablet/laptop) */}
              <div className="space-y-2.5 pt-2 border-t border-neutral-100">
                <span className="text-xs font-heading font-black text-neutral-900 uppercase tracking-wider block">
                  Neighborhood & Preferences
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Primary Locality */}
                  <div className="space-y-0.5">
                    <label className="text-[10.5px] sm:text-[11px] font-bold text-neutral-700 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-part-green" />
                      <span>Chennai Locality</span>
                    </label>
                    <select
                      value={
                        CHENNAI_LOCALITIES.some((l) => `${l.name}, Chennai` === editLocality || l.name === editLocality)
                          ? CHENNAI_LOCALITIES.find((l) => `${l.name}, Chennai` === editLocality || l.name === editLocality)?.name
                          : CHENNAI_LOCALITIES[0].name
                      }
                      onChange={(e) => setEditLocality(`${e.target.value}, Chennai`)}
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900"
                    >
                      {CHENNAI_LOCALITIES.map((loc) => (
                        <option key={loc.name} value={loc.name}>
                          {loc.name} ({loc.pincode})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* App Language */}
                  <div className="space-y-0.5">
                    <label className="text-[10.5px] sm:text-[11px] font-bold text-neutral-700 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-blue-600" />
                      <span>Preferred Language</span>
                    </label>
                    <div className="grid grid-cols-2 gap-1 bg-neutral-100 p-0.5 rounded-xl border border-neutral-200 text-xs">
                      <button
                        type="button"
                        onClick={() => setEditLanguage('en')}
                        className={`py-1.5 rounded-lg font-heading font-bold transition cursor-pointer text-xs ${
                          editLanguage === 'en'
                            ? 'bg-white text-neutral-950 shadow-xs'
                            : 'text-neutral-500 hover:text-neutral-900'
                        }`}
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditLanguage('ta')}
                        className={`py-1.5 rounded-lg font-heading font-bold transition cursor-pointer text-xs ${
                          editLanguage === 'ta'
                            ? 'bg-part-green text-white shadow-xs'
                            : 'text-neutral-500 hover:text-neutral-900'
                        }`}
                      >
                        தமிழ்
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Bio / Headline */}
              <div className="space-y-1 pt-1.5 border-t border-neutral-100">
                <label className="text-[10.5px] sm:text-[11px] font-bold text-neutral-700 flex items-center justify-between">
                  <span>About You / Bio</span>
                  <span className="text-[9.5px] text-neutral-400">Max 300 chars</span>
                </label>
                <textarea
                  rows={2}
                  maxLength={300}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="e.g. Reliable helper in South Chennai. Experienced in electrical repairs, fast delivery & furniture assembly."
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white resize-none"
                />
              </div>

              {/* 5. Helper Skills & Services */}
              <div className="space-y-1.5 pt-1.5 border-t border-neutral-100">
                <label className="text-[10.5px] sm:text-[11px] font-bold text-neutral-700 flex items-center justify-between">
                  <span>Skills & Services (Helper Mode)</span>
                  <span className="text-[9.5px] text-neutral-400">Select what you can help with</span>
                </label>
                <div className="flex flex-wrap gap-1">
                  {POPULAR_SKILLS.map((skill) => {
                    const isSelected = editSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setEditSkills(editSkills.filter((s) => s !== skill));
                          } else {
                            setEditSkills([...editSkills, skill]);
                          }
                        }}
                        className={`text-[11px] px-2 py-0.5 rounded-lg font-medium border transition cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-part-green text-white border-part-green shadow-xs'
                            : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                        }`}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5" />}
                        <span>{skill}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. UPI ID & Worker Availability (2 columns on tablet/laptop) */}
              <div className="pt-2 border-t border-neutral-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 items-start">
                  {/* UPI ID */}
                  <div className="space-y-0.5">
                    <label className="text-[10.5px] sm:text-[11px] font-bold text-neutral-700 flex items-center justify-between">
                      <span>UPI ID (For Instant Payouts)</span>
                      <span className="text-[9.5px] text-neutral-400">GPay / Paytm</span>
                    </label>
                    <div className="relative">
                      <QrCode className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={editUpiId}
                        onChange={(e) => setEditUpiId(e.target.value)}
                        placeholder="e.g. mobile@okhdfcbank"
                        className="w-full pl-9 pr-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:border-neutral-900 focus:bg-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Worker Availability Toggle */}
                  <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200/80 flex items-center justify-between sm:mt-4">
                    <div>
                      <h5 className="font-heading font-bold text-xs text-neutral-900">
                        Available for Gigs
                      </h5>
                      <p className="text-[9.5px] text-neutral-500">
                        Accept nearby Chennai tasks
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditIsAvailable(!editIsAvailable)}
                      className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
                        editIsAvailable ? 'bg-part-green' : 'bg-neutral-300'
                      }`}
                    >
                      <span
                        className={`block w-3.5 h-3.5 rounded-full bg-white shadow-md transform transition-transform absolute top-0.5 ${
                          editIsAvailable ? 'translate-x-4.5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="pt-2 sticky bottom-0 bg-white pb-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="w-1/3 py-2.5 px-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-heading font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-save-edit-profile"
                  disabled={isSavingProfile}
                  className="flex-1 py-2.5 px-4 bg-brand-yellow hover:bg-brand-yellow-hover text-neutral-950 font-heading font-black text-xs rounded-xl shadow-yellow transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.99]"
                >
                  {isSavingProfile ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Save Profile Details</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

      {/* Campus Community College Selector Modal */}
      <CollegeSelectorModal
        isOpen={isCollegeSelectorOpen}
        onClose={closeCollegeSelector}
      />
    </div>
  );
};
