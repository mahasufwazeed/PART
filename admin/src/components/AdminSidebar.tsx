import React from 'react';
import {
  LayoutDashboard,
  Users,
  ListTodo,
  AlertTriangle,
  CreditCard,
  BarChart3,
  Settings,
  ShieldCheck,
} from 'lucide-react';

export type AdminTab =
  | 'overview'
  | 'users'
  | 'tasks'
  | 'disputes'
  | 'payments'
  | 'analytics'
  | 'settings';

interface Props {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
}

export const AdminSidebar: React.FC<Props> = ({ currentTab, onSelectTab }) => {
  const navItems: { key: AdminTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'users', label: 'User Management', icon: Users },
    { key: 'tasks', label: 'Task Moderation', icon: ListTodo },
    { key: 'disputes', label: 'Disputes & Reports', icon: AlertTriangle },
    { key: 'payments', label: 'Payment Monitoring', icon: CreditCard },
    { key: 'analytics', label: 'Analytics & Trends', icon: BarChart3 },
    { key: 'settings', label: 'Platform Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between p-4 border-r border-slate-800 shrink-0">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-black text-white text-base shadow-lg">
            PART
          </div>
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-white">
              PART Console
            </h1>
            <span className="text-[10px] text-accent font-semibold tracking-wider uppercase block">
              Admin & Trust Center
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.key;
            return (
              <button
                key={item.key}
                onClick={() => onSelectTab(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-primary text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-accent' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Admin Profile Footer */}
      <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-accent/20 text-accent font-black text-xs flex items-center justify-center">
          PA
        </div>
        <div className="overflow-hidden">
          <h4 className="text-xs font-bold text-slate-200 truncate">
            Platform Admin
          </h4>
          <span className="text-[10px] text-accent flex items-center gap-1 font-medium">
            <ShieldCheck className="w-2.5 h-2.5" />
            Verified Admin
          </span>
        </div>
      </div>
    </aside>
  );
};
