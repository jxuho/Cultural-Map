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
}

// Create a store to manage filter and sort-related state
const useFilterStore = create<FilterState>()(
  devtools((set) => ({
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
  })),
);

export default useFilterStore;
