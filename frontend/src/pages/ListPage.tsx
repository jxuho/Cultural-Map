import React, { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useAllCulturalSites } from '../hooks/data/useCulturalSitesQueries';
import useFilterStore from '../store/filterStore';
import useUiStore from '../store/uiStore';
import FilterPanel from '../components/Filter/FilterPanel';
import GoToTopButton from '../components/GoToTopButton';
import InfinitePlaceList from '../components/List/InfinitePlaceList';

const ListPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    data: culturalSites = [],
    isLoading,
    isError,
    error,
  } = useAllCulturalSites();

  const setSortBy = useFilterStore((state) => state.setSortBy);
  const { searchQuery, selectedCategories, sortBy, getFilteredSites } =
    useFilterStore();

  const openSidePanel = useUiStore((state) => state.openSidePanel);
  const setJumpToPlace = useUiStore((state) => state.setJumpToPlace);

  const processedSites = useMemo(() => {
    return getFilteredSites(culturalSites);
  }, [
    culturalSites,
    searchQuery,
    selectedCategories,
    sortBy,
    getFilteredSites,
  ]);

  const handleCardClick = (site: any) => {
    navigate('/');
    openSidePanel(site);
    setJumpToPlace(site);
  };

  if (isLoading) return <div className="text-center mt-10">Loading...</div>;
  if (isError)
    return (
      <div className="text-center mt-10 text-red-500">{error?.message}</div>
    );

  return (
    <div className="container mx-auto p-4 mt-5">
      <div className="flex justify-between items-start mb-4">
        <FilterPanel />
        <GoToTopButton />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="border border-gray-300 p-2 rounded-md"
        >
          <option value="alphabetical">Sort by Alphabetical</option>
          <option value="reviews">Sort by Reviews Count</option>
          <option value="favorites">Sort by Favorites Count</option>
        </select>
      </div>

      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          All Cultural Sites List
        </h1>
        <p className="text-lg text-gray-600">
          Showing <strong>{processedSites.length}</strong> sites
        </p>
      </header>

      {processedSites.length === 0 ? (
        <div className="text-center mt-10">No results found.</div>
      ) : (
        <InfinitePlaceList
          items={processedSites}
          onItemClick={handleCardClick}
        />
      )}
    </div>
  );
};

export default ListPage;
