import Supercluster from 'supercluster';

let index: Supercluster<any, any> | null = null;

// 🧠 simple in-memory cache
const clusterCache = new Map<string, any[]>();
const zoomCache = new Map<number, number>();

function getCacheKey(bbox: number[], zoom: number) {
  return `${bbox.join(',')}:${zoom}`;
}

self.onmessage = (e: MessageEvent) => {
  const { type, sites, bbox, zoom, clusterId } = e.data;

  // =========================
  // 1️⃣ INIT (index build)
  // =========================
  if (type === 'INIT') {
    index = new Supercluster({
      radius: 120,
      maxZoom: 16,
    });

    const points = sites.map((site: any) => ({
      type: 'Feature',
      properties: {
        cluster: false,
        siteId: site._id,
        category: site.category,
        site,
      },
      geometry: {
        type: 'Point',
        coordinates: [
          site.location.coordinates[0],
          site.location.coordinates[1],
        ],
      },
    }));

    index.load(points);

    // cache clear on re-init
    clusterCache.clear();
    zoomCache.clear();

    self.postMessage({ type: 'READY' });
    return;
  }

  // =========================
  // 2️⃣ CLUSTER (with cache)
  // =========================
  if (type === 'CLUSTER' && index) {
    const key = getCacheKey(bbox, zoom);

    if (clusterCache.has(key)) {
      self.postMessage({
        type: 'CLUSTERS',
        clusters: clusterCache.get(key),
        fromCache: true,
      });
      return;
    }

    const clusters = index.getClusters(bbox, zoom);

    clusterCache.set(key, clusters);

    self.postMessage({
      type: 'CLUSTERS',
      clusters,
      fromCache: false,
    });

    return;
  }

  // =========================
  // 3️⃣ EXPANSION ZOOM (cache)
  // =========================
  if (type === 'EXPANSION_ZOOM' && index) {
    if (zoomCache.has(clusterId)) {
      self.postMessage({
        type: 'EXPANSION_ZOOM_RESULT',
        zoom: zoomCache.get(clusterId),
      });
      return;
    }

    const zoom = index.getClusterExpansionZoom(clusterId);

    zoomCache.set(clusterId, zoom);

    self.postMessage({
      type: 'EXPANSION_ZOOM_RESULT',
      zoom,
    });

    return;
  }
};

export {};