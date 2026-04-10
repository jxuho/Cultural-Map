import axios, { AxiosError } from 'axios';
import { ApiResponse } from '../types/api';
import { Proposal } from '../types/proposal';

const API_BASE_URL = import.meta.env.PROD 
  ? "https://chemnitz-cultural-sites-map.onrender.com/api/v1" 
  : "http://localhost:5000/api/v1";

/**
 * Submit a new proposal
 * @param proposalData - 백엔드 모델의 validation을 통과하기 위한 데이터 구조
 */
export const submitProposal = async (
  proposalData: Partial<Proposal>
): Promise<ApiResponse<{ proposal: Proposal }>> => {
  try {
    const response = await axios.post<ApiResponse<{ proposal: Proposal }>>(
      `${API_BASE_URL}/proposals`, 
      proposalData, 
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    // 백엔드 validator에서 던지는 구체적인 에러 메시지를 우선적으로 반환
    throw err.response?.data?.message || 'Failed to submit proposal';
  }
};

/**
 * 모든 제안서 가져오기 (Admin용)
 */
export const fetchAllProposals = async (): Promise<Proposal[]> => {
  try {
    const response = await axios.get<ApiResponse<{ proposals: Proposal[] }>>(
      `${API_BASE_URL}/proposals/`, 
      { withCredentials: true }
    );
    return response.data.data.proposals || [];
  } catch (error) {
    const err = error as AxiosError;
    console.error("Error fetching all proposals:", err);
    throw err;
  }
};

/**
 * 제안 승인 (Admin 전용)
 * 백엔드 모델 상 status가 'accepted'가 되면 adminComment가 필수입니다.
 */
export const acceptProposal = async (
  proposalId: string, 
  adminComment: string
): Promise<ApiResponse<{ proposal: Proposal }>> => {
  try {
    const response = await axios.patch<ApiResponse<{ proposal: Proposal }>>(
      `${API_BASE_URL}/proposals/${proposalId}/accept`,
      { adminComment },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    throw err.response?.data?.message || 'Failed to accept proposal';
  }
};

/**
 * 제안 거절 (Admin 전용)
 * 백엔드 모델 상 status가 'rejected'가 되면 adminComment가 필수입니다.
 */
export const rejectProposal = async (
  proposalId: string, 
  adminComment: string
): Promise<ApiResponse<{ proposal: Proposal }>> => {
  try {
    const response = await axios.patch<ApiResponse<{ proposal: Proposal }>>(
      `${API_BASE_URL}/proposals/${proposalId}/reject`,
      { adminComment },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    throw err.response?.data?.message || 'Failed to reject proposal';
  }
};

/**
 * 내가 제출한 제안서 목록 조회
 */
export const fetchMyProposals = async (): Promise<Proposal[]> => {
  try {
    const response = await axios.get<ApiResponse<{ proposals: Proposal[] }>>(
      `${API_BASE_URL}/proposals/my-proposals`,
      { withCredentials: true }
    );
    return response.data.data.proposals || [];
  } catch (error) {
    const err = error as AxiosError;
    console.error('Error fetching my proposals:', err);
    throw err;
  }
};