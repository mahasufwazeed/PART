import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import {
  authService,
  loginSchema,
  registerSchema,
} from '@part/shared';
import { PartLogo } from '../components/PartLogo';
import { UniversityOnboardingModal } from '../components/UniversityOnboardingModal';
import { LocationSelectorModal } from '../components/LocationSelectorModal';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  AlertCircle,
  ArrowRight,
  ShoppingCart,
  FileText,
  Package,
  Wrench,
  Coffee,
  BookOpen,
  Users,
  MapPin,
  Zap,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface LoginScreenProps {
  onNavigateSignup?: () => void;
  onNavigateForgotPassword?: () => void;
  onSuccess?: () => void;
  returnTo?: string;
  initialMode?: 'login' | 'signup';
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateForgotPassword,
  onSuccess,
  returnTo,
  initialMode = 'login',
}) => {
  const { setCurrentProfile } = useAppStore();

  // Tab State: 'login' | 'signup'
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialMode);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // UX Feedback & Modals
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Check if Apple auth is configured (per requirements: hide if not configured)
  const isAppleAuthConfigured = false;

  // Normalize Email / Phone
  const normalizeIdentifier = (val: string): string => {
    const clean = val.trim();
    if (/^[6-9]\d{9}$/.test(clean)) {
      return `${clean}@part.local`;
    }
    return clean;
  };

  // 1-Click Demo Login for instant zero-config testing
  const handleDemoLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await authService.login('demo@part.app', 'demo1234', true);
      if (res.session?.profile) {
        setCurrentProfile(res.session.profile);
        if (onSuccess) onSuccess();
      } else if (res.error) {
        setErrorMessage(res.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = normalizeIdentifier(emailOrPhone);
    const parsed = loginSchema.safeParse({
      email: cleanEmail,
      password,
      rememberMe,
    });

    if (!parsed.success) {
      setErrorMessage(parsed.error.errors[0]?.message || 'Please check your email and password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.login(cleanEmail, password, rememberMe);
      if (res.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
        return;
      }

      if (res.session?.profile) {
        setCurrentProfile(res.session.profile);
        if (!res.session.profile.college_id) {
          setShowOnboardingModal(true);
        } else if (!res.session.profile.general_location) {
          setShowLocationModal(true);
        } else if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Signup Submit
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = normalizeIdentifier(emailOrPhone);

    // Validation
    const parsed = registerSchema.safeParse({
      full_name: fullName,
      email: cleanEmail,
      password,
    });

    if (!parsed.success) {
      setErrorMessage(parsed.error.errors[0]?.message || 'Please check your inputs.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (!termsAccepted) {
      setErrorMessage('You must accept the Terms and Privacy Policy to continue.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.register(cleanEmail, password, fullName);
      if (res.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
        return;
      }

      if (res.profile) {
        setCurrentProfile(res.profile);
        // Prompt for university onboarding (Phase 6)
        setShowOnboardingModal(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);

    try {
      const res = await authService.signInWithGoogle();
      if (res.error) {
        setErrorMessage(res.error);
        setIsGoogleLoading(false);
      } else if (res.session?.profile) {
        setCurrentProfile(res.session.profile);
        setIsGoogleLoading(false);
        if (onSuccess) onSuccess();
      } else if (res.redirectInitiated) {
        // Full page redirect in progress, keep loading state
      } else {
        setIsGoogleLoading(false);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in failed.');
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#EDF3EC] bg-gradient-to-br from-[#F5F8F4] via-[#EEF5EB] to-[#E2EFE0] text-neutral-900 flex items-center justify-center p-3 sm:p-6 lg:p-10 select-none overflow-x-hidden relative">
      {/* Decorative ambient campus background aura */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] rounded-full bg-emerald-300/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-[500px] h-[500px] rounded-full bg-[#FFCC00]/10 blur-[100px] pointer-events-none" />

      {/* Main 2-Column Responsive Card Shell */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
        
        {/* ============================================================ */}
        {/* LEFT COLUMN: Campus Showcase / Hero Section                  */}
        {/* ============================================================ */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6 lg:space-y-8 py-2 lg:py-4">
          
          {/* 1. Custom PART Logo & Handwritten Doodle */}
          <PartLogo
            variant="full"
            size="lg"
            showDoodle={true}
            doodleText="> Your Campus Helper"
          />

          {/* 2. Main Hero Headline */}
          <div className="space-y-2">
            <h1 className="font-heading font-black text-3xl sm:text-4xl lg:text-5xl text-[#0F172A] tracking-tight leading-[1.12]">
              Get Things Done <br />
              <span className="text-[#146B3A] font-black">Around Your Campus</span>
            </h1>
            <p className="text-neutral-600 text-xs sm:text-sm lg:text-base font-medium leading-relaxed max-w-xl">
              Post tasks. Find nearby students. Earn. Help. <br className="hidden sm:inline" />
              Build a smarter campus together.
            </p>
          </div>

          {/* 3. Four Category Cards Row */}
          <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-lg">
            {/* Card 1: Run Errands */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/80 p-3 sm:p-3.5 flex flex-col items-center text-center shadow-xs hover:shadow-md hover:scale-[1.03] transition-all cursor-pointer">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 text-[#146B3A] flex items-center justify-center mb-1.5">
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[10.5px] sm:text-xs font-heading font-extrabold text-neutral-800 leading-tight">
                Run Errands
              </span>
            </div>

            {/* Card 2: Assignments & Notes */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/80 p-3 sm:p-3.5 flex flex-col items-center text-center shadow-xs hover:shadow-md hover:scale-[1.03] transition-all cursor-pointer">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-1.5">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[10.5px] sm:text-xs font-heading font-extrabold text-neutral-800 leading-tight">
                Assignments & Notes
              </span>
            </div>

            {/* Card 3: Buy & Sell */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/80 p-3 sm:p-3.5 flex flex-col items-center text-center shadow-xs hover:shadow-md hover:scale-[1.03] transition-all cursor-pointer">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-1.5">
                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[10.5px] sm:text-xs font-heading font-extrabold text-neutral-800 leading-tight">
                Buy & Sell
              </span>
            </div>

            {/* Card 4: Help & Services */}
            <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-white/80 p-3 sm:p-3.5 flex flex-col items-center text-center shadow-xs hover:shadow-md hover:scale-[1.03] transition-all cursor-pointer">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-1.5">
                <Wrench className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <span className="text-[10.5px] sm:text-xs font-heading font-extrabold text-neutral-800 leading-tight">
                Help & Services
              </span>
            </div>
          </div>

          {/* 4. Campus Students Photo Showcase with Floating Task Bubbles */}
          <div className="relative rounded-[28px] overflow-hidden shadow-2xl border-4 border-white/90 max-w-xl group">
            {/* Campus Students Photo */}
            <img
              src="/campus_hero.jpg"
              alt="Campus Students collaborating on PART"
              className="w-full h-64 sm:h-80 md:h-96 object-cover object-top transition duration-500 group-hover:scale-105"
            />
            {/* Soft Ambient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />

            {/* Floating Task Badge 1: Get Coffee (Top-Left) */}
            <div className="absolute top-4 left-4 bg-amber-50/95 backdrop-blur-md rounded-2xl p-2.5 shadow-lg border border-amber-200/90 flex items-center gap-2.5 animate-pulse-subtle">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center shrink-0">
                <Coffee className="w-4 h-4" />
              </div>
              <div className="pr-1">
                <div className="text-[11px] font-heading font-black text-neutral-900 leading-none">
                  Get coffee from library?
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex -space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-emerald-500 border border-white text-[8px] text-white flex items-center justify-center font-bold">R</span>
                    <span className="w-4 h-4 rounded-full bg-amber-500 border border-white text-[8px] text-white flex items-center justify-center font-bold">P</span>
                    <span className="w-4 h-4 rounded-full bg-blue-500 border border-white text-[8px] text-white flex items-center justify-center font-bold">A</span>
                  </div>
                  <span className="text-[9.5px] font-bold text-amber-900">2 nearby</span>
                </div>
              </div>
            </div>

            {/* Floating Task Badge 2: Need notes (Bottom-Left) */}
            <div className="absolute bottom-5 left-4 bg-blue-50/95 backdrop-blur-md rounded-2xl p-2.5 shadow-lg border border-blue-200/90 flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="pr-1">
                <div className="text-[11px] font-heading font-black text-neutral-900 leading-none">
                  Need notes for this subject
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex -space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-purple-500 border border-white text-[8px] text-white flex items-center justify-center font-bold">S</span>
                    <span className="w-4 h-4 rounded-full bg-rose-500 border border-white text-[8px] text-white flex items-center justify-center font-bold">V</span>
                    <span className="w-4 h-4 rounded-full bg-emerald-500 border border-white text-[8px] text-white flex items-center justify-center font-bold">K</span>
                  </div>
                  <span className="text-[9.5px] font-bold text-blue-900">5 nearby</span>
                </div>
              </div>
            </div>

            {/* Floating Task Badge 3: Pickup parcel (Bottom-Right) */}
            <div className="absolute bottom-5 right-4 bg-emerald-50/95 backdrop-blur-md rounded-2xl p-2.5 shadow-lg border border-emerald-200/90 flex items-center gap-2.5 hidden sm:flex">
              <div className="w-8 h-8 rounded-xl bg-[#146B3A] text-white flex items-center justify-center shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <div className="pr-1">
                <div className="text-[11px] font-heading font-black text-neutral-900 leading-none">
                  Pickup this parcel?
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex -space-x-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-500 border border-white text-[8px] text-white flex items-center justify-center font-bold">M</span>
                    <span className="w-4 h-4 rounded-full bg-teal-500 border border-white text-[8px] text-white flex items-center justify-center font-bold">D</span>
                  </div>
                  <span className="text-[9.5px] font-bold text-[#146B3A]">3 nearby</span>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Bottom Feature Pill Bar */}
          <div className="bg-[#0F1E17]/95 backdrop-blur-md text-white rounded-2xl py-3 px-4 sm:px-6 shadow-xl border border-emerald-900/40 grid grid-cols-4 gap-2 sm:gap-4 text-center max-w-xl">
            <div className="flex flex-col items-center">
              <Users className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="text-[9.5px] sm:text-[11px] font-heading font-extrabold text-neutral-200">
                Students Community
              </span>
            </div>
            <div className="flex flex-col items-center">
              <MapPin className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="text-[9.5px] sm:text-[11px] font-heading font-extrabold text-neutral-200">
                Nearby Tasks
              </span>
            </div>
            <div className="flex flex-col items-center">
              <Zap className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="text-[9.5px] sm:text-[11px] font-heading font-extrabold text-neutral-200">
                Quick & Easy
              </span>
            </div>
            <div className="flex flex-col items-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400 mb-1" />
              <span className="text-[9.5px] sm:text-[11px] font-heading font-extrabold text-neutral-200">
                Safe & Trusted
              </span>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT COLUMN: Floating Auth Card (Login | Sign Up Tabs)      */}
        {/* ============================================================ */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-[460px] bg-white/95 backdrop-blur-xl rounded-[32px] p-6 sm:p-8 md:p-9 shadow-[0_25px_60px_-15px_rgba(20,107,58,0.18)] border border-white/90 relative">
            
            {/* Playful Handwritten Doodle on top right of card */}
            <div className="absolute -top-4 -right-2 text-right hidden sm:block rotate-[6deg]">
              <div className="text-[11px] font-serif font-black italic text-[#146B3A] leading-tight">
                Same Campus <br />
                New Possibilities ✨
              </div>
            </div>

            {/* Header */}
            <div className="text-center space-y-1.5 mb-5">
              <h2 className="font-heading font-black text-2xl sm:text-3xl text-neutral-900 tracking-tight">
                Welcome to <span className="text-[#146B3A]">PART</span>
              </h2>
              <p className="text-xs sm:text-[13px] text-neutral-500 font-medium leading-relaxed max-w-xs mx-auto">
                {activeTab === 'login'
                  ? 'Login or create an account to start posting and finding tasks in your campus.'
                  : 'Join your campus marketplace to post tasks, help peers, and earn safely.'}
              </p>
            </div>

            {/* Segmented Control: Login | Sign Up (Phase 3) */}
            <div className="bg-neutral-100 p-1 rounded-2xl flex border border-neutral-200/80 mb-5 relative">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTab === 'login'
                    ? 'bg-[#146B3A] text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('signup');
                  setErrorMessage(null);
                }}
                className={`flex-1 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                  activeTab === 'signup'
                    ? 'bg-[#146B3A] text-white shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Social Auth Buttons */}
            <div className="space-y-2.5 mb-4">
              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading}
                className="w-full py-3.5 px-4 bg-white hover:bg-neutral-50 active:scale-[0.99] text-neutral-800 font-heading font-bold text-xs sm:text-sm rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-center gap-3 transition cursor-pointer"
              >
                {isGoogleLoading ? (
                  <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {/* Apple Button (Visible only if configured) */}
              {isAppleAuthConfigured && (
                <button
                  type="button"
                  className="w-full py-3.5 px-4 bg-white hover:bg-neutral-50 active:scale-[0.99] text-neutral-800 font-heading font-bold text-xs sm:text-sm rounded-2xl border border-neutral-200 shadow-xs flex items-center justify-center gap-3 transition cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0 fill-current text-black" viewBox="0 0 24 24">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.85-.9.04-1.99.6-2.64 1.35-.57.65-1.07 1.71-.93 2.73 1.01.08 2.04-.48 2.65-1.23z" />
                  </svg>
                  <span>Continue with Apple</span>
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-neutral-200 w-full" />
              <span className="bg-white px-3 text-[10px] uppercase font-bold tracking-wider text-neutral-400 absolute">
                OR
              </span>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-2xl flex items-center gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* ======================================================== */}
            {/* TAB 1: LOGIN FORM                                       */}
            {/* ======================================================== */}
            {activeTab === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                {/* Email or Mobile Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-heading font-bold text-neutral-800">
                    Email or Mobile Number
                  </label>
                  <div className="relative rounded-2xl border border-neutral-200/90 bg-neutral-50/70 focus-within:bg-white focus-within:border-[#146B3A] focus-within:ring-2 focus-within:ring-[#146B3A]/20 transition">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Enter your email or mobile number"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-3.5 text-xs sm:text-sm font-medium text-neutral-900 bg-transparent outline-none placeholder:text-neutral-400"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-heading font-bold text-neutral-800">
                    Password
                  </label>
                  <div className="relative rounded-2xl border border-neutral-200/90 bg-neutral-50/70 focus-within:bg-white focus-within:border-[#146B3A] focus-within:ring-2 focus-within:ring-[#146B3A]/20 transition">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3.5 text-xs sm:text-sm font-medium text-neutral-900 bg-transparent outline-none placeholder:text-neutral-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Forgot Password Link (Right-aligned) */}
                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={onNavigateForgotPassword}
                    className="text-xs font-heading font-bold text-[#146B3A] hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Primary Green Gradient Login Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#146B3A] to-[#168045] hover:from-[#0F532D] hover:to-[#146B3A] text-white font-heading font-black text-sm sm:text-base tracking-wide shadow-[0_8px_20px_rgba(20,107,58,0.35)] hover:shadow-[0_12px_24px_rgba(20,107,58,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Login</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* 1-Click Demo Campus Login */}
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-[#146B3A] border border-emerald-200 font-heading font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>⚡ 1-Click Demo Campus Login</span>
                </button>
              </form>
            ) : (
              /* ======================================================== */
              /* TAB 2: SIGNUP FORM (Phase 5)                             */
              /* ======================================================== */
              <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-heading font-bold text-neutral-800">
                    Full Name
                  </label>
                  <div className="relative rounded-2xl border border-neutral-200/90 bg-neutral-50/70 focus-within:bg-white focus-within:border-[#146B3A] focus-within:ring-2 focus-within:ring-[#146B3A]/20 transition">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-3 text-xs sm:text-sm font-medium text-neutral-900 bg-transparent outline-none placeholder:text-neutral-400"
                    />
                  </div>
                </div>

                {/* Email Address or Mobile Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-heading font-bold text-neutral-800">
                    Email Address
                  </label>
                  <div className="relative rounded-2xl border border-neutral-200/90 bg-neutral-50/70 focus-within:bg-white focus-within:border-[#146B3A] focus-within:ring-2 focus-within:ring-[#146B3A]/20 transition">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="student@university.edu or email"
                      value={emailOrPhone}
                      onChange={(e) => setEmailOrPhone(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-3 text-xs sm:text-sm font-medium text-neutral-900 bg-transparent outline-none placeholder:text-neutral-400"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-heading font-bold text-neutral-800">
                    Password (min. 8 characters)
                  </label>
                  <div className="relative rounded-2xl border border-neutral-200/90 bg-neutral-50/70 focus-within:bg-white focus-within:border-[#146B3A] focus-within:ring-2 focus-within:ring-[#146B3A]/20 transition">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm font-medium text-neutral-900 bg-transparent outline-none placeholder:text-neutral-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-heading font-bold text-neutral-800">
                    Confirm Password
                  </label>
                  <div className="relative rounded-2xl border border-neutral-200/90 bg-neutral-50/70 focus-within:bg-white focus-within:border-[#146B3A] focus-within:ring-2 focus-within:ring-[#146B3A]/20 transition">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm font-medium text-neutral-900 bg-transparent outline-none placeholder:text-neutral-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Terms and Privacy Checkbox */}
                <div className="pt-1">
                  <label className="flex items-start gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-neutral-300 text-[#146B3A] focus:ring-[#146B3A]"
                    />
                    <span className="text-[11px] text-neutral-600 leading-tight">
                      I agree to the PART{' '}
                      <span className="font-bold text-[#146B3A] hover:underline">Terms of Service</span> and{' '}
                      <span className="font-bold text-[#146B3A] hover:underline">Privacy Policy</span>.
                    </span>
                  </label>
                </div>

                {/* Create Account Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#146B3A] to-[#168045] hover:from-[#0F532D] hover:to-[#146B3A] text-white font-heading font-black text-sm sm:text-base tracking-wide shadow-[0_8px_20px_rgba(20,107,58,0.35)] hover:shadow-[0_12px_24px_rgba(20,107,58,0.45)] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Create Account →</span>
                    </>
                  )}
                </button>
              </form>
            )}


            {/* Bottom Toggle */}
            <div className="text-center text-xs text-neutral-600 mt-5">
              {activeTab === 'login' ? (
                <>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('signup');
                      setErrorMessage(null);
                    }}
                    className="font-heading font-extrabold text-[#146B3A] hover:underline cursor-pointer"
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login');
                      setErrorMessage(null);
                    }}
                    className="font-heading font-extrabold text-[#146B3A] hover:underline cursor-pointer"
                  >
                    Login to PART
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* University Student Onboarding Modal (Phase 6) */}
      <UniversityOnboardingModal
        isOpen={showOnboardingModal}
        onComplete={() => {
          setShowOnboardingModal(false);
          setShowLocationModal(true);
        }}
        onClose={() => setShowOnboardingModal(false)}
      />

      {/* Location Selector Modal */}
      <LocationSelectorModal
        isOpen={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
          if (onSuccess) onSuccess();
        }}
      />
    </div>
  );
};
