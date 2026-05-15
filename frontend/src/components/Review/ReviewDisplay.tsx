import StarIcon from '../StarIcon';
import useUiStore from '../../store/uiStore';
import { User, MessageSquare } from 'lucide-react'; // 아이콘 추가

const ReviewDisplay = ({
  reviews,
  currentUser,
}: {
  reviews: any[];
  currentUser: any;
}) => {
  const openUserProfile = useUiStore((state) => state.openUserProfile);

  const handleUserClick = (user: any) => {
    if (user?._id) openUserProfile(user._id);
  };

  if (reviews.length === 0) {
    return (
      <div
        className="
        /* 기본: 큰 화면에서는 넉넉한 높이 */
        py-16 md:py-24 
        px-6 
        flex flex-col items-center justify-center 
        border-t border-black bg-white 
        text-center
      "
      >
        {/* 아이콘 크기 반응형 조절 */}
        <MessageSquare className="text-gray-200 mb-4 md:mb-6 w-8 h-8 md:w-10 md:h-10 transition-all" />

        <p
          className="
          text-[9px] md:text-[11px] 
          font-black uppercase 
          tracking-[0.15em] md:tracking-[0.3em] 
          text-gray-400 
          max-w-[200px] md:max-w-none 
          leading-relaxed
        "
        >
          {currentUser
            ? 'Archive Empty: Be the first to contribute'
            : 'No public records found'}
        </p>

        {/* 장식적 요소: 베를린 스타일의 하단 라인 (작은 화면에서 디테일 강조) */}
        <div className="mt-6 w-8 h-[1px] bg-gray-200 md:hidden" />
      </div>
    );
  }
  return (
    <div className="divide-y divide-black border-t border-black bg-white">
      {reviews.map((review) => (
        <div
          key={review._id}
          className="p-6 transition-colors hover:bg-[#fcfcfc] group"
        >
          {/* Header: User Info & Rating */}
          <div className="flex items-center justify-between mb-4">
            <div
              className="flex items-center gap-3 cursor-pointer group/user"
              onClick={() => handleUserClick(review.user)}
            >
              {review.user?.profileImage ? (
                <img
                  src={review.user.profileImage}
                  alt={review.user.username}
                  className="w-10 h-10 rounded-none border border-black object-cover grayscale group-hover/user:grayscale-0 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              ) : (
                <div className="w-10 h-10 border border-black flex items-center justify-center bg-gray-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <User size={18} className="text-gray-400" />
                </div>
              )}
              <div>
                <p className="text-xs font-black uppercase tracking-tighter group-hover/user:underline decoration-2">
                  {review.user?.username || 'ANONYMOUS_OBSERVER'}
                </p>
                <p className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                  Contributor ID: {review.user?._id?.slice(-6) || 'XXXXXX'}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <StarIcon
                    key={i}
                    rating={review.rating}
                    index={i}
                    className="w-3 h-3"
                    displayMode="reviewForm"
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold font-mono bg-black text-white px-1 leading-tight">
                {review.rating.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Body: Comment */}
          {review.comment && (
            <div className="relative pl-4 border-l-2 border-black/10 py-1 mb-4">
              <p className="text-sm text-gray-700 leading-relaxed font-serif italic">
                "{review.comment}"
              </p>
            </div>
          )}

          {/* Footer: Date */}
          <div className="flex justify-end">
            <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-gray-400">
              Logged:{' '}
              {new Date(review.createdAt).toLocaleDateString('en-GB', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ReviewDisplay;
