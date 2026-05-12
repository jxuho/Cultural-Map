// Backend/utils/osm data processor.js

// Receive osm data and change it to fit mongodb schema

const axios = require('axios');
const { NOMINATIM_API_URL } = require('../config/apiUrls');
const AppError = require('../utils/AppError');
const { CULTURAL_CATEGORY } = require('../config/culturalSiteConfig');

/**
 * The name of the CulturalSite is determined based on the tags of the OSM element.
 * @param {object} tags -tags object of OSM element.
 * @param {string} sourceId -sourceId of OSM element.
 * @returns {string} Name decided.
 */
// const determineCulturalSiteName = (tags, sourceId) => {
//   if (tags.name) {
//     return tags.name;
//   } else if (tags.artwork_type) {
//     return tags.artwork_type;
//   } else if (tags.description) {
//     return tags.description;
//   } else if (tags.tourism) {
//     return tags.tourism;
//   } else if (tags.amenity) {
//     return tags.amenity;
//   } else {
//     return `Unnamed Site (ID: ${sourceId})`;
//   }
// };



const determineCulturalSiteName = (tags, sourceId) => {
  // 1. Best case: explicit name
  if (tags.name && tags.name.trim()) {
    return tags.name.trim();
  }

  // 2. Determine mapped category
  const category = mapCulturalSiteCategory(tags);

  // Helper
  const capitalize = (str) =>
    str
      ?.replace(/_/g, ' ')
      ?.replace(/\b\w/g, (c) => c.toUpperCase());

  // 3. Category-based naming strategy
  switch (category) {
    case 'museums_galleries':
      if (tags.museum) return `${capitalize(tags.museum)} Museum`;
      if (tags.gallery) return `${capitalize(tags.gallery)} Gallery`;
      return 'Unnamed Museum or Gallery';

    case 'monument':
      if (tags.monument_type) {
        return `${capitalize(tags.monument_type)} Monument`;
      }
      return 'Unnamed Monument';

    case 'memorial':
      if (tags.memorial) {
        return `${capitalize(tags.memorial)} Memorial`;
      }
      return 'Unnamed Memorial';

    case 'castle':
      return 'Unnamed Castle';

    case 'religious_heritage':
      if (tags.religion && tags.building) {
        return `${capitalize(tags.religion)} ${capitalize(tags.building)}`;
      }
      if (tags.building) {
        return capitalize(tags.building);
      }
      return 'Unnamed Religious Heritage Site';

    case 'cultural_venues':
      if (tags.amenity) {
        return capitalize(tags.amenity);
      }
      return 'Unnamed Cultural Venue';

    case 'public_art':
      if (tags.artwork_type) {
        return `${capitalize(tags.artwork_type)} Artwork`;
      }
      return 'Unnamed Public Artwork';

    case 'archaeological_sites':
      if (tags.site_type) {
        return `${capitalize(tags.site_type)} Archaeological Site`;
      }
      return 'Unnamed Archaeological Site';

    case 'industrial_heritage':
      if (tags.highway === 'street_lamp' || tags.amenity === 'street_lamp') {
        return capitalize("Street Lamp");
      } 
      return 'Unnamed Industrial Heritage Site';

    case 'heritage_buildings':
      if (tags.building) {
        return capitalize(tags.building);
      }
      return 'Unnamed Heritage Building';

    case 'gardens_parks':
      if (tags.leisure) {
        return capitalize(tags.leisure);
      }
      return 'Unnamed Garden or Park';

    case 'historic_ensemble':
      return 'Historic Ensemble';

    default:
      break;
  }

  // 4. Generic fallback priority
  const fallbackKeys = [
    'historic',
    'building',
    'tourism',
    'amenity',
    'artwork_type',
    'memorial',
  ];

  for (const key of fallbackKeys) {
    if (tags[key]) {
      return capitalize(tags[key]);
    }
  }

  // 5. Final fallback
  return `Unnamed Site (${sourceId})`;
};

/**
 * The description of the CulturalSite is determined based on the tags of the OSM element.
 * @param {object} tags -tags object of OSM element.
 * @param {string} name -Name of the determined CulturalSite.
 * @returns {string} Determined explanation.
 */
const determineCulturalSiteDescription = (tags, name) => {
  let description =
    tags.description || tags.note || tags.long_description || '';
  return description;
};


