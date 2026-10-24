import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { authService, signupSchema, campusService, CHENNAI_COLLEGES } from '@part/shared';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { LocationSelectorModal } from '../components/LocationSelectorModal';
import { CollegeSelectorModal } from '../components/CollegeSelectorModal';
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check,
  GraduationCap,
} from 'lucide-react';

interface SignupScreenProps {
  onNavigateLogin?: () => void;
  onSuccess?: () => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({
  onNavigateLogin,
  onSuccess,
}) => {
  const { setCurrentProfile, language } = useAppStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState('vels-university');
  const [showCollegeModal, setShowCollegeModal] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setValidationErrors({});

    const parseResult = signupSchema.safeParse({
      full_name: fullName,
      email,
      phone: phone.trim() || undefined,
      password,
      confirmPassword,
      termsAccepted,
      preferred_language: language,
    });

    if (!parseResult.success) {
      const errs: Record<string, string> = {};
      parseResult.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (field) errs[field] = err.message;
      });
      setValidationErrors(errs);
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.register(
        email,
        password,
        fullName,
        phone,
        language
      );

      if (res.error) {
        setGeneralError(res.error);
        setIsLoading(false);
        return;
      }

      if (res.needsEmailVerification) {
        setVerificationSent(true);
        setIsLoading(false);
        return;
      }

