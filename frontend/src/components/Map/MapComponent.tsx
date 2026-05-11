import { useRef, useMemo, useEffect, useCallback, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  ZoomControl,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple, LatLngBoundsExpression } from 'leaflet';
import L from 'leaflet';

import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import useFilterStore from '../../store/filterStore.ts';
import useUiStore from '../../store/uiStore';

import {
  useAllCulturalSites,
  useDistrictBoundaries,
  useDistrictStats,
} from '../../hooks/data/useCulturalSitesQueries';
import CurrentLocationButton from './CurrentLocationButton';

import CulturalSiteMarkers from './CulturalSiteMarkers';
import useViewport from '../../hooks/ui/useViewPort';
import DistrictMarkers from './DistrictMarkers';
import { DistrictBoundaryFeature } from '../../api/culturalSitesApi';

import { Place } from '@/types/place.ts';
import { preloadIcons } from '../../utils/iconFactory.tsx';

const DISTRICT_LOD_ZOOM = 12;
const CLUSTER_LOD_ZOOM = 13;
const WARMUP_DELAY_MS = 1200;

const MapEventsHandler = () => {
  const openContextMenu = useUiStore((state) => state.openContextMenu);
  const setSelectedLatLng = useUiStore((state) => state.setSelectedLatLng);
  useMapEvents({
    contextmenu: (e) => {
      console.log(e.latlng);
      e.originalEvent.preventDefault();
      openContextMenu();
      setSelectedLatLng(e.latlng);
    },
  });
  return null;
};

const MapCenterUpdater = () => {
  const map = useMap();
  const jumpToPlace = useUiStore((state) => state.jumpToPlace);
  const clearJumpToPlace = useUiStore((state) => state.clearJumpToPlace);
  const sidePanelWidth = useUiStore((state) => state.sidePanelWidth);
  const isSidePanelOpen = useUiStore((state) => state.isSidePanelOpen);
  const { width: viewportWidth } = useViewport();

  // Move map center based on jumpToPlace
  useEffect(() => {
    if (jumpToPlace) {
      const lat = jumpToPlace.location.coordinates[1];
      const lng = jumpToPlace.location.coordinates[0];
      map.flyTo([lat, lng], 18, {
        animate: true,
        duration: 1.5,
      });

      // Move to the marker, then move to the center considering the sidebar
      if (isSidePanelOpen && sidePanelWidth > 0 && viewportWidth > 450) {
        setTimeout(() => {
          let offsetX = sidePanelWidth / 2 - 20;
          map.panBy([offsetX, 0], { animate: true, duration: 0.5 });
        }, 1700);
      }
      clearJumpToPlace();
    }
  }, [
    jumpToPlace,
    clearJumpToPlace,
    map,
    sidePanelWidth,
    isSidePanelOpen,
    viewportWidth,
  ]);

  return null;
};

const ViewportTracker = ({
  onZoomChanged,
}: {
  onZoomChanged: (zoom: number) => void;
}) => {
  const map = useMap();

  useEffect(() => {
    onZoomChanged(map.getZoom());
  }, [map, onZoomChanged]);

  useMapEvents({
    zoomend: () => {
      onZoomChanged(map.getZoom());
    },
  });

  return null;
};

