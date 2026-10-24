import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from './store/useAppStore';
import { supabase, authService } from '@part/shared';
import { UserAccountBar } from './components/UserAccountBar';
import { BottomNav } from './components/BottomNav';
import { SignupScreen } from './screens/SignupScreen';
import { LoginScreen } from './screens/LoginScreen';
import { ForgotPasswordScreen } from './screens/ForgotPasswordScreen';
import { UpdatePasswordScreen } from './screens/UpdatePasswordScreen';
import { AuthCallbackScreen } from './screens/AuthCallbackScreen';
import { HomeScreen } from './screens/HomeScreen';
import { ExploreScreen } from './screens/ExploreScreen';
import { PostTaskScreen } from './screens/PostTaskScreen';
import { ActivityScreen } from './screens/ActivityScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { TaskDetailsModal } from './screens/TaskDetailsModal';
import { ChatModal } from './screens/ChatModal';
import { PaymentModal } from './screens/PaymentModal';
import { ReviewModal } from './screens/ReviewModal';
import { DisputeModal } from './screens/DisputeModal';

export const App: React.FC = () => {
  const { currentTab, setTab, currentProfile, setCurrentProfile } = useAppStore();

  // Route state synced with browser window.location.pathname
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname || '/';
    }
    return '/';
  });

  const [returnTo, setReturnTo] = useState<string | undefined>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('returnTo') || undefined;
    }
    return undefined;
  });

  const [isInitializingSession, setIsInitializingSession] = useState(true);

  // Programmatic navigation helper
  const navigateTo = useCallback((path: string, options?: { replace?: boolean }) => {
    setCurrentPath(path);
    if (typeof window !== 'undefined') {
      if (options?.replace) {
        window.history.replaceState(null, '', path);
      } else {
        window.history.pushState(null, '', path);
      }
    }
  }, []);

  // Listen to browser PopState (back/forward button)
  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        setCurrentPath(window.location.pathname || '/');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync currentTab with currentPath if on main app routes
  useEffect(() => {
    if (currentPath === '/explore' && currentTab !== 'explore') setTab('explore');
    else if (currentPath === '/post' && currentTab !== 'post') setTab('post');
    else if (currentPath === '/activity' && currentTab !== 'activity') setTab('activity');
    else if (currentPath === '/profile' && currentTab !== 'profile') setTab('profile');
    else if (currentPath === '/' && currentTab !== 'home') setTab('home');
  }, [currentPath, currentTab, setTab]);

  // Session persistence & SSR/browser onAuthStateChange listener
  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData?.session?.user;

        if (user && isMounted) {
          const profile = await authService.getProfile(user.id);
          if (profile && isMounted) {
            setCurrentProfile(profile);
          }
        }
      } catch (err) {
        console.warn('Session restoration exception:', err);
      } finally {
        if (isMounted) setIsInitializingSession(false);
      }
    };

    restoreSession();

    // Listen to token refresh, login, or logout events
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const profile = await authService.getProfile(session.user.id);
            if (profile && isMounted) {
              setCurrentProfile(profile);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setCurrentProfile(null);
          navigateTo('/login');
        }
      }
    );

    return () => {
      isMounted = false;
      authListener?.subscription.unsubscribe();
    };
  }, [setCurrentProfile, navigateTo]);

  // Initializing Splash Screen
  if (isInitializingSession) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center font-sans select-none">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-brand-yellow text-neutral-950 font-heading font-black text-3xl flex items-center justify-center mx-auto shadow-yellow border-2 border-brand-yellow-hover animate-pulse">
            P
          </div>
          <span className="font-heading font-black text-lg text-neutral-900 block">
            PART
          </span>
          <p className="text-xs text-neutral-500 font-medium">
            Loading your neighborhood marketplace...
          </p>
        </div>
      </div>
    );
  }

  // Handle Auth Callback Route: /auth/callback
  if (currentPath === '/auth/callback') {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex justify-center font-sans">
        <div className="w-full max-w-md bg-[#F7F8FA] min-h-screen relative shadow-2xl flex flex-col border-x border-neutral-200">
          <AuthCallbackScreen
            onSuccess={() => {
              const dest = returnTo || '/';
              navigateTo(dest, { replace: true });
            }}
            onNavigateLogin={() => navigateTo('/login')}
          />
        </div>
      </div>
    );
  }

  // Handle Forgot Password Route: /forgot-password
  if (currentPath === '/forgot-password') {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex justify-center font-sans">
        <div className="w-full max-w-md bg-[#F7F8FA] min-h-screen relative shadow-2xl flex flex-col border-x border-neutral-200">
          <ForgotPasswordScreen
            onNavigateLogin={() => navigateTo('/login')}
          />
        </div>
      </div>
    );
  }

  // Handle Update Password Route: /update-password
  if (currentPath === '/update-password') {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex justify-center font-sans">
        <div className="w-full max-w-md bg-[#F7F8FA] min-h-screen relative shadow-2xl flex flex-col border-x border-neutral-200">
          <UpdatePasswordScreen
            onSuccess={() => navigateTo('/login')}
            onNavigateLogin={() => navigateTo('/login')}
          />
        </div>
      </div>
    );
  }

  // Handle Signup Route: /signup
  if (currentPath === '/signup') {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex justify-center font-sans">
        <div className="w-full max-w-md bg-[#F7F8FA] min-h-screen relative shadow-2xl flex flex-col border-x border-neutral-200">
          <SignupScreen
            onNavigateLogin={() => navigateTo('/login')}
            onSuccess={() => {
              const dest = returnTo || '/';
              navigateTo(dest);
            }}
          />
        </div>
      </div>
    );
  }

  // Handle Login Route: /login (or when unauthenticated on protected routes)
  if (!currentProfile || currentPath === '/login') {
    return (
      <div className="min-h-screen bg-[#F0F2F5] flex justify-center font-sans">
        <div className="w-full max-w-md bg-[#F7F8FA] min-h-screen relative shadow-2xl flex flex-col border-x border-neutral-200">
          <LoginScreen
            returnTo={returnTo || (currentPath !== '/login' ? currentPath : undefined)}
            onNavigateSignup={() => navigateTo('/signup')}
            onNavigateForgotPassword={() => navigateTo('/forgot-password')}
            onSuccess={() => {
              const dest = returnTo || '/';
              navigateTo(dest);
            }}
          />
        </div>
      </div>
    );
  }

  // Render Authenticated Tab Screens
  const renderActiveScreen = () => {
    switch (currentTab) {
      case 'home':
        return <HomeScreen />;
      case 'explore':
        return <ExploreScreen />;
      case 'post':
        return <PostTaskScreen />;
      case 'activity':
        return <ActivityScreen />;
      case 'profile':
        return (
          <ProfileScreen
            onNavigateChangePassword={() => navigateTo('/forgot-password')}
          />
        );
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-[#E5E7EB] flex justify-center font-sans">
      {/* Mobile Device Frame Container */}
      <div className="w-full max-w-md bg-[#F7F8FA] min-h-screen relative shadow-2xl flex flex-col border-x border-neutral-300/80">
        {/* Top User Account Bar (shows only on non-home tabs) */}
        <UserAccountBar />

        {/* Dynamic Main View */}
        <main className="flex-1 overflow-x-hidden">
          {renderActiveScreen()}
        </main>

        {/* Global Modals */}
        <TaskDetailsModal />
        <ChatModal />
        <PaymentModal />
        <ReviewModal />
        <DisputeModal />

        {/* Bottom Navigation */}
        <BottomNav />
      </div>
    </div>
  );
};

export default App;
