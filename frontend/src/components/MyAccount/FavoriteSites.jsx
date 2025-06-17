import { useState, useRef, useEffect } from "react";
import { BsStarFill } from "react-icons/bs";
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
    event.stopPropagation();

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
      console.error("Error occurred while changing favorite status:", err);
    }
  };

  const handleSiteClick = (siteId) => {
    setExpandedSiteId((prevId) => (prevId === siteId ? null : siteId));
  };

  // 컴포넌트 마운트 시 또는 UI 변경 시 스크롤 영역 높이 계산
  useEffect(() => {
    const calculateMaxHeight = () => {
      // Capture current ref values
      const currentScrollContainer = scrollContainerRef.current;
      const currentHeader = headerRef.current;

      if (currentScrollContainer && currentHeader) {
        const parentTotalHeight = currentScrollContainer.parentElement.clientHeight;
        const headerHeight = currentHeader.offsetHeight;
        const componentPaddingY = 48;
        const fixedFooterHeight = favoriteMutation.isPending ? 40 : 0;

        const calculatedHeight =
          parentTotalHeight -
          headerHeight -
          componentPaddingY -
          fixedFooterHeight;

        setScrollAreaMaxHeight(`${calculatedHeight}px`);
      }
    };

    calculateMaxHeight(); // Initial calculation on mount

    window.addEventListener("resize", calculateMaxHeight);

    // Capture the current parent element for ResizeObserver
    const observedElement = scrollContainerRef.current?.parentElement;
    let resizeObserver;

    if (observedElement) {
      resizeObserver = new ResizeObserver(() => {
        requestAnimationFrame(calculateMaxHeight);
      });
      resizeObserver.observe(observedElement);
    }

    // cleanup function
    return () => {
      window.removeEventListener("resize", calculateMaxHeight);
      // Use the captured 'observedElement' for unobserving
      if (resizeObserver && observedElement) {
        resizeObserver.unobserve(observedElement);
      }
    };
  }, [
    myFavorites,
    isLoadingFavorites,
    isFavoritesError,
    favoriteMutation.isPending,
    expandedSiteId,
  ]);

  // --- Loading/Error/Empty Favorites State Handling ---
  const renderContent = () => {
    if (!currentUser) {
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

    // Actual favorite sites list
    return (
      <ul className="space-y-4">
        {myFavorites.map((site) => (
          <li
            key={site._id}
            className="flex flex-col bg-gray-50 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow duration-200 overflow-hidden"
          >
            <div
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => handleSiteClick(site._id)}
            >
              <span className="text-lg font-semibold text-gray-800 flex-grow pr-4">
                {site.name}
              </span>
              <button
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
            </div>

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
                        reviews)
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
                      Visit
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
        <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
          My Favorites
        </h2>
      </div>

      <div
        ref={scrollContainerRef}
        className="overflow-y-auto pr-2 flex-grow"
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