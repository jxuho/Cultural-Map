import { useRef } from "react";
import { MapContainer, TileLayer, Marker, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css"; // Leaflet 기본 CSS

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

// --- 클러스터링 관련 추가/수정 ---
import MarkerClusterGroup from "react-leaflet-markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
// --- 클러스터링 관련 추가/수정 끝 ---

// 필터 스토어 임포트 (선택된 카테고리 가져오기 위함)
import useFilterStore from "../store/filterStore"; // filtersStore.js 파일 경로에 맞게 수정
// ui 스토어 임포트
import useUiStore from "../store/uiStore";

// MapComponent는 이제 culturalSites를 props로 받습니다.
const  MapComponent = ({ culturalSites }) => {

  const mapRef = useRef(null);

  const openSidePanel = useUiStore((state) => state.openSidePanel);
  // Zustand 필터 스토어에서 selectedCategories 가져오기
  const selectedCategories = useFilterStore(
    (state) => state.selectedCategories
  );

  // 선택된 카테고리에 따라 문화유산 지점 필터링
  const filteredSites = culturalSites.filter((site) => {
    // 1. 선택된 카테고리가 없으면 모든 지점 표시
    if (selectedCategories.length === 0) {
      return true;
    }
    // 2. 선택된 카테고리 중 하나라도 지점의 카테고리와 일치하면 표시
    return selectedCategories.includes(site.category);
  });

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
        }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomleft" /> {/* 줌 컨트롤 위치 조정 */}
        {/* --- MarkerClusterGroup 추가 --- */}
        <MarkerClusterGroup
          chunkedLoading // 대량의 마커를 효율적으로 로드 (선택 사항이지만 권장)
          // maxClusterRadius={80} // 클러스터링 반경 조정 (선택 사항)
          // spiderfyOnMaxZoom={true} // 최대 줌에서 스파이더파이 (선택 사항)
        >
          {filteredSites.map(
            (
              culturalSite // <--- 필터링된 filteredSites 사용
            ) => (
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
                {/* 마커 클릭 시 팝업을 표시하려면 여기에 Popup 컴포넌트를 추가할 수 있습니다. */}
                {/* <Popup>{culturalSite.name}</Popup> */}
              </Marker>
            )
          )}
        </MarkerClusterGroup>
        {/* --- MarkerClusterGroup 끝 --- */}
      </MapContainer>
    </div>
  );
}

export default MapComponent;
