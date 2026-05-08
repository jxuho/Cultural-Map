import React, { useMemo } from 'react';
// 라이브러리 변경
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
        
        // 2. 클러스터링 반경 (너무 작으면 성능 저하, 50~80 권장)
        maxClusterRadius={60} 
        
        // 3. 애니메이션 및 기타 성능 옵션
        animate={true}
        spiderfyOnMaxZoom={true}
        
        // 4. 아이콘 단순화를 하지 않으려면 별도의 iconCreateFunction을 지정하지 않습니다.
        // 그러면 기본 Leaflet 클러스터 아이콘이 적용됩니다.
      >
        {renderedMarkers}
      </MarkerClusterGroup>
    );
  },
);

export default CulturalSiteMarkers;