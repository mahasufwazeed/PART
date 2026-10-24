import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { taskService, Task, mockStore } from '@part/shared';
import { TaskCard } from '../components/TaskCard';
import { StatusBadge } from '../components/StatusBadge';
import { Clock, Send, CheckCircle2, ChevronRight } from 'lucide-react';

export const ActivityScreen: React.FC = () => {
  const { currentProfile, openTaskDetails, language } = useAppStore();
  const [subTab, setSubTab] = useState<'posted' | 'assigned' | 'applications'>('posted');
  const [postedTasks, setPostedTasks] = useState<Task[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [applications, setApplications] = useState<any[]>([]);

  useEffect(() => {
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
  }, [currentProfile.id]);

  return (
    <div className="pb-28 px-4 pt-4 max-w-md mx-auto space-y-4">
      <div>
        <h2 className="text-lg font-black text-slate-900">
          {language === 'ta' ? 'உங்கள் செயல்பாடுகள்' : 'Activity & History'}
        </h2>
        <p className="text-xs text-slate-500">
          {language === 'ta'
            ? 'பதிவு செய்த பணிகள் மற்றும் நீங்கள் செய்யும் பணிகள்.'
            : 'Track your posted requests and assigned gig work.'}
        </p>
      </div>

      {/* Segmented Control */}
      <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
        <button
          onClick={() => setSubTab('posted')}
          className={`flex-1 py-2 rounded-lg transition ${
            subTab === 'posted'
              ? 'bg-white text-primary shadow-sm font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {language === 'ta' ? 'பதிவிட்டவை' : 'My Requests'} ({postedTasks.length})
        </button>
        <button
          onClick={() => setSubTab('assigned')}
          className={`flex-1 py-2 rounded-lg transition ${
            subTab === 'assigned'
              ? 'bg-white text-primary shadow-sm font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {language === 'ta' ? 'செயல் பணிகள்' : 'My Work'} ({assignedTasks.length})
        </button>
        <button
          onClick={() => setSubTab('applications')}
          className={`flex-1 py-2 rounded-lg transition ${
            subTab === 'applications'
              ? 'bg-white text-primary shadow-sm font-extrabold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {language === 'ta' ? 'விண்ணப்பங்கள்' : 'Applied'} ({applications.length})
        </button>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {subTab === 'posted' && (
          postedTasks.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
              You haven't posted any tasks yet. Tap Post to begin!
            </div>
          ) : (
            postedTasks.map((t) => <TaskCard key={t.id} task={t} />)
          )
        )}

        {subTab === 'assigned' && (
          assignedTasks.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
              No tasks currently assigned to you. Explore tasks to apply!
            </div>
          ) : (
            assignedTasks.map((t) => <TaskCard key={t.id} task={t} />)
          )
        )}

        {subTab === 'applications' && (
          applications.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
              You haven't applied to any tasks yet.
            </div>
          ) : (
            applications.map((app) => (
              <div
                key={app.id}
                onClick={() => app.task && openTaskDetails(app.task.id)}
                className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:border-primary/40 transition"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                    {app.task?.title || 'Task'}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400">
                      Applied {new Date(app.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      Status: {app.status}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </div>
            ))
          )
        )}
      </div>
    </div>
  );
};
