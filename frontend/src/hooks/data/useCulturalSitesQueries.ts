import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import {
  fetchAllCulturalSites,
  fetchCulturalSiteById,
  getNearbyOsm,
  createCulturalSite,
  deleteCulturalSite,
  updateCulturalSite,
  fetchDistrictStats,
} from '../../api/culturalSitesApi';
import { DistrictStat, Place } from '../../types/place';
import axios, { AxiosError } from 'axios';
import { ApiResponse } from '@/types/api';

// define a common error type for API responses
type ApiError = AxiosError<ApiResponse<null>>;

/**
 * fetch all cultural sites with optional query parameters (e.g., pagination, filters)
 */
export const useAllCulturalSites = (enabled: boolean = true, params?: Record<string, any>) => {
  return useQuery<Place[], Error>({
    queryKey: ['culturalSites', params],
    queryFn: () => fetchAllCulturalSites(params), // API 호출 함수
    enabled, // 여기서 boolean 값을 사용
    staleTime: 1000 * 60 * 5,
  });
};

/**
 * fetch a specific cultural site by ID
 */
export const useCulturalSiteDetail = (id: string | undefined | null) => {
  return useQuery<Place | null, ApiError>({
    queryKey: ['culturalSite', id],
    queryFn: () => fetchCulturalSiteById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 1,
  });
};

/**
 * get nearby OSM cultural sites based on latitude and longitude
 */
export const useNearbyOsm = (
  lat: number | null | undefined,
  lon: number | null | undefined,
  options?: Partial<UseQueryOptions<Place[], ApiError>>,
) => {
  const queryResult = useQuery<Place[], ApiError>({
    queryKey: ['nearbyOsm', lat, lon],
    queryFn: () => getNearbyOsm(lat!, lon!),
    enabled: false,
    staleTime: 1000 * 60 * 10,
    ...options,
  });

  return queryResult;
};

/**
 * create a new cultural site (Admin)
 */
export const useCreateCulturalSite = () => {
  const queryClient = useQueryClient();
  return useMutation<Place, ApiError, Partial<Place>>({
    mutationFn: createCulturalSite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['culturalSites'] });
    },
    onError: (error) => {
      console.error('Failed to create cultural site:', error);
      throw error;
    },
  });
};

/**
 * update an existing cultural site (Admin)
 */
interface UpdateMutationParams {
  culturalSiteId: string;
  updateData: Partial<Place>;
}

export const useUpdateCulturalSite = () => {
  const queryClient = useQueryClient();
  return useMutation<Place | null, ApiError, UpdateMutationParams>({
    mutationFn: ({ culturalSiteId, updateData }) =>
      updateCulturalSite(culturalSiteId, updateData),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['culturalSite', variables.culturalSiteId],
      });
      queryClient.invalidateQueries({ queryKey: ['culturalSites'] });
      console.log(`Cultural site ${variables.culturalSiteId} update success!`);
    },
    onError: (error, variables) => {
      const msg =
        error.response?.data?.message || error.message || 'Unknown error';
      console.error(
        `Cultural site ${variables.culturalSiteId} update fail:`,
        error,
      );
      alert(`Cultural site update fail: ${msg}`);
    },
  });
};

/**
 * delete a cultural site (Admin)
 */
export const useDeleteCulturalSite = () => {
  const queryClient = useQueryClient();
  return useMutation<boolean, ApiError, string>({
    mutationFn: (culturalSiteId: string) => deleteCulturalSite(culturalSiteId),
    onSuccess: (_, culturalSiteId) => {
      queryClient.invalidateQueries({
        queryKey: ['culturalSite', culturalSiteId],
      });
      queryClient.invalidateQueries({ queryKey: ['culturalSites'] });
      console.log(`Cultural site ${culturalSiteId} is deleted!`);
    },
    onError: (error, culturalSiteId) => {
      const msg =
        error.response?.data?.message || error.message || 'Unknown error';
      console.error(`Failed to delete cultural site ${culturalSiteId}:`, error);
      alert(`Failed to delete cultural site: ${msg}`);
    },
  });
};


// // hooks/data/useCulturalSitesQueries.ts 에 추가
// export const useDistrictStats = (enabled: boolean) => {
//   return useQuery({
//     queryKey: ['districtStats'],
//     queryFn: () => axios.get('/api/v1/cultural-sites/stats/districts').then(res => res.data.data),
//     enabled
//   });
// };

export const useDistrictStats = (enabled: boolean = true) => {
  return useQuery<DistrictStat[], Error>({
    queryKey: ['districtStats'],
    queryFn: async () => {
      // 1. 먼저 API에서 데이터를 가져옵니다 (Record<string, number> 형태라고 가정)
      const data: Record<string, number> = await fetchDistrictStats();
      
      // 2. 객체 { "Mitte": 100 } 를 배열 [{ _id: "Mitte", count: 100 }] 로 변환합니다.
      return Object.entries(data).map(([districtName, count]) => ({
        _id: districtName,
        count: count
      }));
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  });
};

// export const useDistrictStats = (enabled: boolean) => {
//   return useQuery({
//     queryKey: ['districtStats'],
//     queryFn: fetchDistrictStats,
//     enabled,
//   });
// };