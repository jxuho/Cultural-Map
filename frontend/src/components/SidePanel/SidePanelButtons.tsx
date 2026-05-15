import React from 'react';
import useAuthStore from '../../store/authStore';
import useUiStore from '../../store/uiStore';
import { Edit3, Trash2, HelpCircle, AlertTriangle } from 'lucide-react'; // 아이콘 추가
import {
  useCulturalSiteDetail,
  useDeleteCulturalSite,
} from '../../hooks/data/useCulturalSitesQueries';

const SidePanelButtons: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const role = user?.role;

  const {
    openUpdateForm,
    openModal,
    closeModal,
    isCreateFormOpen,
    isUpdateFormOpen,
    selectedPlace: uiSelectedPlace,
    handleCloseAndCancel,
    isUserProfileOpen,
  } = useUiStore();

  const deleteCulturalSiteMutation = useDeleteCulturalSite();
  const { data: selectedPlaceData } = useCulturalSiteDetail(uiSelectedPlace?._id);

  const editThisSiteButtonClickHandler = (): void => {
    if (selectedPlaceData) openUpdateForm(selectedPlaceData);
  };

  const suggestEditButtonClickHandler = (): void => {
    if (selectedPlaceData) openUpdateForm(selectedPlaceData);
  };

  const deleteThisSiteButtonClickHandler = (): void => {
    if (!selectedPlaceData?._id) return;

    openModal(
      <div className="bg-white border-2 border-black p-8 max-w-sm">
        <div className="flex justify-center mb-4">
          <div className="bg-red-600 text-white p-3">
            <AlertTriangle size={32} />
          </div>
        </div>
        <h3 className="text-lg font-black uppercase tracking-tighter text-center mb-4">
          Permanent Deletion
        </h3>
        <p className="text-[13px] text-gray-500 leading-relaxed text-center mb-8 font-serif italic">
          Are you sure you want to remove "<span className="text-black font-bold not-italic">{selectedPlaceData.name}</span>" from the digital archive? This operation is irreversible.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={async () => {
              try {
                await deleteCulturalSiteMutation.mutateAsync(selectedPlaceData._id);
                closeModal();
                handleCloseAndCancel(null);
              } catch (error) {
                alert('Deletion failed. Please check permissions.');
              }
            }}
            className="w-full bg-black text-white py-3 text-[11px] font-black uppercase tracking-widest hover:bg-red-700 transition-colors"
          >
            Confirm Deletion
          </button>
          <button
            onClick={closeModal}
            className="w-full bg-white text-black border border-gray-200 py-3 text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>,
    );
  };

  const showButtons = !!selectedPlaceData && !isCreateFormOpen && !isUpdateFormOpen && !isUserProfileOpen;

  if (!showButtons) return null;

  return (
    <div className="flex flex-col gap-0 border-t-2 border-black">
      {/* 관리 도구 레이블 */}
      <div className="bg-black text-white py-1 px-4 self-start text-[9px] font-black uppercase tracking-[0.3em]">
        Entry Operations
      </div>

      <div className="flex w-full divide-x divide-black border-b border-black">
        {role === 'admin' ? (
          <>
            <button
              onClick={editThisSiteButtonClickHandler}
              className="flex-1 flex items-center justify-center gap-3 py-4 bg-white hover:bg-gray-50 text-black transition-all group"
            >
              <Edit3 size={14} className="group-hover:rotate-12 transition-transform" />
              <span className="text-[11px] font-black uppercase tracking-widest">Update Record</span>
            </button>
            <button
              onClick={deleteThisSiteButtonClickHandler}
              className="flex-1 flex items-center justify-center gap-3 py-4 bg-white hover:bg-red-50 text-red-600 transition-all group"
            >
              <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-black uppercase tracking-widest">Delete Entry</span>
            </button>
          </>
        ) : (
          <button
            onClick={suggestEditButtonClickHandler}
            className="w-full flex items-center justify-center gap-3 py-5 bg-white hover:bg-gray-50 text-black transition-all group"
          >
            <HelpCircle size={14} />
            <span className="text-[11px] font-black uppercase tracking-widest">Suggest Revision</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SidePanelButtons;