// ReviewDisplay.jsx
import React from 'react';
import StarIcon from '../StarIcon';

const ReviewDisplay = ({ reviews, loading, error }) => {
  if (loading) {
    return <p className="text-gray-600 text-center py-4">리뷰를 불러오는 중입니다...</p>;
  }

  if (error) {
    return <p className="text-red-600 text-center py-4">{error}</p>;
  }

  if (reviews.length === 0) {
    return <p className="text-gray-600 text-center py-4">아직 리뷰가 없습니다.</p>;
  }

  return (
    <div className="space-y-4 p-4">
      {reviews.map((review) => (
        <div
          key={review._id}
          className="bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-100"
        >
          <div className="flex items-center mb-2">
            {review.user?.profileImage && (
              <img
                src={review.user.profileImage}
                alt={`${review.user.username}'s profile`}
                className="w-8 h-8 rounded-full object-cover mr-2 border border-gray-200"
              />
            )}
            <p className="font-semibold text-gray-800 mr-2 flex-grow">
              {review.user?.username || "익명 사용자"}
            </p>
            <div className="flex text-yellow-500 text-sm">
              {[...Array(5)].map((_, i) => (
                <StarIcon
                  key={i}
                  rating={review.rating}
                  index={i}
                  className="w-4 h-4"
                  displayMode="reviewForm" // ★★★ 여기를 추가했습니다 ★★★
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
            {new Date(review.createdAt).toLocaleDateString(
              "ko-KR",
              {
                year: "numeric",
                month: "long",
                day: "numeric",
              }
            )}
          </p>
        </div>
      ))}
    </div>
  );
};

export default ReviewDisplay;