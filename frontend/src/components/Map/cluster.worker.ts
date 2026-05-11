import { Place } from '@/types/place';
import Supercluster from 'supercluster';

let index: Supercluster<any, any> | null = null;

self.onmessage = (e: MessageEvent) => {
  const { type, sites, bbox, zoom } = e.data;

  // INIT: initialize Supercluster with site data
  if (type === 'INIT') {
    index = new Supercluster({ radius: 120, maxZoom: 16 });

    const points = sites.map((site: Place) => ({
      type: 'Feature',
      properties: {
        cluster: false,
        siteId: site._id,
        category: site.category,
        site,
      },
      geometry: {
        type: 'Point',
        coordinates: site.location.coordinates,
      },
    }));

    index.load(points);
    self.postMessage({ type: 'READY' });
    return;
  }

  // CLUSTER: cluster sites based on current bbox and zoom
  if (type === 'CLUSTER' && index) {
    const clusters = index.getClusters(bbox, zoom);

    // Add expansion zoom level to clusters for better UX
    const clustersWithZoom = clusters.map((c) => {
      if (c.properties?.cluster) {
        c.properties.expansionZoom = index!.getClusterExpansionZoom(
          c.id as number,
        );
      }
      return c;
    });

    self.postMessage({
      type: 'CLUSTERS',
      clusters: clustersWithZoom,
    });
  }
};

export {};
