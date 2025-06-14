// src/components/SidePanel/SidePanel.jsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from "../../store/authStore";
import useUiStore from "../../store/uiStore";
import StarIcon from '../StarIcon';
import ReviewForm from '../Review/ReviewForm';
import ReviewDisplay from '../Review/ReviewDisplay';

import Resizer from './SidePanelResizer'; // Resizer 컴포넌트 임포트
import useSidePanelResizer from "../../hooks/useSidePanelResizer"; // sidePanelWidth를 가져오기 위해 훅 임포트

import { 
  fetchCulturalSiteById, 
  fetchReviewsByPlaceId, 
  createReview, 
  updateReview, 
  deleteReview 
} from "../../api/culturalSitesApi"; 

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
  // 이제 detailRef는 SidePanel에서 만들고 Resizer 컴포넌트와 훅에 전달합니다.
  const detailRef = useRef(); 
  const { sidePanelWidth } = useSidePanelResizer(detailRef); // detailRef를 훅에 전달

  // --- TanStack Query: 문화재 상세 정보 페칭 ---
  const { 
    data: selectedPlaceData,
    isLoading: isPlaceLoading, 
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', uiSelectedPlace?._id] });
      queryClient.invalidateQueries({ queryKey: ['culturalSite', uiSelectedPlace?._id] });
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

  // --- 렌더링 조건 ---
  if (!isSidePanelOpen || isPlaceLoading || isPlaceError || !selectedPlaceData) {
    if (isPlaceError) {
      console.error("문화재 상세 정보를 불러오는 중 에러:", placeError);
    }
    return null;
  }

  const currentPlace = selectedPlaceData;

  return (
    <div
      className="absolute z-30 right-0 top-0 h-full shadow-lg bg-white max-w-[700px] flex flex-col"
      ref={detailRef} // detailRef를 SidePanel div에 연결
      style={{
        width: sidePanelWidth, // useSidePanelResizer 훅에서 가져온 sidePanelWidth 사용
        transition: "width 180ms ease",
        position: "absolute",
        right: "0",
        boxShadow:
          "0px 1.2px 3.6px rgba(0,0,0,0.1), 0px 6.4px 14.4px rgba(0,0,0,0.1)",
      }}
    >
      {/* Resizer 컴포넌트를 렌더링하고 detailRef를 prop으로 전달 */}
      <Resizer detailRef={detailRef} /> 

      {/* Header Section */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 break-words pr-2">
          {currentPlace.name}
        </h2>
        <button
          className="text-gray-500 hover:text-gray-700 text-4xl font-bold hover:cursor-pointer p-1"
          onClick={() => {
            closeSidePanel();
            setIsReviewsExpanded(false);
          }}
        >
          &times;
        </button>
      </div>

      {/* Always display Review Summary and Expansion Section */}
      <div className="border-b border-gray-200">
        <div
          className="flex items-center justify-between p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors duration-200 mx-4 my-2"
          onClick={toggleReviewsExpansion}
        >
          <h3 className="text-lg font-semibold text-blue-800 flex-grow">
            리뷰 ({currentPlace.reviewCount || 0})
          </h3>
          {currentPlace.averageRating !== undefined && currentPlace.averageRating !== null && currentPlace.reviewCount > 0 && (
            <div className="flex items-center">
              <div className="flex text-yellow-500 text-base mr-2">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    rating={currentPlace.averageRating}
                    index={i}
                    className="w-5 h-5"
                    displayMode="averageRating"
                  />
                ))}
              </div>
              <span className="text-blue-800 font-bold">
                {currentPlace.averageRating.toFixed(1)}
              </span>
            </div>
          )}
          <span className="ml-4 text-gray-500">
            {isReviewsExpanded ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {/* Panel Content - Conditional Rendering based on isReviewsExpanded */}
      {isReviewsExpanded ? (
        <div className="flex-grow overflow-y-auto">
          {currentUser ? (
            <ReviewForm
              placeId={currentPlace._id}
              userReview={userReview}
              onReviewActionCompleted={handleReviewActionCompleted}
              currentUser={currentUser}
            />
          ) : (
            <div className="p-4 bg-white border-b border-gray-200">
              <p className="text-gray-700 text-center font-medium">리뷰를 작성하려면 로그인해주세요.</p>
            </div>
          )}

          <ReviewDisplay
            reviews={otherReviews}
            loading={loadingReviews}
            error={reviewFetchError?.message || reviewsError?.message}
            currentUser={currentUser}
          />
        </div>
      ) : (
        <div className="flex-grow p-4 overflow-y-auto">
          {currentPlace.imageUrl && (
            <div className="mb-4">
              <img
                src={currentPlace.imageUrl}
                alt={currentPlace.name}
                className="w-full h-48 object-cover rounded-lg shadow-sm"
              />
            </div>
          )}

          {/* Basic Info Section */}
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-1">
              <span className="font-semibold text-gray-700">카테고리:</span>{" "}
              {currentPlace.category
                ?.replace(/_/g, " ")
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ") || "N/A"}
            </p>
            {currentPlace.address && (
              <p className="text-gray-700 mb-1">
                <span className="font-semibold">주소:</span>{" "}
                {currentPlace.address}
              </p>
            )}
            {currentPlace.website && (
              <p className="text-gray-700 mb-1">
                <span className="font-semibold">웹사이트:</span>{" "}
                <a
                  href={currentPlace.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  방문하기
                </a>
              </p>
            )}
            {currentPlace.openingHours && (
              <p className="text-gray-700 mb-1">
                <span className="font-semibold">영업 시간:</span>{" "}
                {currentPlace.openingHours}
              </p>
            )}
          </div>

          {/* Description Section */}
          {currentPlace.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">설명</h3>
              <p className="text-gray-700 leading-relaxed">
                {currentPlace.description}
              </p>
            </div>
          )}

          {/* Message if no additional info */}
          {!currentPlace.description && !currentPlace.website && !currentPlace.openingHours && currentPlace.reviewCount === 0 && (
            <p className="text-gray-600 text-center py-8">추가 정보가 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SidePanel;


// // SidePanel.jsx
// import { useCallback, useEffect, useRef, useState } from "react";
// import axios from "axios";
// import useViewport from "../../hooks/useViewPort";
// import useAuthStore from "../../store/authStore";
// import StarIcon from '../StarIcon';
// import ReviewForm from '../Review/ReviewForm';
// import ReviewDisplay from '../Review/ReviewDisplay';
// import useUiStore from "../../store/uiStore";

// const SidePanel = () => {
//   const isSidePanelOpen = useUiStore((state) => state.isSidePanelOpen);
//   const selectedPlace = useUiStore((state) => state.selectedPlace);
//   const closeSidePanel = useUiStore((state) => state.closeSidePanel);
//   const sidePanelWidth = useUiStore(
//     (state) => state.sidePanelWidth
//   );
//   const setSidePanelWidth = useUiStore(
//     (state) => state.setSidePanelWidth
//   );
//   const { width: viewportWidth } = useViewport();

//   const currentUser = useAuthStore((state) => state.user);

//   const detailRef = useRef();
//   const [isResizing, setIsResizing] = useState(false);
//   const [isHover, setIsHover] = useState(false);
//   const [resizerPosition, setResizerPosition] = useState(360);

//   const [userReview, setUserReview] = useState(null);
//   const [otherReviews, setOtherReviews] = useState([]);
//   const [loadingReviews, setLoadingReviews] = useState(false);
//   const [reviewError, setReviewError] = useState(null);
//   const [isReviewsExpanded, setIsReviewsExpanded] = useState(false); // Default to false

//   const resizerMouseDownHandler = useCallback(() => {
//     setIsResizing(true);
//   }, []);

//   const resizerMouseUpHandler = useCallback(() => {
//     setIsResizing(false);
//   }, []);

//   useEffect(() => {
//     if (!isResizing) {
//       setSidePanelWidth(resizerPosition);
//     }
//   }, [isResizing, resizerPosition, setSidePanelWidth]);

//   const resizeHandler = useCallback(
//     (event) => {
//       if (!isResizing) return;
//       let calculatedPosition =
//         detailRef.current.getBoundingClientRect().right - event.clientX;
//       if (calculatedPosition > 700) {
//         calculatedPosition = 700;
//       }
//       if (calculatedPosition < 360) {
//         calculatedPosition = 360;
//       }
//       setResizerPosition(calculatedPosition);
//     },
//     [isResizing]
//   );

//   useEffect(() => {
//     document.addEventListener("mousemove", resizeHandler);
//     document.addEventListener("mouseup", resizerMouseUpHandler);
//     return () => {
//       document.removeEventListener("mousemove", resizeHandler);
//       document.removeEventListener("mouseup", resizerMouseUpHandler);
//     };
//   }, [resizeHandler, resizerMouseUpHandler]);

//   useEffect(() => {
//     if (viewportWidth - sidePanelWidth < 50 && viewportWidth > 450) {
//       setSidePanelWidth(viewportWidth - 50);
//       setResizerPosition(viewportWidth - 50);
//     } else if (viewportWidth <= 450) {
//       setSidePanelWidth(viewportWidth);
//       setResizerPosition(viewportWidth);
//     }
//   }, [viewportWidth, sidePanelWidth, setSidePanelWidth]);

//   const fetchReviews = useCallback(async () => {
//     if (!selectedPlace?._id || loadingReviews) return;

//     setLoadingReviews(true);
//     setReviewError(null);
//     try {
//       const response = await axios.get(
//         `http://localhost:5000/api/v1/cultural-sites/${selectedPlace._id}/reviews`
//       );
//       const reviews = response.data.data.reviews;

//       if (currentUser?._id) {
//         const userReviewFound = reviews.find(
//           (review) => review.user?._id === currentUser._id
//         );
//         const filteredOtherReviews = reviews.filter(
//           (review) => review.user?._id !== currentUser._id
//         );
//         setUserReview(userReviewFound || null);
//         setOtherReviews(filteredOtherReviews);
//       } else {
//         setUserReview(null);
//         setOtherReviews(reviews);
//       }
//     } catch (err) {
//       console.error("Failed to fetch reviews:", err);
//       setReviewError("리뷰를 불러오는 데 실패했습니다.");
//       setUserReview(null);
//       setOtherReviews([]);
//     } finally {
//       setLoadingReviews(false);
//     }
//   }, [selectedPlace?._id, loadingReviews, currentUser?._id]);

//   // ★★★ MODIFICATION HERE ★★★
//   // This useEffect will reset review states when the place changes or panel closes,
//   // but it will NOT collapse the review section automatically.
//   // The expansion will be controlled by toggleReviewsExpansion.
//   useEffect(() => {
//     // 사이드 패널이 닫히거나 선택된 장소가 없을 경우 모든 리뷰 관련 상태를 초기화하고 확장 상태를 false로 설정합니다.
//     if (!isSidePanelOpen || !selectedPlace?._id) {
//       setUserReview(null);
//       setOtherReviews([]);
//       setIsReviewsExpanded(false); // ★★★ 여기가 수정된 부분입니다. ★★★
//       setLoadingReviews(false);
//       setReviewError(null);
//     } else {
//       // 새로운 장소가 선택되고 패널이 열려 있는 경우
//       // 리뷰 데이터를 초기화하고, 리뷰 섹션을 접습니다.
//       setUserReview(null);
//       setOtherReviews([]);
//       setIsReviewsExpanded(false); // ★★★ 여기가 수정된 부분입니다. ★★★
//       setLoadingReviews(false);
//       setReviewError(null);
//       // fetchReviews는 toggleReviewsExpansion이 호출될 때만 실행됩니다.
//     }
//   }, [isSidePanelOpen, selectedPlace?._id]); 


//   const toggleReviewsExpansion = useCallback(() => {
//     setIsReviewsExpanded((prev) => !prev); // Simply toggle the state
//     if (!isReviewsExpanded) { // If it's about to expand, fetch reviews
//       fetchReviews();
//     }
//     // If it's about to collapse, no need to fetch, state will be reset by the useEffect above
//   }, [isReviewsExpanded, fetchReviews]);

//   const handleReviewActionCompleted = useCallback(() => {
//     fetchReviews();
//   }, [fetchReviews]);


//   if (!isSidePanelOpen || !selectedPlace) {
//     return null;
//   }

//   return (
//     <div
//       className="absolute z-30 right-0 top-0 h-full shadow-lg bg-white max-w-[700px] flex flex-col"
//       ref={detailRef}
//       style={
//         viewportWidth - sidePanelWidth < 560
//           ? {
//             width: sidePanelWidth,
//             transition: "width 180ms ease",
//             position: "absolute",
//             right: "0",
//             boxShadow:
//               "0px 1.2px 3.6px rgba(0,0,0,0.1), 0px 6.4px 14.4px rgba(0,0,0,0.1)",
//           }
//           : {
//             width: sidePanelWidth,
//             transition: "width 180ms ease",
//             boxShadow:
//               "0px 1.2px 3.6px rgba(0,0,0,0.1), 0px 6.4px 14.4px rgba(0,0,0,0.1)",
//           }
//       }
//     >
//       {/* resizer */}
//       <div
//         className={`w-1 absolute top-0 h-full m-0 p-0 box-border bg-gray-500 opacity-0 translate-x-1 ${
//           (isHover || isResizing) && "opacity-40 cursor-ew-resize"
//         } `}
//         onMouseDown={resizerMouseDownHandler}
//         onMouseEnter={() => setIsHover(true)}
//         onMouseLeave={() => setIsHover(false)}
//         style={{ right: resizerPosition, zIndex: "200" }}
//       ></div>

//       {/* Header Section */}
//       <div className="flex items-center justify-between p-4 border-b border-gray-200">
//         <h2 className="text-2xl font-bold text-gray-800 break-words pr-2">
//           {selectedPlace.name}
//         </h2>
//         <button
//           className="text-gray-500 hover:text-gray-700 text-4xl font-bold hover:cursor-pointer p-1"
//           onClick={() => {
//             closeSidePanel();
//             setIsReviewsExpanded(false); // Ensure reviews are collapsed on panel close
//           }}
//         >
//           &times;
//         </button>
//       </div>

//       {/* Always display Review Summary and Expansion Section */}
//       <div className="border-b border-gray-200">
//         <div
//           className="flex items-center justify-between p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors duration-200 mx-4 my-2"
//           onClick={toggleReviewsExpansion}
//         >
//           <h3 className="text-lg font-semibold text-blue-800 flex-grow">
//             리뷰 ({selectedPlace.reviewCount})
//           </h3>
//           {selectedPlace.averageRating !== undefined && selectedPlace.averageRating !== null && selectedPlace.reviewCount > 0 && (
//             <div className="flex items-center">
//               <div className="flex text-yellow-500 text-base mr-2">
//                 {[...Array(5)].map((_, i) => (
//                   <StarIcon
//                     key={i}
//                     rating={selectedPlace.averageRating}
//                     index={i}
//                     className="w-5 h-5"
//                     displayMode="averageRating"
//                   />
//                 ))}
//               </div>
//               <span className="text-blue-800 font-bold">
//                 {selectedPlace.averageRating.toFixed(1)}
//               </span>
//             </div>
//           )}
//           <span className="ml-4 text-gray-500">
//             {isReviewsExpanded ? "▲" : "▼"}
//           </span>
//         </div>
//       </div>

//       {/* Panel Content - Conditional Rendering based on isReviewsExpanded */}
//       {isReviewsExpanded ? (
//         <div className="flex-grow overflow-y-auto">
//           {/* currentUser가 있을 때만 ReviewForm 렌더링 */}
//           {currentUser ? (
//             <ReviewForm
//               placeId={selectedPlace._id}
//               userReview={userReview}
//               onReviewActionCompleted={handleReviewActionCompleted}
//               currentUser={currentUser}
//             />
//           ) : (
//             <div className="p-4 bg-white border-b border-gray-200">
//               <p className="text-gray-700 text-center font-medium">리뷰를 작성하려면 로그인해주세요.</p>
//             </div>
//           )}

//           {/* ReviewDisplay에 전달되는 reviews prop은 otherReviews (로그인 시) 또는 all reviews (로그인 안 한 경우) */}
//           <ReviewDisplay
//             reviews={otherReviews}
//             loading={loadingReviews}
//             error={reviewError}
//             currentUser={currentUser}
//           />
//         </div>
//       ) : (
//         <div className="flex-grow p-4 overflow-y-auto">
//           {selectedPlace.imageUrl && (
//             <div className="mb-4">
//               <img
//                 src={selectedPlace.imageUrl}
//                 alt={selectedPlace.name}
//                 className="w-full h-48 object-cover rounded-lg shadow-sm"
//               />
//             </div>
//           )}

//           {/* Basic Info Section */}
//           <div className="mb-6">
//             <p className="text-sm text-gray-500 mb-1">
//               <span className="font-semibold text-gray-700">카테고리:</span>{" "}
//               {selectedPlace.category
//                 ?.replace(/_/g, " ")
//                 .split(" ")
//                 .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
//                 .join(" ") || "N/A"}
//             </p>
//             {selectedPlace.address && (
//               <p className="text-gray-700 mb-1">
//                 <span className="font-semibold">주소:</span>{" "}
//                 {selectedPlace.address}
//               </p>
//             )}
//             {selectedPlace.website && (
//               <p className="text-gray-700 mb-1">
//                 <span className="font-semibold">웹사이트:</span>{" "}
//                 <a
//                   href={selectedPlace.website}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="text-blue-600 hover:underline"
//                 >
//                   방문하기
//                 </a>
//               </p>
//             )}
//             {selectedPlace.openingHours && (
//               <p className="text-gray-700 mb-1">
//                 <span className="font-semibold">영업 시간:</span>{" "}
//                 {selectedPlace.openingHours}
//               </p>
//             )}
//           </div>

//           {/* Description Section */}
//           {selectedPlace.description && (
//             <div className="mb-6">
//               <h3 className="text-lg font-semibold text-gray-800 mb-2">설명</h3>
//               <p className="text-gray-700 leading-relaxed">
//                 {selectedPlace.description}
//               </p>
//             </div>
//           )}

//           {/* Message if no additional info */}
//           {!selectedPlace.description && !selectedPlace.website && !selectedPlace.openingHours && selectedPlace.reviewCount === 0 && (
//             <p className="text-gray-600 text-center py-8">추가 정보가 없습니다.</p>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default SidePanel;