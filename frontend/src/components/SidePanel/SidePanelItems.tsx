import { useCallback } from 'react';
import { BsStar, BsStarFill } from 'react-icons/bs';
import { ChevronUp, ChevronDown, Globe, MapPin, Clock, Info, X } from 'lucide-react'; 
import StarIcon from '../StarIcon';
import ReviewForm from '../Review/ReviewForm';
import ReviewDisplay from '../Review/ReviewDisplay';
import useAuthStore from '../../store/authStore';
import { useCulturalSiteDetail } from '../../hooks/data/useCulturalSitesQueries';
import { useFavoriteMutation, useMyFavorites } from '../../hooks/data/useFavoriteQueries';
import { usePlaceReviews, useReviewMutation } from '../../hooks/data/useReviewQueries';
import useUiStore from '../../store/uiStore';
import ErrorMessage from '../ErrorMessage';
import { Place } from '@/types/place';

interface SidePanelItemsProps {
  isReviewsExpanded: boolean;
  toggleReviewsExpansion: () => void;
  onClose: () => void; // 부모로부터 전달받은 닫기 함수
  selectedPlaceData: Place | null;
}

const SidePanelItems = ({
  isReviewsExpanded,
  toggleReviewsExpansion,
  onClose, // Props 구조 분해 할당
}: SidePanelItemsProps) => {
  const currentUser = useAuthStore((state) => state.user);
  const uiSelectedPlace = useUiStore((state) => state.selectedPlace);
  const setJumpToPlace = useUiStore((state) => state.setJumpToPlace);

  const { data: selectedPlaceData } = useCulturalSiteDetail(uiSelectedPlace?._id);
  const { data: reviews = [], isLoading: loadingReviews, isError: reviewFetchError } = 
    usePlaceReviews(uiSelectedPlace?._id, isReviewsExpanded);
  const { data: myFavorites = [] } = useMyFavorites(currentUser?._id);

  const reviewMutation = useReviewMutation();
  const favoriteMutation = useFavoriteMutation();

  const userReview = reviews.find((r) => typeof r.user !== 'string' && r.user?._id === currentUser?._id) || null;
  const otherReviews = reviews.filter((r) => (typeof r.user === 'string' ? r.user !== currentUser?._id : r.user?._id !== currentUser?._id));
  const isSelectedPlaceFavorite = myFavorites.some((obj) => obj._id === uiSelectedPlace?._id);

  const handleFavoriteChange = useCallback(async (newStatus: boolean) => {
    if (!currentUser) return alert('Please sign in to manage favorites.');
    await favoriteMutation.mutateAsync({
      actionType: newStatus ? 'add' : 'delete',
      culturalSiteId: uiSelectedPlace?._id || '',
    });
  }, [favoriteMutation, uiSelectedPlace?._id, currentUser]);

  const handleReviewActionCompleted = useCallback(async (actionType: 'create' | 'update' | 'delete', newRating: number | null, oldRating: number | null, comment?: string) => {
    if (!currentUser || !uiSelectedPlace?._id) return;
    await reviewMutation.mutateAsync({
      actionType,
      placeId: uiSelectedPlace._id,
      reviewId: actionType === 'create' ? undefined : userReview?._id,
      reviewData: actionType === 'delete' ? undefined : { rating: newRating ?? 0, comment: comment ?? '' },
      oldRating: oldRating ?? undefined,
    });
  }, [reviewMutation, uiSelectedPlace?._id, userReview?._id, currentUser]);

  if (!selectedPlaceData) return <ErrorMessage message="Data retrieval failed." />;

  // General Information 항목 존재 여부 체크
  const hasGeneralInfo = selectedPlaceData.address?.fullAddress || selectedPlaceData.openingHours || selectedPlaceData.website;

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-500">
      {/* 1. Header: 장소명, 즐겨찾기 및 닫기 버튼 */}
{/* 1. Header: 장소명, 즐겨찾기 및 닫기 버튼 */}
<header className="p-6 border-b-2 border-black relative">
  <div className="flex justify-between items-start gap-4 mb-4">
    {/* 
        min-w-0: flex 자식 내에서 텍스트가 길어질 때 
        부모의 가로 폭을 넘지 않고 줄바꿈(break-words)되게 함 
    */}
    <h2 
      className="text-3xl font-black tracking-tighter uppercase leading-[1.1] cursor-pointer hover:text-gray-600 transition-colors break-words flex-1 min-w-0"
      onClick={() => setJumpToPlace(selectedPlaceData)}
    >
      {selectedPlaceData.name}
    </h2>
    
    {/* shrink-0: 버튼 뭉치가 찌그러지거나 밀리지 않도록 고정 */}
    <div className="flex items-center gap-3 shrink-0 ml-2 mt-1">
      {currentUser && (
        <button
          onClick={() => handleFavoriteChange(!isSelectedPlaceFavorite)}
          className={`transition-transform active:scale-90 p-1 ${isSelectedPlaceFavorite ? 'text-black' : 'text-gray-300 hover:text-black'}`}
          disabled={favoriteMutation.isPending}
        >
          {isSelectedPlaceFavorite ? <BsStarFill size={20} /> : <BsStar size={20} />}
        </button>
      )}
      <button 
        onClick={onClose}
        className="text-black hover:rotate-90 transition-transform duration-300 p-1"
      >
        <X size={28} strokeWidth={2.5} />
      </button>
    </div>
  </div>
  <div className="inline-block bg-black text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest">
    {selectedPlaceData.category?.replace(/_/g, ' ') || 'Cultural Site'}
  </div>
</header>

      {/* 2. Review Toggle */}
      <section 
        className={`flex items-center justify-between px-6 py-4 cursor-pointer transition-colors border-b border-black ${isReviewsExpanded ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'}`}
        onClick={toggleReviewsExpansion}
      >
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-black uppercase tracking-widest">
            Community Archive ({selectedPlaceData.reviewCount || 0})
          </span>
          {selectedPlaceData.averageRating ? (
            <div className="flex items-center gap-2 border-l border-current pl-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} rating={selectedPlaceData.averageRating!} index={i} className="w-3 h-3" displayMode="averageRating" />
                ))}
              </div>
              <span className="font-mono text-sm font-bold">{selectedPlaceData.averageRating.toFixed(1)}</span>
            </div>
          ) : null}
        </div>
        {isReviewsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </section>

      {/* 3. Main Content Area */}
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#f9f9f9]">
        {isReviewsExpanded ? (
          <div className="bg-white min-h-full">
            {/* ... 리뷰 섹션 생략 (이전과 동일) ... */}
            {currentUser ? (
              <ReviewForm
                placeId={selectedPlaceData._id}
                userReview={userReview}
                onReviewActionCompleted={handleReviewActionCompleted}
                currentUser={currentUser}
                isSubmitting={reviewMutation.isPending}
                submitError={reviewMutation.isError ? reviewMutation.error?.message : null}
              />
            ) : (
              <div className="p-8 text-center border-b border-gray-100 italic text-gray-400 text-sm">
                Sign in to contribute to the archive.
              </div>
            )}
            {loadingReviews ? (
              <div className="p-10 text-center text-[10px] uppercase tracking-widest animate-pulse">Syncing Reviews...</div>
            ) : (
              <ReviewDisplay reviews={otherReviews} currentUser={currentUser} />
            )}
          </div>
        ) : (
          <div className="p-6 space-y-8">
            {/* General Information Block */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Info size={14} className="text-black" />
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">General Information</h3>
              </div>
              
              {hasGeneralInfo ? (
                <div className="grid gap-4 bg-white border border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  {selectedPlaceData.address?.fullAddress && (
                    <div className="flex gap-4">
                      <MapPin size={16} className="shrink-0 mt-0.5 text-gray-400" />
                      <div>
                        <label className="block text-[9px] uppercase text-gray-400 font-bold tracking-tight mb-1">Location</label>
                        <p className="text-sm font-medium leading-snug">{selectedPlaceData.address.fullAddress}</p>
                      </div>
                    </div>
                  )}

                  {selectedPlaceData.openingHours && (
                    <div className="flex gap-4">
                      <Clock size={16} className="shrink-0 mt-0.5 text-gray-400" />
                      <div>
                        <label className="block text-[9px] uppercase text-gray-400 font-bold tracking-tight mb-1">Access Hours</label>
                        <p className="text-sm font-medium leading-snug font-mono italic">{selectedPlaceData.openingHours}</p>
                      </div>
                    </div>
                  )}

                  {selectedPlaceData.website && (
                    <div className="flex gap-4 pt-2 border-t border-gray-100">
                      <Globe size={16} className="shrink-0 text-gray-400" />
                      <a 
                        href={selectedPlaceData.website} target="_blank" rel="noopener noreferrer"
                        className="text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-colors px-1"
                      >
                        Official Website →
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 px-5 border border-dashed border-gray-300 text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                    No general information registered for this record.
                  </p>
                </div>
              )}
            </div>

            {/* Description Block */}
            {selectedPlaceData.description && (
              <div className="space-y-3">
                 <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Description</h3>
                 <div className="bg-white border-l-4 border-black p-4 italic text-sm text-gray-700 leading-relaxed font-serif">
                   "{selectedPlaceData.description}"
                 </div>
              </div>
            )}

            {/* Metadata Tags Block with Clickable Links */}
            {selectedPlaceData.originalTags && Object.keys(selectedPlaceData.originalTags).length > 0 && (
              <div className="space-y-3">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Metadata Tags</h3>
                <div className="flex flex-wrap gap-1.5 font-mono">
                  {Object.entries(selectedPlaceData.originalTags).map(([key, value]) => {
                    if (key === 'name') return null;
                    const valString = String(value);
                    const isLink = valString.startsWith('http');

                    return (
                      <div key={key} className="text-[10px] flex overflow-hidden border border-gray-200">
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 border-r border-gray-200">{key}</span>
                        {isLink ? (
                          <a 
                            href={valString} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-2 py-1 bg-white text-blue-600 font-bold hover:bg-black hover:text-white transition-colors underline decoration-blue-200"
                          >
                            Link ↗
                          </a>
                        ) : (
                          <span className="px-2 py-1 bg-white text-gray-700">{valString}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SidePanelItems;