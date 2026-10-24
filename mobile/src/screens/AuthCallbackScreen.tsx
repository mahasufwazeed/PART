import React, { useEffect, useState } from 'react';
import { supabase, authService, Profile } from '@part/shared';
import { useAppStore } from '../store/useAppStore';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface AuthCallbackScreenProps {
  onSuccess: () => void;
  onNavigateLogin: () => void;
}

export const AuthCallbackScreen: React.FC<AuthCallbackScreenProps> = ({
  onSuccess,
  onNavigateLogin,
}) => {
  const { setCurrentProfile } = useAppStore();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isSubscribed = true;

    const handleCallback = async () => {
      try {
        // Exchange session or read current session from URL hash / storage
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          throw new Error(sessionError.message);
        }

        const user = sessionData?.session?.user;
        if (!user) {
          // If no immediate session, check if onAuthStateChange fires
          const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
              if (session?.user && isSubscribed) {
                await processUser(session.user);
              }
            }
          );

          // Timeout fallback
          setTimeout(() => {
            if (status === 'verifying' && isSubscribed) {
              setErrorMessage('Authentication session timed out. Please try logging in again.');
              setStatus('error');
            }
          }, 6000);

          return () => {
            authListener.subscription.unsubscribe();
          };
        }

        await processUser(user);
      } catch (err: any) {
        if (isSubscribed) {
          setErrorMessage(err.message || 'Authentication failed during callback.');
          setStatus('error');
        }
      }
    };

    const processUser = async (user: any) => {
      let profile = await authService.getProfile(user.id);

      if (!profile) {
        // Auto-create profile from Google OAuth metadata
        const googleMeta = user.user_metadata || {};
        profile = {
          id: user.id,
          full_name:
            googleMeta.full_name ||
            googleMeta.name ||
            user.email?.split('@')[0] ||
            'PART User',
          email: user.email,
          phone: googleMeta.phone || null,
          avatar_url: googleMeta.avatar_url || googleMeta.picture || null,
          bio: null,
          default_role: 'poster',
          preferred_language: 'en',
          city: 'Chennai',
          general_location: 'Velachery, Chennai',
          is_admin: false,
          verification_status: 'verified',
          is_worker_available: true,
          rating_as_worker: 5.0,
          total_reviews_as_worker: 0,
          completed_tasks_as_worker: 0,
          rating_as_requester: 5.0,
          total_reviews_as_requester: 0,
          completed_tasks_as_requester: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        await supabase
          .from('profiles')
          .upsert(profile)
          .select()
          .maybeSingle();
      }

      if (isSubscribed) {
        setCurrentProfile(profile);
        setStatus('success');
        setTimeout(() => {
          onSuccess();
        }, 800);
      }
    };

    handleCallback();

    return () => {
      isSubscribed = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F8FA] flex flex-col justify-center px-4 py-8 select-none">
      <div className="max-w-sm w-full mx-auto bg-white p-6 rounded-3xl border border-neutral-200 shadow-card text-center space-y-4">
        {status === 'verifying' && (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-yellow/30 text-neutral-900 flex items-center justify-center mx-auto">
              <div className="w-6 h-6 border-3 border-neutral-950 border-t-transparent rounded-full animate-spin" />
            </div>
            <h3 className="font-heading font-black text-base text-neutral-900">
              Verifying Google Account...
            </h3>
            <p className="text-xs text-neutral-500">
              Establishing verified Supabase session and setting up your profile.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-3 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-part-green-mint text-part-green flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-black text-base text-neutral-900">
              Authentication Successful
            </h3>
            <p className="text-xs text-neutral-500">
              Redirecting you to PART...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3 animate-shake">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="font-heading font-black text-base text-neutral-900">
              Authentication Error
            </h3>
            <p className="text-xs text-rose-700">{errorMessage}</p>
            <button
              type="button"
              onClick={onNavigateLogin}
              className="w-full py-3 bg-brand-yellow hover:bg-brand-yellow-hover text-neutral-950 font-heading font-black text-xs rounded-2xl shadow-yellow transition cursor-pointer"
            >
              Return to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
