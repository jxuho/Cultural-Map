import { useEffect, useState, useRef, useCallback } from "react"; // useCallback 추가
import { MapContainer, TileLayer, Marker, ZoomControl, useMapEvents } from "react-leaflet"; // useMapEvents 추가
import "leaflet/dist/leaflet.css";
import axios from "axios";

// Leaflet 마커 아이콘 깨짐 방지 (기존 코드 유지)
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import shadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconRetinaUrl: iconRetina,
  iconUrl: icon,
  shadowUrl: shadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

import MarkerClusterGroup from 'react-leaflet-markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

import useSidePanelStore from "../store/sidePanelStore";

// 맵 이벤트 핸들러를 위한 별도 컴포넌트
function MapEventHandler({ onViewportChange }) {
  const map = useMapEvents({
    moveend: () => {
      // 맵 이동 또는 줌 변경이 끝났을 때
      const bounds = map.getBounds();
      onViewportChange(bounds);
    },
    // 초기 로드 시에도 데이터 불러오도록 설정
    load: () => {
      const bounds = map.getBounds();
      onViewportChange(bounds);
    }
  });
  return null;
}

function MapComponent() {
  const [culturalSites, setCulturalSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const [currentBounds, setCurrentBounds] = useState(null); // 현재 맵 뷰포트 경계를 저장

  const openSidePanel = useSidePanelStore((state) => state.openSidePanel);

  // 뷰포트 변경 시 호출될 콜백 함수
  const handleViewportChange = useCallback((bounds) => {
    // Leaflet bounds 객체에서 좌표 추출 (southWest.lng, southWest.lat, northEast.lng, northEast.lat)
    const newBounds = `${bounds.getSouthWest().lng},${bounds.getSouthWest().lat},${bounds.getNorthEast().lng},${bounds.getNorthEast().lat}`;
    setCurrentBounds(newBounds);
  }, []);

  useEffect(() => {
    const fetchLocations = async () => {
      if (!currentBounds) { // 뷰포트 경계가 설정되기 전에는 요청하지 않음
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(
          `http://localhost:5000/api/v1/cultural-sites?bounds=${currentBounds}` // bounds 쿼리 파라미터 추가
        );
        const culturalSitesArray = response.data.data.culturalSites;
        setCulturalSites(culturalSitesArray);
      } catch (err) {
        setError(
          "Failed to fetch locations. Please check your backend server."
        );
        console.error("Error fetching locations:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLocations();
  }, [currentBounds]); // currentBounds가 변경될 때마다 데이터를 다시 불러옴

  if (loading && culturalSites.length === 0)
    return (
      <div className="flex justify-center items-center h-full text-lg">
        Loading map data...
      </div>
    );
  if (error)
    return (
      <div className="flex justify-center items-center h-full text-lg text-red-500">
        Error: {error}
      </div>
    );

  const initialPosition = [50.8303, 12.91895]; // Chemnitz Lat, Lng

  return (
    <div className="h-full w-full">
      <MapContainer
        center={initialPosition}
        zoom={14}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        whenCreated={(mapInstance) => {
          mapRef.current = mapInstance;
          // 초기 맵 로드 시에도 경계를 설정하여 데이터 로드 트리거
          handleViewportChange(mapInstance.getBounds());
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />

        {/* 맵 이벤트 핸들러 컴포넌트 추가 */}
        <MapEventHandler onViewportChange={handleViewportChange} />

        <MarkerClusterGroup
          chunkedLoading
        >
          {culturalSites.map((culturalSite) => (
            <Marker
              key={culturalSite._id}
              position={[
                culturalSite.location.coordinates[1], // 위도 (latitude)
                culturalSite.location.coordinates[0], // 경도 (longitude)
              ]}
              eventHandlers={{
                click: () => openSidePanel(culturalSite),
              }}
            >
              {/* <Popup>{culturalSite.name}</Popup> */}
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}

export default MapComponent;