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

  // stats 변경 시 tooltip 갱신
  useEffect(() => {
    layerRefs.current.forEach((layer) => {
      const districtName = layer.feature?.properties?.name;
      if (!districtName) return;

      const districtCount = countByDistrict.get(districtName) ?? 0;

      layer.unbindTooltip();
      layer.bindTooltip(`${districtName}: ${districtCount} sites`, {
        direction: 'center',
        className: 'district-lod-tooltip',
        sticky: true,
      });
    });
  }, [stats]);

  return (
    <GeoJSON
      key="district-lod-polygons"
      data={boundaries as GeoJsonObject}
      style={() => ({
        color: '#2563eb',
        weight: 1.5,
        fillColor: '#2563eb',
        fillOpacity: 0.06,
      })}
      pointToLayer={() => L.layerGroup()}
      onEachFeature={(feature, layer: L.Layer) => {
        const geoLayer = layer as L.Layer & { feature: any };
        geoLayer.feature = feature;
        layerRefs.current.push(geoLayer);

        const districtName = feature.properties?.name;
        if (!districtName) return;

        const districtCount = countByDistrict.get(districtName) ?? 0;

        const tooltip = geoLayer.bindTooltip(
          `${districtName}: ${districtCount} sites`,
          {
            direction: 'center',
            className: 'district-lod-tooltip',
            sticky: true,
          }
        );

        geoLayer.on({
          mouseover: () => {
            const pathLayer = geoLayer as unknown as LeafletPath;
            pathLayer.setStyle({
              weight: 2.5,
              fillOpacity: 0.35,
            });
            tooltip.openTooltip();
          },
          mouseout: () => {
            const pathLayer = geoLayer as unknown as LeafletPath;
            pathLayer.setStyle({
              weight: 1.5,
              fillOpacity: 0.06,
            });
            tooltip.closeTooltip();
          },
          click: () => onDistrictClick(feature as DistrictBoundaryFeature),
        });
      }}
    />
  );
};

export default DistrictMarkers;