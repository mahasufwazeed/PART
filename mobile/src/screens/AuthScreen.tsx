import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { authService, CHENNAI_LOCALITIES } from '@part/shared';
import {
  LogIn,
  UserPlus,
  ShieldCheck,
  Globe,
  MapPin,
  AlertCircle,
  ArrowRight,
  Zap,
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { setCurrentProfile, language, setLanguage } = useAppStore();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [locality, setLocality] = useState('Velachery');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      if (isRegisterMode) {
        if (fullName.trim().length < 2) {
          setErrorMsg('Please enter your full name (minimum 2 characters).');
          setLoading(false);
          return;
        }

        const res = await authService.register(
          email,
          password,
          fullName,
          language
        );

        if (res.error) {
          setErrorMsg(res.error);
        } else {
          // Update profile with selected Chennai locality
          await authService.completeOnboarding(res.profile.id, {
            full_name: fullName,
            city: 'Chennai',
            general_location: `${locality}, Chennai`,
            preferred_language: language,
          });
          setCurrentProfile({
            ...res.profile,
            full_name: fullName,
            general_location: `${locality}, Chennai`,
          });
        }
      } else {
        const res = await authService.login(email, password);
        if (res.error) {
          setErrorMsg(res.error);
        } else {
          setCurrentProfile(res.profile);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed. Please check inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center px-4 py-8 select-none">
      <div className="max-w-sm w-full mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-brand-yellow text-neutral-950 font-heading font-black text-3xl flex items-center justify-center mx-auto shadow-yellow border-2 border-brand-yellow-hover">
            P
          </div>
          <h1 className="font-heading font-black text-2xl sm:text-3xl text-neutral-950 tracking-tight">
            PART
          </h1>
          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">
            People At Right Time
          </p>
          <p className="text-xs text-neutral-600 font-medium max-w-xs mx-auto">
            {language === 'ta'
              ? 'சரியான மனிதர்கள். சரியான நேரம். சரியான பணி.'
              : 'Right People. Right Time. Right Work.'}
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white p-6 rounded-3xl border border-neutral-200/90 shadow-card space-y-4">
          {/* Segmented Mode Selector */}
          <div className="flex bg-neutral-100 p-1 rounded-2xl border border-neutral-200 text-xs font-heading font-bold">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl text-center transition cursor-pointer ${
                !isRegisterMode
                  ? 'bg-part-green text-white shadow-xs font-black'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 rounded-xl text-center transition cursor-pointer ${
                isRegisterMode
                  ? 'bg-part-green text-white shadow-xs font-black'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegisterMode && (
              <>
                <div className="space-y-1">
                  <label className="block text-xs font-heading font-bold text-neutral-800">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anandha Krishnan"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs p-3.5 rounded-2xl bg-[#F7F8FA] border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-part-green font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-heading font-bold text-neutral-800">
                    Chennai Neighborhood *
                  </label>
                  <select
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full text-xs p-3.5 rounded-2xl bg-[#F7F8FA] border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-part-green font-medium"
                  >
                    {CHENNAI_LOCALITIES.map((loc) => (
                      <option key={loc.name} value={loc.name}>
                        {loc.name}, Chennai
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-heading font-bold text-neutral-800">
                Email Address *
              </label>
              <input
                type="email"
                required
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-xs p-3.5 rounded-2xl bg-[#F7F8FA] border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-part-green font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-heading font-bold text-neutral-800">
                Password *
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs p-3.5 rounded-2xl bg-[#F7F8FA] border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-part-green font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-part-green hover:bg-part-green-dark text-white font-heading font-black text-xs rounded-2xl shadow-green hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {loading ? (
                <span>Connecting...</span>
              ) : (
                <>
                  <span>{isRegisterMode ? 'Complete Registration' : 'Sign In to PART'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Language Switch */}
          <div className="flex items-center justify-center gap-2 pt-2 border-t border-neutral-100 text-xs">
            <Globe className="w-3.5 h-3.5 text-neutral-400" />
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
              className="text-part-green font-heading font-bold hover:underline"
            >
              {language === 'en' ? 'தமிழில் தொடரவும் (Tamil)' : 'Switch to English'}
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-[11px] text-neutral-400 flex items-center justify-center gap-1.5 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-part-green" />
          <span>Encrypted with Row-Level Security for Chennai residents</span>
        </p>
      </div>
    </div>
  );
};
