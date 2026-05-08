// backend/config/osmData.js
const CITY_RELATION_IDS = {
  chemnitz: 62594,
  berlin: 62422,
};

const singleElementQuery = (osmType, osmId) => {
  return `[out:json][timeout:25];
          ${osmType}(${osmId});
          out center;`;
};



const baseCulturalSiteQuery = (areaId, radius, lat, lon) => {
  const useAround = radius && lat && lon;
  const around = useAround ? `(around:${radius},${lat},${lon})` : '';
  const AREA_ID = 3600000000 + areaId;

  return `
  [out:json][timeout:90];
  area(${AREA_ID})->.searchArea;
  (
    // 1. 역사적 가치가 있는 모든 장소 (성, 기념비, 유적지 등)
    node["historic"~"monument|memorial|castle|ruins|archaeological_site|heritage"](area.searchArea)${around};
    way["historic"~"monument|memorial|castle|ruins|archaeological_site|heritage"](area.searchArea)${around};
    relation["historic"~"monument|memorial|castle|ruins|archaeological_site|heritage"](area.searchArea)${around};

    // 2. 문화 유산 보호 등급이 지정된 건물
    node["heritage"](area.searchArea)${around};
    way["heritage"](area.searchArea)${around};
    relation["heritage"](area.searchArea)${around};

    // 3. 박물관 및 예술 관련 (레스토랑 제외, 순수 예술/전시 위주)
    node["tourism"~"museum|gallery|artwork"](area.searchArea)${around};
    way["tourism"~"museum|gallery|artwork"](area.searchArea)${around};
    relation["tourism"~"museum|gallery|artwork"](area.searchArea)${around};

    // 4. 종교적 역사 건축물 (유럽 문화유산의 큰 비중)
    node["amenity"="place_of_worship"]["historic"](area.searchArea)${around};
    way["amenity"="place_of_worship"]["historic"](area.searchArea)${around};
    relation["amenity"="place_of_worship"]["historic"](area.searchArea)${around};

    // 5. 공연 예술 (역사적 극장 등)
    node["amenity"~"theatre|arts_centre"](area.searchArea)${around};
    way["amenity"~"theatre|arts_centre"](area.searchArea)${around};
    relation["amenity"~"theatre|arts_centre"](area.searchArea)${around};
  );
  out center;
  `;
};



// const baseCulturalSiteQuery = (areaId, radius, lat, lon) => {
//   const useAround = radius && lat && lon;
//   const around = useAround ? `(around:${radius},${lat},${lon})` : '';

//   // const AREA_ID = 3600000000 + CHEMNITZ_RELATION_ID;
//   const AREA_ID = 3600000000 + areaId;

//   return `
//   [out:json][timeout:60];
//   area(${AREA_ID})->.searchArea;
//   (
//     node["tourism"="museum"](area.searchArea)${around};
//     way["tourism"="museum"](area.searchArea)${around};
//     relation["tourism"="museum"](area.searchArea)${around};

//     node["tourism"="artwork"](area.searchArea)${around};
//     way["tourism"="artwork"](area.searchArea)${around};
//     relation["tourism"="artwork"](area.searchArea)${around};

//     node["tourism"="gallery"](area.searchArea)${around};
//     way["tourism"="gallery"](area.searchArea)${around};
//     relation["tourism"="gallery"](area.searchArea)${around};

//     node["art_gallery"="yes"](area.searchArea)${around};
//     way["art_gallery"="yes"](area.searchArea)${around};
//     relation["art_gallery"="yes"](area.searchArea)${around};

//     node["amenity"="theatre"](area.searchArea)${around};
//     way["amenity"="theatre"](area.searchArea)${around};
//     relation["amenity"="theatre"](area.searchArea)${around};

//     node["amenity"="restaurant"](area.searchArea)${around};
//     way["amenity"="restaurant"](area.searchArea)${around};
//     relation["amenity"="restaurant"](area.searchArea)${around};

//     node["tourism"="attraction"](area.searchArea)${around};
//     way["tourism"="attraction"](area.searchArea)${around};
//     relation["tourism"="attraction"](area.searchArea)${around};

//     node["amenity"="arts_centre"](area.searchArea)${around};
//     way["amenity"="arts_centre"](area.searchArea)${around};
//     relation["amenity"="arts_centre"](area.searchArea)${around};

//     node["amenity"="community_centre"](area.searchArea)${around};
//     way["amenity"="community_centre"](area.searchArea)${around};
//     relation["amenity"="community_centre"](area.searchArea)${around};

//     node["amenity"="library"](area.searchArea)${around};
//     way["amenity"="library"](area.searchArea)${around};
//     relation["amenity"="library"](area.searchArea)${around};

//     node["amenity"="cinema"](area.searchArea)${around};
//     way["amenity"="cinema"](area.searchArea)${around};
//     relation["amenity"="cinema"](area.searchArea)${around};
//   );
//   out center;
// `;
// };

// const extendedCulturalSiteQuery = (areaId, radius, lat, lon) => {
//   console.log('trigger');
  
//   const useAround = radius && lat && lon;
//   const around = useAround ? `(around:${radius},${lat},${lon})` : '';
//   const AREA_ID = 3600000000 + areaId;

//   return `
// [out:json][timeout:60];
// area(${AREA_ID})->.searchArea;
// (
//   node["tourism"="museum"](area.searchArea)${around};
//   way["tourism"="museum"](area.searchArea)${around};
//   relation["tourism"="museum"](area.searchArea)${around};

//   node["tourism"="artwork"](area.searchArea)${around};
//   way["tourism"="artwork"](area.searchArea)${around};
//   relation["tourism"="artwork"](area.searchArea)${around};

