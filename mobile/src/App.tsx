import React from 'react';
import { useAppStore } from './store/useAppStore';
import { UserAccountBar } from './components/UserAccountBar';
import { BottomNav } from './components/BottomNav';
import { AuthScreen } from './screens/AuthScreen';
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
  const { currentTab, currentProfile } = useAppStore();

  // If user is not authenticated, show real registration/login screen
  if (!currentProfile) {
    return (
      <div className="min-h-screen bg-slate-900 flex justify-center font-sans">
        <div className="w-full max-w-md bg-slate-900 min-h-screen relative shadow-2xl flex flex-col border-x border-slate-800">
          <AuthScreen />
        </div>
      </div>
    );
  }

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
        return <ProfileScreen />;
      default:
        return <HomeScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center font-sans">
      {/* Mobile Device Frame Container */}
      <div className="w-full max-w-md bg-surface min-h-screen relative shadow-2xl flex flex-col border-x border-slate-200">
        {/* Top User Account Bar */}
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