      if (res.profile) {
        if (selectedCollege && selectedCollege !== 'other') {
          const colDef = CHENNAI_COLLEGES.find((c) => c.id === selectedCollege);
          if (colDef) {
            await campusService.setUserCollege(res.profile.id, colDef.id, colDef.short_name);
          }
        }
        setCurrentProfile(res.profile);
        // Prompt for neighborhood location selection
        setShowLocationModal(true);
      }
    } catch (err: any) {
      setGeneralError(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setGeneralError(null);
    try {
      const res = await authService.signInWithGoogle();
      if (res.error) {
        setGeneralError(res.error);
      }
    } catch (err: any) {
      setGeneralError(err.message || 'Google signup failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // If email verification was required
  if (verificationSent) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center px-4 py-8 select-none">
        <div className="max-w-sm w-full mx-auto bg-white p-6 rounded-3xl border border-neutral-200 shadow-card text-center space-y-4 animate-slide-up">
          <div className="w-14 h-14 rounded-2xl bg-part-green-mint text-part-green flex items-center justify-center mx-auto shadow-xs">
            <Mail className="w-7 h-7" />
          </div>
          <h2 className="font-heading font-black text-xl text-neutral-900">
            Verify Your Email
          </h2>
          <p className="text-xs text-neutral-600 leading-relaxed">
            We have sent a verification email to <strong className="text-neutral-900">{email}</strong>. Please check your inbox and click the confirmation link to activate your account.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onNavigateLogin}
              className="w-full py-3.5 bg-brand-yellow hover:bg-brand-yellow-hover text-neutral-950 font-heading font-black text-xs rounded-2xl shadow-yellow transition cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center px-4 py-8 select-none">
      <div className="max-w-sm w-full mx-auto space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="w-14 h-14 rounded-3xl bg-brand-yellow text-neutral-950 font-heading font-black text-2xl flex items-center justify-center mx-auto shadow-yellow border-2 border-brand-yellow-hover">
            P
          </div>
          <h1 className="font-heading font-black text-2xl text-neutral-950 tracking-tight">
            Create Your Account
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            Join PART to get help or earn in your neighborhood
          </p>
        </div>

        {generalError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-2xl flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-3xl border border-neutral-200/90 shadow-card space-y-3.5">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="block text-xs font-heading font-bold text-neutral-700">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full pl-10 pr-3.5 py-3 bg-neutral-50 border rounded-2xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-part-green focus:bg-white transition ${
                  validationErrors.full_name ? 'border-rose-300 ring-rose-200' : 'border-neutral-200'
                }`}
              />
            </div>
            {validationErrors.full_name && (
              <span className="text-[11px] text-rose-600 font-medium block">
                {validationErrors.full_name}
              </span>
            )}
          </div>

          {/* Email Address */}
          <div className="space-y-1">
            <label className="block text-xs font-heading font-bold text-neutral-700">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-3.5 py-3 bg-neutral-50 border rounded-2xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-part-green focus:bg-white transition ${
                  validationErrors.email ? 'border-rose-300 ring-rose-200' : 'border-neutral-200'
                }`}
              />
            </div>
            {validationErrors.email && (
              <span className="text-[11px] text-rose-600 font-medium block">
                {validationErrors.email}
              </span>
            )}
          </div>

          {/* Mobile Number */}
          <div className="space-y-1">
            <label className="block text-xs font-heading font-bold text-neutral-700">
              Mobile Number (Optional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                placeholder="10-digit mobile (e.g. 9876543210)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full pl-10 pr-3.5 py-3 bg-neutral-50 border rounded-2xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-part-green focus:bg-white transition ${
                  validationErrors.phone ? 'border-rose-300 ring-rose-200' : 'border-neutral-200'
                }`}
              />
            </div>
            {validationErrors.phone && (
              <span className="text-[11px] text-rose-600 font-medium block">
                {validationErrors.phone}
              </span>
            )}
          </div>

          {/* College / University Selection (Campus Community) */}
          <div className="space-y-1">
            <label className="block text-xs font-heading font-bold text-neutral-700 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-part-green" />
                <span>University / College (Campus Community)</span>
              </span>
              <span className="text-[10px] text-neutral-400 font-normal">Optional</span>
            </label>
            <select
              value={selectedCollege}
              onChange={(e) => setSelectedCollege(e.target.value)}
              className="w-full px-3.5 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-part-green focus:bg-white transition"
            >
              <option value="">Select your college (or skip)</option>
              {CHENNAI_COLLEGES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.short_name} ({c.locality || c.city})
                </option>
              ))}
              <option value="other">Other College (Suggest later)</option>
            </select>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="block text-xs font-heading font-bold text-neutral-700">
              Password (min 8 characters) *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-10 py-3 bg-neutral-50 border rounded-2xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-part-green focus:bg-white transition ${
                  validationErrors.password ? 'border-rose-300 ring-rose-200' : 'border-neutral-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {validationErrors.password && (
              <span className="text-[11px] text-rose-600 font-medium block">
                {validationErrors.password}
              </span>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <label className="block text-xs font-heading font-bold text-neutral-700">
              Confirm Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-10 pr-10 py-3 bg-neutral-50 border rounded-2xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-part-green focus:bg-white transition ${
                  validationErrors.confirmPassword ? 'border-rose-300 ring-rose-200' : 'border-neutral-200'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <span className="text-[11px] text-rose-600 font-medium block">
                {validationErrors.confirmPassword}
              </span>
            )}
          </div>

          {/* Terms and Privacy Policy Checkbox */}
          <div className="pt-1">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded border-neutral-300 text-part-green focus:ring-part-green"
              />
              <span className="text-[11px] text-neutral-600 leading-tight">
                I agree to the <span className="text-neutral-900 font-bold hover:underline">Terms of Service</span> and <span className="text-neutral-900 font-bold hover:underline">Privacy Policy</span> of PART.
              </span>
            </label>
            {validationErrors.termsAccepted && (
              <span className="text-[11px] text-rose-600 font-medium block mt-1">
                {validationErrors.termsAccepted}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-brand-yellow hover:bg-brand-yellow-hover text-neutral-950 font-heading font-black text-xs sm:text-sm rounded-2xl shadow-yellow hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-3 flex items-center justify-center">
            <div className="border-t border-neutral-200 w-full" />
            <span className="bg-white px-3 text-[10px] uppercase font-bold text-neutral-400 absolute">
              or
            </span>
          </div>

          {/* Google OAuth Signup */}
          <GoogleAuthButton
            onClick={handleGoogleSignIn}
            isLoading={isGoogleLoading}
            text="Sign up with Google"
          />
        </form>

        {/* Link to Login */}
        <p className="text-center text-xs text-neutral-600">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onNavigateLogin}
            className="font-heading font-black text-part-green hover:underline cursor-pointer"
          >
            Log in here
          </button>
        </p>
      </div>

      {/* Post-Registration Location Setup Modal */}
      <LocationSelectorModal
        isOpen={showLocationModal}
        onClose={() => {
          setShowLocationModal(false);
          setShowCollegeModal(true);
        }}
      />

      {/* Campus Community College Setup Modal */}
      <CollegeSelectorModal
        isOpen={showCollegeModal}
        onClose={() => {
          setShowCollegeModal(false);
          if (onSuccess) onSuccess();
        }}
      />
    </div>
  );
};
