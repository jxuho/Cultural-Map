import React, { useMemo, useState } from 'react';
import useFilterStore from '../../store/filterStore.ts';
import { CULTURAL_CATEGORY } from '../../config/culturalSiteConfig.ts';
import debounce from 'lodash.debounce';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { RotateCcw, Search, X } from 'lucide-react';
import { useAllCulturalSites } from '@/hooks/data/useCulturalSitesQueries.ts';

interface FilterContentProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  floatingStyles?: React.CSSProperties;
}

const FilterContent = React.forwardRef<HTMLDivElement, FilterContentProps>(
  ({ isOpen, floatingStyles, ...props }, ref) => {
    const selectedCategories = useFilterStore(
      (state) => state.selectedCategories,
    );
    const { data: culturalSites = [] } = useAllCulturalSites();
    const getFilteredSites = useFilterStore((state) => state.getFilteredSites);
    const toggleCategory = useFilterStore((state) => state.toggleCategory);
    const setSearchQuery = useFilterStore((state) => state.setSearchQuery);
    const searchQuery = useFilterStore((state) => state.searchQuery);
    const resetFilters = useFilterStore((state) => state.resetFilters);
    const [localSearchInput, setLocalSearchInput] = useState(searchQuery);

    const filteredCount = useMemo(() => {
      return getFilteredSites(culturalSites).length;
    }, [culturalSites, getFilteredSites, selectedCategories, searchQuery]);

    const debouncedSetSearchQuery = useMemo(
      () => debounce((value) => setSearchQuery(value), 300),
      [setSearchQuery],
    );

    const handleSearchInputChange = (
      e: React.ChangeEvent<HTMLInputElement>,
    ) => {
      const value = e.target.value;
      setLocalSearchInput(value);
      debouncedSetSearchQuery(value);
    };

    const handleClearSearch = () => {
      setLocalSearchInput('');
      setSearchQuery('');
    };

    const handleResetAll = () => {
      resetFilters();
      setLocalSearchInput('');
    };

    const isFiltered = selectedCategories.length > 0 || searchQuery.length > 0;

    return (
      <div
        ref={ref}
        style={floatingStyles}
        className={`
          z-50 bg-white text-black border-2 border-black p-0
          w-[95vw] sm:w-[550px] overflow-hidden 
          ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
        `}
        {...props}
      >
        {/* 1. Header Area */}
        <div className="bg-black text-white px-6 py-4 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] leading-none">
              Filter Criteria
            </h3>
            <p className="text-[9px] font-mono opacity-60 uppercase">
              Current selection yields {filteredCount} matching records
            </p>
          </div>
          {isFiltered && (
            <button
              onClick={handleResetAll}
              className="text-[10px] font-bold uppercase tracking-widest hover:underline flex items-center gap-2"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>

        <div className="p-8">
          {/* 2. Category Selection Area */}
          <div className="mb-8">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-gray-400">
              By Classification
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CULTURAL_CATEGORY.map((category) => {
                const isSelected = selectedCategories.includes(category);
                return (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`
                      px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-left border transition-all
                      ${
                        isSelected
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border-gray-100 hover:border-black'
                      }
                    `}
                  >
                    {category.replace(/_/g, ' ')}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Search Area */}
          <div className="relative">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 text-gray-400">
              Keyword Search
            </h4>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black group-focus-within:scale-110 transition-transform" />
              <Input
                value={localSearchInput}
                onChange={handleSearchInputChange}
                placeholder="ENTER SEARCH TERMS..."
                className={`
                  pl-12 pr-12 h-14 bg-transparent border-black border-2 rounded-none
                  font-mono text-sm placeholder:text-gray-200 focus-visible:ring-0
                  transition-all duration-300
                `}
              />
              {localSearchInput && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:scale-125 transition-transform"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. Footer Decorative Bar */}
        <div className="h-2 bg-black w-full" />
      </div>
    );
  },
);

FilterContent.displayName = 'FilterContent';
export default FilterContent;
