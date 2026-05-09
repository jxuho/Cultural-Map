import { useRef, useMemo, useEffect, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  ZoomControl,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngTuple, LatLngBoundsExpression } from 'leaflet';

import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import useFilterStore from '../../store/filterStore.ts';
import useUiStore from '../../store/uiStore';

import { useAllCulturalSites } from '../../hooks/data/useCulturalSitesQueries';
import CurrentLocationButton from './CurrentLocationButton';

import CulturalSiteMarkers from './CulturalSiteMarkers';
import useViewport from '../../hooks/ui/useViewPort';

import { Place } from '@/types/place.ts';

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

// MapComponent
const MapComponent = () => {
  const mapRef = useRef(null);

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

  const {
    data: culturalSites = [],
    isLoading,
    isError,
    error,
  } = useAllCulturalSites();

  const searchQuery = useFilterStore((state) =>
    state.searchQuery.toLowerCase(),
  );

  // Include all information, including address
  const memoizedFilteredSites = useMemo(() => {
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

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center text-gray-600">
        Loading the Map...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="h-full w-full flex items-center justify-center text-red-600">
        Failed to load map data: {error.message}
      </div>
    );
  }

  const initialPosition: LatLngTuple = [initialLat, initialLng];
  const mapMaxBounds: LatLngBoundsExpression = [
    [swLat, swLng],
    [neLat, neLng],
  ];

  return (
    <div className="h-full w-full relative" id="map">
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
        <CulturalSiteMarkers
          sites={memoizedFilteredSites}
          openSidePanel={handleOpenSidePanel}
          selectedPlace={selectedPlace}
        />
      </MapContainer>
    </div>
  );
};

export default MapComponent;
