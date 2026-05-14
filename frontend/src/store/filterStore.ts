import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface FilterState {
  selectedCategories: string[];
  searchQuery: string;
  sortBy: 'alphabetical' | 'favorites' | 'reviews';

  toggleCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortOption: 'alphabetical' | 'favorites' | 'reviews') => void;
  resetFilters: () => void;
  getFilteredSites: (sites: any[]) => any[];
}

// Create a store to manage filter and sort-related state
const useFilterStore = create<FilterState>()(
  devtools((set, get) => ({
    selectedCategories: [],
    searchQuery: '',
    sortBy: 'alphabetical',

    toggleCategory: (category) =>
      set((state) => ({
        selectedCategories: state.selectedCategories.includes(category)
          ? state.selectedCategories.filter((cat) => cat !== category)
          : [...state.selectedCategories, category],
      })),

    setSearchQuery: (query) => set({ searchQuery: query }),

    setSortBy: (sortOption) => set({ sortBy: sortOption }),

    resetFilters: () =>
      set({
        selectedCategories: [],
        searchQuery: '',
        sortBy: 'alphabetical',
      }),

    getFilteredSites: (sites) => {
      const { searchQuery, selectedCategories, sortBy } = get();
      const query = searchQuery.toLowerCase();

      const filtered = sites.filter((site) => {
        const matchesCategory =
          selectedCategories.length === 0 ||
          selectedCategories.includes(site.category);
        const matchesSearch =
          site.name.toLowerCase().includes(query) ||
          site.description?.toLowerCase().includes(query);
        return matchesCategory && matchesSearch;
      });

      return [...filtered].sort((a, b) => {
        if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
        if (sortBy === 'reviews')
          return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
        if (sortBy === 'favorites')
          return (b.favoritesCount ?? 0) - (a.favoritesCount ?? 0);
        return 0;
      });
    },
  })),
);

export default useFilterStore;
