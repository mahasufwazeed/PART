import React, { useState } from 'react';
import { authService, updatePasswordSchema } from '@part/shared';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

interface UpdatePasswordScreenProps {
  onSuccess: () => void;
  onNavigateLogin: () => void;
}

export const UpdatePasswordScreen: React.FC<UpdatePasswordScreenProps> = ({
  onSuccess,
  onNavigateLogin,
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const parsed = updatePasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setErrorMsg(parsed.error.errors[0]?.message || 'Please check your password inputs.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await authService.updatePassword(password);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setIsSuccess(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setIsLoading(false);
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
            Set New Password
          </h1>
          <p className="text-xs text-neutral-500 font-medium">
            Choose a strong password with at least 8 characters
          </p>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3.5 rounded-2xl flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-card text-center space-y-4 animate-slide-up">
            <div className="w-12 h-12 rounded-2xl bg-part-green-mint text-part-green flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-black text-base text-neutral-900">
              Password Updated Successfully
            </h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Your password has been securely reset. You can now log in with your new credentials.
            </p>
            <button
              type="button"
              onClick={onNavigateLogin}
              className="w-full py-3.5 bg-brand-yellow hover:bg-brand-yellow-hover text-neutral-950 font-heading font-black text-xs rounded-2xl shadow-yellow transition cursor-pointer"
            >
              Log In Now
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white p-5 rounded-3xl border border-neutral-200/90 shadow-card space-y-4"
          >
            {/* New Password */}
            <div className="space-y-1">
              <label className="block text-xs font-heading font-bold text-neutral-700">
                New Password (min 8 characters)
              </label>
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

            {/* Confirm New Password */}
            <div className="space-y-1">
              <label className="block text-xs font-heading font-bold text-neutral-700">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-part-green focus:bg-white transition"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-brand-yellow hover:bg-brand-yellow-hover text-neutral-950 font-heading font-black text-xs sm:text-sm rounded-2xl shadow-yellow hover:scale-[1.01] active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