//   node["tourism"="gallery"](area.searchArea)${around};
//   way["tourism"="gallery"](area.searchArea)${around};
//   relation["tourism"="gallery"](area.searchArea)${around};

//   node["art_gallery"="yes"](area.searchArea)${around};
//   way["art_gallery"="yes"](area.searchArea)${around};
//   relation["art_gallery"="yes"](area.searchArea)${around};

//   node["amenity"="theatre"](area.searchArea)${around};
//   way["amenity"="theatre"](area.searchArea)${around};
//   relation["amenity"="theatre"](area.searchArea)${around};

//   node["amenity"="restaurant"](area.searchArea)${around};
//   way["amenity"="restaurant"](area.searchArea)${around};
//   relation["amenity"="restaurant"](area.searchArea)${around};

//   node["tourism"="attraction"](area.searchArea)${around};
//   way["tourism"="attraction"](area.searchArea)${around};
//   relation["tourism"="attraction"](area.searchArea)${around};

//   node["amenity"="arts_centre"](area.searchArea)${around};
//   way["amenity"="arts_centre"](area.searchArea)${around};
//   relation["amenity"="arts_centre"](area.searchArea)${around};

//   node["amenity"="community_centre"](area.searchArea)${around};
//   way["amenity"="community_centre"](area.searchArea)${around};
//   relation["amenity"="community_centre"](area.searchArea)${around};

//   node["amenity"="library"](area.searchArea)${around};
//   way["amenity"="library"](area.searchArea)${around};
//   relation["amenity"="library"](area.searchArea)${around};

//   node["amenity"="cinema"](area.searchArea)${around};
//   way["amenity"="cinema"](area.searchArea)${around};
//   relation["amenity"="cinema"](area.searchArea)${around};

//   // ADDED QUERIES
//   node["historic"](area.searchArea)${around};
//   way["historic"](area.searchArea)${around};
//   relation["historic"](area.searchArea)${around};

//   node["heritage"](area.searchArea)${around};
//   way["heritage"](area.searchArea)${around};
//   relation["heritage"](area.searchArea)${around};

//   node["building"](area.searchArea)${around};
//   way["building"](area.searchArea)${around};
//   relation["building"](area.searchArea)${around};

//   node["leisure"](area.searchArea)${around};
//   way["leisure"](area.searchArea)${around};
//   relation["leisure"](area.searchArea)${around};

//   node["shop"](area.searchArea)${around};
//   way["shop"](area.searchArea)${around};
//   relation["shop"](area.searchArea)${around};

//   node["wikipedia"](area.searchArea)${around};
//   way["wikipedia"](area.searchArea)${around};
//   relation["wikipedia"](area.searchArea)${around};
// );
// out center;
// `;
// };

const extendedCulturalSiteQuery = (areaId, radius, lat, lon) => {
  const useAround = radius && lat && lon;
  const around = useAround ? `(around:${radius},${lat},${lon})` : '';
  const AREA_ID = 3600000000 + areaId;

  return `
[out:json][timeout:90];
area(${AREA_ID})->.searchArea;
(
  // Museums, galleries, artworks
  node["tourism"~"museum|gallery|artwork"](area.searchArea)${around};
  way["tourism"~"museum|gallery|artwork"](area.searchArea)${around};
  relation["tourism"~"museum|gallery|artwork"](area.searchArea)${around};

  // Art galleries (alternate tagging)
  node["art_gallery"="yes"](area.searchArea)${around};
  way["art_gallery"="yes"](area.searchArea)${around};
  relation["art_gallery"="yes"](area.searchArea)${around};

  // Theatres and arts centres
  node["amenity"~"theatre|arts_centre"](area.searchArea)${around};
  way["amenity"~"theatre|arts_centre"](area.searchArea)${around};
  relation["amenity"~"theatre|arts_centre"](area.searchArea)${around};

  // Community and cultural services
  node["amenity"~"community_centre|library|cinema"](area.searchArea)${around};
  way["amenity"~"community_centre|library|cinema"](area.searchArea)${around};
  relation["amenity"~"community_centre|library|cinema"](area.searchArea)${around};

  // Attractions and tourism spots
  node["tourism"="attraction"](area.searchArea)${around};
  way["tourism"="attraction"](area.searchArea)${around};
  relation["tourism"="attraction"](area.searchArea)${around};

  // Restaurants and shops (optional cultural significance)
  node["amenity"="restaurant"](area.searchArea)${around};
  way["amenity"="restaurant"](area.searchArea)${around};
  relation["amenity"="restaurant"](area.searchArea)${around};

  node["shop"](area.searchArea)${around};
  way["shop"](area.searchArea)${around};
  relation["shop"](area.searchArea)${around};

  // Expanded heritage and historic coverage
  node["historic"](area.searchArea)${around};
  way["historic"](area.searchArea)${around};
  relation["historic"](area.searchArea)${around};

  node["heritage"](area.searchArea)${around};
  way["heritage"](area.searchArea)${around};
  relation["heritage"](area.searchArea)${around};

  // Buildings with possible cultural significance
  node["building"](area.searchArea)${around};
  way["building"](area.searchArea)${around};
  relation["building"](area.searchArea)${around};

  // Leisure and cultural activity locations
  node["leisure"](area.searchArea)${around};
  way["leisure"](area.searchArea)${around};
  relation["leisure"](area.searchArea)${around};

  // Wikipedia-tagged points (additional info)
  node["wikipedia"](area.searchArea)${around};
  way["wikipedia"](area.searchArea)${around};
  relation["wikipedia"](area.searchArea)${around};
);
out center;
`;
};


module.exports = {
  singleElementQuery,
  CITY_RELATION_IDS,
  baseCulturalSiteQuery,
  extendedCulturalSiteQuery,
};
