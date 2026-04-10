import axios, { AxiosError } from 'axios';
import { Place } from '../types/place';
import { ApiResponse } from '../types/api';

const API_BASE_URL = import.meta.env.PROD 
  ? "https://chemnitz-cultural-sites-map.onrender.com/api/v1" 
  : "http://localhost:5000/api/v1";

/**
 * Add a cultural site to favorites
 */
export const addFavorite = async (culturalSiteId: string): Promise<Place[]> => {
  if (!culturalSiteId) {
    throw new Error("Cultural site ID is required to add to favorites.");
  }
  
  try {
    const response = await axios.post<ApiResponse<{ favoriteSites: Place[] }>>(
      `${API_BASE_URL}/users/me/favorites/${culturalSiteId}`, 
      {}, 
      { withCredentials: true }
    );
    // Return the updated list of favorite sites
    return response.data.data.favoriteSites || [];
  } catch (error) {
    const err = error as AxiosError;
    console.error("Error adding favorite:", err);
    throw err;
  }
};

/**
 * Fetch all favorite cultural sites for the current user
 */
export const fetchMyFavorites = async (): Promise<Place[]> => {
  try {
    const response = await axios.get<ApiResponse<{ favoriteSites: Place[] }>>(
      `${API_BASE_URL}/users/me/favorites`, 
      { withCredentials: true }
    );
    return response.data.data.favoriteSites || [];
  } catch (error) {
    const err = error as AxiosError;
    console.error("Error fetching my favorites:", err);
    throw err;
  }
};

/**
 * Delete a cultural site from favorites
 */
export const deleteFavorite = async (culturalSiteId: string): Promise<boolean> => {
  if (!culturalSiteId) {
    throw new Error("Cultural site ID is required to delete from favorites.");
  }
  
  try {
    await axios.delete(
      `${API_BASE_URL}/users/me/favorites/${culturalSiteId}`, 
      { withCredentials: true }
    );
    return true; // Return true on successful deletion
  } catch (error) {
    const err = error as AxiosError;
    console.error("Error deleting favorite:", err);
    throw err;
  }
};