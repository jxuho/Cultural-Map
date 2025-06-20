import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css"; // Leaflet 기본 CSS
import axios from "axios"; // API 호출 라이브러리

// Leaflet 마커 아이콘 깨짐 방지
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconRetina from "leaflet/dist/images/marker-icon-2x.png";
import shadow from "leaflet/dist/images/marker-shadow.png";
import SidePanel from "./SidePanel";

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

function MapComponent() {
  const [culturalSites, setCulturalSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 컴포넌트 마운트 시 API에서 데이터 가져오기
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        // 백엔드 API 엔드포인트에 맞게 URL 수정
        const response = await axios.get(
          "http://localhost:5000/api/v1/cultural-sites"
        );
        const culturalSitesArray = response.data.data.culturalSites;
        console.log(typeof culturalSitesArray);
        console.log(culturalSitesArray);
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
  }, []);

  if (loading) return <div>Loading map data...</div>;
  if (error) return <div>Error: {error}</div>;

  // 지도의 초기 중심 좌표 (예: Chemnitz)
  const initialPosition = [50.8303, 12.91895]; // Lat, Lng

  return (
    <div className="h-full">
      <MapContainer
        center={initialPosition}
        zoom={14}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {culturalSites.map((culturalSite) => (
          <Marker
            key={culturalSite._id}
            position={[
              culturalSite.location.coordinates[1],
              culturalSite.location.coordinates[0],
            ]}
          >
            <Popup>
              <h3>{culturalSite.name || "Unnamed culturalSite"}</h3>
              <p>Category: {culturalSite.category}</p>
              {culturalSite.address && <p>Address: {culturalSite.address}</p>}
              {culturalSite.openingHours && <p>Opening Hours: {culturalSite.openingHours}</p>}
              {culturalSite.description && <p>Description: {culturalSite.description}</p>}
              {culturalSite.website && <a href={culturalSite.website} target="_blank">Go to website</a>}
              <p>See the reviews</p>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <SidePanel/>
    </div>
  );
}

export default MapComponent;
