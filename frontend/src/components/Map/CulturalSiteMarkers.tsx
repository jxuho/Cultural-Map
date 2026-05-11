import React, { useState, useCallback, useEffect, useMemo, use } from 'react';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import Supercluster from 'supercluster';
import { Place } from '@/types/place';
import { getClusterIcon } from '../../utils/iconFactory';
import MemoizedCulturalSiteMarker from './MemoizedCulturalSiteMarker';

interface Props {
  sites: Place[];
  openSidePanel: (site: Place) => void;
  selectedPlace: Place | null;
}

const CulturalSiteMarkers = ({ sites, openSidePanel, selectedPlace }: Props) => {
  const map = useMap();
  const [clusters, setClusters] = useState<any[]>([]);

  // 1. Supercluster 인스턴스 초기화 (사이트 데이터가 바뀔 때만 재색인)
  const index = useMemo(() => {
    const sc = new Supercluster({
      radius: 120,
      maxZoom: 16, // 이 줌 이상에서는 클러스터링 해제
    });

    // 데이터를 GeoJSON Feature 형태로 변환
    const points = sites.map((site) => ({
      type: 'Feature' as const,
      properties: {
        cluster: false,
        siteId: site._id,
        category: site.category,
        site: site, // 나중에 개별 마커 렌더링 시 필요
      },
      geometry: {
        type: 'Point' as const,
        coordinates: [site.location.coordinates[0], site.location.coordinates[1]],
      },
    }));

    sc.load(points);
    return sc;
  }, [sites]);

  // 2. 현재 뷰포트 내의 클러스터/마커 계산 함수
  const updateClusters = useCallback(() => {
    const bounds = map.getBounds();
    const zoom = Math.round(map.getZoom());

    // Supercluster용 bbox 형식: [west, south, east, north]
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];

    const currentClusters = index.getClusters(bbox, zoom);
    setClusters(currentClusters);
  }, [index, map]);

  // 3. 지도 이동/줌 이벤트 발생 시 클러스터 업데이트
  useMapEvents({
    moveend: () => updateClusters(),
    zoomend: () => updateClusters(),
  });

  // 초기 렌더링 시 실행
  useEffect(() => {
    updateClusters();
  }, [updateClusters]);

  return (
    <>
      {clusters.map((cluster) => {
        const [longitude, latitude] = cluster.geometry.coordinates;
        const { cluster: isCluster, point_count: pointCount, siteId, category, site } = cluster.properties;

        if (isCluster) {
          // 클러스터 렌더링
          return (
            <Marker
              key={`cluster-${cluster.id}`}
              position={[latitude, longitude]}
              icon={getClusterIcon(pointCount)}
              eventHandlers={{
                click: () => {
                  const expansionZoom = Math.min(
                    index.getClusterExpansionZoom(cluster.id),
                    18
                  );
                  map.setView([latitude, longitude], expansionZoom);
                },
              }}
            />
          );
        }

        // 개별 마커 렌더링 (MemoizedCulturalSiteMarker 재사용)
        const isSelected = !!selectedPlace && selectedPlace._id === siteId;
        return (
          <MemoizedCulturalSiteMarker
            key={`site-${siteId}`}
            culturalSite={site}
            openSidePanel={openSidePanel}
            isSelected={isSelected}
          />
        );
      })}
    </>
  );
};

export default React.memo(CulturalSiteMarkers);