import { supabase, isLiveSupabaseConfigured } from './client';
import { mockStore } from './mockStore';
import { Dispute, Report, DisputeStatus, UserBlock, Profile } from '../types';

export const disputeService = {
  /**
   * Raise a dispute on a task
   */
  async raiseDispute(params: {
    taskId: string;
    raisedBy: string;
    reason: string;
    details: string;
  }): Promise<{ dispute: Dispute; error?: string }> {
    const { taskId, raisedBy, reason, details } = params;

    const task = mockStore.tasks.get(taskId);
    if (!task) return { dispute: null as any, error: 'Task not found' };

    const disputeId = `disp-${Date.now()}`;
    const newDispute: Dispute = {
      id: disputeId,
      task_id: taskId,
      raised_by: raisedBy,
      reason,
      details,
      status: 'OPEN',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured) {
      try {
        await supabase.from('disputes').insert(newDispute);
      } catch (err) {
        console.warn('Supabase raiseDispute error:', err);
      }
    }

    mockStore.disputes.set(disputeId, newDispute);
    task.status = 'DISPUTED';

    return { dispute: newDispute };
  },

  /**
   * Report an inappropriate task or user
   */
  async submitReport(params: {
    reporterId: string;
    reportedUserId?: string;
    reportedTaskId?: string;
    reason: string;
    details?: string;
  }): Promise<{ report: Report; error?: string }> {
    const reportId = `rep-${Date.now()}`;
    const newReport: Report = {
      id: reportId,
      reporter_id: params.reporterId,
      reported_user_id: params.reportedUserId || null,
      reported_task_id: params.reportedTaskId || null,
      reason: params.reason,
      details: params.details || null,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured) {
      try {
        await supabase.from('reports').insert(newReport);
      } catch (err) {
        console.warn('Supabase submitReport error:', err);
      }
    }

    mockStore.reports.set(reportId, newReport);
    return { report: newReport };
  },

  /**
   * Block a user
   */
  async blockUser(
    blockerId: string,
    blockedId: string
  ): Promise<{ success: boolean; error?: string }> {
    if (blockerId === blockedId) {
      return { success: false, error: 'You cannot block yourself' };
    }

    const blockId = `block-${blockerId}-${blockedId}`;
    const block: UserBlock = {
      id: blockId,
      blocker_id: blockerId,
      blocked_id: blockedId,
      created_at: new Date().toISOString(),
    };

    if (isLiveSupabaseConfigured) {
      try {
        await supabase.from('user_blocks').upsert({
          blocker_id: blockerId,
          blocked_id: blockedId,
        });
      } catch (err) {
        console.warn('Supabase blockUser error:', err);
      }
    }

    mockStore.userBlocks.set(blockId, block);
    return { success: true };
  },

  /**
   * Unblock a user
   */
  async unblockUser(
    blockerId: string,
    blockedId: string
  ): Promise<{ success: boolean; error?: string }> {
    const blockId = `block-${blockerId}-${blockedId}`;

    if (isLiveSupabaseConfigured) {
      try {
        await supabase
          .from('user_blocks')
          .delete()
          .eq('blocker_id', blockerId)
          .eq('blocked_id', blockedId);
      } catch (err) {
        console.warn('Supabase unblockUser error:', err);
      }
    }

    mockStore.userBlocks.delete(blockId);
    return { success: true };
  },

  /**
   * Check if communication or collaboration is blocked between two users (bi-directional check)
   */
  async isUserBlocked(userAId: string, userBId: string): Promise<boolean> {
    if (!userAId || !userBId) return false;

    // Check in-memory store
    for (const [_, block] of mockStore.userBlocks.entries()) {
      if (
        (block.blocker_id === userAId && block.blocked_id === userBId) ||
        (block.blocker_id === userBId && block.blocked_id === userAId)
      ) {
        return true;
      }
    }

    if (isLiveSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('user_blocks')
          .select('blocker_id, blocked_id')
          .or(
            `and(blocker_id.eq.${userAId},blocked_id.eq.${userBId}),and(blocker_id.eq.${userBId},blocked_id.eq.${userAId})`
          )
          .maybeSingle();

        if (!error && data) return true;
      } catch (err) {
        // Fallback to false
      }
    }

    return false;
  },

  /**
   * Get all users blocked by a specific user
   */
  async getBlockedUsers(userId: string): Promise<Profile[]> {
    const blockedIds: string[] = [];
    for (const [_, block] of mockStore.userBlocks.entries()) {
      if (block.blocker_id === userId) {
        blockedIds.push(block.blocked_id);
      }
    }

    return blockedIds
      .map((id) => mockStore.profiles.get(id))
      .filter((p): p is Profile => Boolean(p));
  },

  /**
   * Get all disputes for admin
   */
  async getAllDisputes(): Promise<Dispute[]> {
    return Array.from(mockStore.disputes.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  /**
   * Get all reports for admin
   */
  async getAllReports(): Promise<Report[]> {
    return Array.from(mockStore.reports.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  /**
   * Resolve dispute (admin action)
   */
  async resolveDispute(
    disputeId: string,
    adminId: string,
    resolution: DisputeStatus,
    notes: string
  ): Promise<{ success: boolean; error?: string }> {
    const dispute = mockStore.disputes.get(disputeId);
    if (!dispute) return { success: false, error: 'Dispute not found' };

    dispute.status = resolution;
    dispute.resolution_notes = notes;
    dispute.resolved_by = adminId;
    dispute.resolved_at = new Date().toISOString();
    dispute.updated_at = new Date().toISOString();

    const task = mockStore.tasks.get(dispute.task_id);
    if (task) {
      if (resolution === 'RESOLVED_PAY_WORKER') {
        task.status = 'COMPLETED';
      } else if (resolution === 'RESOLVED_REFUND' || resolution === 'DISMISSED') {
        task.status = 'CANCELLED';
      }
    }

    return { success: true };
  },
};
