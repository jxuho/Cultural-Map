import { useState, useCallback, useMemo } from 'react';
import StarIcon from '../StarIcon';
import ReviewForm from '../Review/ReviewForm';
import useAuthStore from '../../store/authStore';
import {
  useMyReviews,
  useReviewMutation,
} from '../../hooks/data/useReviewQueries';
import BackButton from '../BackButton';
import { Calendar, Star, MapPin, ArrowUpDown, Loader2 } from 'lucide-react';

const MyReviews = () => {
  const currentUser = useAuthStore((state) => state.user);

  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'createdAt' | 'culturalSiteName' | 'rating'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const {
    data: reviews = [],
    isLoading: loadingReviews,
    isError: reviewFetchError,
    error: reviewsError,
  } = useMyReviews();

  const reviewMutation = useReviewMutation();

  const handleReviewActionCompleted = useCallback(
    async (
      actionType: 'create' | 'update' | 'delete',
      newRating: number | null,
      _oldRating: number | null,
      comment?: string,
    ) => {
      const targetReview = reviews.find((r) => r._id === expandedReviewId);
      const placeIdForAction = targetReview?.culturalSite._id;
      const reviewIdForAction = expandedReviewId ?? undefined;

      if (!placeIdForAction) return;

      await reviewMutation.mutateAsync({
        actionType,
        placeId: placeIdForAction,
        reviewId: actionType === 'create' ? undefined : reviewIdForAction,
        reviewData:
          actionType === 'delete'
            ? undefined
            : { rating: newRating ?? 0, comment: comment ?? '' },
      });

      setExpandedReviewId(null);
    },
    [reviewMutation, expandedReviewId, reviews],
  );

  const sortedReviews = useMemo(() => {
    if (!reviews || reviews.length === 0) return [];
    const sortableReviews = [...reviews];
    sortableReviews.sort((a, b) => {
      let valA, valB;
      switch (sortBy) {
        case 'culturalSiteName':
          valA = a.culturalSite?.name || '';
          valB = b.culturalSite?.name || '';
          break;
        case 'rating':
          valA = a.rating;
          valB = b.rating;
          break;
        default:
          valA = new Date(a.createdAt).getTime();
          valB = new Date(b.createdAt).getTime();
      }
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortOrder === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
    return sortableReviews;
  }, [reviews, sortBy, sortOrder]);

  const handleSortChange = (criteria: typeof sortBy) => {
    if (sortBy === criteria) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(criteria);
      setSortOrder('asc');
    }
  };

  const renderContent = () => {
    if (loadingReviews) return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
        <p className="text-[10px] font-black uppercase tracking-widest">Retrieving logs...</p>
      </div>
    );

    if (reviewFetchError) return (
      <div className="border-2 border-red-500 p-6 text-center">
        <p className="text-red-500 font-mono text-xs uppercase font-bold">Error_Log: {reviewsError?.message}</p>
      </div>
    );

    if (sortedReviews.length === 0) return (
      <div className="border-2 border-dashed border-gray-300 py-20 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">No review entries found.</p>
      </div>
    );

    return (
      <div className="grid gap-4">
        {sortedReviews.map((review) => (
          <div 
            key={review._id} 
            className={`border-2 border-black transition-all ${expandedReviewId === review._id ? 'bg-white' : 'bg-zinc-50 hover:bg-white'}`}
          >
            <div 
              className="p-4 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              onClick={() => setExpandedReviewId(expandedReviewId === review._id ? null : review._id)}
            >
              <div className="space-y-1 grow">
                <div className="flex items-center gap-2">
                  <div className="bg-black text-white px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider">Site Record</div>
                  <h3 className="text-sm font-black uppercase tracking-tight break-all">
                    {review.culturalSite.name || 'Unknown Site'}
                  </h3>
                </div>
                {review.comment && (
                  <p className="text-xs font-mono text-gray-600 line-clamp-1 italic">"{review.comment}"</p>
                )}
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon 
                      key={i} 
                      rating={review.rating} 
                      index={i} 
                      className="w-3.5 h-3.5" 
                      displayMode="reviewForm" 
                    />
                  ))}
                </div>
                <div className="text-[10px] font-mono text-gray-400 border-l border-gray-300 pl-4 uppercase">
                  {new Date(review.createdAt).toLocaleDateString('en-GB')}
                </div>
              </div>
            </div>

            {expandedReviewId === review._id && (
              <div className="p-6 border-t-2 border-black bg-white animate-in slide-in-from-top-2 duration-200">
                <ReviewForm
                  placeId={review.culturalSite._id}
                  userReview={review}
                  onReviewActionCompleted={handleReviewActionCompleted}
                  currentUser={currentUser}
                  isSubmitting={reviewMutation.isPending}
                  submitError={reviewMutation.error?.message || null}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const sortBtnClass = (active: boolean) => `
    flex items-center gap-2 px-4 py-2 border-2 border-black text-[10px] font-black uppercase tracking-widest transition-all
    ${active ? 'bg-black text-white' : 'bg-white text-black hover:bg-zinc-100'}
  `;

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-12">
      <div className="flex justify-start mb-8">
        <BackButton />
      </div>

      <header className="mb-12">
        <div className="inline-block bg-black text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
          Community Contributions
        </div>
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">
          My <br /> Reviews
        </h1>
      </header>

      {/* Sorting Controls */}
      <div className="flex flex-wrap gap-2 mb-10">
        <button onClick={() => handleSortChange('createdAt')} className={sortBtnClass(sortBy === 'createdAt')}>
          <Calendar size={14} /> Date {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button onClick={() => handleSortChange('rating')} className={sortBtnClass(sortBy === 'rating')}>
          <Star size={14} /> Rating {sortBy === 'rating' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button onClick={() => handleSortChange('culturalSiteName')} className={sortBtnClass(sortBy === 'culturalSiteName')}>
          <MapPin size={14} /> Site {sortBy === 'culturalSiteName' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      <div className="space-y-4">
        {renderContent()}
      </div>
    </div>
  );
};

export default MyReviews;