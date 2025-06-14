import axios from 'axios';

const API_BASE_URL = "http://localhost:5000/api/v1";

// 모든 문화재 정보를 가져오는 함수
export const fetchAllCulturalSites = async (params = {}) => {
  const response = await axios.get(`${API_BASE_URL}/cultural-sites`, {
    params: { limit: 1000, ...params }
  });
  return response.data.data.culturalSites;
};

// 특정 문화재 정보를 가져오는 함수
export const fetchCulturalSiteById = async (id) => {
  if (!id) throw new Error("Cultural site ID is required.");
  const response = await axios.get(`${API_BASE_URL}/cultural-sites/${id}`);
  return response.data.data.culturalSite;
};

// 특정 문화재의 리뷰 목록을 가져오는 함수
export const fetchReviewsByPlaceId = async (placeId) => {
  if (!placeId) throw new Error("Place ID is required to fetch reviews.");
  const response = await axios.get(`${API_BASE_URL}/cultural-sites/${placeId}/reviews`);
  return response.data.data.reviews;
};

// 리뷰 생성 함수
export const createReview = async (placeId, reviewData) => {
  const response = await axios.post(`${API_BASE_URL}/cultural-sites/${placeId}/reviews`, reviewData, { withCredentials: true });
  return response.data.data.review;
};

// 리뷰 수정 함수
export const updateReview = async (placeId, reviewId, reviewData) => {
  const response = await axios.patch(`${API_BASE_URL}/cultural-sites/${placeId}/reviews/${reviewId}`, reviewData, { withCredentials: true });
  return response.data.data.review;
};

// 리뷰 삭제 함수
export const deleteReview = async (placeId, reviewId) => {
  await axios.delete(`${API_BASE_URL}/cultural-sites/${placeId}/reviews/${reviewId}`, { withCredentials: true });
  return true; // 삭제 성공을 알림
};