// MapComponent
const MapComponent = () => {
  const mapRef = useRef(null);
  const [zoomLevel, setZoomLevel] = useState<number>(DISTRICT_LOD_ZOOM);
  const [isWarmupEnabled, setIsWarmupEnabled] = useState(false);
  const [isWarmupCompleted, setIsWarmupCompleted] = useState(false);

  const initialLat = parseFloat(
    import.meta.env.VITE_MAP_INITIAL_LAT || '52.5163',
  );
  const initialLng = parseFloat(
    import.meta.env.VITE_MAP_INITIAL_LNG || '13.3777',
  );
  const initialZoom = parseInt(import.meta.env.VITE_MAP_INITIAL_ZOOM || '12');
  const minZoom = parseInt(import.meta.env.VITE_MAP_MIN_ZOOM || '12');

  const swLat = parseFloat(import.meta.env.VITE_MAP_BOUND_SW_LAT || '52.338');
  const swLng = parseFloat(import.meta.env.VITE_MAP_BOUND_SW_LNG || '13.088');
  const neLat = parseFloat(import.meta.env.VITE_MAP_BOUND_NE_LAT || '52.675');
  const neLng = parseFloat(import.meta.env.VITE_MAP_BOUND_NE_LNG || '13.761');

  const openSidePanel = useUiStore((state) => state.openSidePanel);
  const handleOpenSidePanel = useCallback(
    (site: Place) => {
      openSidePanel(site);
    },
    [openSidePanel],
  );
  const selectedCategories = useFilterStore(
    (state) => state.selectedCategories,
  );
  const selectedPlace = useUiStore((state) => state.selectedPlace);

  const shouldShowCluster = zoomLevel >= CLUSTER_LOD_ZOOM;

  const { data: districtStats = [] } = useDistrictStats(!shouldShowCluster);
  const { data: districtBoundaries, isLoading: isDistrictBoundaryLoading } =
    useDistrictBoundaries(!shouldShowCluster);
  const canStartWarmup =
    !shouldShowCluster && !isDistrictBoundaryLoading && !!districtBoundaries;

  const {
    data: culturalSites = [],
    isLoading,
    isFetching,
    isSuccess,
    isError,
    error,
  } = useAllCulturalSites(shouldShowCluster || isWarmupEnabled);

  const searchQuery = useFilterStore((state) =>
    state.searchQuery.toLowerCase(),
  );

  // Include all information, including address
  const memoizedFilteredSites = useMemo(() => {
    if (selectedCategories.length === 0 && !searchQuery) {
      return culturalSites;
    }

    return culturalSites.filter((site) => {
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(site.category);

      // If the search term is empty, it matches all entries.
      if (!searchQuery) {
        return matchesCategory;
      }

      const lowerCaseSearchQuery = searchQuery.toLowerCase();

      // Compare each field to your search term.
      const matchesSearch =
        site.name?.toLowerCase().includes(lowerCaseSearchQuery) ||
        site.description?.toLowerCase().includes(lowerCaseSearchQuery) ||
        site.category?.toLowerCase().includes(lowerCaseSearchQuery) ||
        (site.address
          ? (
              site.address.fullAddress ||
              `${site.address.street || ''} ${site.address.houseNumber || ''}, ${site.address.postcode || ''} ${site.address.city || ''}`
            )
              .toLowerCase()
              .includes(lowerCaseSearchQuery)
          : false) ||
        site.website?.toLowerCase().includes(lowerCaseSearchQuery) ||
        (site.sourceId &&
          String(site.sourceId).toLowerCase().includes(lowerCaseSearchQuery));

      return matchesCategory && matchesSearch;
    });
  }, [culturalSites, selectedCategories, searchQuery]);

  // 데이터 로드 완료 시 아이콘 사전 생성
  useEffect(() => {
    if (isSuccess && culturalSites.length > 0) {
      // CPU가 비교적 한가한 백그라운드 시점에 무거운 renderToString 작업을 미리 마칩니다.
      preloadIcons();
      setIsWarmupCompleted(true);
    }
  }, [isSuccess, culturalSites.length]);


  useEffect(() => {
    if (!canStartWarmup || isWarmupEnabled || isWarmupCompleted) {
      return;
    }

    const timer = setTimeout(() => {
      setIsWarmupEnabled(true);
    }, WARMUP_DELAY_MS);

    return () => clearTimeout(timer);
  }, [canStartWarmup, isWarmupEnabled, isWarmupCompleted]);

  useEffect(() => {
    if (isSuccess) {
      setIsWarmupCompleted(true);
    }
  }, [isSuccess]);

  const handleZoomChanged = useCallback((zoom: number) => {
    setZoomLevel(zoom);
  }, []);

  const handleDistrictClick = useCallback((feature: DistrictBoundaryFeature) => {
    const map = mapRef.current as unknown as L.Map | null;
    if (!map) {
      return;
    }

    const tempLayer = L.geoJSON(feature as any);
    const featureBounds = tempLayer.getBounds();
    if (featureBounds.isValid()) {
      map.fitBounds(featureBounds, {
        padding: [20, 20],
        maxZoom: CLUSTER_LOD_ZOOM,
        animate: true,
      });
    }
  }, []);

  const shouldShowClusterLoadingOverlay =
    shouldShowCluster &&
    (
      (!isWarmupCompleted && culturalSites.length === 0) ||
      (isLoading && culturalSites.length === 0)
    );
  const shouldShowClusterUpdatingBadge =
    shouldShowCluster && isFetching && culturalSites.length > 0;
  const shouldShowClusterErrorOverlay = shouldShowCluster && isError;

  const initialPosition: LatLngTuple = [initialLat, initialLng];
  const mapMaxBounds: LatLngBoundsExpression = [
    [swLat, swLng],
    [neLat, neLng],
  ];

  return (
    <div className="h-full w-full relative" id="map">
      {shouldShowClusterLoadingOverlay && (
        <div className="absolute inset-0 z-1000 flex items-center justify-center bg-white/75 text-gray-600 pointer-events-none">
          Loading the Map...
        </div>
      )}
      {shouldShowClusterUpdatingBadge && (
        <div className="absolute top-3 right-3 z-1000 rounded-full bg-white/90 px-3 py-1 text-xs text-gray-600 shadow">
          Updating markers...
        </div>
      )}
      {shouldShowClusterErrorOverlay && (
        <div className="absolute top-3 left-1/2 z-1000 -translate-x-1/2 rounded-md bg-red-100 px-3 py-2 text-sm text-red-700 shadow">
          Failed to load map data: {error?.message ?? 'Unknown error'}
        </div>
      )}
      <MapContainer
        center={initialPosition}
        zoom={initialZoom}
        minZoom={minZoom}
        maxBounds={mapMaxBounds}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        // whenCreated={(mapInstance) => {
        //   mapRef.current = mapInstance;
        // }}
        ref={mapRef}
        zoomControl={false}
      >
        <CurrentLocationButton maxBounds={mapMaxBounds} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomleft" />
        <MapEventsHandler />
        <MapCenterUpdater />
        <ViewportTracker onZoomChanged={handleZoomChanged} />

        {!shouldShowCluster && districtBoundaries && !isDistrictBoundaryLoading && (
          <DistrictMarkers
            boundaries={districtBoundaries}
            stats={districtStats}
            onDistrictClick={handleDistrictClick}
          />
        )}

        {shouldShowCluster && (
          <CulturalSiteMarkers
            sites={memoizedFilteredSites}
            openSidePanel={handleOpenSidePanel}
            selectedPlace={selectedPlace}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
