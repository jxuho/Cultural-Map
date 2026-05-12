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
  const { data: culturalSites = [], isLoading, isError, error } = useAllCulturalSites();

  const selectedCategories = useFilterStore((state) => state.selectedCategories);
  const searchQuery = useFilterStore((state) => state.searchQuery);
  const sortBy = useFilterStore((state) => state.sortBy);
  const setSortBy = useFilterStore((state) => state.setSortBy);

  const openSidePanel = useUiStore((state) => state.openSidePanel);
  const setJumpToPlace = useUiStore((state) => state.setJumpToPlace);

  // 데이터 필터링 및 정렬 로직을 useMemo로 감싸 성능 최적화
  const processedSites = useMemo(() => {
    const query = searchQuery.toLowerCase();
    let filtered = culturalSites.filter((site) => {
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(site.category);
      const matchesSearch = site.name.toLowerCase().includes(query) || 
                            (site.description?.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
      if (sortBy === 'reviews') return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
      if (sortBy === 'favorites') return (b.favoritesCount ?? 0) - (a.favoritesCount ?? 0);
      return 0;
    });
  }, [culturalSites, selectedCategories, searchQuery, sortBy]);

  const handleCardClick = (site: any) => {
    navigate('/');
    openSidePanel(site);
    setJumpToPlace(site);
  };

  if (isLoading) return <div className="text-center mt-10">Loading...</div>;
  if (isError) return <div className="text-center mt-10 text-red-500">{error?.message}</div>;

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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">All Cultural Sites List</h1>
        <p className="text-lg text-gray-600">Showing <strong>{processedSites.length}</strong> sites</p>
      </header>

      {processedSites.length === 0 ? (
        <div className="text-center mt-10">No results found.</div>
      ) : (
        <InfinitePlaceList items={processedSites} onItemClick={handleCardClick} />
      )}
    </div>
  );
};

export default ListPage;