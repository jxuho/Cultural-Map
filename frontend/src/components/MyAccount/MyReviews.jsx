// src/components/Review/MyReview.jsx
import { useState, useCallback, useRef, useEffect } from "react"; // useRef, useEffect 임포트 추가
import StarIcon from "../StarIcon";
import ReviewForm from "../Review/ReviewForm";
import useAuthStore from "../../store/authStore";

// Import custom TanStack Query hooks
import {
  useMyReviews,
  useReviewMutation,
} from "../../hooks/useCulturalSitesQueries";

const MyReviews = () => {
  const currentUser = useAuthStore((state) => state.user);

  const [expandedReviewId, setExpandedReviewId] = useState(null);
  const scrollContainerRef = useRef(null); // 스크롤될 목록을 감싸는 div의 ref
  const headerRef = useRef(null); // 제목 부분을 감싸는 div의 ref (높이 계산용)
  const [scrollAreaMaxHeight, setScrollAreaMaxHeight] = useState('auto'); // 스크롤 영역의 최대 높이 상태

  // --- TanStack Query: Fetch My Reviews (using custom hook) ---
  const {
    data: reviews = [],
    isLoading: loadingReviews,
    isError: reviewFetchError,
    error: reviewsError,
  } = useMyReviews(); // Call the custom hook

  // --- TanStack Query: Review Create/Update/Delete Mutation (using custom hook) ---
  const reviewMutation = useReviewMutation(); // Call the custom hook

  const handleReviewActionCompleted = useCallback(
    async (actionType, newRating, oldRating, comment) => {
      // Find the current review being acted upon to get its culturalSite._id
      const targetReview = reviews.find((r) => r._id === expandedReviewId);
      const placeIdForAction = targetReview?.culturalSite._id;
      const reviewIdForAction = expandedReviewId;
      const oldRatingOfTargetReview = targetReview?.rating; // Get old rating directly from the fetched review

      if (!placeIdForAction) {
        alert("문화재 정보를 찾을 수 없습니다.");
        return;
      }

      await reviewMutation.mutateAsync({
        actionType,
        placeId: placeIdForAction,
        reviewId: actionType === "create" ? undefined : reviewIdForAction,
        reviewData:
          actionType === "delete"
            ? undefined
            : { rating: newRating, comment: comment },
        oldRating: oldRatingOfTargetReview, // Pass oldRating to the mutation for manual cache update if needed
      });

      // This state update should remain in the component, not in the generic hook
      setExpandedReviewId(null); // Close the form on successful review action
    },
    [reviewMutation, expandedReviewId, reviews]
  );

  // 스크롤 영역의 최대 높이를 동적으로 계산
  useEffect(() => {
    const calculateMaxHeight = () => {
      if (scrollContainerRef.current && headerRef.current) {
        // 이 컴포넌트의 전체 높이를 가져옵니다. (p-6 bg-white rounded-lg shadow-md div)
        const parentTotalHeight = scrollContainerRef.current.parentElement.clientHeight;
        
        // 제목 섹션의 높이
        const headerHeight = headerRef.current.offsetHeight;
        
        // 컴포넌트의 패딩 (p-6은 상하 24px * 2 = 48px)
        const componentPaddingY = 48; 
        
        // 실제 스크롤 가능한 영역의 높이 계산
        // 전체 높이 - (제목 높이 + 컴포넌트 자체 상하 패딩 + (옵션: 기타 고정 요소 높이))
        // 리뷰 항목 내부의 확장되는 높이는 flex-grow로 조절되므로, 여기서는 고정된 요소만 고려합니다.
        const calculatedHeight = parentTotalHeight - headerHeight - componentPaddingY;
        
        setScrollAreaMaxHeight(`${calculatedHeight}px`);
      }
    };

    calculateMaxHeight(); // 초기 마운트 시 계산

    // 윈도우 리사이즈 시 높이 재계산
    window.addEventListener('resize', calculateMaxHeight);

    // 확장/축소 시에도 높이 재계산 (ReviewForm의 높이가 동적으로 변할 경우)
    // reviews 배열이나 expandedReviewId가 변경될 때마다 재계산 (성능 고려하여 debounce 필요할 수도)
    // setTimeout을 사용하여 DOM 업데이트 후 높이 계산을 지연시키는 것이 안전합니다.
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(calculateMaxHeight, 0); // DOM 업데이트 후 비동기적으로 계산
    });

    if (scrollContainerRef.current) {
      resizeObserver.observe(scrollContainerRef.current.parentElement);
    }

    return () => {
      window.removeEventListener('resize', calculateMaxHeight);
      if (scrollContainerRef.current && scrollContainerRef.current.parentElement) {
        resizeObserver.unobserve(scrollContainerRef.current.parentElement);
      }
    };
  }, [reviews, expandedReviewId]); // expandedReviewId를 의존성 배열에 추가하여 항목 확장 시 재계산

  // --- 로딩/에러/빈 리뷰 상태 처리 ---
  const renderContent = () => {
    if (loadingReviews) {
      return (
        <div className="text-center flex-grow flex items-center justify-center flex-col">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">리뷰를 불러오는 중입니다...</p>
        </div>
      );
    }

    if (reviewFetchError) {
      return (
        <div className="text-center flex-grow flex items-center justify-center flex-col">
          <p className="text-red-600">
            리뷰를 불러오는 중 오류가 발생했습니다: {reviewsError.message}
          </p>
        </div>
      );
    }

    if (reviews.length === 0) {
      return (
        <div className="text-center flex-grow flex items-center justify-center flex-col">
          <p className="text-gray-600 text-lg">
            아직 작성된 리뷰가 없습니다.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            새로운 리뷰를 작성해보세요!
          </p>
        </div>
      );
    }

    // 실제 리뷰 목록
    return (
      <div className="space-y-4">
        {reviews.map((review) => (
          <div
            key={review._id}
            className="bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-100"
          >
            {/* Main review content (clickable to expand/collapse) */}
            <div
              className="cursor-pointer"
              onClick={() =>
                setExpandedReviewId(
                  expandedReviewId === review._id ? null : review._id
                )
              }
            >
              <div className="flex items-center mb-2">
                {review.culturalSite.imageUrl && (
                  <img
                    src={review.culturalSite.imageUrl}
                    alt={`${review.culturalSite.name}'s image`}
                    className="w-8 h-8 rounded-full object-cover mr-2 border border-gray-200"
                  />
                )}
                <p className="font-semibold text-gray-800 mr-2 flex-grow">
                  {review.culturalSite.name || "Unknown"}
                </p>
                <div className="flex text-yellow-500 text-sm">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      rating={review.rating}
                      index={i}
                      className="w-4 h-4"
                      displayMode="reviewForm"
                    />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="text-gray-700 text-sm italic">
                  "{review.comment}"
                </p>
              )}
              <p className="text-gray-500 text-xs mt-2 text-right">
                {new Date(review.createdAt).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            {/* Conditionally render ReviewForm if this review is expanded */}
            {expandedReviewId === review._id && (
              <div
                className="mt-4 border-t pt-4 border-gray-200"
                onClick={(e) => e.stopPropagation()} // IMPORTANT: Stop propagation here to prevent re-collapsing when clicking inside the form
              >
                <ReviewForm
                  userReview={review} // Pass the specific review object to the form for editing
                  onReviewActionCompleted={handleReviewActionCompleted}
                  currentUser={currentUser}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md flex flex-col h-full"> {/* h-full과 flex-col 추가 */}
      {/* 제목 섹션 - Ref 연결 */}
      <div ref={headerRef}>
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
          내가 작성한 리뷰
        </h2>
      </div>

      {/* 스크롤 가능한 리뷰 목록 영역 - Ref 연결 및 동적 maxHeight 적용 */}
      {/* flex-grow를 추가하여 남은 공간을 차지하도록 함 */}
      <div
        ref={scrollContainerRef}
        className="overflow-y-auto pr-2 flex-grow"
        style={{ maxHeight: scrollAreaMaxHeight }}
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default MyReviews;