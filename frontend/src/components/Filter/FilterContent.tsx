import React, { useMemo, useState } from 'react';
import useFilterStore from '../../store/filterStore.ts';
import { CULTURAL_CATEGORY } from '../../config/culturalSiteConfig.ts';
import debounce from 'lodash.debounce';
import { categoryBorderColors } from '../../config/colors.ts';

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
          z-50 bg-popover text-popover-foreground shadow-xl rounded-xl p-4 border
          w-[95vw] sm:w-[600px] max-w-[calc(100vw-32px)]
          ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
        `}
        {...props}
      >
        {/* Top header area: title and reset button */}

        {/* Top header area */}
        <div className="flex items-center justify-between mb-4 px-1 min-h-[32px]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Filters
            </h3>
            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {filteredCount} sites found
            </span>
          </div>
          <div className="flex items-center">
            {isFiltered ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetAll}
                className="h-8 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset All
              </Button>
            ) : (
              <div className="h-8 w-[80px]" />
            )}
          </div>
        </div>
        {/* Category filter area */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CULTURAL_CATEGORY.map((category) => {
            const isSelected = selectedCategories.includes(category);
            const color = categoryBorderColors[category] || '#64748b';

            return (
              <Button
                key={category}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleCategory(category)}
                style={isSelected ? { backgroundColor: color } : {}}
                className={`
                  rounded-full transition-all text-xs h-8 px-4
                  ${isSelected ? 'hover:opacity-90 border-none shadow-md' : 'hover:bg-accent'}
                `}
              >
                {category
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </Button>
            );
          })}
        </div>

        {/* Search area */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={localSearchInput}
            onChange={handleSearchInputChange}
            placeholder="Search for place name"
            className="pl-9 pr-10 h-10 bg-muted/50 border-none focus-visible:ring-1 focus-visible:bg-background"
          />
          {localSearchInput && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClearSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    );
  },
);

FilterContent.displayName = 'FilterContent';

export default FilterContent;
