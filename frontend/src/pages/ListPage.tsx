import React, { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useAllCulturalSites } from '../hooks/data/useCulturalSitesQueries';
import useFilterStore from '../store/filterStore';
import useUiStore from '../store/uiStore';
import FilterPanel from '../components/Filter/FilterPanel';
import GoToTopButton from '../components/GoToTopButton';
import InfinitePlaceList from '../components/List/InfinitePlaceList';
import { ListFilter, Loader2 } from 'lucide-react';

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

  if (isLoading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-black" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">
          Accessing Archive...
        </p>
      </div>
    );

  if (isError)
    return (
      <div className="container mx-auto p-12 text-center">
        <div className="inline-block border-2 border-red-500 p-6">
          <p className="text-red-500 font-mono font-bold uppercase tracking-tighter">
            Error :: {error?.message}
          </p>
        </div>
      </div>
    );

  return (
    <div className="bg-[#f4f4f4] min-h-screen">
      {/* 1. Archive Hero Section */}
      <header className="bg-white border-b-2 border-black pt-20 pb-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-2">
            <div className="inline-block bg-black text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">
              Index: Comprehensive List
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.85]">
              The Berlin <br /> Archive
            </h1>
            <p className="text-sm font-mono text-gray-500 pt-4">
              TOTAL RECORDS_
              <span className="text-black font-bold">
                {processedSites.length.toString().padStart(3, '0')}
              </span>
            </p>
          </div>

          {/* Sorting Control */}
          <div className="relative group shrink-0">
            <div className="absolute -top-6 left-0 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
              <ListFilter size={12} /> Sort Criteria
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none bg-white border-2 border-black px-6 py-3 pr-12 rounded-none font-black uppercase text-xs tracking-widest cursor-pointer focus:bg-black focus:text-white transition-all w-full md:w-64"
            >
              <option value="alphabetical">A-Z Index</option>
              <option value="reviews">Review Density</option>
              <option value="favorites">Community Rank</option>
            </select>
            <div className="absolute right-4 bottom-3.5 pointer-events-none group-focus-within:text-white">
              <span className="text-[10px]">▼</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Filter & Interaction Bar */}
      <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-black px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <FilterPanel />
        </div>
      </nav>

      {/* 3. Main Content Grid */}
      <main className="max-w-7xl mx-auto p-6 pb-24">
        {processedSites.length === 0 ? (
          <div className="py-40 text-center border-2 border-dashed border-gray-300">
            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-gray-400">
              No matching records in archive.
            </p>
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <InfinitePlaceList
              items={processedSites}
              onItemClick={handleCardClick}
            />
          </div>
        )}
      </main>

      {/* Footer Decoration */}
      <footer className="border-t border-black bg-white p-6 text-center">
        <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">
          Archival System v3.0 // Updated 2024
        </p>
      </footer>
      <GoToTopButton />
    </div>
  );
};

export default ListPage;
