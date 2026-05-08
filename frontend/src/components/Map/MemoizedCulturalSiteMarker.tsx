import React from 'react';
import { Marker } from 'react-leaflet';
import { Place } from '@/types/place';
import { getCustomIcon } from '../../utils/iconFactory';

// Components for individual markers
const MemoizedCulturalSiteMarker = React.memo(
  ({
    culturalSite,
    openSidePanel,
    isSelected,
  }: {
    culturalSite: Place;
    openSidePanel: (site: Place) => void;
    isSelected: boolean;
  }) => {
    const iconToRender = getCustomIcon(culturalSite.category, isSelected);

    return (
      <Marker
        position={[
          culturalSite.location.coordinates[1],
          culturalSite.location.coordinates[0],
        ]}
        icon={iconToRender}
        zIndexOffset={isSelected ? 1000 : 0}
        eventHandlers={{
          click: () => openSidePanel(culturalSite),
        }}
      />
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.culturalSite === nextProps.culturalSite &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.openSidePanel === nextProps.openSidePanel
    );
  },
);

export default MemoizedCulturalSiteMarker;
