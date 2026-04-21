import React from 'react';
import MarkerClusterGroup from 'react-leaflet-markercluster';
// 이제 L, ReactDOMServer, FaIcon 등은 이 파일에서 직접 사용하지 않습니다.
// 대신 MemoizedCulturalSiteMarker에서 사용합니다.

import MemoizedCulturalSiteMarker from './MemoizedCulturalSiteMarker'; 
import { Place } from '@/types/place';


const CulturalSiteMarkers = React.memo(({ sites, openSidePanel, selectedPlace }: { sites: Place[]; openSidePanel: (site: Place) => void; selectedPlace: Place | null }) => {
    // console.log("CulturalSiteMarkers 재렌더링됨."); // 디버깅용

    return (
        <MarkerClusterGroup chunkedLoading>
            {sites.map((culturalSite) => {
                // 현재 마커가 selectedPlace인지 확인
                const isSelected = !!selectedPlace && selectedPlace._id === culturalSite._id;
                return (
                    <MemoizedCulturalSiteMarker
                        key={culturalSite._id} // MarkerClusterGroup은 key prop을 사용합니다.
                        culturalSite={culturalSite}
                        openSidePanel={openSidePanel}
                        isSelected={isSelected}
                    />
                );
            })}
        </MarkerClusterGroup>
    );
});

export default CulturalSiteMarkers;