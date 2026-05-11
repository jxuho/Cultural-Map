import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Marker, useMap, useMapEvents } from 'react-leaflet';
import { Place } from '@/types/place';
import MemoizedCulturalSiteMarker from './MemoizedCulturalSiteMarker';
import { getClusterIcon } from '../../utils/iconFactory';

interface Props {
  sites: Place[];
  openSidePanel: (site: Place) => void;
  selectedPlace: Place | null;
}

const CulturalSiteMarkers = ({
  sites,
  openSidePanel,
  selectedPlace,
}: Props) => {
  const map = useMap();
  const workerRef = useRef<Worker | null>(null);

  const [clusters, setClusters] = useState<any[]>([]);
  const [isWorkerReady, setIsWorkerReady] = useState(false);

  const rafRef = useRef<number | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const DEBOUNCE_MS = 100;

  // ---- Cluster request ----
  const requestClusters = useCallback(() => {
    if (!workerRef.current || !isWorkerReady) return;

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
  }, [map, isWorkerReady]);

  // ---- Worker init ----
  useEffect(() => {
    const worker = new Worker(new URL('./cluster.worker.ts', import.meta.url), {
      type: 'module',
    });

    workerRef.current = worker;

    worker.onmessage = (e) => {
      const { type, clusters } = e.data;
      if (type === 'READY') {
        setIsWorkerReady(true);
      }
      if (type === 'CLUSTERS') {
        setClusters(clusters);
      }
    };

    return () => {
      worker.terminate();
    };
  }, []);

  useEffect(() => {
    if (!workerRef.current || sites.length === 0) return;

    setIsWorkerReady(false);
    workerRef.current.postMessage({
      type: 'INIT',
      sites,
    });
  }, [sites]);

  // calculate clusters once when worker is ready(first load or after sites change)
  useEffect(() => {
    if (isWorkerReady) {
      requestClusters();
    }
  }, [isWorkerReady, requestClusters]);

  // ---- rAF + debounce hybrid ----
  const scheduleClusterUpdate = useCallback(() => {
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        requestClusters();
      });
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      requestClusters();
    }, DEBOUNCE_MS);
  }, [requestClusters]);

  // ---- Map events ----
  useMapEvents({
    move: scheduleClusterUpdate,
    zoom: scheduleClusterUpdate,
  });

  // ---- Cleanup ----
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <>
      {clusters.map((cluster) => {
        const [lng, lat] = cluster.geometry.coordinates;
        const {
          cluster: isCluster,
          point_count: pointCount,
          site,
          siteId,
          expansionZoom,
        } = cluster.properties;

        if (isCluster) {
          return (
            <Marker
              key={`cluster-${cluster.id}`}
              position={[lat, lng]}
              icon={getClusterIcon(pointCount)}
              eventHandlers={{
                click: () => {
                  const targetZoom = Math.min(
                    expansionZoom ?? map.getZoom() + 1,
                    18,
                  );
                  map.setView([lat, lng], targetZoom);
                },
              }}
            />
          );
        }

        const isSelected = selectedPlace?._id === siteId;
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
