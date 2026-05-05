import axiosInstance from './axiosInstance';
import { User } from '../types/user';
import { ApiResponse } from '@/types/api';
import { AxiosError } from 'axios';

// interface for the response of fetching all users (Admin only)
interface AllUsersResponse {
  status: string;
  results: number;
  data: {
    users: User[];
  };
}

/**
 * update user profile information (user only)
 */
export const updateProfileApi = async (
  updateData: Partial<User>,
): Promise<ApiResponse<{ user: User }>> => {
  try {
    const response = await axiosInstance.patch<ApiResponse<{ user: User }>>(
      '/users/updateMe',
      updateData,
    );
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    throw err.response?.data?.message || 'Failed to update profile.';
  }
};

/**
 * delete my account (user only)
 */
export const deleteMyAccount = async (): Promise<{
  status: string;
  message: string;
}> => {
  try {
    const response = await axiosInstance.delete<{
      status: string;
      message: string;
    }>('/users/deleteMe');
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    throw err.response?.data?.message || 'Failed to delete account';
  }
};

/**
 * fetch user information by user ID
 */
export const fetchUserById = async (userId: string): Promise<User | null> => {
  if (!userId) throw new Error('User ID is required.');

  try {
    const response = await axiosInstance.get<ApiResponse<User>>(
      `/users/${userId}`,
    );
    return response.data.data || null;
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    throw err.response?.data?.message || 'Failed to fetch user';
  }
};

/**
 * fetch all users (Admin only)
 */
export const fetchAllUsers = async (): Promise<User[]> => {
  try {
    const response = await axiosInstance.get<AllUsersResponse>('/users');
    return response.data.data.users;
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    throw err.response?.data?.message || 'Failed to fetch users';
  }
};

/**
 * update user role (Admin only)
 */
export const updateUserRoleApi = async (
  userId: string,
  newRole: 'user' | 'admin',
): Promise<ApiResponse<{ user: User }>> => {
  try {
    const response = await axiosInstance.patch<ApiResponse<{ user: User }>>(
      `/users/updateRole/${userId}`,
      { newRole },
    );
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    throw err.response?.data?.message || 'Failed to update user role.';
  }
};
