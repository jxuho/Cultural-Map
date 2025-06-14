// src/components/Review/ReviewDisplay.jsx
import StarIcon from '../StarIcon';

const ReviewDisplay = ({ reviews, loading, error, currentUser }) => {
  if (loading) {
    return <p className="text-gray-600 text-center py-4">리뷰를 불러오는 중입니다...</p>;
  }

  if (error) {
    return <p className="text-red-600 text-center py-4">{error}</p>;
  }

  // 리뷰가 없는 경우 메시지 분기 처리
  if (reviews.length === 0) {
    if (currentUser) {
      // 로그인한 사용자가 자신의 리뷰를 작성했고, 다른 리뷰가 없는 경우
      return <p className="text-gray-600 text-center py-4">아직 다른 사용자의 리뷰가 없습니다.</p>;
    } else {
      // 로그인하지 않은 경우 (모든 리뷰가 없을 때)
      return <p className="text-gray-600 text-center py-4">아직 작성된 리뷰가 없습니다.</p>;
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
              {review.user?.username || "익명 사용자"}
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


// import StarIcon from '../StarIcon';

// const ReviewDisplay = ({ reviews, loading, error, currentUser }) => { // Receive currentUser prop
//   if (loading) {
//     return <p className="text-gray-600 text-center py-4">리뷰를 불러오는 중입니다...</p>;
//   }

//   if (error) {
//     return <p className="text-red-600 text-center py-4">{error}</p>;
//   }

//   if (reviews.length === 0) {
//     if (currentUser) {
//       return <p className="text-gray-600 text-center py-4">아직 다른 사용자의 리뷰가 없습니다.</p>;
//     } else {
//       return <p className="text-gray-600 text-center py-4">아직 작성된 리뷰가 없습니다.</p>; // More general message
//     }
//   }

//   return (
//     <div className="space-y-4 p-4">
//       {reviews.map((review) => (
//         <div
//           key={review._id}
//           className="bg-gray-50 p-3 rounded-lg shadow-sm border border-gray-100"
//         >
//           <div className="flex items-center mb-2">
//             {review.user?.profileImage && (
//               <img
//                 src={review.user.profileImage}
//                 alt={`${review.user.username}'s profile`}
//                 className="w-8 h-8 rounded-full object-cover mr-2 border border-gray-200"
//               />
//             )}
//             <p className="font-semibold text-gray-800 mr-2 flex-grow">
//               {review.user?.username || "익명 사용자"}
//             </p>
//             <div className="flex text-yellow-500 text-sm">
//               {[...Array(5)].map((_, i) => (
//                 <StarIcon
//                   key={i}
//                   rating={review.rating}
//                   index={i}
//                   className="w-4 h-4"
//                   displayMode="reviewForm"
//                 />
//               ))}
//             </div>
//           </div>
//           {review.comment && (
//             <p className="text-gray-700 text-sm italic">
//               "{review.comment}"
//             </p>
//           )}
//           <p className="text-gray-500 text-xs mt-2 text-right">
//             {new Date(review.createdAt).toLocaleDateString(
//               "ko-KR",
//               {
//                 year: "numeric",
//                 month: "long",
//                 day: "numeric",
//               }
//             )}
//           </p>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default ReviewDisplay;