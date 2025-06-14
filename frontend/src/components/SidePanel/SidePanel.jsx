// src/components/SidePanel/SidePanel.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from "../../store/authStore";
import useUiStore from "../../store/uiStore";

import Resizer from './SidePanelResizer';
import useSidePanelResizer from "../../hooks/useSidePanelResizer";

import { 
  fetchCulturalSiteById, 
  fetchReviewsByPlaceId, 
  createReview, 
  updateReview, 
  deleteReview 
} from "../../api/culturalSitesApi"; 

// 새로 분리된 컴포넌트 임포트
import SidePanelItems from './SidePanelItems'; // 경로 확인
import SidePanelSkeleton from "./SidePanelSkeleton";

const SidePanel = () => {
  const queryClient = useQueryClient();

  // --- Zustand (UI 상태 관리) ---
  const isSidePanelOpen = useUiStore((state) => state.isSidePanelOpen);
  const uiSelectedPlace = useUiStore((state) => state.selectedPlace); 
  const closeSidePanel = useUiStore((state) => state.closeSidePanel);
  
  const currentUser = useAuthStore((state) => state.user);

  // --- 로컬 UI 상태 (useState) ---
  const [isReviewsExpanded, setIsReviewsExpanded] = useState(false);

  // --- useSidePanelResizer 훅 사용 (sidePanelWidth만 가져옴) ---
  const detailRef = useRef(); 
  const { sidePanelWidth } = useSidePanelResizer(detailRef);

  // --- TanStack Query: 문화재 상세 정보 페칭 ---
  const { 
    data: selectedPlaceData,
    isLoading: isPlaceLoading, 
    isFetching: isPlaceFetching,
    isError: isPlaceError,
    error: placeError
  } = useQuery({
    queryKey: ['culturalSite', uiSelectedPlace?._id],
    queryFn: () => fetchCulturalSiteById(uiSelectedPlace._id),
    enabled: !!uiSelectedPlace?._id,
    staleTime: 1000 * 60 * 1,
  });

  // --- TanStack Query: 리뷰 목록 페칭 ---
  const { 
    data: reviews = [],
    isLoading: loadingReviews, 
    isFetching: isReviewsFetching,
    isError: reviewFetchError,
    error: reviewsError
  } = useQuery({
    queryKey: ['reviews', uiSelectedPlace?._id],
    queryFn: () => fetchReviewsByPlaceId(uiSelectedPlace._id),
    enabled: !!uiSelectedPlace?._id && isReviewsExpanded, 
    staleTime: 1000 * 10,
  });

  const userReview = reviews.find(review => review.user?._id === currentUser?._id) || null;
  const otherReviews = reviews.filter(review => review.user?._id !== currentUser?._id);

  // --- TanStack Query: 리뷰 생성/수정/삭제 뮤테이션 ---
  const reviewMutation = useMutation({
    mutationFn: async ({ actionType, placeId, reviewId, reviewData }) => {
      if (actionType === 'create') {
        return createReview(placeId, reviewData);
      } else if (actionType === 'update') {
        return updateReview(placeId, reviewId, reviewData);
      } else if (actionType === 'delete') {
        return deleteReview(placeId, reviewId);
      }
      throw new Error('Invalid review action type.');
    },
    onSuccess: (response, variables) => { // response와 variables를 인자로 받음
      queryClient.invalidateQueries({ queryKey: ['reviews', uiSelectedPlace?._id] });

      const updatedPlaceData = response.data?.culturalSite; // 서버 응답에서 업데이트된 culturalSite 데이터 추출

      if (updatedPlaceData) {
        queryClient.setQueryData(
          ['culturalSite', uiSelectedPlace?._id],
          updatedPlaceData 
        );
      } else {
        queryClient.setQueryData(
          ['culturalSite', uiSelectedPlace?._id],
          (oldData) => {
            if (!oldData) return oldData; 

            let newReviewCount = oldData.reviewCount || 0;
            let currentTotalRating = oldData.averageRating !== undefined && oldData.averageRating !== null
                                   ? oldData.averageRating * newReviewCount
                                   : 0;

            if (variables.actionType === 'create') {
              newReviewCount += 1;
              currentTotalRating += variables.reviewData.rating;
            } else if (variables.actionType === 'update') {
              const oldRating = userReview?.rating || 0; 
              currentTotalRating = currentTotalRating - oldRating + variables.reviewData.rating;
            } else if (variables.actionType === 'delete') {
              const deletedRating = userReview?.rating || 0; 
              if (newReviewCount > 0) {
                newReviewCount -= 1;
                currentTotalRating -= deletedRating;
              }
            }

            const newAverageRating = newReviewCount > 0 ? currentTotalRating / newReviewCount : 0;

            return {
              ...oldData,
              reviewCount: newReviewCount,
              averageRating: newAverageRating,
            };
          }
        );
      }

      queryClient.invalidateQueries({ queryKey: ['culturalSites'] }); 
      alert("리뷰가 성공적으로 처리되었습니다!");
    },
    onError: (error) => {
      console.error("리뷰 액션 실패:", error);
      alert(`리뷰 처리 실패: ${error.message || "알 수 없는 오류"}`);
    },
  });

  // --- 리뷰 섹션 확장/축소 및 데이터 초기화 (UI 로직) ---
  const toggleReviewsExpansion = useCallback(() => {
    setIsReviewsExpanded((prev) => !prev);
  }, []);

  const handleReviewActionCompleted = useCallback(async (actionType, newRating, oldRating, comment) => {
    await reviewMutation.mutateAsync({
      actionType,
      placeId: uiSelectedPlace._id,
      reviewId: actionType === 'create' ? undefined : userReview?._id,
      reviewData: actionType === 'delete' ? undefined : { rating: newRating, comment: comment }
    });
  }, [reviewMutation, uiSelectedPlace?._id, userReview]);

  // 사이드 패널 닫히거나 장소 변경 시 리뷰 섹션 접기 및 상태 초기화
  useEffect(() => {
    if (!isSidePanelOpen || !uiSelectedPlace?._id) {
      setIsReviewsExpanded(false);
    }
  }, [isSidePanelOpen, uiSelectedPlace?._id]);


  const ErrorDisplay = ({ message }) => (
    <div className="p-4 text-red-600 text-center">
      <p>오류 발생: {message}</p>
      <p>정보를 불러오지 못했습니다.</p>
    </div>
  );

  // --- 렌더링 조건 ---
  if (!isSidePanelOpen) {
    return null;
  }

  let panelContent;
  let showLoadingOverlay = false;

  if (isPlaceError) {
    panelContent = <ErrorDisplay message={placeError?.message || "알 수 없는 오류"} />;
  } else if (!selectedPlaceData && isPlaceLoading) {
    panelContent = <SidePanelSkeleton />;
  } else if (selectedPlaceData) {
    showLoadingOverlay = isPlaceFetching || isReviewsFetching;

    // 이제 SidePanelItems 컴포넌트를 렌더링하고 필요한 prop들을 전달합니다.
    panelContent = (
      <SidePanelItems
        currentPlace={selectedPlaceData} // selectedPlaceData를 currentPlace prop으로 전달
        isReviewsExpanded={isReviewsExpanded}
        toggleReviewsExpansion={toggleReviewsExpansion}
        currentUser={currentUser}
        userReview={userReview}
        handleReviewActionCompleted={handleReviewActionCompleted}
        loadingReviews={loadingReviews}
        reviewFetchError={reviewFetchError}
        reviewsError={reviewsError}
        closeSidePanel={closeSidePanel} // closeSidePanel 함수도 전달
        otherReviews={otherReviews} 
      />
    );
  } else {
    panelContent = <p className="p-4 text-gray-600 text-center">선택된 장소 정보가 없습니다.</p>;
  }


  return (
    <div
      className="absolute z-30 right-0 top-0 h-full shadow-lg bg-white max-w-[700px] flex flex-col"
      ref={detailRef}
      style={{
        width: sidePanelWidth,
        transition: "width 180ms ease",
        position: "absolute",
        right: "0",
        boxShadow:
          "0px 1.2px 3.6px rgba(0,0,0,0.1), 0px 6.4px 14.4px rgba(0,0,0,0.1)",
      }}
    >
      <Resizer detailRef={detailRef} /> 
      {panelContent}
      {showLoadingOverlay && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900"></div>
          </div>
      )}
    </div>
  );
};

export default SidePanel;
