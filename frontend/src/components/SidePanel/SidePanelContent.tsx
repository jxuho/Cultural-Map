import { useState } from 'react';
import useUiStore from '../../store/uiStore';
import { useCulturalSiteDetail } from '../../hooks/data/useCulturalSitesQueries';
import SidePanelSkeleton from './SidePanelSkeleton';
import ErrorMessage from '../ErrorMessage';
import NearbySitesList from './NearbySitesList';
import SidePanelItems from './SidePanelItems';
import CreateForm from './CreateForm';
import UpdateForm from './UpdateForm';
import UserProfileDisplay from './UserProfileDisplay';
import { X } from 'lucide-react'; 

const SidePanelContent = () => {
  const isCreateFormOpen = useUiStore((state) => state.isCreateFormOpen);
  const isUpdateFormOpen = useUiStore((state) => state.isUpdateFormOpen);
  const nearbySites = useUiStore((state) => state.nearbySites);
  const nearbySitesLoading = useUiStore((state) => state.nearbySitesLoading);
  const nearbySitesError = useUiStore((state) => state.nearbySitesError);
  const uiSelectedPlace = useUiStore((state) => state.selectedPlace);
  const handleCloseAndCancel = useUiStore(
    (state) => state.handleCloseAndCancel,
  );
  const isUserProfileOpen = useUiStore((state) => state.isUserProfileOpen);

  const [isReviewsExpanded, setIsReviewsExpanded] = useState(false);

  const {
    data: selectedPlaceData,
    isLoading: isPlaceLoading,
    isError: isPlaceError,
    error: placeError,
  } = useCulturalSiteDetail(uiSelectedPlace?._id);

  const CloseButton = ({ onClick }: { onClick: () => void }) => (
    <button
      onClick={onClick}
      className="group absolute top-6 right-6 z-[60] flex items-center justify-center w-10 h-10 border border-black bg-white hover:bg-black transition-all duration-300 cursor-pointer"
      aria-label="Close panel"
    >
      <X
        size={18}
        className="text-black group-hover:text-white group-hover:rotate-90 transition-all duration-500"
      />
    </button>
  );

  let panelContent;

  if (isCreateFormOpen) {
    panelContent = <CreateForm />;
  } else if (isUpdateFormOpen) {
    panelContent = <UpdateForm />;
  } else if (isUserProfileOpen) {
    panelContent = <UserProfileDisplay />;
  } else if (nearbySitesLoading) {
    panelContent = (
      <SidePanelSkeleton onClose={() => handleCloseAndCancel('nearbyOsm')} />
    );
  } else if (nearbySitesError) {
    panelContent = (
      <ErrorMessage
        message={
          nearbySitesError?.message || 'Failed to load nearby cultural sites.'
        }
        onClose={() => handleCloseAndCancel(null)}
      />
    );
  } else if (nearbySites.length > 0 && !uiSelectedPlace?._id) {
    panelContent = (
      <NearbySitesList
        sites={nearbySites}
        onClose={() => handleCloseAndCancel(null)}
      />
    );
  } else if (isPlaceError) {
    panelContent = (
      <ErrorMessage
        message={
          placeError?.message || 'Failed to load cultural site information.'
        }
        onClose={() => handleCloseAndCancel(null)}
      />
    );
  } else if (isPlaceLoading && !selectedPlaceData) {
    panelContent = (
      <SidePanelSkeleton
        onClose={() => handleCloseAndCancel('culturalSiteDetail')}
      />
    );
  } else if (selectedPlaceData) {
    panelContent = (
      <SidePanelItems
        isReviewsExpanded={isReviewsExpanded}
        toggleReviewsExpansion={() => setIsReviewsExpanded((prev) => !prev)}
        onClose={() => handleCloseAndCancel(null)}
        selectedPlaceData={selectedPlaceData}
      />
    );
  } else {
    panelContent = (
      <div className="relative h-full flex flex-col items-center justify-center p-12 text-center bg-white">
        <CloseButton onClick={() => handleCloseAndCancel(null)} />
        <div className="w-12 h-[1px] bg-gray-200 mb-6" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">
          No Archive Selected
        </p>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-white border-l border-black overflow-y-auto overflow-x-hidden custom-scrollbar">
      {panelContent}

      {/* Loading Overlay: 베를린 미니멀리즘 스타일 */}
      {isPlaceLoading &&
        !selectedPlaceData &&
        !isCreateFormOpen &&
        !isUpdateFormOpen && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-[2px] flex flex-col items-center justify-center z-[100]">
            <CloseButton
              onClick={() => handleCloseAndCancel('culturalSiteDetail')}
            />

            <div className="flex flex-col items-center gap-6">
              {/* 고정된 높이의 추상적 로더 */}
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 border-2 border-gray-100" />
                <div className="absolute inset-0 border-t-2 border-black animate-spin" />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[9px] font-black uppercase tracking-[0.5em] text-black animate-pulse">
                  Loading Entry
                </span>
                <span className="text-[8px] font-mono text-gray-400 mt-2">
                  Retrieving from Digital Archive...
                </span>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

export default SidePanelContent;
