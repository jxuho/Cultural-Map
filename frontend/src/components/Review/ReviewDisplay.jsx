import StarIcon from '../StarIcon';

const ReviewDisplay = ({ reviews, currentUser }) => {
  // ReviewDisplay는 이제 로딩과 에러 상태를 직접 처리하지 않습니다.
  // 이 상태들은 상위 컴포넌트(SidePanelItems)에서 이미 관리되고 있습니다.

  // 리뷰가 없는 경우 메시지 분기 처리
  if (reviews.length === 0) {
    if (currentUser) {
      return <p className="text-gray-600 text-center py-4">No reviews from the other users.</p>;
    } else {
      // 이 경우는 ReviewForm이 표시되지 않을 때만 발생합니다.
      return <p className="text-gray-600 text-center py-4">No reviews yet.</p>;
    }
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
              {review.user?.username || "Unknown user"}
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
            {new Date(review.createdAt).toLocaleDateString(
              "en-US",
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