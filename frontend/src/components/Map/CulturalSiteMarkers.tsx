import React, {
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import { Place } from '@/types/place';
import { getClusterIcon } from '../../utils/iconFactory';
import MemoizedCulturalSiteMarker from './MemoizedCulturalSiteMarker';

interface Props {
  sites: Place[];
  openSidePanel: (site: Place) => void;
  selectedPlace: Place | null;
}

type ClusterFeature = {
  id: number;
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    cluster?: boolean;
    point_count?: number;
    siteId?: string;
    site?: Place;
  };
};

const CulturalSiteMarkers = ({
  sites,
  openSidePanel,
  selectedPlace,
}: Props) => {
  const map = useMap();
  const workerRef = useRef<Worker | null>(null);

  const [clusters, setClusters] = useState<ClusterFeature[]>([]);

  // 🧠 1. Worker 초기화
  useEffect(() => {
    const worker = new Worker(
      new URL('./cluster.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, clusters } = e.data;

      if (type === 'CLUSTERS') {
        setClusters(clusters);
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // 🧠 2. Worker에 초기 데이터 전달 (index build)
  useEffect(() => {
    if (!workerRef.current || sites.length === 0) return;

    workerRef.current.postMessage({
      type: 'INIT',
      sites,
    });
  }, [sites]);

  // 🧠 3. viewport 변경 시 cluster 요청
  const updateClusters = useCallback(() => {
    if (!workerRef.current) return;

    const bounds = map.getBounds();
    const zoom = Math.round(map.getZoom());

    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];

    workerRef.current.postMessage({
      type: 'CLUSTER',
      bbox,
      zoom,
    });
  }, [map]);

  // 🧠 4. 지도 이벤트 연결
  useMapEvents({
    moveend: updateClusters,
    zoomend: updateClusters,
  });

  // 🧠 5. 초기 1회 실행
  useEffect(() => {
    updateClusters();
  }, [updateClusters]);

  // 🧠 6. render
  return (
    <>
      {clusters.map((cluster) => {
        const [lng, lat] = cluster.geometry.coordinates;

        const {
          cluster: isCluster,
          point_count,
          siteId,
          site,
        } = cluster.properties;

        // 🔵 cluster marker
        if (isCluster) {
          return (
            <Marker
              key={`cluster-${cluster.id}`}
              position={[lat, lng]}
              icon={getClusterIcon(point_count || 0)}
              eventHandlers={{
                click: () => {
                  // 👉 Worker에서 expansionZoom까지 옮길 수도 있지만
                  // 현재는 UX 단순화를 위해 +2 zoom 방식 사용
                  const currentZoom = map.getZoom();
                  const nextZoom = Math.min(currentZoom + 2, 18);

                  map.setView([lat, lng], nextZoom);
                },
              }}
            />
          );
        }

        // 🟢 individual marker
        const isSelected =
          !!selectedPlace && selectedPlace._id === siteId;

        return (
          <MemoizedCulturalSiteMarker
            key={`site-${siteId}`}
            culturalSite={site!}
            openSidePanel={openSidePanel}
            isSelected={isSelected}
          />
        );
      })}
    </>
  );
};

export default React.memo(CulturalSiteMarkers);