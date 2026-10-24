import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { reviewService, mockStore } from '@part/shared';
import { X, Star, CheckCircle, AlertCircle } from 'lucide-react';

export const ReviewModal: React.FC = () => {
  const {
    activeReviewTaskId,
    closeReview,
    currentProfile,
    refreshProfile,
    language,
  } = useAppStore();

  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const task = activeReviewTaskId ? mockStore.tasks.get(activeReviewTaskId) : null;
  if (!activeReviewTaskId || !task) return null;

  const isRequester = currentProfile.id === task.requester_id;
  const revieweeId = isRequester
    ? task.assigned_worker_id || ''
    : task.requester_id;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (feedback.trim().length < 5) {
      setErrorMsg('Please write at least 5 characters of constructive feedback.');
      return;
    }

    setIsSubmitting(true);
    const { review, error } = await reviewService.submitReview({
      taskId: task.id,
      reviewerId: currentProfile.id,
      revieweeId,
      roleReviewed: isRequester ? 'worker' : 'requester',
      rating,
      feedback,
    });

    setIsSubmitting(false);

    if (error) {
      setErrorMsg(error);
    } else {
      setSuccess(true);
      refreshProfile();
      setTimeout(() => {
        closeReview();
      }, 1200);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 animate-slide-up">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-extrabold text-slate-900">
            {language === 'ta' ? 'மதிப்பீடு வழங்குக' : 'Rate & Review'}
          </h3>
          <button
            onClick={closeReview}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="py-8 text-center">
            <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
              <CheckCircle className="w-7 h-7" />
            </div>
            <h4 className="text-base font-black text-slate-900">
              Review Submitted!
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Thank you for strengthening community trust in Chennai.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-3">
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="text-center">
              <p className="text-xs text-slate-600 mb-2">
                How was your experience for "{task.title}"?
              </p>

              {/* Star Rating Selector */}
              <div className="flex justify-center gap-2 my-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform active:scale-125"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-500 drop-shadow'
                          : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-amber-600">
                {rating === 5
                  ? 'Excellent & Prompt (5/5)'
                  : rating === 4
                  ? 'Good Work (4/5)'
                  : rating === 3
                  ? 'Average (3/5)'
                  : 'Needs Improvement'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Written Feedback *
              </label>
              <textarea
                rows={3}
                placeholder="Share details about punctuality, communication, and work quality..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary text-white font-black text-xs py-3.5 rounded-xl shadow-lg hover:bg-primaryDark transition disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting Review...' : 'Submit 5-Star Feedback'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
