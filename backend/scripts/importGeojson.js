require('dotenv').config();
const fsAsync = require('fs/promises');
const path = require('path');
const CulturalSite = require('../models/CulturalSite');
const {
  processOsmElementForCulturalSite,
} = require('../utils/osmDataProcessor');

/**
 * Import GeoJSON /OSM data into MongoDB
 * @param {boolean} performReverseGeocoding
 */
const importGeojson = async (performReverseGeocoding) => {
  try {
    console.log('Importing GeoJSON...');

    const dataPath = await getLatestCulturalSitesFile();
    if (!dataPath) {
      console.error('No valid GeoJSON file found.');
      return;
    }

    const raw = await fsAsync.readFile(dataPath, 'utf8');
    const geojson = JSON.parse(raw);

    const culturalSitesToInsert = [];

    // GeoJSON format
    if (geojson.features) {
      for (const feature of geojson.features) {
        const properties = feature.properties;
        const geometry = feature.geometry;

        const osmElementLike = {
          type: properties['@type'] || 'unknown',
          id: properties['@id'] || feature.id,
          geometry: {
            type: geometry.type,
            coordinates: geometry.coordinates,
          },
          tags: properties,
        };

        if (
          !osmElementLike.id ||
          !osmElementLike.geometry ||
          !osmElementLike.geometry.coordinates
        ) {
          console.warn(
            'Skipping feature due to missing id or geometry:',
            JSON.stringify(feature),
          );
          continue;
        }

        try {
          const culturalSiteData = await processOsmElementForCulturalSite(
            osmElementLike,
            performReverseGeocoding,
          );

          culturalSitesToInsert.push(culturalSiteData);
        } catch (error) {
          console.warn(
            `Error processing feature ${osmElementLike.id}: ${error.message}`,
          );
        }
      }
    } else if (geojson.elements) {
      // Overpass API format
      for (const element of geojson.elements) {
        if (!element.type || !element.id) {
          console.warn(
            'Skipping element due to missing id:',
            JSON.stringify(element),
          );
          continue;
        }

        try {
          const culturalSiteData = await processOsmElementForCulturalSite(
            element,
            performReverseGeocoding,
          );

          culturalSitesToInsert.push(culturalSiteData);
        } catch (error) {
          console.warn(
            `Error processing element ${element.id}: ${error.message}`,
          );
        }
      }
    }

    if (culturalSitesToInsert.length === 0) {
      console.warn('No valid cultural sites to insert.');
      return;
    }

    const result = await CulturalSite.insertMany(culturalSitesToInsert, {
      ordered: false, // Duplicate error, I keep going
    });

    console.log(`Successfully inserted ${result.length} new CulturalSites.`);
  } catch (error) {
    console.error('Error importing data:', error);

    // Cleaning up duplicate key error logs
    if (error.writeErrors) {
      const duplicateErrors = error.writeErrors.filter((e) => e.code === 11000);

      console.warn(`Skipped ${duplicateErrors.length} duplicate entries.`);
    }
  }
};

/**
 * Find latest data file
 */
async function getLatestCulturalSitesFile() {
  const dataDir = path.join(__dirname, '../data');
  const fileNamePattern = /^chemnitz_cultural_sites_(\d{13})\.(geo)?json$/;

  try {
    const files = await fsAsync.readdir(dataDir);

    let latestFile = null;
    let latestTimestamp = 0;

    for (const file of files) {
      const match = file.match(fileNamePattern);
      if (match) {
        const timestamp = parseInt(match[1], 10);
        if (timestamp > latestTimestamp) {
          latestTimestamp = timestamp;
          latestFile = file;
        }
      }
    }

    if (!latestFile) {
      console.warn('No cultural sites file found.');
      return null;
    }

    const filePath = path.join(dataDir, latestFile);
    console.log(`Using latest file: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error finding latest file:', error);
    throw error;
  }
}

// When running CLI, determine whether to reverse geocode using the --no-reverse-geocode option.
if (require.main === module) {
  const args = process.argv.slice(2);
  const shouldPerformReverseGeocoding = !args.includes('--no-reverse-geocode');

  importGeojson(shouldPerformReverseGeocoding);
}

module.exports = importGeojson;
