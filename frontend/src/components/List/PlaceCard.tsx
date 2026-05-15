import React from 'react';
import { FaHeart, FaCommentAlt, FaArrowRight } from 'react-icons/fa';
import { Place } from '../../types/place';

interface PlaceCardProps {
  site: Place;
  onClick: (site: Place) => void;
}

const formatCategoryName = (name: string): string => {
  if (!name) return '';
  return name
    .replace(/_/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const PlaceCard: React.FC<PlaceCardProps> = React.memo(({ site, onClick }) => {
  return (
    <article
      className="group bg-white p-8 border-none hover:bg-[#fcfcfc] transition-all duration-500 flex flex-col cursor-pointer relative overflow-hidden h-full"
      onClick={() => onClick(site)}
    >
      {/* 1. Reference Number (Top Label) */}
      <div className="text-[10px] font-mono text-gray-400 mb-4 tracking-widest uppercase flex justify-between items-center">
        <span>Ref. No: {site._id.slice(-6).toUpperCase()}</span>
        {/* 호버 시에만 나타나는 아주 작은 도트 (바우하우스 스타일 포인트) */}
        <div className="w-1.5 h-1.5 bg-black opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      </div>

      {/* 2. Title Section */}
      <h2 className="text-xl md:text-2xl font-black tracking-tight text-black mb-3 leading-tight group-hover:text-black/70 transition-colors line-clamp-2 min-h-[3.5rem]">
        {site.name}
      </h2>

      {/* 3. Metadata Section */}
      <div className="flex flex-wrap items-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-6 gap-4">
        {site.averageRating != null && (
          <div className="flex items-center bg-black text-white px-2 py-0.5 tracking-normal">
            <span className="mr-1 text-[9px]">SCORE</span>
            <span className="text-[11px]">{site.averageRating.toFixed(1)}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 group-hover:text-black transition-colors">
          <FaCommentAlt size={9} />
          <span>{site.reviewCount ?? site.reviews?.length ?? 0} INDEXED</span>
        </div>
        <div className="flex items-center gap-1.5 group-hover:text-black transition-colors">
          <FaHeart
            size={9}
            className="group-hover:text-red-600 transition-colors"
          />
          <span>{site.favoritesCount || 0} SAVED</span>
        </div>
      </div>

      {/* 4. Description (Serif font for historical feel) */}
      {site.description && (
        <p className="mb-8 text-[13px] leading-relaxed text-gray-500 line-clamp-2 font-serif italic border-l border-gray-200 pl-4 group-hover:border-black transition-colors duration-500">
          {site.description}
        </p>
      )}

      {/* 5. Bottom Section (Pinned to bottom) */}
      <div className="mt-auto pt-6 border-t border-gray-100 group-hover:border-black/10 transition-colors">
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest group-hover:text-gray-400 transition-colors">
              Classification
            </span>
            <span className="text-[11px] font-semibold text-black uppercase tracking-wider">
              {formatCategoryName(site.category)}
            </span>
          </div>

          {/* Action: "View Details" 애니메이션 최적화 */}
          <div className="flex items-center gap-2 text-black translate-y-[5px] group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out">
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">
              Open Archive
            </span>
            <FaArrowRight size={10} />
          </div>
        </div>
      </div>

      {/* 우측 상단 회색 박스 대신 사용되는 '포커스 라인' (호버 시 아래로 살짝 내려옴) */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-black translate-y-[-2px] group-hover:translate-y-0 transition-transform duration-500" />
    </article>
  );
});

export default PlaceCard;
