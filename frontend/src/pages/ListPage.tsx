import React, { ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { FaHeart, FaCommentAlt } from "react-icons/fa";

// 타입 및 커스텀 훅 임포트
import { Place } from "../types/place";
import { useAllCulturalSites } from "../hooks/data/useCulturalSitesQueries";
import useFilterStore from "../store/filterStore"; 
import useUiStore from "../store/uiStore";

// 컴포넌트 임포트
import FilterPanel from "../components/Filter/FilterPanel";
import StarIcon from "../components/StarIcon";
import GoToTopButton from "../components/GoToTopButton";

/**
 * 카테고리 식별자를 읽기 좋은 형태의 문자열로 변환하는 헬퍼 함수
 */
const formatCategoryName = (name: string): string => {
  if (!name) return "";
  return name
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const ListPage: React.FC = () => {
  const navigate = useNavigate();

  // 1. API 데이터 페칭
  const {
    data: culturalSites = [],
    isLoading,
    isError,
    error,
  } = useAllCulturalSites();

  // 2. 전역 상태 관리 (구조 분해 대신 개별 선택을 사용하면 리렌더링 최적화에 유리합니다)
  const selectedCategories = useFilterStore((state) => state.selectedCategories);
  const searchQuery = useFilterStore((state) => state.searchQuery);
  const sortBy = useFilterStore((state) => state.sortBy);
  const setSortBy = useFilterStore((state) => state.setSortBy);

  const openSidePanel = useUiStore((state) => state.openSidePanel);
  const setJumpToPlace = useUiStore((state) => state.setJumpToPlace);

  // 3. 이벤트 핸들러
  const handleCardClick = (site: Place): void => {
    navigate("/");
    openSidePanel(site);
    setJumpToPlace(site);
  };

  const handleSortChange = (e: ChangeEvent<HTMLSelectElement>): void => {
    // Store에 정의된 타입('alphabetical' | 'favorites' | 'reviews')으로 단언
    setSortBy(e.target.value as 'alphabetical' | 'favorites' | 'reviews');
  };

  // 4. 로딩 및 에러 처리
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 text-center mt-10">
        <h1 className="text-3xl font-bold text-gray-800">Cultural Sites</h1>
        <p className="mt-4 text-gray-600">Loading cultural sites...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto p-4 text-center mt-10 text-red-600">
        <h1 className="text-3xl font-bold text-gray-800">Error</h1>
        <p className="mt-4">Failed to load cultural sites: {error?.message}</p>
      </div>
    );
  }

  // 5. 필터링 및 정렬 통합 로직
  const query = searchQuery.toLowerCase();
  
  // 필터링
  let processedSites = culturalSites.filter((site: Place) => {
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes(site.category);
    
    const matchesSearch =
      site.name.toLowerCase().includes(query) ||
      (site.description && site.description.toLowerCase().includes(query));
    
    return matchesCategory && matchesSearch;
  });

  // 정렬 (방어적 코드 적용)
  processedSites.sort((a, b) => {
    switch (sortBy) {
      case "alphabetical":
        return (a.name || "").localeCompare(b.name || "");

      case "reviews":
        // site.reviewCount가 없을 경우 reviews 배열의 길이를 대안으로 사용 가능
        const countA = a.reviewCount ?? a.reviews?.length ?? 0;
        const countB = b.reviewCount ?? b.reviews?.length ?? 0;
        return countB - countA;

      case "favorites":
        return (b.favoritesCount || 0) - (a.favoritesCount || 0);

      default:
        return 0;
    }
  });

  return (
    <div className="container mx-auto p-4 mt-5">
      {/* 컨트롤 바 */}
      <div className="flex justify-between items-start mb-4">
        <div className="text-left">
          <FilterPanel />
        </div>
        <GoToTopButton />
        <div className="relative">
          <select
            value={sortBy}
            onChange={handleSortChange}
            className="block appearance-none w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 pr-8 rounded-md leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="alphabetical">Sort by Alphabetical</option>
            <option value="reviews">Sort by Reviews Count</option>
            <option value="favorites">Sort by Favorites Count</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 6.757 7.586 5.343 9z" />
            </svg>
          </div>
        </div>
      </div>

      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          All Cultural Sites List
        </h1>
        <p className="text-lg text-gray-600">
          Showing <strong>{processedSites.length}</strong> cultural sites
          {selectedCategories.length > 0 &&
            ` (filtered by ${selectedCategories.map(formatCategoryName).join(", ")})`}
        </p>
      </header>

      {processedSites.length === 0 ? (
        <div className="text-center mt-10 text-gray-600">
          No cultural sites found matching the selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedSites.map((site) => (
            <article
              key={site._id}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col cursor-pointer border border-transparent hover:border-blue-100"
              onClick={() => handleCardClick(site)}
            >
              <h2 className="text-xl font-semibold text-blue-900 mb-2">
                {site.name}
              </h2>

              {/* 통계 바 */}
              <div className="flex flex-wrap items-center text-sm text-gray-700 mb-3 gap-3">
                {site.averageRating != null && (
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        rating={site.averageRating!}
                        index={i}
                        className="w-4 h-4"
                        displayMode="averageRating"
                        onClick={() => {}} // 필수 props 에러 방지
                      />
                    ))}
                    <span className="ml-1 font-semibold">{site.averageRating.toFixed(1)}</span>
                  </div>
                )}

                <div className="flex items-center">
                  <FaCommentAlt className="text-blue-500 mr-1" />
                  <span>{site.reviewCount ?? site.reviews?.length ?? 0} Reviews</span>
                </div>

                <div className="flex items-center">
                  <FaHeart className="text-red-500 mr-1" />
                  <span>{site.favoritesCount || 0} Favorites</span>
                </div>
              </div>

              <div className="mt-auto">
                <p className="text-gray-700 text-sm mb-1">
                  <strong>Category: </strong>
                  {formatCategoryName(site.category)}
                </p>
                <p className="text-gray-600 text-sm mb-2">{site.address}</p>
                {site.description && (
                  <p className="text-gray-800 text-sm line-clamp-3 italic">
                    {site.description}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default ListPage;