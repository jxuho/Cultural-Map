import { useQuery } from '@tanstack/react-query'; // useQuery 임포트
import MapComponent from "../components/MapComponent.jsx";
import SidePanel from "../components/SidePanel/SidePanel.jsx";
import FilterPanel from "../components/FilterPanel.jsx";
import { fetchAllCulturalSites } from "../api/culturalSitesApi.js"; // API 함수 임포트

const HomePage = () => {
  // useQuery 훅을 사용하여 문화재 데이터 페칭 및 관리
  const { 
    data: culturalSites = [], // 데이터, 기본값은 빈 배열
    isLoading, // 로딩 상태
    isError,   // 에러 발생 여부
    error      // 에러 객체
  } = useQuery({
    queryKey: ['culturalSites'], // 이 쿼리를 식별하는 고유 키
    queryFn: fetchAllCulturalSites, // 데이터를 가져올 함수
    // 데이터를 캐시하여 재페칭 시 불필요한 로딩 상태를 방지
    staleTime: 1000 * 60 * 5, // 5분 동안은 캐시된 데이터를 '신선'하다고 간주
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen text-xl font-semibold">
        지도 데이터를 불러오는 중입니다...
      </div>
    );
  if (isError)
    return (
      <div className="flex justify-center items-center h-screen text-xl text-red-600">
        오류: {error?.message || "데이터를 불러오는 데 실패했습니다."}
      </div>
    );

  return (
    <>
      {/* MapComponent에 페칭된 culturalSites 데이터 전달 */}
      <MapComponent culturalSites={culturalSites} />
      <div className="absolute top-4 left-4 z-20">
        <FilterPanel />
      </div>
      <SidePanel />
    </>
  );
};

export default HomePage;


// import { useState, useEffect } from "react";
// import axios from "axios";
// import MapComponent from "../components/MapComponent.jsx";
// import SidePanel from "../components/SidePanel/SidePanel.jsx";
// import FilterPanel from "../components/FilterPanel.jsx"; // FilterPanel 임포트

// const HomePage = () => {
//   const [culturalSites, setCulturalSites] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchLocations = async () => {
//       try {
//         const response = await axios.get(
//           "http://localhost:5000/api/v1/cultural-sites?limit=1000"
//         );
//         const culturalSitesArray = response.data.data.culturalSites;
//         setCulturalSites(culturalSitesArray);
//       } catch (err) {
//         setError(
//           "Failed to fetch locations. Please check your backend server."
//         );
//         console.error("Error fetching locations:", err);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchLocations();
//   }, []);

//   if (loading)
//     return (
//       <div className="flex justify-center items-center h-screen text-xl font-semibold">
//         지도 데이터를 불러오는 중입니다...
//       </div>
//     );
//   if (error)
//     return (
//       <div className="flex justify-center items-center h-screen text-xl text-red-600">
//         오류: {error}
//       </div>
//     );

//   return (
//     <>
//       <MapComponent culturalSites={culturalSites} />
//       {/* FilterPanel을 지도 위에 오버레이 */}
//       <div className="absolute top-4 left-4 z-20">
//         {" "}
//         {/* 지도 상단 좌측에 위치 (z-index 조정) */}
//         <FilterPanel />
//       </div>
//       <SidePanel />
//     </>
//   );
// };

// export default HomePage;