const determineCulturalSiteAddress = async (tags, lat, lon, name, sourceId) => {
  const cityName = process.env.CITY_NAME || 'berlin';
  // 기본 주소 객체 구조
  let addressObj = {
    fullAddress: '',
    street: tags['addr:street'] || tags.street || '',
    houseNumber: tags['addr:housenumber'] || tags.housenumber || '',
    postcode: tags['addr:postcode'] || '',
    district: '', // 이후에 공간 연산으로 채울 예정
    city: (tags['addr:city'] || cityName).toLowerCase()
  };

  // 기존 태그 기반 fullAddress 생성 로직
  if (addressObj.street && addressObj.houseNumber) {
    addressObj.fullAddress = `${addressObj.street} ${addressObj.houseNumber}`;
  } else if (tags['addr:full']) {
    addressObj.fullAddress = tags['addr:full'];
  }

  // 주소 정보가 부족할 때만 Nominatim 호출
  if (!addressObj.fullAddress && lat && lon) {
    try {
      const nominatimResponse = await axios.get(NOMINATIM_API_URL, {
        params: { lat, lon, format: 'json', 'accept-language': 'en', zoom: 18, addressdetails: 1 },
        headers: { 'User-Agent': 'CulturalHeritageMap/2.0' },
      });
      const addr = nominatimResponse.data.address;

      if (addr) {
        addressObj.street = addr.road || addr.pedestrian || addressObj.street;
        addressObj.houseNumber = addr.house_number || addressObj.houseNumber;
        addressObj.postcode = addr.postcode || addressObj.postcode;
        // Nominatim이 제공하는 'suburb'나 'city_district'를 district 후보로 사용 가능
        addressObj.district = addr.suburb || addr.city_district || '';

        // fullAddress 조립
        addressObj.fullAddress = addressObj.houseNumber
          ? `${addressObj.street} ${addressObj.houseNumber}`
          : addressObj.street;
      }
    } catch (err) {
      console.warn(`Address inference failed for ${sourceId}`);
    }
  }
  return addressObj;
};

const determineCulturalSiteAddressFromTags = (tags) => {
  let address = '';
  if (tags['addr:street'] && tags['addr:housenumber']) {
    address = `${tags['addr:street']} ${tags['addr:housenumber']}`;
  } else if (tags['addr:full']) {
    address = tags['addr:full'];
  } else if (tags.address) {
    address = tags.address;
  } else if (tags.street && tags.housenumber) {
    address = `${tags.street} ${tags.housenumber}`;
  }
  if (tags['addr:postcode'] && address) address += `, ${tags['addr:postcode']}`;
  if (tags['addr:city'] && address) address += `, ${tags['addr:city']}`;
  else if (!address && tags.city) address = tags.city;
  return address;
};

// Map OSM tags to our defined cultural heritage categories
const mapCulturalSiteCategory = (tags) => {
  if (tags['lda:criteria'] === "Ensemble" || tags['lda:criteria'] === "Gesamtanlage" || tags['lda:criteria'] === "Flächendenkmal") {
    return 'historic_ensemble';
  }
  if (tags.tourism === 'museum' || tags.tourism === 'gallery') {
    return 'museums_galleries';
  }
  if (tags.historic === 'monument' || tags.attraction === 'monument') {
    return 'monument';
  }
  if (tags.historic === 'memorial') {
    return 'memorial';
  }
  if (tags.historic === 'castle') {
    return 'castle';
  }
  if (
    ['church', 'cathedral', 'chapel', 'monastery', 'temple', 'shrine', 'mosque'].includes(tags.building) ||
    ['monastery', 'church'].includes(tags.historic) || tags.amenity === 'place_of_worship'
  ) {
    return 'religious_heritage';
  }
  if (
    ['theatre', 'arts_centre'].includes(tags.amenity) ||
    tags.attraction === 'cultural'
  ) {
    return 'cultural_venues';
  }
  if (tags.tourism === 'artwork') {
    return 'public_art';
  }
  if (tags.historic === "archaeological_site" || tags.historic === "ruins" || tags['lda:criteria'] === "Bodendenkmal") {
    return 'archaeological_sites';
  }
  if (tags.highway === 'street_lamp' || tags.amenity === 'street_lamp') {
    return 'industrial_heritage';
  }
  if (tags['lda:criteria'] === "Baudenkmal" || tags['heritage:description'] === "Baudenkmal" ||
    tags.building || tags['lda:criteria'] === "Ensembleteil") {
    return 'heritage_buildings';
  }
  if (tags['lda:criteria'] === 'Gartendenkmal' || tags.leisure === 'garden' || tags.leisure === 'park') {
    return 'gardens_parks';
  }
  return 'other';
};



