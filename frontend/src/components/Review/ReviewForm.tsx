import {
  useCallback,
  useState,
  useEffect,
  ChangeEvent,
  FormEvent,
} from 'react';
import StarIcon from '../StarIcon';
import { Review } from '../../types/review';
import { User } from '../../types/user';
import { Trash2, Send, Edit3 } from 'lucide-react'; // 아이콘 추가

interface ReviewFormProps {
  placeId: string;
  userReview: Review | null;
  onReviewActionCompleted: (
    actionType: 'create' | 'update' | 'delete',
    newRating: number | null,
    oldRating: number | null,
    comment?: string,
  ) => Promise<void>;
  currentUser: User | null;
  isSubmitting: boolean;
  submitError: string | null;
}

const ReviewForm = ({
  userReview,
  onReviewActionCompleted,
  currentUser,
  isSubmitting,
  submitError,
}: ReviewFormProps) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');

  useEffect(() => {
    if (userReview) {
      setRating(userReview.rating);
      setComment(userReview.comment || '');
    } else {
      setRating(0);
      setComment('');
    }
  }, [userReview]);

  const handleStarClick = useCallback(
    (clickedIndex: number) => {
      if (!currentUser) return;
      setRating(clickedIndex + 1);
    },
    [currentUser],
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!currentUser || rating === 0) return;

      try {
        if (userReview) {
          await onReviewActionCompleted('update', rating, userReview.rating, comment);
        } else {
          await onReviewActionCompleted('create', rating, null, comment);
        }
      } catch (error) {
        console.error('Submit error:', error);
      }
    },
    [rating, comment, userReview, onReviewActionCompleted, currentUser],
  );

  const handleDelete = useCallback(async () => {
    if (!currentUser || !userReview) return;
    if (!window.confirm('Archive records for this entry will be removed. Continue?')) return;

    try {
      await onReviewActionCompleted('delete', null, userReview.rating);
    } catch (error) {
      console.error('Delete error:', error);
    }
  }, [userReview, onReviewActionCompleted, currentUser]);

  return (
    <div className="p-6 bg-white border-b border-black">
      {/* Label & Error */}
      <div className="flex justify-between items-baseline mb-6">
        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-black">
          {userReview ? 'Edit Contribution' : 'New Contribution'}
        </h3>
        {submitError && (
          <span className="text-[10px] font-bold text-red-500 uppercase animate-pulse">
            Error: {submitError}
          </span>
        )}
      </div>

      {/* Rating System */}
      <div className="mb-6 p-4 border border-black bg-[#fdfdfd]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-tighter text-gray-400">Score</span>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <StarIcon
                key={i}
                rating={rating}
                index={i}
                className={`w-5 h-5 transition-transform ${currentUser ? 'cursor-pointer hover:scale-110 active:scale-95' : 'opacity-30 cursor-not-allowed'}`}
                onClick={() => handleStarClick(i)}
              />
            ))}
          </div>
          <span className="font-mono text-xs font-bold w-6 text-right">
            {rating > 0 ? rating : '--'}
          </span>
        </div>
      </div>

      {/* Comment Input */}
      <div className="mb-6 relative">
        <textarea
          id="reviewComment"
          className="w-full p-4 border border-black rounded-none focus:ring-0 focus:border-black text-sm text-gray-800 placeholder:text-gray-300 bg-white min-h-[120px] resize-none font-serif leading-relaxed"
          placeholder={currentUser ? "Share your archival findings..." : "Authentication required to contribute."}
          value={comment}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
          disabled={isSubmitting || !currentUser}
        />
        <div className="absolute bottom-[-1px] right-[-1px] w-4 h-4 bg-black border-t border-l border-white" />
      </div>

      {/* Action Buttons */}
      {currentUser && (
        <div className="flex gap-2 h-12">
          {userReview && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 border border-black text-black hover:bg-red-500 hover:text-white transition-all duration-300 disabled:opacity-30"
            >
              <Trash2 size={16} />
              <span className="text-[11px] font-black uppercase tracking-widest">Remove</span>
            </button>
          )}
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || rating === 0}
            className={`flex-[2] flex items-center justify-center gap-2 bg-black text-white hover:bg-gray-800 transition-all duration-300 disabled:bg-gray-200 disabled:text-gray-400`}
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
            ) : (
              userReview ? <Edit3 size={16} /> : <Send size={16} />
            )}
            <span className="text-[11px] font-black uppercase tracking-widest">
              {isSubmitting ? 'Syncing...' : userReview ? 'Update Entry' : 'Post Entry'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewForm;