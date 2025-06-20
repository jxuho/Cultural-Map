// components/FilterContent.jsx
import React, { useMemo } from 'react';
import useFilterStore from '../../store/filterStore';
import { CULTURAL_CATEGORY } from '../../config/culturalSiteConfig';
import debounce from 'lodash.debounce';

// Floating UI의 floatingStyles를 props로 받도록 변경
const FilterContent = React.forwardRef(({ isOpen, floatingStyles, ...props }, ref) => {
  const selectedCategories = useFilterStore((state) => state.selectedCategories);
  const toggleCategory = useFilterStore((state) => state.toggleCategory);
  const searchQuery = useFilterStore((state) => state.searchQuery);
  const setSearchQuery = useFilterStore((state) => state.setSearchQuery);
  const [localSearchInput, setLocalSearchInput] = React.useState(searchQuery);

  const debouncedSetSearchQuery = useMemo(
    () => debounce((value) => {
      setSearchQuery(value);
    }, 300),
    [setSearchQuery]
  );

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setLocalSearchInput(value);
    debouncedSetSearchQuery(value);
  };

  const handleClearSearch = () => {
    setLocalSearchInput("");
    setSearchQuery("");
    debouncedSetSearchQuery.cancel();
  };

  // 패널의 가시성을 제어하는 새로운 상태
  // floatingStyles.x와 floatingStyles.y가 유효할 때 (즉, Floating UI 위치 계산 완료)만 보이도록 합니다.
  const isPositioned = floatingStyles && typeof floatingStyles.left === 'number' && typeof floatingStyles.top === 'number';

  return (
    <div
      ref={ref}
      // Floating UI의 스타일을 직접 적용합니다.
      style={floatingStyles}
      // isPositioned가 true이고 isOpen일 때만 보이도록 합니다.
      className={`
        bg-white shadow-lg rounded-lg p-2
        transition-opacity duration-300
        ${(isOpen && isPositioned) ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `}
      {...props}
    >
      <div className="flex flex-wrap justify-center gap-2 pb-2">
        {CULTURAL_CATEGORY.map((category) => (
          <button
            key={category}
            onClick={(e) => {
              e.stopPropagation();
              toggleCategory(category);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              selectedCategories.includes(category)
                ? "bg-blue-600 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {category
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      <div className="p-2 relative">
        <input
          type="text"
          value={localSearchInput}
          onChange={handleSearchInputChange}
          placeholder="Search by name or description..."
          className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
        />
        {localSearchInput && (
          <button
            onClick={handleClearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            aria-label="Clear search"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
});

export default FilterContent;