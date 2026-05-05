import { useMap } from 'react-leaflet';
import { useState } from 'react';
import L, { CircleMarker, LatLngBoundsExpression } from 'leaflet';
import { MdMyLocation } from 'react-icons/md';

const CurrentLocationButton = ({
  maxBounds,
}: {
  maxBounds: LatLngBoundsExpression;
}) => {
  const map = useMap();
  const [locMarker, setLocMarker] = useState<CircleMarker | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLocationOutsideBounds, setIsLocationOutsideBounds] =
    useState<boolean>(false);

  const handleClick = () => {
    if (!navigator.geolocation) {
      alert("Can't use current location function.");
      return;
    }

    setIsLoading(true);
    setIsLocationOutsideBounds(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const currentLatLng = L.latLng(latitude, longitude);

        const bounds = L.latLngBounds(maxBounds as L.LatLngBoundsLiteral);

        if (!bounds.contains(currentLatLng)) {
          setIsLocationOutsideBounds(true);
          alert(
            "Your current location is outside the map's allowed boundaries.",
          );
          setIsLoading(false);
          return;
        }

        map.setView([latitude, longitude], 16);

        if (locMarker) {
          map.removeLayer(locMarker);
        }

        const marker = L.circleMarker([latitude, longitude], {
          radius: 8,
          color: 'red',
        }).addTo(map);
        setLocMarker(marker);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error getting current location:', error);
        alert(
          'Failed to get your location. Please ensure location services are enabled.',
        );
        setIsLoading(false);
      },
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 10000,
      },
    );
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading || isLocationOutsideBounds}
      className="absolute bottom-4 right-4 z-1000 bg-white shadow px-3 py-2 rounded text-sm cursor-pointer flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin h-4 w-4 text-gray-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          Checking Location...
        </>
      ) : isLocationOutsideBounds ? (
        <>
          <MdMyLocation className="text-lg" />
          Out of Bounds
        </>
      ) : (
        <>
          <MdMyLocation className="text-lg" />
          Current Location
        </>
      )}
    </button>
  );
};

export default CurrentLocationButton;