/**
 * Converts the OSM element object to a data format suitable for the CulturalSite schema.
 * @param {Object} osmElement -A single OSM element object received from the Overpass API.
 * @returns {Promise<object>} culturalSiteData -A data object that conforms to the CulturalSite schema.
 * @throws {AppError} -Required fields are missing or invalid data.
 */
const processOsmElementForCulturalSite = async (
  osmElement,
  performReverseGeocoding = true,
) => {
  const cityName = process.env.CITY_NAME || 'berlin';
  // Added new parameter with default true
  const { type, id, tags } = osmElement;

  // 1. Create sourceId
  const sourceId = `${type}/${id}`;

  // 2. Extract latitude (lat) and longitude (lon) according to OSM type
  let lat, lon;
  // 1. Highest priority: If there is a lat/lon field inside the 'center' object (result of out center; option)
  if (
    osmElement.center &&
    typeof osmElement.center.lat === 'number' &&
    typeof osmElement.center.lon === 'number'
  ) {
    lat = osmElement.center.lat;
    lon = osmElement.center.lon;
  }
  // 2. Next priority: When there is a lat/lon field directly in the OSM element (mainly Node type)
  else if (
    typeof osmElement.lat === 'number' &&
    typeof osmElement.lon === 'number'
  ) {
    lat = osmElement.lat;
    lon = osmElement.lon;
  }
  // 3. Next rank: if geometry field exists and length is greater than 0
  else if (osmElement.geometry && osmElement.geometry.length > 0) {
    lat = osmElement.geometry[0].lat;
    lon = osmElement.geometry[0].lon;
  }
  // 4. Last rank: if there is a bounds field (calculate centroids)
  else if (osmElement.bounds) {
    lat = (osmElement.bounds.minlat + osmElement.bounds.maxlat) / 2;
    lon = (osmElement.bounds.minlon + osmElement.bounds.maxlon) / 2;
  }

  // Debug log and errors if no location information is found
  if (!(typeof lat === 'number' && typeof lon === 'number')) {
    console.warn(
      `[DEBUG] Element ${sourceId} (type: ${type}) has no valid lat/lon, geometry, or bounds after all checks. Full element:`,
      JSON.stringify(osmElement, null, 2),
    );
    throw new AppError(
      `Could not find valid location information for element ${sourceId} (type: ${type}). (No lat/lon, geometry, bounds)`,
      400,
    );
  }

  // 3. Latitude/longitude validation
  if (!lat || !lon) {
    throw new AppError(
      `Skipping element ${sourceId} due to missing coordinates.`,
      400,
    );
  }
  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);

  // 4. Determine the CulturalSite field
  const name = determineCulturalSiteName(tags, sourceId);
  const description = determineCulturalSiteDescription(tags, name);
  // Conditionally call determineCulturalSiteAddress based on the flag
  // const address = performReverseGeocoding
  //   ? await determineCulturalSiteAddress(
  //     tags,
  //     parsedLat,
  //     parsedLon,
  //     name,
  //     sourceId,
  //   )
  //   : determineCulturalSiteAddressFromTags(tags); // New helper to only get address from tags
  const address = performReverseGeocoding
    ? await determineCulturalSiteAddress(tags, parsedLat, parsedLon, name, sourceId)
    : {
      fullAddress: determineCulturalSiteAddressFromTags(tags),
      street: tags['addr:street'] || '',
      houseNumber: tags['addr:housenumber'] || '',
      postcode: tags['addr:postcode'] || '',
      district: '', // 초기값은 비워두고 마이그레이션/공간쿼리로 채움
      city: (tags['addr:city'] || cityName).toLowerCase()
    };
  const category = mapCulturalSiteCategory(tags); // Apply changed category mapping logic

  // 5. Final confirmation of required fields
  if (!name || !category || isNaN(parsedLat) || isNaN(parsedLon) || !sourceId) {
    console.error(`Missing Info - Name: ${!!name}, Cat: ${!!category}, Lat: ${!isNaN(parsedLat)}`);
    throw new AppError(
      'Essential cultural heritage information (name, category, location, sourceId) cannot be extracted from OSM data.',
      400,
    );
  }

  return {
    name,
    description,
    category,
    location: {
      type: 'Point',
      coordinates: [parsedLon, parsedLat],
    },
    address, 
    website: tags.website || tags.url || '',
    imageUrl: tags.image || tags.thumbnail || '',
    openingHours: tags.opening_hours || '',
    licenseInfo: 'Data © OpenStreetMap contributors, ODbL.',
    sourceId: sourceId,
    originalTags: tags,
  };
};

module.exports = {
  processOsmElementForCulturalSite,
};
