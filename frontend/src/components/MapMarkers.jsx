// src/components/MapMarkers.jsx
import { Marker } from "react-leaflet"; // Marker만 임포트
import "leaflet/dist/leaflet.css"; // Leaflet 기본 스타일

// Leaflet 기본 아이콘 깨짐 방지 (필요한 경우, 이 코드는 일반적으로 한 번만 실행되면 됩니다)
import L from "leaflet";
// Leaflet의 기본 아이콘 URL이 CDN 기반이라 깨질 수 있으므로, 로컬 또는 다른 안정적인 CDN으로 대체
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// 전역 스토어 임포트
import useUiStore from "../store/uiStore";

/**
 * 지도에 개별 마커들을 렌더링하는 컴포넌트입니다.
 * 각 마커 클릭 시 사이드 패널을 열고 해당 장소 정보를 표시합니다.
 */
const MapMarkers = ({ places }) => {
  // Zustand 스토어에서 openSidePanel 액션을 가져옵니다.
  const openSidePanel = useUiStore((state) => state.openSidePanel);

  // 마커 클릭 시 호출될 핸들러 함수
  const handleMarkerClick = (place) => {
    // 선택된 장소 정보를 스토어에 저장하고 사이드 패널을 엽니다.
    openSidePanel(place);
  };

  return (
    <>
      {places.map((place) => (
        <Marker
          key={place.id} // 각 마커는 고유한 key prop을 가져야 합니다.
          position={place.position} // 마커의 [위도, 경도] 위치
          eventHandlers={{
            click: () => handleMarkerClick(place),
          }}
        ></Marker>
      ))}
    </>
  );
};

export default MapMarkers;
