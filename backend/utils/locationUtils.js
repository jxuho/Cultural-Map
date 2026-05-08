const turf = require('@turf/turf');
const fs = require('fs');
const path = require('path');

// 여러 도시의 경계를 저장할 캐시 객체
let cityBoundaries = {};

/**
 * 특정 도시의 경계 GeoJSON 파일을 로드합니다.
 * @param {string} cityName - 도시 이름 (예: 'berlin', 'chemnitz')
 */
const loadCityBoundary = (cityName = 'berlin') => {
  const cityKey = cityName.toLowerCase();
  
  if (!cityBoundaries[cityKey]) {
    try {
      const boundaryPath = path.join(
        __dirname,
        `../data/${cityKey}_boundary.geojson`, // 파일명이 berlin_boundary.geojson 형태여야 함
      );
      
      if (!fs.existsSync(boundaryPath)) {
        console.warn(`Boundary file for ${cityName} not found at ${boundaryPath}`);
        return null;
      }

      const geojsonData = fs.readFileSync(boundaryPath, 'utf8');
      let boundary = JSON.parse(geojsonData);

      if (boundary.type === 'FeatureCollection' && boundary.features.length > 0) {
        boundary = boundary.features[0];
      }

      if (!['Polygon', 'MultiPolygon'].includes(boundary.geometry.type)) {
        throw new Error(`${cityName} boundary must be a Polygon or MultiPolygon.`);
      }

      cityBoundaries[cityKey] = boundary;
      console.log(`✅ Loaded boundary for: ${cityName}`);
    } catch (error) {
      console.error(`Error loading boundary for ${cityName}:`, error);
      return null;
    }
  }
  return cityBoundaries[cityKey];
};

/**
 * 좌표가 특정 도시의 경계 내부에 있는지 확인합니다.
 */
const isPointInCity = (lat, lng, cityName = 'berlin') => {
  const boundary = loadCityBoundary(cityName);
  if (!boundary) return false; // 경계 파일이 없으면 일단 false (혹은 true로 기본값 설정 가능)

  const point = turf.point([lng, lat]);
  return turf.booleanPointInPolygon(point, boundary);
};
/**
 * Checks whether the given latitude (lat) and longitude (lng) values ​​are within a valid geographic range.
 * @param {*} lng -longitude (string or number)
 * @param {*} lat -latitude (string or number)
 * @returns {boolean} -true if valid, false otherwise
 */
const isValidLatLng = (lng, lat) => {
  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);

  // 1. Check if it can be converted to a number (not NaN)
  if (isNaN(parsedLat) || isNaN(parsedLng)) {
    return false;
  }

  // 2. Check the valid latitude range (-90 to +90)
  // Latitude ranges from the North Pole (-90) to the South Pole (+90).
  if (parsedLat < -90 || parsedLat > 90) {
    return false;
  }

  // 3. Check the valid hardness range (-180 to +180)
  // Longitude ranges from west longitude (-180) to east longitude (+180).
  if (parsedLng < -180 || parsedLng > 180) {
    return false;
  }

  return true; // Valid if all conditions are met
};

/**
 * Check whether the coordinates sent from the client and the coordinates retrieved from OSM are within a certain distance.
 * @param {number[]} clientCoord -Coordinates sent from client [lon, lat]
 * @param {number[]} osmCoord -Coordinates taken from OSM [lon, lat]
 * @param {number} toleranceInMeters -Allowed distance (in m), default 5m
 * @returns {boolean} -true if the coordinates match
 */
function areCoordinatesMatching(clientCoord, osmCoord, toleranceInMeters = 10) {
  const clientPoint = turf.point(clientCoord);
  const osmPoint = turf.point(osmCoord);

  const distance = turf.distance(clientPoint, osmPoint, { units: 'meters' });

  console.log(
    `Distance between client and OSM coordinates: ${distance.toFixed(2)} meters`,
  );

  return distance <= toleranceInMeters;
}

module.exports = {
  loadCityBoundary,
  isPointInCity,
  isValidLatLng,
  areCoordinatesMatching,
};
