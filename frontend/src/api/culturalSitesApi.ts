import axios, { AxiosError } from 'axios';
import { Place } from '../types/place';
import { ApiResponse } from '@/types/api';

const API_BASE_URL = import.meta.env.PROD 
  ? "https://chemnitz-cultural-sites-map.onrender.com/api/v1" 
  : "http://localhost:5000/api/v1";


// 1. 모든 문화재 정보를 가져오는 함수
export const fetchAllCulturalSites = async (params: Record<string, any> = {}): Promise<Place[]> => {
  try {
    const response = await axios.get<ApiResponse<{ culturalSites: Place[] }>>(
      `${API_BASE_URL}/cultural-sites`, 
      { params: { limit: 1000, ...params } }
    );
    return response.data.data.culturalSites || [];
  } catch (error) {
    const err = error as AxiosError;
    console.error("Error fetching all cultural sites:", err);
    throw err;
  }
};

// 2. 특정 문화재 정보를 가져오는 함수
export const fetchCulturalSiteById = async (id: string): Promise<Place | null> => {
  if (!id) {
    const error = new Error("Cultural site ID is required.");
    console.error(error.message);
    throw error;
  }
  try {
    const response = await axios.get<ApiResponse<{ culturalSite: Place }>>(
      `${API_BASE_URL}/cultural-sites/${id}`
    );
    return response.data.data.culturalSite || null;
  } catch (error) {
    const err = error as AxiosError;
    console.error(`Error fetching cultural site by ID ${id}:`, err);
    throw err;
  }
};

// 3. 주변 OSM 장소 가져오기
export const getNearbyOsm = async (lat: number, lon: number): Promise<Place[]> => {
  if (!lat || !lon) {
    const error = new Error("Latitude and Longitude are required to fetch nearby OSM sites.");
    console.error(error.message);
    throw error;
  }
  try {
    const response = await axios.get<ApiResponse<{ osmCulturalSites: Place[] }>>(
      `${API_BASE_URL}/cultural-sites/nearby-osm`, 
      { 
        params: { lat, lon, noReverseGeocode: 'true' },
        withCredentials: true 
      }
    );
    return response.data.data.osmCulturalSites || [];
  } catch (error) {
    const err = error as AxiosError;
    console.error(`Error fetching nearby OSM sites for lat: ${lat}, lon: ${lon}:`, err);
    throw err;
  }
};

// 4. Site 즉시 생성 (Admin)
export const createCulturalSite = async (siteData: Partial<Place>): Promise<Place> => {
  const response = await axios.post<ApiResponse<{ culturalSite: Place }>>(
    `${API_BASE_URL}/cultural-sites`, 
    siteData, 
    { withCredentials: true }
  );
  return response.data.data.culturalSite;
};

// 5. 특정 문화재 정보 업데이트 (Admin)
export const updateCulturalSite = async (culturalSiteId: string, updateData: Partial<Place>): Promise<Place | null> => {
  if (!culturalSiteId || !updateData) {
    throw new Error("Cultural site ID and update data are required.");
  }
  try {
    const response = await axios.put<ApiResponse<{ culturalSite: Place }>>(
      `${API_BASE_URL}/cultural-sites/${culturalSiteId}`, 
      updateData, 
      { withCredentials: true }
    );
    return response.data.data.culturalSite || null;
  } catch (error) {
    const err = error as AxiosError;
    console.error(`Error updating cultural site ${culturalSiteId}:`, err);
    throw err;
  }
};

// 6. 특정 문화재 삭제 (Admin)
export const deleteCulturalSite = async (culturalSiteId: string): Promise<boolean> => {
  if (!culturalSiteId) {
    throw new Error("Cultural site ID is required.");
  }
  try {
    await axios.delete(
      `${API_BASE_URL}/cultural-sites/${culturalSiteId}`, 
      { withCredentials: true }
    );
    return true; 
  } catch (error) {
    const err = error as AxiosError;
    console.error(`Error deleting cultural site ${culturalSiteId}:`, err);
    throw err;
  }
};