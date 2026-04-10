import axios, { AxiosError } from "axios";
import { User } from "../types/user";
import { ApiResponse } from "@/types/api";

const API_BASE_URL = import.meta.env.PROD
  ? "https://chemnitz-cultural-sites-map.onrender.com/api/v1"
  : "http://localhost:5000/api/v1";


interface AllUsersResponse {
  status: string;
  results: number;
  data: {
    users: User[];
  };
}

// 사용자 프로필 업데이트 함수
export const updateProfileApi = async (
  updateData: Partial<User>,
): Promise<ApiResponse<User>> => {
  try {
    const response = await axios.patch<ApiResponse<User>>(
      `${API_BASE_URL}/users/updateMe`,
      updateData,
      { withCredentials: true },
    );
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    throw (
      err.response?.data?.message ||
      "Failed to update profile. Please try again."
    );
  }
};

export const deleteMyAccount = async (): Promise<{
  status: string;
  message: string;
}> => {
  try {
    const response = await axios.delete<{ status: string; message: string }>(
      `${API_BASE_URL}/users/deleteMe`,
      { withCredentials: true },
    );
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    throw err.response?.data?.message || "Failed to delete account";
  }
};

export const fetchUserById = async (userId: string): Promise<User | null> => {
  if (!userId) {
    throw new Error("User ID is required to fetch user data.");
  }

  try {
    const response = await axios.get<ApiResponse<User>>(
      `${API_BASE_URL}/users/${userId}`,
      { withCredentials: true },
    );
    return response.data.data.user || null;
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    throw err.response?.data?.message || "Failed to fetch user";
  }
};

export const fetchAllUsers = async (): Promise<User[]> => {
  try {
    const response = await axios.get<AllUsersResponse>(
      `${API_BASE_URL}/users`,
      { withCredentials: true },
    );
    return response.data.data.users;
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    throw err.response?.data?.message || "Failed to fetch users";
  }
};

export const updateUserRoleApi = async (
  userId: string,
  newRole: "user" | "admin",
): Promise<ApiResponse<User>> => {
  try {
    const response = await axios.patch<ApiResponse<User>>(
      `${API_BASE_URL}/users/updateRole/${userId}`,
      { newRole },
      { withCredentials: true },
    );
    return response.data;
  } catch (error) {
    const err = error as AxiosError<{ message: string }>;
    throw err.response?.data?.message || "Failed to update user role.";
  }
};
