import { supabase, isLiveSupabaseConfigured } from './client';
import { mockStore } from './mockStore';
import { Review } from '../types';

export const reviewService = {
  /**
   * Submit review after task completion
   */
  async submitReview(params: {
    taskId: string;
    reviewerId: string;
    revieweeId: string;
    roleReviewed: 'worker' | 'requester';
    rating: number;
    feedback: string;
  }): Promise<{ review: Review; error?: string }> {
    const { taskId, reviewerId, revieweeId, roleReviewed, rating, feedback } = params;

    const task = mockStore.tasks.get(taskId);
    if (task && task.status !== 'COMPLETED') {
      return { review: null as any, error: 'Reviews are only enabled after task is marked COMPLETED' };
    }

    if (reviewerId === revieweeId) {
      return { review: null as any, error: 'You cannot review yourself' };
    }

    if (isLiveSupabaseConfigured) {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          task_id: taskId,
          reviewer_id: reviewerId,
          reviewee_id: revieweeId,
          role_reviewed: roleReviewed,
          rating,
          feedback,
        })
        .select('*, reviewer:profiles!reviewer_id(*)')
        .single();

      if (error) return { review: null as any, error: error.message };
      return { review: data as Review };
    }

    const reviewId = `rev-${Date.now()}`;
    const newRev: Review = {
      id: reviewId,
      task_id: taskId,
      reviewer_id: reviewerId,
      reviewee_id: revieweeId,
      role_reviewed: roleReviewed,
      rating,
      feedback,
      created_at: new Date().toISOString(),
      reviewer: mockStore.profiles.get(reviewerId),
    };

    mockStore.reviews.set(reviewId, newRev);

    // Update profile average rating
    const userReviews = Array.from(mockStore.reviews.values()).filter(
      (r) => r.reviewee_id === revieweeId && r.role_reviewed === roleReviewed
    );
    const avg =
      userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length;

    const profile = mockStore.profiles.get(revieweeId);
    if (profile) {
      if (roleReviewed === 'worker') {
        profile.rating_as_worker = Math.round(avg * 100) / 100;
        profile.total_reviews_as_worker = userReviews.length;
      } else {
        profile.rating_as_requester = Math.round(avg * 100) / 100;
        profile.total_reviews_as_requester = userReviews.length;
      }
    }

    return { review: newRev };
  },

  /**
   * Fetch reviews received by a user
   */
  async getUserReviews(userId: string): Promise<Review[]> {
    return Array.from(mockStore.reviews.values())
      .filter((r) => r.reviewee_id === userId)
      .map((r) => ({
        ...r,
        reviewer: mockStore.profiles.get(r.reviewer_id),
      }))
      .sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  },
};
