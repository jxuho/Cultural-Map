import L from 'leaflet';
import { Marker, Tooltip, useMap } from 'react-leaflet';

// 1. 베를린 12개 구의 중심 좌표 데이터 (LOD 12-13용)
// 이 좌표들은 각 구의 기하학적 중심점입니다.
const DISTRICT_CENTERS: Record<string, [number, number]> = {
  "Mitte": [52.5200, 13.3700],
  "Pankow": [52.5900, 13.4300],
  "Tempelhof-Schöneberg": [52.4600, 13.3800],
  "Charlottenburg-Wilmersdorf": [52.5000, 13.2800],
  "Friedrichshain-Kreuzberg": [52.5000, 13.4400],
  "Neukölln": [52.4500, 13.4400],
  "Reinickendorf": [52.5900, 13.3000],
  "Steglitz-Zehlendorf": [52.4300, 13.2500],
  "Spandau": [52.5300, 13.1700],
  "Lichtenberg": [52.5300, 13.5000],
  "Marzahn-Hellersdorf": [52.5300, 13.5900],
  "Treptow-Köpenick": [52.4200, 13.5800]
};

interface DistrictStat {
  _id: string; // 구 이름
  count: number; // 해당 구의 문화유산 개수
}

interface DistrictMarkersProps {
  stats: DistrictStat[];
  onDistrictClick: (lat: number, lng: number) => void;
}

const DistrictMarkers = ({ stats, onDistrictClick }: DistrictMarkersProps) => {
  const map = useMap();

  return (
    <>
      {stats.map((stat) => {
        const position = DISTRICT_CENTERS[stat._id];
        
        // 좌표 데이터가 없는 경우 렌더링하지 않음
        if (!position) return null;

        // 2. 커스텀 마커 아이콘 생성 (Tailwind CSS 활용)
        const customIcon = L.divIcon({
          className: 'custom-district-marker',
          html: `
            <div class="flex flex-col items-center justify-center bg-blue-600 border-2 border-white text-white rounded-full shadow-xl hover:bg-blue-700 transition-colors cursor-pointer" 
                 style="width: 70px; height: 70px;">
              <span class="text-[10px] font-medium leading-none opacity-90">${stat._id}</span>
              <span class="text-lg font-bold leading-tight">${stat.count.toLocaleString()}</span>
            </div>
          `,
          iconSize: [70, 70],
          iconAnchor: [35, 35], // 아이콘의 중심이 좌표에 오도록 설정
        });

        return (
          <Marker
            key={stat._id}
            position={position}
            icon={customIcon}
            eventHandlers={{
              click: () => {
                // 클릭 시 해당 구의 좌표로 이동하며 줌인
                onDistrictClick(position[0], position[1]);
              },
            }}
          >
            {/* 마우스 호버 시 이름을 한 번 더 강조 */}
            <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent>
              <span className="text-sm font-semibold">{stat._id}</span>
            </Tooltip>
          </Marker>
        );
      })}
    </>
  );
};

export default DistrictMarkers;