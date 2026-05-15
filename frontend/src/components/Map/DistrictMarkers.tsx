import { useEffect, useRef } from 'react';
import { GeoJSON } from 'react-leaflet';
import type { Path as LeafletPath } from 'leaflet';
import type { GeoJsonObject } from 'geojson';
import type {
  DistrictBoundaryGeoJson,
  DistrictBoundaryFeature,
} from '../../api/culturalSitesApi';
import type { DistrictStat } from '../../types/place';
import L from 'leaflet';

interface DistrictMarkersProps {
  boundaries: DistrictBoundaryGeoJson;
  stats: DistrictStat[];
  onDistrictClick: (feature: DistrictBoundaryFeature) => void;
}

const DistrictMarkers = ({
  boundaries,
  stats,
  onDistrictClick,
}: DistrictMarkersProps) => {
  const countByDistrict = new Map(stats.map((stat) => [stat._id, stat.count]));
  const layerRefs = useRef<Array<L.Layer & { feature?: any }>>([]);

  const createTooltipContent = (name: string, count: number) => {
    return `
      <div class="district-tooltip-container">
        <div class="district-tooltip-label">${name.toUpperCase()}</div>
        <div class="district-tooltip-value font-mono">${count.toString().padStart(3, '0')} RECORDS</div>
      </div>
    `;
  };

  useEffect(() => {
    layerRefs.current.forEach((layer) => {
      const districtName = layer.feature?.properties?.name;
      if (!districtName) return;

      const districtCount = countByDistrict.get(districtName) ?? 0;

      layer.unbindTooltip();
      layer.bindTooltip(createTooltipContent(districtName, districtCount), {
        direction: 'center',
        className: 'archive-district-tooltip',
        permanent: false,
        sticky: true,
        opacity: 1,
      });
    });
  }, [stats]);

  const defaultStyle = {
    color: '#000000',
    weight: 1,
    dashArray: '',
    fillColor: '#000000',
    fillOpacity: 0.04,
  };

  const hoverStyle = {
    color: '#000000',
    weight: 2,
    dashArray: '',
    fillColor: '#facc15',
    fillOpacity: 0.2,
  };

  return (
    <GeoJSON
      key="district-lod-polygons"
      data={boundaries as GeoJsonObject}
      style={() => defaultStyle}
      pointToLayer={() => L.layerGroup()}
      onEachFeature={(feature, layer: L.Layer) => {
        const geoLayer = layer as L.Layer & { feature: any };
        geoLayer.feature = feature;
        layerRefs.current.push(geoLayer);

        const districtName = feature.properties?.name;
        if (!districtName) return;

        const districtCount = countByDistrict.get(districtName) ?? 0;

        const tooltip = geoLayer.bindTooltip(
          createTooltipContent(districtName, districtCount),
          {
            direction: 'center',
            className: 'archive-district-tooltip',
            sticky: true,
          },
        );

        geoLayer.on({
          mouseover: () => {
            const pathLayer = geoLayer as unknown as LeafletPath;
            pathLayer.setStyle(hoverStyle);
            pathLayer.bringToFront(); // 경계선을 강조하기 위해 앞으로 가져옴
            tooltip.openTooltip();
          },
          mouseout: () => {
            const pathLayer = geoLayer as unknown as LeafletPath;
            pathLayer.setStyle(defaultStyle);
            tooltip.closeTooltip();
          },
          click: () => onDistrictClick(feature as DistrictBoundaryFeature),
        });
      }}
    />
  );
};

export default DistrictMarkers;
