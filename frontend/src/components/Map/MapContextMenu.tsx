import { useEffect } from 'react';
import useUiStore from '../../store/uiStore';
import { Menu, MenuItem } from '../ContextMenu';
import { useNearbyOsm } from '../../hooks/data/useCulturalSitesQueries';
import useAuthStore from '../../store/authStore';

const MapContextMenu = () => {
  const selectedLatLng = useUiStore((state) => state.selectedLatLng);
  const setNearbySites = useUiStore((state) => state.setNearbySites);
  const openSidePanel = useUiStore((state) => state.openSidePanel);
  const setNearbySitesLoading = useUiStore(
    (state) => state.setNearbySitesLoading,
  );
  const setNearbySitesError = useUiStore((state) => state.setNearbySitesError);
  const user = useAuthStore((state) => state.user);

  const {
    data: nearbyOsmData,
    isLoading: isNearbyOsmLoading,
    isError: isNearbyOsmError,
    isSuccess: isNearbyOsmSuccess,
    error: nearbyOsmError,
    refetch: refetchNearbyOsm,
  } = useNearbyOsm(selectedLatLng?.lat, selectedLatLng?.lng, {
    enabled: false,
  });

  // Function to be called when the "Search this area" button is clicked
  const queryThisArea = () => {
    if (selectedLatLng?.lat && selectedLatLng?.lng) {
      openSidePanel({
        _id: 'new',
        name: '',
        category: 'other',
        location: {
          type: 'Point',
          coordinates: [selectedLatLng.lng, selectedLatLng.lat],
        },
      } as any);
      setNearbySitesLoading(true);
      setNearbySitesError(null);
      refetchNearbyOsm(); // Start importing nearby OSM data
    } else {
      console.warn(
        'The surrounding area cannot be searched due to lack of valid latitude and longitude information.',
      );
      setNearbySitesError(
        new Error('There is no valid latitude and longitude information.'),
      );
    }
  };

  // The data, loading, and error status of useNearbyOsm are reflected in the Zustand store.
  useEffect(() => {
    setNearbySitesLoading(isNearbyOsmLoading);
    if (isNearbyOsmSuccess && nearbyOsmData) {
      console.log(nearbyOsmData);
      setNearbySites(nearbyOsmData);
      console.log(
        'Surrounding OSM cultural site data is set in the UI store:',
        nearbyOsmData,
      );
    }
    if (isNearbyOsmError) {
      console.error(
        'Error occurred while retrieving surrounding OSM cultural site:',
        nearbyOsmError,
      );
      setNearbySites([]);
      setNearbySitesError(nearbyOsmError);
    }
  }, [
    isNearbyOsmSuccess,
    nearbyOsmData,
    isNearbyOsmLoading,
    isNearbyOsmError,
    nearbyOsmError,
    setNearbySites,
    setNearbySitesLoading,
    setNearbySitesError,
  ]);

  return (
    <>
      {user && (
        <Menu>
          <MenuItem onClick={queryThisArea}>
            <div className="px-1 mx-1 text-xs">
              {user.role === 'admin' ? 'Add new place' : 'Suggest new place'}
            </div>
          </MenuItem>
        </Menu>
      )}
    </>
  );
};

export default MapContextMenu;
