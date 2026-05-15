import { useMap } from 'react-leaflet';
import { useState } from 'react';
import L, { CircleMarker, LatLngBoundsExpression } from 'leaflet';
import { Crosshair, Loader2, MapPinOff } from 'lucide-react';

const CurrentLocationButton = ({
  maxBounds,
}: {
  maxBounds: LatLngBoundsExpression;
}) => {
  const map = useMap();
  const [locMarker, setLocMarker] = useState<CircleMarker | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLocationOutsideBounds, setIsLocationOutsideBounds] = useState<boolean>(false);

  const handleClick = () => {
    if (!navigator.geolocation) return;

    setIsLoading(true);
    setIsLocationOutsideBounds(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const currentLatLng = L.latLng(latitude, longitude);
        const bounds = L.latLngBounds(maxBounds as L.LatLngBoundsLiteral);

        if (!bounds.contains(currentLatLng)) {
          setIsLocationOutsideBounds(true);
          setIsLoading(false);
          return;
        }

        map.setView([latitude, longitude], 16);
        if (locMarker) map.removeLayer(locMarker);

        const marker = L.circleMarker([latitude, longitude], {
          radius: 7,
          color: '#000',
          weight: 2,
          fillColor: '#facc15',
          fillOpacity: 1,
        }).addTo(map);
        
        setLocMarker(marker);
        setIsLoading(false);
      },
      () => setIsLoading(false),
      { timeout: 5000 }
    );
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        absolute bottom-6 right-6 z-[1000]
        flex items-center gap-2 px-3 py-2
        bg-white border-2 border-black
        transition-all duration-75
        ${isLocationOutsideBounds ? 'bg-red-50' : 'hover:bg-yellow-400'}
        shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
        active:shadow-none active:translate-x-[2px] active:translate-y-[2px]
        disabled:opacity-50 cursor-pointer
      `}
    >
      <div className="flex items-center justify-center">
        {isLoading ? (
          <Loader2 size={16} className="animate-spin text-black" />
        ) : isLocationOutsideBounds ? (
          <MapPinOff size={16} className="text-red-600" />
        ) : (
          <Crosshair size={16} className="text-black" />
        )}
      </div>

      <span className="text-[10px] font-black uppercase tracking-tighter leading-none">
        {isLoading ? 'SYNC' : isLocationOutsideBounds ? 'OUT' : 'Location'}
      </span>

      {/* 상태 표시용 작은 점 */}
      {!isLoading && !isLocationOutsideBounds && (
        <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse ml-0.5"></div>
      )}
    </button>
  );
};

export default CurrentLocationButton;