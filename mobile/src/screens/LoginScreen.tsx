import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { authService, loginSchema } from '@part/shared';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { LocationSelectorModal } from '../components/LocationSelectorModal';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface LoginScreenProps {
  onNavigateSignup?: () => void;
  onNavigateForgotPassword?: () => void;
  onSuccess?: () => void;
  returnTo?: string;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onNavigateSignup,
  onNavigateForgotPassword,
  onSuccess,
  returnTo,
}) => {
  const { setCurrentProfile, userLocation } = useAppStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsed = loginSchema.safeParse({ email, password, rememberMe });
    if (!parsed.success) {
      setErrorMessage(parsed.error.errors[0]?.message || 'Please check your inputs.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.login(email, password, rememberMe);
      if (res.error) {
        setErrorMessage(res.error);
        setIsLoading(false);
        return;
      }

      if (res.session?.profile) {
        setCurrentProfile(res.session.profile);

        // Check if user has an assigned location; if not prompt
        if (!res.session.profile.general_location) {
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

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      const res = await authService.signInWithGoogle();
      if (res.error) {
        setErrorMessage(res.error);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center px-4 py-8 select-none">
      <div className="max-w-sm w-full mx-auto space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="w-14 h-14 rounded-3xl bg-brand-yellow text-neutral-950 font-heading font-black text-2xl flex items-center justify-center mx-auto shadow-yellow border-2 border-brand-yellow-hover">
            P
          </div>
          <h1 className="font-heading font-black text-2xl text-neutral-950 tracking-tight">
            Welcome Back to PART
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            Log in to manage tasks, chat with helpers, or accept gigs
          </p>
        </div>

        {returnTo && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs p-3 rounded-2xl flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-part-green shrink-0" />
            <span>Please log in to continue to {returnTo}.</span>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-2xl flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-3xl border border-neutral-200/90 shadow-card space-y-3.5">
          {/* Email Address */}
          <div className="space-y-1">
            <label className="block text-xs font-heading font-bold text-neutral-700">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-part-green focus:bg-white transition"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-heading font-bold text-neutral-700">
                Password
              </label>
              <button
                type="button"
                onClick={onNavigateForgotPassword}
                className="text-[11px] font-heading font-bold text-part-green hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-part-green focus:bg-white transition"
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

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-neutral-300 text-part-green focus:ring-part-green"
              />
              <span className="text-xs text-neutral-600 font-medium">
                Keep me logged in
              </span>
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-brand-yellow hover:bg-brand-yellow-hover text-neutral-950 font-heading font-black text-xs sm:text-sm rounded-2xl shadow-yellow hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Log In</span>
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

          {/* Google OAuth Login */}
          <GoogleAuthButton
            onClick={handleGoogleSignIn}
            isLoading={isGoogleLoading}
            text="Continue with Google"
          />
        </form>

        {/* Link to Signup */}
        <p className="text-center text-xs text-neutral-600">
          Don't have an account yet?{' '}
          <button
            type="button"
            onClick={onNavigateSignup}
            className="font-heading font-black text-part-green hover:underline cursor-pointer"
          >
            Create an account
          </button>
        </p>
      </div>

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
