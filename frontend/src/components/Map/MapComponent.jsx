import React, { useRef, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Marker, // Marker는 이제 selectedPlace를 위한 별도 렌더링에 사용하지 않습니다.
  ZoomControl,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";

import L from "leaflet";

import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import useFilterStore from "../../store/filterStore";
import useUiStore from "../../store/uiStore";

import { useAllCulturalSites } from "../../hooks/useCulturalSitesQueries";
import CurrentLocationButton from "./CurrentLocationButton";

// ReactDOMServer와 FaMapMarkerAlt는 이제 MapComponent에서 필요 없습니다.
// import ReactDOMServer from 'react-dom/server';
// import { FaMapMarkerAlt } from 'react-icons/fa';

import CulturalSiteMarkers from './CulturalSiteMarkers';

// MapEventsHandler 컴포넌트 (동일)
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

// Selected Place를 위한 별도의 빨간색 마커 아이콘 생성 함수는 더 이상 필요 없습니다.
// const createSelectedPlaceIcon = () => { /* ... */ };


// MapComponent
const MapComponent = () => {
    const mapRef = useRef(null);

    const openSidePanel = useUiStore((state) => state.openSidePanel);
    const selectedCategories = useFilterStore(
        (state) => state.selectedCategories
    );
    const selectedPlace = useUiStore((state) => state.selectedPlace); // selectedPlace는 여전히 필요합니다.

    const {
        data: culturalSites = [],
        isLoading,
        isError,
        error,
    } = useAllCulturalSites();

    console.log("MapComponent 재렌더링됨");

    const memoizedFilteredSites = useMemo(() => {
        console.log("filteredSites 재계산됨");
        return culturalSites.filter((site) => {
            if (selectedCategories.length === 0) {
                return true;
            }
            return selectedCategories.includes(site.category);
        });
    }, [culturalSites, selectedCategories]);

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

    const initialPosition = [50.8303, 12.91895]; // Chemnitz Lat, Lng

    return (
        <div className="h-full w-full relative">
            <MapContainer
                center={initialPosition}
                zoom={14}
                minZoom={13}
                maxBounds={[
                    [50.7, 12.7],
                    [50.95, 13.1],
                ]}
                maxBoundsViscosity={1.0}
                scrollWheelZoom={true}
                className="h-full w-full z-0"
                whenCreated={(mapInstance) => {
                    mapRef.current = mapInstance;
                }}
                zoomControl={false}
            >
                <CurrentLocationButton />
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ZoomControl position="bottomleft" />
                <MapEventsHandler />

                {/* CulturalSiteMarkers에 selectedPlace를 prop으로 전달 */}
                <CulturalSiteMarkers
                    sites={memoizedFilteredSites}
                    openSidePanel={openSidePanel}
                    selectedPlace={selectedPlace} // 이 부분 추가
                />

                {/* selectedPlace가 있을 경우 빨간색 마커 렌더링 부분 제거 */}
                {/* {selectedPlace && (
                    <Marker
                        position={[
                            selectedPlace.location.coordinates[1],
                            selectedPlace.location.coordinates[0],
                        ]}
                        icon={createSelectedPlaceIcon()}
                        zIndexOffset={1000}
                        eventHandlers={{
                            click: () => openSidePanel(selectedPlace),
                        }}
                    />
                )} */}
            </MapContainer>
        </div>
    );
};

export default MapComponent;






// import { useRef } from "react";
// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   ZoomControl,
//   useMapEvents,
// } from "react-leaflet";
// import "leaflet/dist/leaflet.css";

// // Leaflet 마커 아이콘 깨짐 방지 (기존 코드 유지)
// import L from "leaflet";

// // --- 클러스터링 관련 추가/수정 ---
// import MarkerClusterGroup from "react-leaflet-markercluster";
// import "leaflet.markercluster/dist/MarkerCluster.css";
// import "leaflet.markercluster/dist/MarkerCluster.Default.css";
// // --- 클러스터링 관련 추가/수정 끝 ---

// // 필터 스토어 임포트
// import useFilterStore from "../../store/filterStore";
// // ui 스토어 임포트
// import useUiStore from "../../store/uiStore";

// // TanStack Query 훅 임포트
// import { useAllCulturalSites } from "../../hooks/useCulturalSitesQueries";
// import CurrentLocationButton from "./CurrentLocationButton";

// // NEW: ReactDOMServer 임포트
// import ReactDOMServer from 'react-dom/server';
// // NEW: React Icons 임포트 (예시로 몇 가지만 가져왔습니다. 필요한 아이콘을 추가하세요.)
// import { FaLandmark, FaPalette, FaBuilding, FaUtensils, FaTheaterMasks, FaUsers, FaBook, FaFilm, FaQuestionCircle, FaMapMarkerAlt } from 'react-icons/fa';


// // MapEventsHandler 컴포넌트
// const MapEventsHandler = () => {
//   const openContextMenu = useUiStore((state) => state.openContextMenu);
//   const setSelectedLatLng = useUiStore((state) => state.setSelectedLatLng);
//   useMapEvents({
//     contextmenu: (e) => {
//       console.log(e.latlng);
//       e.originalEvent.preventDefault();
//       openContextMenu();
//       setSelectedLatLng(e.latlng);
//     },
//   });
//   return null;
// };

// // 카테고리별 React Icons 및 DivIcon 생성 함수 ---
// // 각 카테고리에 맞는 React Icon 컴포넌트 매핑
// const categoryIconComponents = {
//   artwork: <FaPalette />,
//   gallery: <FaBuilding />,
//   museum: <FaLandmark />,
//   restaurant: <FaUtensils />,
//   theatre: <FaTheaterMasks />,
//   arts_centre: <FaUsers />, // 예시로 다른 아이콘 사용
//   community_centre: <FaUsers />,
//   library: <FaBook />,
//   cinema: <FaFilm />,
//   other: <FaQuestionCircle />, // 기본 아이콘
// };

// // L.divIcon을 생성하는 헬퍼 함수
// const createCustomIcon = (category) => {
//   const IconComponent = categoryIconComponents[category] || categoryIconComponents.other;

//   // React Icon을 HTML 문자열로 변환
//   const iconHtml = ReactDOMServer.renderToString(
//     <div style={{
//         backgroundColor: 'white', // 배경색
//         borderRadius: '50%',     // 원형 마커
//         width: '30px',           // 크기
//         height: '30px',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         boxShadow: '0 2px 5px rgba(0,0,0,0.3)', // 그림자
//         fontSize: '18px',        // 아이콘 크기
//         color: '#333',           // 아이콘 색상
//         border: '2px solid #333' // 테두리
//     }}>
//       {IconComponent}
//     </div>
//   );

//   return L.divIcon({
//     html: iconHtml,
//     className: 'custom-div-icon', // 필요시 추가 CSS 클래스
//     iconSize: [30, 30], // div의 크기와 동일하게 설정
//     iconAnchor: [15, 15], // div의 중심을 마커의 앵커로 설정
//   });
// };

// // Selected Place를 위한 빨간색 마커 아이콘 생성 함수
// const createSelectedPlaceIcon = () => {
//   const iconHtml = ReactDOMServer.renderToString(
//     <div style={{
//         backgroundColor: 'red', // 빨간색 배경
//         borderRadius: '50%',     // 원형 마커
//         width: '35px',           // 살짝 크게
//         height: '35px',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         boxShadow: '0 2px 8px rgba(255,0,0,0.5)', // 더 강한 그림자
//         fontSize: '22px',        // 더 큰 아이콘
//         color: 'white',           // 흰색 아이콘
//     }}>
//       <FaMapMarkerAlt /> {/* 지도 마커 아이콘 사용 */}
//     </div>
//   );

//   return L.divIcon({
//     html: iconHtml,
//     className: 'selected-place-icon', // 새로운 CSS 클래스
//     iconSize: [40, 40], // div의 크기와 동일하게 설정
//     iconAnchor: [18, 16], // 마커의 바닥 중앙을 앵커로 설정 (핀 모양 마커에 적합)
//   });
// };


// // MapComponent
// const MapComponent = () => {
//   const mapRef = useRef(null);

//   const openSidePanel = useUiStore((state) => state.openSidePanel);
//   const selectedCategories = useFilterStore(
//     (state) => state.selectedCategories
//   );
//   // NEW: uiStore에서 selectedPlace 가져오기
//   const selectedPlace = useUiStore((state) => state.selectedPlace);


//   const {
//     data: culturalSites = [],
//     isLoading,
//     isError,
//     error,
//   } = useAllCulturalSites();

//   if (isLoading) {
//     return (
//       <div className="h-full w-full flex items-center justify-center text-gray-600">
//         Loading the Map...
//       </div>
//     );
//   }

//   if (isError) {
//     return (
//       <div className="h-full w-full flex items-center justify-center text-red-600">
//         Failed to load map data: {error.message}
//       </div>
//     );
//   }

//   const filteredSites = culturalSites.filter((site) => {
//     if (selectedCategories.length === 0) {
//       return true;
//     }
//     return selectedCategories.includes(site.category);
//   });

//   const initialPosition = [50.8303, 12.91895]; // Chemnitz Lat, Lng

//   return (
//     <div className="h-full w-full relative">
//       <MapContainer
//         center={initialPosition}
//         zoom={14}
//         minZoom={13}
//         maxBounds={[
//           [50.7, 12.7], // SW corner of Chemnitz region
//           [50.95, 13.1], // NE corner of Chemnitz region
//         ]}
//         maxBoundsViscosity={1.0}
//         scrollWheelZoom={true}
//         className="h-full w-full z-0"
//         whenCreated={(mapInstance) => {
//           mapRef.current = mapInstance;
//         }}
//         zoomControl={false}
//       >
//         <CurrentLocationButton />
//         <TileLayer
//           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         />
//         <ZoomControl position="bottomleft" />
//         <MapEventsHandler />
//         <MarkerClusterGroup chunkedLoading>
//           {filteredSites.map((culturalSite) => (
//             <Marker
//               key={culturalSite._id}
//               position={[
//                 culturalSite.location.coordinates[1], // Latitude
//                 culturalSite.location.coordinates[0], // Longitude
//               ]}
//               // createCustomIcon 함수를 사용하여 아이콘 할당
//               icon={createCustomIcon(culturalSite.category)}
//               eventHandlers={{
//                 click: () => openSidePanel(culturalSite),
//               }}
//             >
//               {/* Optional: Add Popup here */}
//               {/* <Popup>{culturalSite.name}</Popup> */}
//             </Marker>
//           ))}
//         </MarkerClusterGroup>

//         {/* selectedPlace가 있을 경우 빨간색 마커 렌더링 */}
//         {selectedPlace && (
//          <Marker
//             position={[
//               selectedPlace.location.coordinates[1], // Latitude
//               selectedPlace.location.coordinates[0], // Longitude
//             ]}
//             icon={createSelectedPlaceIcon()} // createSelectedPlaceIcon 함수 자체에 zIndexOffset이 이미 높게 설정되어 있지만, 여기에 추가해도 무방
//             zIndexOffset={10}
//             eventHandlers={{
//               click: () => openSidePanel(selectedPlace),
//             }}
//           />
//         )}
//       </MapContainer>
//     </div>
//   );
// };

// export default MapComponent;
















// import { useRef } from "react";
// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   ZoomControl,
//   useMapEvents,
// } from "react-leaflet";
// import "leaflet/dist/leaflet.css";

// // Leaflet 마커 아이콘 깨짐 방지 (기존 코드 유지)
// import L from "leaflet";

// // 기본 아이콘 설정은 제거하거나, fallback 용도로만 사용
// // L.Marker.prototype.options.icon = DefaultIcon; // 이 줄은 제거합니다.

// // --- 클러스터링 관련 추가/수정 ---
// import MarkerClusterGroup from "react-leaflet-markercluster";
// import "leaflet.markercluster/dist/MarkerCluster.css";
// import "leaflet.markercluster/dist/MarkerCluster.Default.css";
// // --- 클러스터링 관련 추가/수정 끝 ---

// // 필터 스토어 임포트
// import useFilterStore from "../../store/filterStore";
// // ui 스토어 임포트
// import useUiStore from "../../store/uiStore";

// // TanStack Query 훅 임포트
// import { useAllCulturalSites } from "../../hooks/useCulturalSitesQueries";
// import CurrentLocationButton from "./CurrentLocationButton";

// // NEW: ReactDOMServer 임포트
// import ReactDOMServer from 'react-dom/server';
// // NEW: React Icons 임포트 (예시로 몇 가지만 가져왔습니다. 필요한 아이콘을 추가하세요.)
// import { FaLandmark, FaPalette, FaBuilding, FaUtensils, FaTheaterMasks, FaUsers, FaBook, FaFilm, FaQuestionCircle } from 'react-icons/fa';


// // MapEventsHandler 컴포넌트
// const MapEventsHandler = () => {
//   const openContextMenu = useUiStore((state) => state.openContextMenu);
//   const setSelectedLatLng = useUiStore((state) => state.setSelectedLatLng);
//   useMapEvents({
//     contextmenu: (e) => {
//       console.log(e.latlng);
//       e.originalEvent.preventDefault();
//       openContextMenu();
//       setSelectedLatLng(e.latlng);
//     },
//   });
//   return null;
// };

// // 카테고리별 React Icons 및 DivIcon 생성 함수 ---
// // 각 카테고리에 맞는 React Icon 컴포넌트 매핑
// const categoryIconComponents = {
//   artwork: <FaPalette />,
//   gallery: <FaBuilding />,
//   museum: <FaLandmark />,
//   restaurant: <FaUtensils />,
//   theatre: <FaTheaterMasks />,
//   arts_centre: <FaUsers />, // 예시로 다른 아이콘 사용
//   community_centre: <FaUsers />,
//   library: <FaBook />,
//   cinema: <FaFilm />,
//   other: <FaQuestionCircle />, // 기본 아이콘
// };

// // L.divIcon을 생성하는 헬퍼 함수
// const createCustomIcon = (category) => {
//   const IconComponent = categoryIconComponents[category] || categoryIconComponents.other;

//   // React Icon을 HTML 문자열로 변환
//   const iconHtml = ReactDOMServer.renderToString(
//     <div style={{
//         backgroundColor: 'white', // 배경색
//         borderRadius: '50%',     // 원형 마커
//         width: '30px',           // 크기
//         height: '30px',
//         display: 'flex',
//         alignItems: 'center',
//         justifyContent: 'center',
//         boxShadow: '0 2px 5px rgba(0,0,0,0.3)', // 그림자
//         fontSize: '18px',        // 아이콘 크기
//         color: '#333',           // 아이콘 색상
//         border: '2px solid #333' // 테두리
//     }}>
//       {IconComponent}
//     </div>
//   );

//   return L.divIcon({
//     html: iconHtml,
//     className: 'custom-div-icon', // 필요시 추가 CSS 클래스
//     iconSize: [30, 30], // div의 크기와 동일하게 설정
//     iconAnchor: [15, 15], // div의 중심을 마커의 앵커로 설정
//   });
// };

// // MapComponent
// const MapComponent = () => {
//   const mapRef = useRef(null);

//   const openSidePanel = useUiStore((state) => state.openSidePanel);
//   const selectedCategories = useFilterStore(
//     (state) => state.selectedCategories
//   );

//   const {
//     data: culturalSites = [],
//     isLoading,
//     isError,
//     error,
//   } = useAllCulturalSites();

//   if (isLoading) {
//     return (
//       <div className="h-full w-full flex items-center justify-center text-gray-600">
//         Loading the Map...
//       </div>
//     );
//   }

//   if (isError) {
//     return (
//       <div className="h-full w-full flex items-center justify-center text-red-600">
//         Failed to load map data: {error.message}
//       </div>
//     );
//   }

//   const filteredSites = culturalSites.filter((site) => {
//     if (selectedCategories.length === 0) {
//       return true;
//     }
//     return selectedCategories.includes(site.category);
//   });

//   const initialPosition = [50.8303, 12.91895]; // Chemnitz Lat, Lng

//   return (
//     <div className="h-full w-full relative">
//       <MapContainer
//         center={initialPosition}
//         zoom={14}
//         minZoom={13}
//         maxZoom={17}
//         maxBounds={[
//           [50.7, 12.7], // SW corner of Chemnitz region
//           [50.95, 13.1], // NE corner of Chemnitz region
//         ]}
//         maxBoundsViscosity={1.0}
//         scrollWheelZoom={true}
//         className="h-full w-full z-0"
//         whenCreated={(mapInstance) => {
//           mapRef.current = mapInstance;
//         }}
//         zoomControl={false}
//       >
//         <CurrentLocationButton />
//         <TileLayer
//           attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//           url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         />
//         <ZoomControl position="bottomleft" />
//         <MapEventsHandler />
//         <MarkerClusterGroup chunkedLoading>
//           {filteredSites.map((culturalSite) => (
//             <Marker
//               key={culturalSite._id}
//               position={[
//                 culturalSite.location.coordinates[1], // Latitude
//                 culturalSite.location.coordinates[0], // Longitude
//               ]}
//               // createCustomIcon 함수를 사용하여 아이콘 할당
//               icon={createCustomIcon(culturalSite.category)}
//               eventHandlers={{
//                 click: () => openSidePanel(culturalSite),
//               }}
//             >
//               {/* Optional: Add Popup here */}
//               {/* <Popup>{culturalSite.name}</Popup> */}
//             </Marker>
//           ))}
//         </MarkerClusterGroup>
//       </MapContainer>
//     </div>
//   );
// };

// export default MapComponent;

