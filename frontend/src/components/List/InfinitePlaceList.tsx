import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Place } from '../../types/place';
import PlaceCard from './PlaceCard';

interface InfinitePlaceListProps {
  items: Place[];
  onItemClick: (site: Place) => void;
}

const ITEMS_PER_PAGE = 20; // 한 번에 추가할 개수

const InfinitePlaceList: React.FC<InfinitePlaceListProps> = ({ items, onItemClick }) => {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const observerTarget = useRef<HTMLDivElement>(null);

  // 검색어나 필터가 바뀌어 items가 변경되면 노출 개수 초기화
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [items]);

  const loadMore = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && visibleCount < items.length) {
      setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
    }
  }, [visibleCount, items.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(loadMore, { threshold: 0.1 });
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [loadMore]);

  const visibleItems = items.slice(0, visibleCount);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleItems.map((site) => (
          <PlaceCard key={site._id} site={site} onClick={onItemClick} />
        ))}
      </div>
      
      {/* 스크롤 감지 타겟 */}
      <div ref={observerTarget} className="h-20 flex items-center justify-center">
        {visibleCount < items.length && (
          <p className="text-gray-500 animate-pulse">Loading more sites...</p>
        )}
      </div>
    </>
  );
};

export default InfinitePlaceList;