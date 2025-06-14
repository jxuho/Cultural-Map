// ReviewForm.jsx
import React, { useCallback, useState } from 'react';
import axios from 'axios';
import StarIcon from '../StarIcon';

const ReviewForm = ({ placeId, onReviewSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // 별점 클릭 핸들러 수정: 클릭된 별까지 채워지도록 합니다.
  const handleStarClick = useCallback((clickedIndex) => {
    // clickedIndex는 0부터 시작하므로, 실제 별점은 clickedIndex + 1 입니다.
    setRating(clickedIndex + 1);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    if (rating === 0) {
      alert("별점을 선택해주세요!");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await axios.post(
        `http://localhost:5000/api/v1/cultural-sites/${placeId}/reviews`,
        { rating, comment }
      );

      console.log("리뷰 제출 성공:", response.data);
      alert("리뷰가 성공적으로 제출되었습니다!");

      setRating(0);
      setComment("");

      if (onReviewSubmitted) {
        onReviewSubmitted();
      }

    } catch (error) {
      console.error("리뷰 제출 실패:", error);
      setSubmitError("리뷰 제출에 실패했습니다. 다시 시도해주세요.");
      alert(`리뷰 제출에 실패했습니다: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [rating, comment, placeId, onReviewSubmitted]);

  return (
    <form onSubmit={handleSubmit} className="p-4 border-b border-gray-200 bg-white">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">리뷰 작성</h3>
      {submitError && <p className="text-red-600 text-sm mb-3">{submitError}</p>}
      <div className="flex items-center mb-3">
        <span className="font-medium text-gray-700 mr-2">별점:</span>
        <div className="flex">
          {[...Array(5)].map((_, i) => (
            <StarIcon
              key={i}
              rating={rating} // 현재 폼의 rating 상태를 StarIcon에 전달하여 채워진 상태를 표시
              index={i}
              className="w-6 h-6 cursor-pointer"
              onClick={() => handleStarClick(i)} // 클릭된 별의 인덱스를 전달
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
          placeholder="리뷰를 작성해주세요..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={isSubmitting}
        ></textarea>
      </div>
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
        disabled={isSubmitting}
      >
        {isSubmitting ? '제출 중...' : '리뷰 제출'}
      </button>
    </form>
  );
};

export default ReviewForm;