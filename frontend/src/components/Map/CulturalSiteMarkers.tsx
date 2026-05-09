import React, { useMemo } from 'react';
import MarkerClusterGroup from 'react-leaflet-cluster';
import MemoizedCulturalSiteMarker from './MemoizedCulturalSiteMarker';
import { Place } from '@/types/place';

const CulturalSiteMarkers = React.memo(
  ({
    sites,
    openSidePanel,
    selectedPlace,
  }: {
    sites: Place[];
    openSidePanel: (site: Place) => void;
    selectedPlace: Place | null;
  }) => {
    
    // 1.7만 개의 마커 컴포넌트 생성을 메모이제이션하여 
    // selectedPlace가 바뀔 때만 필요한 부분만 재계산하도록 보호합니다.
    const renderedMarkers = useMemo(() => {
      return sites.map((culturalSite) => {
        const isSelected = !!selectedPlace && selectedPlace._id === culturalSite._id;
        return (
          <MemoizedCulturalSiteMarker
            key={culturalSite._id}
            culturalSite={culturalSite}
            openSidePanel={openSidePanel}
            isSelected={isSelected}
          />
        );
      });
    }, [sites, selectedPlace, openSidePanel]);

    return (
      <MarkerClusterGroup
        // 1. 대용량 데이터를 위한 핵심 옵션
        chunkedLoading={true}
        chunkInterval={30}
        chunkDelay={80}
        removeOutsideVisibleBounds={true}
        disableClusteringAtZoom={18}
        
        // 2. 클러스터링 반경 (너무 작으면 성능 저하, 50~80 권장)
        maxClusterRadius={90}
        
        // 3. 애니메이션 및 기타 성능 옵션
        animate={false}
        animateAddingMarkers={false}
        spiderfyOnMaxZoom={false}
        
      >
        {renderedMarkers}
      </MarkerClusterGroup>
    );
  },
);

export default CulturalSiteMarkers;