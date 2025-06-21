import { create } from 'zustand';
import { devtools } from 'zustand/middleware'
import { queryClient } from '../config/reactQueryConfig'; // 수정된 경로로 queryClient 임포트!

const useUiStore = create(devtools((set) => ({
  // modal
  isModalOpen: false,
  modalContent: null, // 모달 내부에 렌더링할 JSX 또는 컴포넌트
  openModal: (content) => set({ isModalOpen: true, modalContent: content }),
  closeModal: () => set({ isModalOpen: false, modalContent: null }),

  // account manager
  isAccountManagerOpen: false,
  openAccountManager: () => set({ isAccountManagerOpen: true }),
  closeAccountManager: () => set({ isAccountManagerOpen: false }),

  // side panel
  isSidePanelOpen: false,
  selectedPlace: null,
  sidePanelWidth: 360,
  setSidePanelWidth: (width) => set({ sidePanelWidth: width }),
  openSidePanel: (placeInfo) => set({ isSidePanelOpen: true, selectedPlace: placeInfo }),
  closeSidePanel: () => set({ isSidePanelOpen: false, selectedPlace: null }),
  clearSelectedPlace: () => set({ selectedPlace: null }),
  isUserProfileOpen: false,
  userProfileId: null,
  openUserProfile: (userId) => set({isUserProfileOpen: true, userProfileId: userId}),
  closeUserProfile: () => set({isUserProfileOpen: false, userProfileId: null}),


  // context menu
  isContextMenuOpen: false,
  openContextMenu: () => set({ isContextMenuOpen: true }),
  closeContextMenu: () => set({ isContextMenuOpen: false }),

  // latlng
  selectedLatLng: null,
  setSelectedLatLng: (LatLng) => set({ selectedLatLng: LatLng }),

  // nearby
  nearbySites: [],
  nearbySitesLoading: false,
  nearbySitesError: null,
  setNearbySites: (sites) => set({ nearbySites: sites, selectedPlace: null }),
  clearNearbySites: () => set({ nearbySites: [] }),
  setNearbySitesLoading: (isLoading) => set({ nearbySitesLoading: isLoading }),
  setNearbySitesError: (error) => set({ nearbySitesError: error }),

  // create form
  isCreateFormOpen: false,
  createFormData: null, // Holds the data to pre-fill the form
  openCreateForm: (data) => set({
    isSidePanelOpen: true, // Open side panel if not already open
    isCreateFormOpen: true,
    createFormData: data,
    selectedPlace: null, // Ensure no single cultural site is selected
    nearbySites: [], // Clear nearby sites list
  }),
  closeCreateForm: () => set({ isCreateFormOpen: false, createFormData: null }),

  // update form
  isUpdateFormOpen: false,
  updateFormData: null,
  openUpdateForm: (data) => set({
    isSidePanelOpen: true,
    isUpdateFormOpen: true,
    updateFormData: data,
    selectedPlace: data, // Keep selectedPlace for update form to reflect the item being updated
  }),
  closeUpdateForm: () => set({ isUpdateFormOpen: false, updateFormData: null }),

  // Centralized Close and Cancel Logic ---
  handleCloseAndCancel: (queryKeyToCancel) => {
    set({
      isSidePanelOpen: false,
      nearbySites: [],
      nearbySitesLoading: false,
      nearbySitesError: null,
      selectedPlace: null, // Clear selected place
      isCreateFormOpen: false,
      createFormData: null,
      isUpdateFormOpen: false,
      updateFormData: null,
      isUserProfileOpen: false,
      userProfileId: null
    });
    if (queryKeyToCancel) {
      console.log(`Cancelling query with key: ${queryKeyToCancel}`);
      // Use the imported queryClient to cancel queries
      queryClient.cancelQueries({ queryKey: [queryKeyToCancel] });
    }
  },

  // jump to place
  jumpToPlace: null,
  setJumpToPlace: (place) => set({ jumpToPlace: place }),
  clearJumpToPlace: () => set({ jumpToPlace: null }),
})));

export default useUiStore;