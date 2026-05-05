import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addFavorite,
  deleteFavorite,
  fetchMyFavorites,
} from '../../api/favoriteApi';
import { Place } from '../../types/place';
import { AxiosError } from 'axios';
import { ApiResponse } from '../../types/api';

/**
 * My Favorites List Import Hook
 */
export const useMyFavorites = (userId: string | undefined) => {
  return useQuery<Place[], AxiosError<ApiResponse<null>>>({
    queryKey: ['myFavorites', userId],
    queryFn: fetchMyFavorites,
    // Enable query only when userId exists
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

/**
 * Define add/delete favorite action type
 */
interface FavoriteMutationParams {
  actionType: 'add' | 'delete';
  culturalSiteId: string;
}

/**
 * Add/delete favorites Mutation hook
 */
export const useFavoriteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Place[] | boolean,
    AxiosError<ApiResponse<null>>,
    FavoriteMutationParams
  >({
    mutationFn: async ({ actionType, culturalSiteId }) => {
      if (actionType === 'add') {
        return addFavorite(culturalSiteId);
      } else if (actionType === 'delete') {
        return deleteFavorite(culturalSiteId);
      }
      throw new Error('Invalid favorite action type.');
    },
    onSuccess: (_, variables) => {
      // 1. Invalidate my favorites list (update list)
      queryClient.invalidateQueries({ queryKey: ['myFavorites'] });

      // 2. Invalidate detailed information on specific cultural assets (reflects favorite status)
      queryClient.invalidateQueries({
        queryKey: ['culturalSite', variables.culturalSiteId],
      });
    },
    onError: (error) => {
      // If there is a message in the API response, output, otherwise the default message
      const errorMessage =
        error.response?.data?.message || error.message || 'Unknown error';
      console.error('Favorite action fail:', error);
      alert(`Favorite process fail: ${errorMessage}`);
    },
  });
};
