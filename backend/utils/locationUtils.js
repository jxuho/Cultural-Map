/**
 * ../data/chemnitz_boundary.geojson파일을 바탕으로, 
 * isPointInChemnitz 함수는 전달받은 위,경도가 chemnitz 내부에 속하는지 판단한다
 */
const turf = require('@turf/turf');
const fs = require('fs');
const path = require('path');

let chemnitzBoundary = null;

/**
 * Chemnitz 시 경계 GeoJSON 파일을 로드합니다.
 * 파일은 한 번만 로드되도록 합니다. ( app.js에서 실행됨. )
 */
const loadChemnitzBoundary = () => {
    if (!chemnitzBoundary) {
        try {
            const boundaryPath = path.join(__dirname, '../data/chemnitz_boundary.geojson');
            const geojsonData = fs.readFileSync(boundaryPath, 'utf8');
            chemnitzBoundary = JSON.parse(geojsonData);
            // GeoJSON 파일이 FeatureCollection일 경우 첫 번째 Feature의 geometry를 사용합니다.
            // 단일 Feature일 경우 직접 geometry를 사용합니다.
            if (chemnitzBoundary.type === 'FeatureCollection' && chemnitzBoundary.features.length > 0) {
                chemnitzBoundary = chemnitzBoundary.features[0];
            }
            // GeoJSON의 geometry가 Polygon 또는 MultiPolygon인지 확인
            if (!['Polygon', 'MultiPolygon'].includes(chemnitzBoundary.geometry.type)) {
                throw new Error('Chemnitz boundary GeoJSON must contain a Polygon or MultiPolygon geometry.');
            }
        } catch (error) {
            console.error('Error loading Chemnitz boundary GeoJSON:', error);
            throw new Error('Failed to load Chemnitz boundary data.');
        }
    }
};

/**
 * 주어진 위도, 경도 지점이 Chemnitz 시 경계 내부에 있는지 확인합니다.
 * @param {number} lat - 위도
 * @param {number} lng - 경도
 * @returns {boolean} - 지점이 경계 내부에 있으면 true, 아니면 false
 */
const isPointInChemnitz = (lat, lng) => {
    if (!chemnitzBoundary) {
        loadChemnitzBoundary();
    }

    const point = turf.point([lng, lat]);
    return turf.booleanPointInPolygon(point, chemnitzBoundary);
};

/**
 * 주어진 위도(lat), 경도(lng) 값이 유효한 지리적 범위 내에 있는지 확인합니다.
 * @param {*} lng - 경도 (문자열 또는 숫자)
 * @param {*} lat - 위도 (문자열 또는 숫자)
 * @returns {boolean} - 유효하면 true, 아니면 false
 */
const isValidLatLng = (lng, lat) => {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);

    // 1. 숫자로 변환 가능한지 확인 (NaN이 아닌지)
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
        return false;
    }

    // 2. 유효한 위도 범위 (-90 ~ +90) 확인
    // 위도는 북극(-90)에서 남극(+90)까지
    if (parsedLat < -90 || parsedLat > 90) {
        return false;
    }

    // 3. 유효한 경도 범위 (-180 ~ +180) 확인
    // 경도는 서경(-180)에서 동경(+180)까지
    if (parsedLng < -180 || parsedLng > 180) {
        return false;
    }

    return true; // 모든 조건 충족 시 유효
};


/**
 * 클라이언트에서 보낸 좌표와 OSM에서 가져온 좌표가 일정 거리 이내인지 확인
 * @param {number[]} clientCoord - 클라이언트에서 보낸 좌표 [lon, lat]
 * @param {number[]} osmCoord - OSM에서 가져온 좌표 [lon, lat]
 * @param {number} toleranceInMeters - 허용 거리(m 단위), 기본값 5m
 * @returns {boolean} - 좌표가 일치하면 true
 */
function areCoordinatesMatching(clientCoord, osmCoord, toleranceInMeters = 10) {
    const clientPoint = turf.point(clientCoord);
    const osmPoint = turf.point(osmCoord);

    const distance = turf.distance(clientPoint, osmPoint, { units: 'meters' });

    console.log(`Distance between client and OSM coordinates: ${distance.toFixed(2)} meters`);

    return distance <= toleranceInMeters;
}


module.exports = {
    loadChemnitzBoundary,
    isPointInChemnitz,
    isValidLatLng,
    areCoordinatesMatching
};