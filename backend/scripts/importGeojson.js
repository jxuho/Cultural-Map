require('dotenv').config();
const fsAsync = require('fs/promises');
const path = require('path');
const CulturalSite = require('../models/CulturalSite');
const {
  processOsmElementForCulturalSite,
} = require('../utils/osmDataProcessor');
const { default: mongoose } = require('mongoose');

/**
 * Import GeoJSON /OSM data into MongoDB
 * @param {boolean} performReverseGeocoding
 * @param {string} cityName
 */
const importGeojson = async (performReverseGeocoding, cityName = 'berlin') => {
  try {
    console.log('Importing GeoJSON...');

    const dataPath = await getLatestCulturalSitesFile(cityName);
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
/**
 * @param {string} cityName 
 */
async function getLatestCulturalSitesFile(cityName = 'berlin') {
  const dataDir = path.join(__dirname, '../data');
  const fileNamePattern = new RegExp(`^${cityName.toLowerCase()}_cultural_sites_(\\d{13})\\.(geo)?json$`);

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

async function runScript() {
  const args = process.argv.slice(2);
  const cityName = args.find(arg => !arg.startsWith('--')) || 'berlin';
  const shouldPerformReverseGeocoding = !args.includes('--no-reverse-geocode');

  try {
    // 1. 환경 변수로부터 URI 가져오기
    const mongoUri = process.env.MONGO_URI;
    console.log(`📡 Connecting to MongoDB: ${mongoUri}`);

    // 2. 명시적 연결 수행 (중요!)
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB successfully.');

    // 3. 임포트 로직 실행
    await importGeojson(shouldPerformReverseGeocoding, cityName);

    console.log('🎉 Data import process finished.');
  } catch (err) {
    console.error('❌ Critical error during script execution:', err);
  } finally {
    // 4. 프로세스 종료를 위해 연결 닫기
    await mongoose.connection.close();
    console.log('👋 MongoDB connection closed.');
    process.exit(0);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  runScript();
}

module.exports = importGeojson;