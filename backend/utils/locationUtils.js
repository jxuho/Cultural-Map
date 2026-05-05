/**
 * Based on the ../data/chemnitz_boundary.geojson file,
 * The isPointInChemnitz function determines whether the received latitude and longitude fall within chemnitz.
 */
const turf = require('@turf/turf');
const fs = require('fs');
const path = require('path');

let chemnitzBoundary = null;

/**
 * Load the Chemnitz city limits GeoJSON file.
 * Ensures that files are loaded only once. (Run in app.js.)
 */
const loadChemnitzBoundary = () => {
  if (!chemnitzBoundary) {
    try {
      const boundaryPath = path.join(
        __dirname,
        '../data/chemnitz_boundary.geojson',
      );
      const geojsonData = fs.readFileSync(boundaryPath, 'utf8');
      chemnitzBoundary = JSON.parse(geojsonData);
      // If the GeoJSON file is a FeatureCollection, it uses the geometry of the first Feature.
      // In the case of a single feature, geometry is used directly.
      if (
        chemnitzBoundary.type === 'FeatureCollection' &&
        chemnitzBoundary.features.length > 0
      ) {
        chemnitzBoundary = chemnitzBoundary.features[0];
      }
      // Check if geometry in GeoJSON is Polygon or MultiPolygon
      if (
        !['Polygon', 'MultiPolygon'].includes(chemnitzBoundary.geometry.type)
      ) {
        throw new Error(
          'Chemnitz boundary GeoJSON must contain a Polygon or MultiPolygon geometry.',
        );
      }
    } catch (error) {
      console.error('Error loading Chemnitz boundary GeoJSON:', error);
      throw new Error('Failed to load Chemnitz boundary data.');
    }
  }
};

/**
 * Checks if a given latitude, longitude point is inside the city limits of Chemnitz.
 * @param {number} lat -latitude
 * @param {number} lng -hardness
 * @returns {boolean} -true if the point is inside the boundary, false otherwise.
 */
const isPointInChemnitz = (lat, lng) => {
  if (!chemnitzBoundary) {
    loadChemnitzBoundary();
  }

  const point = turf.point([lng, lat]);
  return turf.booleanPointInPolygon(point, chemnitzBoundary);
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
  loadChemnitzBoundary,
  isPointInChemnitz,
  isValidLatLng,
  areCoordinatesMatching,
};
