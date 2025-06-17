import { useState, useRef, useEffect } from "react";
import { BsStar, BsStarFill } from "react-icons/bs";
import useAuthStore from "../../store/authStore";
import {
  useMyFavorites,
  useFavoriteMutation,
} from "../../hooks/useCulturalSitesQueries";
import ErrorMessage from "../ErrorMessage";
import StarIcon from "../StarIcon";

const FavoriteSites = () => {
  const currentUser = useAuthStore((state) => state.user);
  const [expandedSiteId, setExpandedSiteId] = useState(null);
  const scrollContainerRef = useRef(null); // 스크롤 컨테이너 참조
  const headerRef = useRef(null); // 제목 부분 참조 (높이 계산용)
  const [scrollAreaMaxHeight, setScrollAreaMaxHeight] = useState("auto"); // 스크롤 영역 최대 높이 상태

  const {
    data: myFavorites,
    isLoading: isLoadingFavorites,
    isError: isFavoritesError,
    error: favoritesError,
  } = useMyFavorites(currentUser?._id);

  const favoriteMutation = useFavoriteMutation();

  const handleFavoriteChange = async (
    event,
    culturalSiteId,
    isCurrentlyFavorite
  ) => {
    // event 매개변수 추가
    event.stopPropagation(); // 이벤트 버블링 중단!

    if (!currentUser) {
      alert("Please signin");
      return;
    }

    try {
      await favoriteMutation.mutateAsync({
        actionType: isCurrentlyFavorite ? "delete" : "add",
        culturalSiteId: culturalSiteId,
      });
    } catch (err) {
      console.error("Error occured while change favorite status:", err);
    }
  };

  const handleSiteClick = (siteId) => {
    // console.log('trigger'); // 이 로그는 이제 스타 버튼 클릭 시 발생하지 않습니다.
    setExpandedSiteId((prevId) => (prevId === siteId ? null : siteId));
  };

  // 컴포넌트 마운트 시 또는 UI 변경 시 스크롤 영역 높이 계산
  useEffect(() => {
    const calculateMaxHeight = () => {
      if (scrollContainerRef.current && headerRef.current) {
        // 이 컴포넌트의 전체 높이를 가져옵니다. (p-6 bg-white rounded-lg shadow-md div)
        const parentTotalHeight =
          scrollContainerRef.current.parentElement.clientHeight;

        // 제목 섹션의 높이
        const headerHeight = headerRef.current.offsetHeight;

        // 컴포넌트의 패딩 (p-6은 상하 24px * 2 = 48px)
        const componentPaddingY = 48;

        // 기타 고정 요소 (예: 즐겨찾기 변경 중... 메시지)의 높이를 추가로 뺄 수 있습니다.
        // 현재 코드에서는 해당 요소가 스크롤 영역 밖에 있으므로 직접 높이를 계산하여 빼지 않아도 됩니다.
        // 하지만 특정 UI 상황에서 푸터 등이 있다면 그 높이를 여기에 추가해야 합니다.
        const fixedFooterHeight = favoriteMutation.isPending ? 40 : 0; // 예시: 로딩 메시지 높이

        // 실제 스크롤 가능한 영역의 높이 계산
        const calculatedHeight =
          parentTotalHeight -
          headerHeight -
          componentPaddingY -
          fixedFooterHeight;

        setScrollAreaMaxHeight(`${calculatedHeight}px`);
      }
    };

    calculateMaxHeight(); // 초기 마운트 시 계산

    // 윈도우 리사이즈 시 높이 재계산
    window.addEventListener("resize", calculateMaxHeight);

    // ResizeObserver를 사용하여 DOM 크기 변경 감지 (예: 항목 확장/축소)
    const resizeObserver = new ResizeObserver(() => {
      // DOM 업데이트 후 높이 계산을 지연시키는 것이 안전합니다.
      // requestAnimationFrame을 사용하면 브라우저의 다음 리페인트 전에 실행됩니다.
      requestAnimationFrame(calculateMaxHeight);
    });

    // FavoriteSites 컴포넌트 전체를 관찰하여 높이 변화에 대응
    if (
      scrollContainerRef.current &&
      scrollContainerRef.current.parentElement
    ) {
      resizeObserver.observe(scrollContainerRef.current.parentElement);
    }

    // cleanup 함수
    return () => {
      window.removeEventListener("resize", calculateMaxHeight);
      if (
        scrollContainerRef.current &&
        scrollContainerRef.current.parentElement
      ) {
        resizeObserver.unobserve(scrollContainerRef.current.parentElement);
      }
    };
  }, [
    myFavorites,
    isLoadingFavorites,
    isFavoritesError,
    favoriteMutation.isPending,
    expandedSiteId, // expandedSiteId가 변경될 때도 높이 재계산을 트리거
  ]);

  // --- 로딩/에러/빈 즐겨찾기 상태 처리 ---
  const renderContent = () => {
    if (!currentUser) {
      // 이 부분은 실제로는 상위에서 처리되지만, renderContent 함수 내에 포함될 경우를 대비
      return (
        <div className="text-center flex-grow flex items-center justify-center">
          <p className="text-gray-600 text-lg font-medium">
            Please sign in to see favorite sites.
          </p>
        </div>
      );
    }

    if (isLoadingFavorites) {
      return (
        <div className="text-center flex-grow flex items-center justify-center flex-col">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600 ml-2">
            Loading favorite sites...
          </p>
        </div>
      );
    }

    if (isFavoritesError) {
      return (
        <div className="flex-grow flex items-center justify-center">
          <ErrorMessage
            message={
              favoritesError?.message ||
              "Failed to fetch favorite sites."
            }
          />
        </div>
      );
    }

    if (!myFavorites || myFavorites.length === 0) {
      return (
        <div className="flex-grow flex items-center justify-center flex-col">
          <p className="text-gray-600 text-lg text-center">
            There's no favorite site.
          </p>
          <p className="text-gray-500 text-sm mt-2 text-center">
            Explore the map and add your favorite sites!
          </p>
        </div>
      );
    }

    // 실제 즐겨찾기 목록
    return (
      <ul className="space-y-4">
        {myFavorites.map((site) => (
          <li
            key={site._id}
            className="flex flex-col bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow duration-200 overflow-hidden"
          >
            <div
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => handleSiteClick(site._id)} // 이 클릭 시 상세 정보 토글
            >
              <span className="text-lg font-semibold text-gray-800 flex-grow pr-4">
                {site.name}
              </span>
              <button
                // handleFavoriteChange 함수 호출 시 event 객체를 전달
                onClick={(e) => handleFavoriteChange(e, site._id, true)}
                className={`text-xl p-2 rounded-full transition-colors duration-200 ${
                  favoriteMutation.isPending
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                } text-yellow-500 hover:text-yellow-600 hover:cursor-pointer`}
                disabled={favoriteMutation.isPending}
              >
                <BsStarFill />
              </button>
              {/* 확장/축소 화살표 버튼은 handleSiteClick을 직접 호출 (이미 부모 div에 핸들러가 있으므로 여기서는 제거하거나, 클릭 이벤트를 추가할 필요 없음) */}
              {/* <button
                onClick={() => handleSiteClick(site._id)} // 이 버튼은 클릭 시 expand/collapse만 해야 합니다.
                className="ml-2 text-gray-500 hover:text-gray-700 p-1"
              >
                {expandedSiteId === site._id ? (
                  <IoIosArrowUp size={20} />
                ) : (
                  <IoIosArrowDown size={20} />
                )}
              </button> */}
            </div>

            {/* 상세 정보 탭 */}
            {expandedSiteId === site._id && (
              <div className="p-4 text-sm text-gray-700 bg-gray-100 border-t border-gray-200">
                {site.averageRating !== undefined &&
                  site.averageRating !== null &&
                  site.reviewCount > 0 && (
                    <div className="flex items-center mb-1">
                      <span className="font-semibold mr-2">Rating:</span>
                      <div className="flex text-yellow-500 text-base mr-2">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            rating={site.averageRating}
                            index={i}
                            className="w-4 h-4"
                            displayMode="averageRating"
                          />
                        ))}
                      </div>
                      <span className="font-bold text-gray-800">
                        {site.averageRating.toFixed(1)} ({site.reviewCount}{" "}
                        리뷰)
                      </span>
                    </div>
                  )}

                {site.category && (
                  <p className="mb-1">
                    <span className="font-semibold">Category:</span>{" "}
                    {site.category
                      ?.replace(/_/g, " ")
                      .split(" ")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ") || "N/A"}
                  </p>
                )}
                {site.address && (
                  <p className="mb-1">
                    <span className="font-semibold">Address:</span> {site.address}
                  </p>
                )}
                {site.website && (
                  <p className="mb-1">
                    <span className="font-semibold">Website:</span>{" "}
                    <a
                      href={site.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      방문하기
                    </a>
                  </p>
                )}
                {site.openingHours && (
                  <p className="mb-1">
                    <span className="font-semibold">Opening Hours:</span>{" "}
                    {site.openingHours}
                  </p>
                )}
                {site.description && (
                  <div className="mt-2">
                    <p className="font-semibold mb-1">Description:</p>
                    <p className="leading-relaxed">{site.description}</p>
                  </div>
                )}
                {!site.category &&
                  !site.address &&
                  !site.website &&
                  !site.openingHours &&
                  !site.description &&
                  (site.averageRating === undefined ||
                    site.averageRating === null ||
                    site.reviewCount === 0) && (
                    <p className="text-gray-500 italic mt-2">
                     There's no additional info.
                    </p>
                  )}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md flex flex-col h-full">
      <div ref={headerRef}>
        {" "}
        {/* 제목 섹션을 ref로 감쌈 */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
          My favorites
        </h2>
      </div>

      <div
        ref={scrollContainerRef}
        className="overflow-y-auto pr-2 flex-grow" // flex-grow 추가
        style={{ maxHeight: scrollAreaMaxHeight }}
      >
        {renderContent()}
      </div>

      {favoriteMutation.isPending && (
        <div className="mt-4 text-center text-blue-500">
          <p>Changing favorites...</p>
        </div>
      )}
    </div>
  );
};

export default FavoriteSites;
