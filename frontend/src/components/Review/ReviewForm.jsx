// src/components/Review/ReviewForm.jsx
import { useCallback, useState, useEffect } from 'react';
import StarIcon from '../StarIcon';

// onReviewActionCompleted 콜백은 이제 actionType, newRating, oldRating, comment를 인자로 받습니다.
// 이 콜백을 통해 상위 컴포넌트의 useMutation이 실행됩니다.
const ReviewForm = ({ userReview, onReviewActionCompleted, currentUser }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  // isSubmitting 상태는 이제 mutation 훅의 isLoading 상태를 사용하게 되므로, 여기서는 직접 사용하지 않을 수 있습니다.
  // 다만, onReviewActionCompleted가 비동기 작업을 포함하므로, 로컬 상태로 유지하는 것이 좋습니다.
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // userReview prop이 변경될 때마다 폼을 초기화 또는 기존 리뷰로 채움
  useEffect(() => {
    if (userReview) {
      setRating(userReview.rating);
      setComment(userReview.comment || "");
    } else {
      setRating(0);
      setComment("");
    }
    setSubmitError(null); // 에러 메시지 초기화
  }, [userReview]);

  const handleStarClick = useCallback((clickedIndex) => {
    if (!currentUser) {
      alert("리뷰를 작성하려면 먼저 로그인해주세요!");
      return;
    }
    setRating(clickedIndex + 1);
  }, [currentUser]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (!currentUser) {
      alert("로그인 후 리뷰를 작성할 수 있습니다.");
      return;
    }

    if (rating === 0) {
      alert("별점을 선택해주세요!");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (userReview) {
        // 기존 리뷰 업데이트: 'update' 액션 타입, 새 평점, 이전 평점, 댓글 전달
        await onReviewActionCompleted('update', rating, userReview.rating, comment);
        // 성공 메시지는 onReviewActionCompleted 내부의 onSuccess에서 처리됩니다.
      } else {
        // 새 리뷰 작성: 'create' 액션 타입, 새 평점, 이전 평점(null), 댓글 전달
        await onReviewActionCompleted('create', rating, null, comment);
        // 성공 메시지는 onReviewActionCompleted 내부의 onSuccess에서 처리됩니다.
      }
      // 성공 후 폼 초기화는 SidePanel의 invalidateQueries 후 데이터가 재페칭되어
      // userReview가 업데이트될 때 이 컴포넌트의 useEffect에 의해 자동으로 처리됩니다.
      // 하지만 즉각적인 UI 피드백을 위해 수동 초기화도 고려할 수 있습니다.
    } catch (error) {
      // 에러 처리는 onReviewActionCompleted 내부의 onError에서 처리됩니다.
      // 여기서는 상위 컴포넌트로부터 전달받은 에러 메시지를 표시합니다.
      setSubmitError(`리뷰 ${userReview ? '수정' : '작성'}에 실패했습니다.`);
      console.error(error)
    } finally {
      setIsSubmitting(false);
    }
  }, [rating, comment, userReview, onReviewActionCompleted, currentUser]);


  const handleDelete = useCallback(async () => {
    if (!currentUser) {
      alert("로그인 후 리뷰를 삭제할 수 있습니다.");
      return;
    }

    if (!userReview || !window.confirm("정말로 리뷰를 삭제하시겠습니까?")) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 리뷰 삭제: 'delete' 액션 타입, 새 평점(null), 이전 평점 전달
      await onReviewActionCompleted('delete', null, userReview.rating);
      // 성공 메시지는 onReviewActionCompleted 내부의 onSuccess에서 처리됩니다.

      // 삭제 성공 후 폼 초기화 (즉각적인 UI 업데이트)
      setRating(0);
      setComment("");
      
    } catch (error) {
      // 에러 처리는 onReviewActionCompleted 내부의 onError에서 처리됩니다.
      setSubmitError(`리뷰 삭제에 실패했습니다.`);
      console.error(error)
    } finally {
      setIsSubmitting(false);
    }
  }, [userReview, onReviewActionCompleted, currentUser]);

  return (
    <div className="p-4 border-b border-gray-200 bg-white">
      {currentUser ? (
        <h3 className="text-lg font-semibold text-gray-800 mb-3">
          {userReview ? "내 리뷰" : "리뷰 작성"}
        </h3>
      ) : (
        <h3 className="text-lg font-semibold text-gray-600 mb-3">
          리뷰를 작성하려면 로그인해주세요.
        </h3>
      )}

      {submitError && <p className="text-red-600 text-sm mb-3">{submitError}</p>}

      <div className="flex items-center mb-3">
        <span className="font-medium text-gray-700 mr-2">별점:</span>
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              rating={rating}
              index={i}
              className={`w-6 h-6 ${currentUser ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              onClick={() => handleStarClick(i)}
            />
          ))}
        </div>
        {rating > 0 && <span className="ml-2 text-gray-700 font-bold">{rating.toFixed(1)}점</span>}
      </div>

      <div className="mb-3">
        <label htmlFor="reviewComment" className="sr-only">리뷰 메시지</label>
        <textarea
          id="reviewComment"
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 resize-y"
          rows="3"
          placeholder={currentUser ? "리뷰를 작성해주세요..." : "로그인 후 리뷰를 작성할 수 있습니다."}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={isSubmitting || !currentUser}
        ></textarea>
      </div>

      {currentUser && (
        <div className="flex justify-end space-x-2">
          {userReview && (
            <button
              type="button"
              onClick={handleDelete}
              className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? '삭제 중...' : '삭제하기'}
            </button>
          )}
          <button
            type="submit"
            onClick={handleSubmit}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? (userReview ? '수정 중...' : '제출 중...') : (userReview ? '수정하기' : '리뷰 제출')}
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewForm;



// import { useCallback, useState, useEffect } from 'react';
// import axios from 'axios';
// import StarIcon from '../StarIcon';

// // onReviewActionCompleted는 onReviewSubmitted의 역할을 포함합니다.
// const ReviewForm = ({ placeId, userReview, onReviewActionCompleted, currentUser }) => {
//   const [rating, setRating] = useState(0);
//   const [comment, setComment] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [submitError, setSubmitError] = useState(null);

//   // userReview prop이 변경될 때마다 폼을 초기화 또는 기존 리뷰로 채움
//   useEffect(() => {
//     if (userReview) {
//       setRating(userReview.rating);
//       setComment(userReview.comment || "");
//     } else {
//       setRating(0);
//       setComment("");
//     }
//     setSubmitError(null); // 에러 메시지 초기화
//   }, [userReview]);

//   const handleStarClick = useCallback((clickedIndex) => {
//     if (!currentUser) { // 로그인하지 않은 경우 별점 선택 불가
//       alert("리뷰를 작성하려면 먼저 로그인해주세요!");
//       return;
//     }
//     setRating(clickedIndex + 1);
//   }, [currentUser]);

//   const handleSubmit = useCallback(async (e) => {
//     e.preventDefault();

//     if (!currentUser) {
//       alert("로그인 후 리뷰를 작성할 수 있습니다.");
//       return;
//     }

//     if (rating === 0) {
//       alert("별점을 선택해주세요!");
//       return;
//     }

//     setIsSubmitting(true);
//     setSubmitError(null);

//     try {
//       let response;
//       if (userReview) {
//         // 리뷰 수정
//         response = await axios.patch(
//           `http://localhost:5000/api/v1/cultural-sites/${placeId}/reviews/${userReview._id}`,
//           { rating, comment },
//           { withCredentials: true } // 세션 쿠키 등 인증 정보 포함
//         );
//         alert("리뷰가 성공적으로 수정되었습니다!");
//       } else {
//         // 리뷰 작성
//         response = await axios.post(
//           `http://localhost:5000/api/v1/cultural-sites/${placeId}/reviews`,
//           { rating, comment },
//           { withCredentials: true } // 세션 쿠키 등 인증 정보 포함
//         );
//         alert("리뷰가 성공적으로 제출되었습니다!");
//       }

//       console.log("리뷰 액션 성공:", response.data);

//       if (onReviewActionCompleted) {
//         onReviewActionCompleted(); // 부모 컴포넌트에 액션 완료 알림
//       }

//     } catch (error) {
//       console.error("리뷰 액션 실패:", error);
//       setSubmitError(`리뷰 ${userReview ? '수정' : '작성'}에 실패했습니다: ${error.response?.data?.message || error.message}`);
//       alert(`리뷰 ${userReview ? '수정' : '작성'}에 실패했습니다: ${error.response?.data?.message || error.message}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   }, [rating, comment, placeId, userReview, onReviewActionCompleted, currentUser]);


//   const handleDelete = useCallback(async () => {
//     if (!currentUser) {
//       alert("로그인 후 리뷰를 삭제할 수 있습니다.");
//       return;
//     }

//     if (!userReview || !window.confirm("정말로 리뷰를 삭제하시겠습니까?")) {
//       return;
//     }

//     setIsSubmitting(true);
//     setSubmitError(null);

//     try {
//       await axios.delete(
//         `http://localhost:5000/api/v1/cultural-sites/${placeId}/reviews/${userReview._id}`,
//         { withCredentials: true }
//       );
//       alert("리뷰가 성공적으로 삭제되었습니다!");

//       // 삭제 성공 후 폼 초기화
//       setRating(0);
//       setComment("");

//       if (onReviewActionCompleted) {
//         onReviewActionCompleted(); // 부모 컴포넌트에 액션 완료 알림
//       }
//     } catch (error) {
//       console.error("리뷰 삭제 실패:", error);
//       setSubmitError(`리뷰 삭제에 실패했습니다: ${error.response?.data?.message || error.message}`);
//       alert(`리뷰 삭제에 실패했습니다: ${error.response?.data?.message || error.message}`);
//     } finally {
//       setIsSubmitting(false);
//     }
//   }, [placeId, userReview, onReviewActionCompleted, currentUser]);


//   return (
//     <div className="p-4 border-b border-gray-200 bg-white">
//       {currentUser ? (
//         <h3 className="text-lg font-semibold text-gray-800 mb-3">
//           {userReview ? "내 리뷰" : "리뷰 작성"}
//         </h3>
//       ) : (
//         <h3 className="text-lg font-semibold text-gray-600 mb-3">
//           리뷰를 작성하려면 로그인해주세요.
//         </h3>
//       )}

//       {submitError && <p className="text-red-600 text-sm mb-3">{submitError}</p>}

//       <div className="flex items-center mb-3">
//         <span className="font-medium text-gray-700 mr-2">별점:</span>
//         <div className="flex">
//           {[...Array(5)].map((_, i) => (
//             <StarIcon
//               key={i}
//               rating={rating}
//               index={i}
//               className={`w-6 h-6 ${currentUser ? 'cursor-pointer' : 'cursor-not-allowed'}`}
//               onClick={() => handleStarClick(i)}
//             />
//           ))}
//         </div>
//         {rating > 0 && <span className="ml-2 text-gray-700 font-bold">{rating.toFixed(1)}점</span>}
//       </div>

//       <div className="mb-3">
//         <label htmlFor="reviewComment" className="sr-only">리뷰 메시지</label>
//         <textarea
//           id="reviewComment"
//           className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-800 resize-y"
//           rows="3"
//           placeholder={currentUser ? "리뷰를 작성해주세요..." : "로그인 후 리뷰를 작성할 수 있습니다."}
//           value={comment}
//           onChange={(e) => setComment(e.target.value)}
//           disabled={isSubmitting || !currentUser} // 제출 중이거나 로그인하지 않은 경우 비활성화
//         ></textarea>
//       </div>

//       {currentUser && ( // 로그인한 경우에만 버튼 표시
//         <div className="flex justify-end space-x-2">
//           {userReview && (
//             <button
//               type="button"
//               onClick={handleDelete}
//               className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed"
//               disabled={isSubmitting}
//             >
//               {isSubmitting ? '삭제 중...' : '삭제하기'}
//             </button>
//           )}
//           <button
//             type="submit"
//             onClick={handleSubmit} // form 태그가 아니므로 onClick으로 호출
//             className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
//             disabled={isSubmitting}
//           >
//             {isSubmitting ? (userReview ? '수정 중...' : '제출 중...') : (userReview ? '수정하기' : '리뷰 제출')}
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ReviewForm;