import { Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

import useUiStore from '../../store/uiStore';
import { Place } from '@/types/place';

const MapMarkers = ({ places }: { places: Place[] }) => {
  const openSidePanel = useUiStore((state) => state.openSidePanel);
  const handleMarkerClick = (place: Place) => {
    openSidePanel(place);
  };

  return (
    <>
      {places.map((place) => (
        <Marker
          key={place._id}
          position={place.location.coordinates} // [latitude, longitude] location of marker
          eventHandlers={{
            click: () => handleMarkerClick(place),
          }}
        ></Marker>
      ))}
    </>
  );
};

export default MapMarkers;
