import Supercluster from 'supercluster';

let index: Supercluster<any, any> | null = null;

self.onmessage = (e: MessageEvent) => {
  const { type, sites, bbox, zoom } = e.data;

  // 1️⃣ 초기 인덱스 생성
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

    self.postMessage({ type: 'READY' });
    return;
  }

  // 2️⃣ 클러스터 계산
  if (type === 'CLUSTER' && index) {
    const clusters = index.getClusters(bbox, zoom);

    self.postMessage({
      type: 'CLUSTERS',
      clusters,
    });
  }
};

export {};