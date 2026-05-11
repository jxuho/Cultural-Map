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

type ClusterFeature = any;

const DEBOUNCE_DELAY = 120;

const CulturalSiteMarkers = ({
  sites,
  openSidePanel,
  selectedPlace,
}: Props) => {
  const map = useMap();
  const workerRef = useRef<Worker | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [clusters, setClusters] = useState<ClusterFeature[]>([]);
  const [expansionZoomMap, setExpansionZoomMap] = useState<Map<number, number>>(new Map());

  // =========================
  // 1️⃣ Worker init
  // =========================
  useEffect(() => {
    const worker = new Worker(
      new URL('./cluster.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, clusters, zoom } = e.data;

      if (type === 'CLUSTERS') {
        setClusters(clusters);
      }

      if (type === 'EXPANSION_ZOOM_RESULT') {
        setExpansionZoomMap((prev) => {
          const next = new Map(prev);
          next.set(e.data.clusterId, zoom);
          return next;
        });
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // =========================
  // 2️⃣ INIT sites
  // =========================
  useEffect(() => {
    if (!workerRef.current || sites.length === 0) return;

    workerRef.current.postMessage({
      type: 'INIT',
      sites,
    });
  }, [sites]);

  // =========================
  // 3️⃣ Debounced cluster request
  // =========================
  const requestClusters = useCallback(() => {
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

  const debouncedUpdateClusters = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      requestClusters();
    }, DEBOUNCE_DELAY);
  }, [requestClusters]);

  // =========================
  // 4️⃣ map events
  // =========================
  useMapEvents({
    moveend: debouncedUpdateClusters,
    zoomend: debouncedUpdateClusters,
  });

  useEffect(() => {
    requestClusters();
  }, [requestClusters]);

  // =========================
  // 5️⃣ request expansion zoom
  // =========================
  const requestExpansionZoom = useCallback((clusterId: number) => {
    if (!workerRef.current) return;

    workerRef.current.postMessage({
      type: 'EXPANSION_ZOOM',
      clusterId,
    });
  }, []);

  // =========================
  // 6️⃣ render
  // =========================
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

        // 🔵 cluster
        if (isCluster) {
          return (
            <Marker
              key={`cluster-${cluster.id}`}
              position={[lat, lng]}
              icon={getClusterIcon(point_count || 0)}
              eventHandlers={{
                click: () => {
                  const zoom =
                    expansionZoomMap.get(cluster.id) ??
                    (map.getZoom() + 2);

                  if (!expansionZoomMap.has(cluster.id)) {
                    requestExpansionZoom(cluster.id);
                  }

                  map.setView([lat, lng], Math.min(zoom, 18));
                },
              }}
            />
          );
        }

        // 🟢 marker
        const isSelected =
          !!selectedPlace && selectedPlace._id === siteId;

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