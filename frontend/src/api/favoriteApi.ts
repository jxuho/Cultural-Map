import apiClient from './axiosInstance';
import { AxiosError } from 'axios';
import { Place } from '../types/place';
import { ApiResponse } from '../types/api';

/**
 * Add a cultural site to favorites
 */
export const addFavorite = async (culturalSiteId: string): Promise<Place[]> => {
  if (!culturalSiteId) {
    throw new Error('Cultural site ID is required to add to favorites.');
  }

  try {
    const response = await apiClient.post<
      ApiResponse<{ favoriteSites: Place[] }>
    >(`/users/me/favorites/${culturalSiteId}`);
    return response.data.data.favoriteSites || [];
  } catch (error) {
    const err = error as AxiosError;
    console.error('Error adding favorite:', err);
    throw err;
  }
};

/**
 * Fetch all favorite cultural sites for the current user
 */
export const fetchMyFavorites = async (): Promise<Place[]> => {
  try {
    const response = await apiClient.get<
      ApiResponse<{ favoriteSites: Place[] }>
    >('/users/me/favorites');
    return response.data.data.favoriteSites || [];
  } catch (error) {
    const err = error as AxiosError;
    console.error('Error fetching my favorites:', err);
    throw err;
  }
};

/**
 * Delete a cultural site from favorites
 */
export const deleteFavorite = async (
  culturalSiteId: string,
): Promise<boolean> => {
  if (!culturalSiteId) {
    throw new Error('Cultural site ID is required to delete from favorites.');
  }

  try {
    await apiClient.delete(`/users/me/favorites/${culturalSiteId}`);
    return true;
  } catch (error) {
    const err = error as AxiosError;
    console.error('Error deleting favorite:', err);
    throw err;
  }
};
