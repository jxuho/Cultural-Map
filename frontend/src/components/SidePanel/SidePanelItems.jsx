// src/components/SideePanel/SidePanelItems.jsx
import StarIcon from '../StarIcon'; 
import ReviewForm from '../Review/ReviewForm'; 
import ReviewDisplay from '../Review/ReviewDisplay'; 

const SidePanelItems = ({
  currentPlace,
  isReviewsExpanded,
  toggleReviewsExpansion,
  currentUser,
  userReview,
  handleReviewActionCompleted,
  loadingReviews,
  reviewFetchError,
  reviewsError,
  closeSidePanel, // SidePanelItems 내에서 패널 닫기 버튼이 있으므로 필요
  otherReviews
}) => {
  if (!currentPlace) {
    return <p className="p-4 text-gray-600 text-center">선택된 장소 정보가 없습니다.</p>;
  }

  return (
    <>
      {/* Header Section */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-800 break-words pr-2">
          {currentPlace.name}
        </h2>
        <button
          className="text-gray-500 hover:text-gray-700 text-4xl font-bold hover:cursor-pointer p-1"
          onClick={() => {
            closeSidePanel(); // prop으로 받은 closeSidePanel 사용
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
          {/* 사진 업로드 해결될 때까지는 주석처리. */}
          {/* {currentPlace.imageUrl && (
            <div className="mb-4">
              <img
                src={'currentPlace.imageUrl'}
                alt={currentPlace.name}
                className="w-full h-48 object-cover rounded-lg shadow-sm"
              />
            </div>
          )} */}

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
    </>
  );
};

export default SidePanelItems;