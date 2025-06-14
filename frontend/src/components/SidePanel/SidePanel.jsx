// SidePanel.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import useSidePanelStore from "../../store/sidePanelStore";
import useViewport from "../../hooks/useViewPort";
import StarIcon from '../StarIcon';
import ReviewForm from '../Review/ReviewForm';
import ReviewDisplay from '../Review/ReviewDisplay';

const SidePanel = () => {
  const isSidePanelOpen = useSidePanelStore((state) => state.isSidePanelOpen);
  const selectedPlace = useSidePanelStore((state) => state.selectedPlace);
  const closeSidePanel = useSidePanelStore((state) => state.closeSidePanel);
  const sidePanelWidth = useSidePanelStore((state) => state.sidePanelWidth);
  const setSidePanelWidth = useSidePanelStore(
    (state) => state.setSidePanelWidth
  );
  const { width: viewportWidth } = useViewport();

  const detailRef = useRef();
  const [isResizing, setIsResizing] = useState(false);
  const [isHover, setIsHover] = useState(false);
  const [resizerPosition, setResizerPosition] = useState(360);

  const [fullReviewsData, setFullReviewsData] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [isReviewsExpanded, setIsReviewsExpanded] = useState(false);

  const resizerMouseDownHandler = useCallback(() => {
    setIsResizing(true);
  }, []);

  const resizerMouseUpHandler = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (!isResizing) {
      setSidePanelWidth(resizerPosition);
    }
  }, [isResizing, resizerPosition, setSidePanelWidth]);

  const resizeHandler = useCallback(
    (event) => {
      if (!isResizing) return;
      let calculatedPosition =
        detailRef.current.getBoundingClientRect().right - event.clientX;
      if (calculatedPosition > 700) {
        calculatedPosition = 700;
      }
      if (calculatedPosition < 360) {
        calculatedPosition = 360;
      }
      setResizerPosition(calculatedPosition);
    },
    [isResizing]
  );

  useEffect(() => {
    document.addEventListener("mousemove", resizeHandler);
    document.addEventListener("mouseup", resizerMouseUpHandler);
    return () => {
      document.removeEventListener("mousemove", resizeHandler);
      document.removeEventListener("mouseup", resizerMouseUpHandler);
    };
  }, [resizeHandler, resizerMouseUpHandler]);

  useEffect(() => {
    if (viewportWidth - sidePanelWidth < 50 && viewportWidth > 450) {
      setSidePanelWidth(viewportWidth - 50);
      setResizerPosition(viewportWidth - 50);
    } else if (viewportWidth <= 450) {
      setSidePanelWidth(viewportWidth);
      setResizerPosition(viewportWidth);
    }
  }, [viewportWidth, sidePanelWidth, setSidePanelWidth]);

  useEffect(() => {
    if (!isSidePanelOpen || !selectedPlace?._id) {
      setFullReviewsData(null);
      setIsReviewsExpanded(false);
      setLoadingReviews(false);
      setReviewError(null);
    }
  }, [isSidePanelOpen, selectedPlace?._id]);

  const fetchReviews = useCallback(async () => {
    if (!selectedPlace?._id || loadingReviews) return;

    setLoadingReviews(true);
    setReviewError(null);
    try {
      const response = await axios.get(
        `http://localhost:5000/api/v1/cultural-sites/${selectedPlace._id}`
      );
      setFullReviewsData(response.data.data.culturalSite.reviews);
      setIsReviewsExpanded(true);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
      setReviewError("리뷰를 불러오는 데 실패했습니다.");
      setFullReviewsData([]);
    } finally {
      setLoadingReviews(false);
    }
  }, [selectedPlace?._id, loadingReviews]);

  const toggleReviewsExpansion = useCallback(() => {
    if (!isReviewsExpanded) {
      fetchReviews();
    } else {
      setIsReviewsExpanded(false);
    }
  }, [isReviewsExpanded, fetchReviews]);

  const handleReviewSubmitted = useCallback(() => {
    fetchReviews();
  }, [fetchReviews]);


  if (!isSidePanelOpen || !selectedPlace) {
    return null;
  }

  const reviewsToDisplay = fullReviewsData || [];

  return (
    <div
      className="absolute z-[1001] right-0 top-0 h-full shadow-lg bg-white max-w-[700px] flex flex-col"
      ref={detailRef}
      style={
        viewportWidth - sidePanelWidth < 560
          ? {
              width: sidePanelWidth,
              transition: "width 180ms ease",
              position: "absolute",
              right: "0",
              boxShadow:
                "0px 1.2px 3.6px rgba(0,0,0,0.1), 0px 6.4px 14.4px rgba(0,0,0,0.1)",
            }
          : {
              width: sidePanelWidth,
              transition: "width 180ms ease",
              boxShadow:
                "0px 1.2px 3.6px rgba(0,0,0,0.1), 0px 6.4px 14.4px rgba(0,0,0,0.1)",
            }
      }
    >
      {/* resizer */}
      <div
        className={`w-1 absolute top-0 h-full m-0 p-0 box-border bg-gray-500 opacity-0 translate-x-1 ${
          (isHover || isResizing) && "opacity-40 cursor-ew-resize"
        } `}
        onMouseDown={resizerMouseDownHandler}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        style={{ right: resizerPosition, zIndex: "200" }}
      ></div>

      {/* Header Section */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 break-words pr-2">
          {selectedPlace.name}
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

      {/* Review Summary and Expansion Section */}
      {selectedPlace.reviewCount > 0 && (
        <div className="border-b border-gray-200">
          <div
            className="flex items-center justify-between p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors duration-200 mx-4 my-2"
            onClick={toggleReviewsExpansion}
          >
            <h3 className="text-lg font-semibold text-blue-800 flex-grow">
              리뷰 ({selectedPlace.reviewCount})
            </h3>
            {selectedPlace.averageRating !== undefined && selectedPlace.averageRating !== null && (
              <div className="flex items-center">
                <div className="flex text-yellow-500 text-base mr-2">
                  {[...Array(5)].map((_, i) => (
                    <StarIcon
                      key={i}
                      rating={selectedPlace.averageRating}
                      index={i}
                      className="w-5 h-5"
                      displayMode="averageRating" // ★★★ 여기를 추가했습니다 ★★★
                    />
                  ))}
                </div>
                <span className="text-blue-800 font-bold">
                  {selectedPlace.averageRating.toFixed(1)}
                </span>
              </div>
            )}
            <span className="ml-4 text-gray-500">
              {isReviewsExpanded ? "▲" : "▼"}
            </span>
          </div>
        </div>
      )}

      {/* Panel Content - Conditional Rendering based on isReviewsExpanded */}
      {isReviewsExpanded ? (
        <div className="flex-grow overflow-y-auto">
          {/* Review Form Component */}
          <ReviewForm
            placeId={selectedPlace._id}
            onReviewSubmitted={handleReviewSubmitted}
          />
          {/* Review Display Component */}
          <ReviewDisplay
            reviews={reviewsToDisplay}
            loading={loadingReviews}
            error={reviewError}
          />
        </div>
      ) : (
        <div className="flex-grow p-4 overflow-y-auto">
          {selectedPlace.imageUrl && (
            <div className="mb-4">
              <img
                src={selectedPlace.imageUrl}
                alt={selectedPlace.name}
                className="w-full h-48 object-cover rounded-lg shadow-sm"
              />
            </div>
          )}

          {/* Basic Info Section */}
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-1">
              <span className="font-semibold text-gray-700">카테고리:</span>{" "}
              {selectedPlace.category
                ?.replace(/_/g, " ")
                .split(" ")
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(" ") || "N/A"}
            </p>
            {selectedPlace.address && (
              <p className="text-gray-700 mb-1">
                <span className="font-semibold">주소:</span>{" "}
                {selectedPlace.address}
              </p>
            )}
            {selectedPlace.website && (
              <p className="text-gray-700 mb-1">
                <span className="font-semibold">웹사이트:</span>{" "}
                <a
                  href={selectedPlace.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  방문하기
                </a>
              </p>
            )}
            {selectedPlace.openingHours && (
              <p className="text-gray-700 mb-1">
                <span className="font-semibold">영업 시간:</span>{" "}
                {selectedPlace.openingHours}
              </p>
            )}
          </div>

          {/* Description Section */}
          {selectedPlace.description && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">설명</h3>
              <p className="text-gray-700 leading-relaxed">
                {selectedPlace.description}
              </p>
            </div>
          )}

          {/* Message if no additional info */}
          {!selectedPlace.description && !selectedPlace.website && !selectedPlace.openingHours && selectedPlace.reviewCount === 0 && (
            <p className="text-gray-600 text-center py-8">추가 정보가 없습니다.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SidePanel;