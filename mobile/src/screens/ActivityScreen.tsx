import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { taskService, Task, mockStore } from '@part/shared';
import { TaskCard } from '../components/TaskCard';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState } from '../components/EmptyState';
import {
  Clock,
  Send,
  CheckCircle2,
  ChevronRight,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export const ActivityScreen: React.FC = () => {
  const { currentProfile, openTaskDetails, openChat, setTab, language } =
    useAppStore();

  const [tab, setTabState] = useState<'posted' | 'applied' | 'ongoing' | 'completed'>('posted');
  const [postedTasks, setPostedTasks] = useState<Task[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
    if (!currentProfile) return;
    const load = async () => {
      const posted = await taskService.getMyPostedTasks(currentProfile.id);
      setPostedTasks(posted);

      const assigned = await taskService.getMyAssignedTasks(currentProfile.id);
      setAssignedTasks(assigned);

      const apps = Array.from(mockStore.applications.values())
        .filter((a) => a.worker_id === currentProfile.id)
        .map((a) => ({
          ...a,
          task: mockStore.tasks.get(a.task_id),
        }));
      setApplications(apps);
    };

    load();
  }, [currentProfile?.id]);

  const ongoingTasks = [
    ...postedTasks.filter((t) => ['ASSIGNED', 'IN_PROGRESS', 'COMPLETION_SUBMITTED'].includes(t.status)),
    ...assignedTasks.filter((t) => ['ASSIGNED', 'IN_PROGRESS', 'COMPLETION_SUBMITTED'].includes(t.status)),
  ].filter((t, idx, arr) => arr.findIndex((x) => x.id === t.id) === idx);

  const completedTasks = [
    ...postedTasks.filter((t) => t.status === 'COMPLETED'),
    ...assignedTasks.filter((t) => t.status === 'COMPLETED'),
  ].filter((t, idx, arr) => arr.findIndex((x) => x.id === t.id) === idx);

  return (
    <div className="pb-28 min-h-screen bg-[#F7F8FA] select-none">
      {/* Top Header */}
      <div className="bg-white border-b border-neutral-200/90 shadow-xs px-3 sm:px-5 md:px-6 pt-3 sm:pt-4 pb-3">
        <h2 className="font-heading font-black text-xl text-neutral-900 tracking-tight">
          {language === 'ta' ? 'செயல்பாடுகள் & வரலாறு' : 'Activity & History'}
        </h2>
        <p className="text-xs text-neutral-500 font-medium">
          {language === 'ta'
            ? 'உங்கள் பணிகள் மற்றும் விண்ணப்பங்களின் நேரடி நிலை'
            : 'Track your posted requests, applications, and ongoing work'}
        </p>

        {/* 4 Segmented Tabs: Posted | Applied | Ongoing | Completed */}
        <div className="flex bg-neutral-100 p-1 rounded-2xl border border-neutral-200 text-xs font-heading font-bold mt-3">
          {[
            { key: 'posted', label: `Posted (${postedTasks.length})` },
            { key: 'applied', label: `Applied (${applications.length})` },
            { key: 'ongoing', label: `Ongoing (${ongoingTasks.length})` },
            { key: 'completed', label: `Completed (${completedTasks.length})` },
          ].map((t) => {
            const isActive = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTabState(t.key as any)}
                className={`flex-1 py-1.5 sm:py-2 rounded-xl text-center transition cursor-pointer text-[11px] sm:text-xs ${
                  isActive
                    ? 'bg-part-green text-white shadow-xs font-black'
                    : 'text-neutral-500 hover:text-neutral-900 font-semibold'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-3 sm:px-5 md:px-6 pt-3 sm:pt-4 w-full">
        {/* Tab 1: Posted Tasks */}
        {tab === 'posted' && (
          postedTasks.length === 0 ? (
            <EmptyState
              title="You haven't posted any tasks yet"
              subtitle="Need help with parcel pickup, errands, or home chores? Post in seconds!"
              actionText="Post a Task"
              onAction={() => setTab('post')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {postedTasks.map((t) => <TaskCard key={t.id} task={t} />)}
            </div>
          )
        )}

        {/* Tab 2: Applications */}
        {tab === 'applied' && (
          applications.length === 0 ? (
            <EmptyState
              title="No task applications yet"
              subtitle="Explore neighborhood tasks in Chennai to start earning."
              actionText="Explore Tasks"
              onAction={() => setTab('explore')}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  onClick={() => app.task && openTaskDetails(app.task.id)}
                  className="bg-white p-3 sm:p-4 rounded-2xl border border-neutral-200/90 shadow-quick flex items-center justify-between cursor-pointer hover:border-part-green transition select-none"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-part-green bg-part-green-mint px-2 py-0.5 rounded-full">
                      Application {app.status}
                    </span>
                    <h4 className="font-heading font-black text-xs text-neutral-900 line-clamp-1">
                      {app.task?.title || 'Neighborhood Task'}
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      Budget: ₹{app.task?.budget_inr} • Applied on {new Date(app.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-400 shrink-0 ml-2" />
                </div>
              ))}
            </div>
          )
        )}

        {/* Tab 3: Ongoing */}
        {tab === 'ongoing' && (
          ongoingTasks.length === 0 ? (
            <EmptyState
              title="No tasks currently in progress"
              subtitle="Accepted jobs or assigned tasks will show here with real-time chat."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {ongoingTasks.map((t) => (
                <div key={t.id} className="space-y-2">
                  <TaskCard task={t} />
                  <button
                    type="button"
                    onClick={() => openChat(t.id)}
                    className="w-full py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-heading font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-brand-yellow" />
                    <span>Open Active Task Chat</span>
                  </button>
                </div>
              ))}
            </div>
          )
        )}

        {/* Tab 4: Completed */}
        {tab === 'completed' && (
          completedTasks.length === 0 ? (
            <EmptyState
              title="No completed tasks yet"
              subtitle="Gigs you complete and approve will be archived here along with receipts."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {completedTasks.map((t) => <TaskCard key={t.id} task={t} />)}
            </div>
          )
        )}
      </div>
    </div>
  );
};
