import React, { useState } from 'react';
import { AdminSidebar, AdminTab } from './components/AdminSidebar';
import { OverviewPage } from './pages/OverviewPage';
import { UsersPage } from './pages/UsersPage';
import { TasksPage } from './pages/TasksPage';
import { DisputesPage } from './pages/DisputesPage';
import { PaymentsPage } from './pages/PaymentsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { Bell, ShieldCheck, Activity } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AdminTab>('overview');

  const renderContent = () => {
    switch (currentTab) {
      case 'overview':
        return <OverviewPage onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'users':
        return <UsersPage />;
      case 'tasks':
        return <TasksPage />;
      case 'disputes':
        return <DisputesPage />;
      case 'payments':
        return <PaymentsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <OverviewPage onNavigate={(tab) => setCurrentTab(tab)} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 capitalize">
              {currentTab === 'overview'
                ? 'Mission Control Overview'
                : currentTab.replace('-', ' ')}
            </h2>
            <span className="text-[11px] text-slate-400">
              Chennai Hyperlocal Region • PostgreSQL RLS Active
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span>Postgres Live</span>
            </div>

            <button
              onClick={() => alert('No unresolved critical system alerts.')}
              className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"
              title="System Alerts"
            >
              <Bell className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
