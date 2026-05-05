import React from 'react';
import MarkerClusterGroup from 'react-leaflet-markercluster';

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
    // console.log("CulturalSiteMarkers rerendered.");

    return (
      <MarkerClusterGroup chunkedLoading>
        {sites.map((culturalSite) => {
          // Check if current marker is selectedPlace
          const isSelected =
            !!selectedPlace && selectedPlace._id === culturalSite._id;
          return (
            <MemoizedCulturalSiteMarker
              key={culturalSite._id}
              culturalSite={culturalSite}
              openSidePanel={openSidePanel}
              isSelected={isSelected}
            />
          );
        })}
      </MarkerClusterGroup>
    );
  },
);

export default CulturalSiteMarkers;
