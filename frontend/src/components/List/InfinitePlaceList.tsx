import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Place } from '../../types/place';
import PlaceCard from './PlaceCard';

interface InfinitePlaceListProps {
  items: Place[];
  onItemClick: (site: Place) => void;
}

const ITEMS_PER_PAGE = 20;

const InfinitePlaceList: React.FC<InfinitePlaceListProps> = ({ items, onItemClick }) => {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const observerTarget = useRef<HTMLDivElement>(null);

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
    const observer = new IntersectionObserver(loadMore, { 
      threshold: 0.1,
      rootMargin: '100px' // 사용자 경험을 위해 미리 로딩
    });
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [loadMore]);

  const visibleItems = items.slice(0, visibleCount);

  return (
    <div className="max-w-7xl mx-auto py-12 px-6">
      {/* Archive Statistics Header */}
      <div className="mb-12 flex items-baseline justify-between border-b-2 border-black pb-4">
        <h3 className="text-[14px] font-black uppercase tracking-[0.4em] text-black">
          Index of Heritage Sites
        </h3>
        <span className="font-mono text-[11px] text-gray-400 uppercase">
          Total Entries: {items.length} / Showing: {visibleItems.length}
        </span>
      </div>

      {/* Grid: Gap is reduced to emphasize the "Archive" feel */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-0 border-l border-t border-black">
        {visibleItems.map((site) => (
          <div key={site._id} className="border-r border-b border-black">
            <PlaceCard site={site} onClick={onItemClick} />
          </div>
        ))}
      </div>
      
      {/* Modernist Loader */}
      <div ref={observerTarget} className="h-40 flex flex-col items-center justify-center gap-4">
        {visibleCount < items.length ? (
          <>
            <div className="w-12 h-[1px] bg-black animate-pulse" />
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-black animate-pulse">
              Retrieving Archives
            </p>
          </>
        ) : (
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-gray-300">
            End of Record
          </p>
        )}
      </div>
    </div>
  );
};

export default InfinitePlaceList;