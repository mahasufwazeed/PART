import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { authService, CHENNAI_LOCALITIES } from '@part/shared';
import { LogIn, UserPlus, Shield, Globe, MapPin, AlertCircle, ArrowRight } from 'lucide-react';

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
            skills: [],
            interested_categories: [],
            is_worker_available: true,
          });
          const updated = await authService.getProfile(res.profile.id);
          setCurrentProfile(updated!);
        }
      } else {
        const res = await authService.login(email, password);
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.session) {
          setCurrentProfile(res.session.profile);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between p-6">
      {/* Top Brand Header */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-black text-white text-base shadow-lg">
              PART
            </div>
            <div>
              <h1 className="font-extrabold text-sm tracking-tight text-white">
                PART
              </h1>
              <span className="text-[10px] text-accent font-semibold tracking-wider uppercase block">
                People At Right Time
              </span>
            </div>
          </div>

          {/* Language Toggle */}
          <button
            onClick={() => setLanguage(language === 'en' ? 'ta' : 'en')}
            className="flex items-center gap-1.5 bg-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded-full border border-slate-700 hover:bg-slate-700 transition"
          >
            <Globe className="w-3.5 h-3.5 text-accent" />
            <span>{language === 'en' ? 'தமிழ்' : 'English'}</span>
          </button>
        </div>

        <div className="space-y-1 mb-6">
          <h2 className="text-2xl font-black text-white tracking-tight">
            {isRegisterMode
              ? language === 'ta'
                ? 'புதிய கணக்கை உருவாக்கவும்'
                : 'Join PART Chennai'
              : language === 'ta'
              ? 'மீண்டும் வருக!'
              : 'Welcome Back'}
          </h2>
          <p className="text-xs text-slate-400">
            {language === 'ta'
              ? 'சென்னையில் சரியான நேரத்தில் சரியான உதவி அல்லது வருமானம்.'
              : 'Right People. Right Time. Right Work in Chennai.'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-slate-800 p-1 rounded-2xl border border-slate-700 mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(false);
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition ${
              !isRegisterMode
                ? 'bg-primary text-white shadow font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'ta' ? 'உள்நுழைக' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(true);
              setErrorMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl transition ${
              isRegisterMode
                ? 'bg-primary text-white shadow font-extrabold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {language === 'ta' ? 'பதிவு செய்க' : 'Register'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {errorMsg && (
            <div className="bg-rose-950/80 border border-rose-800 text-rose-200 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isRegisterMode && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {language === 'ta' ? 'உங்கள் முழு பெயர் *' : 'Your Full Name *'}
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Sundaram"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-800 text-white placeholder:text-slate-500 text-xs p-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {language === 'ta' ? 'மின்னஞ்சல் முகவரி *' : 'Email Address *'}
            </label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 text-white placeholder:text-slate-500 text-xs p-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {language === 'ta' ? 'கடவுச்சொல் *' : 'Password *'}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 text-white placeholder:text-slate-500 text-xs p-3 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {isRegisterMode && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {language === 'ta' ? 'சென்னை பகுதி *' : 'Your Chennai Locality *'}
              </label>
              <select
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                className="w-full bg-slate-800 text-white text-xs p-3 rounded-xl border border-slate-700 focus:outline-none"
              >
                {CHENNAI_LOCALITIES.map((loc) => (
                  <option key={loc.name} value={loc.name}>
                    {loc.name} ({loc.zone})
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-secondary text-white font-black text-xs py-3.5 rounded-xl shadow-lg hover:shadow-xl active:scale-[0.99] transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            <span>
              {loading
                ? 'Processing...'
                : isRegisterMode
                ? language === 'ta'
                  ? 'கணக்கு தொடங்குக'
                  : 'Create Real Account'
                : language === 'ta'
                ? 'உள்நுழைக'
                : 'Sign In to PART'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Trust & Safety Footer */}
      <div className="pt-6 border-t border-slate-800 text-center">
        <span className="text-[10px] text-slate-500 flex items-center justify-center gap-1">
          <Shield className="w-3 h-3 text-accent" />
          Strict Data Isolation & PostGIS Geolocation • Chennai Launch
        </span>
      </div>
    </div>
  );
};
