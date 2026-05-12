const path = require('path');
const fs = require('fs');
const CulturalSite = require('../models/CulturalSite');
const fetchAndSaveCulturalSites = require('../scripts/fetchAndSaveCulturalSites');
const importGeojson = require('../scripts/importGeojson');

// helper function to find the latest data file for a given city
const getExistingDataFile = (cityName = 'berlin') => {
  const dataDir = path.join(__dirname, '../data');
  if (!fs.existsSync(dataDir)) return null;

  const files = fs.readdirSync(dataDir)
    .filter(f => f.startsWith(`${cityName}_cultural_sites_`) && f.endsWith('.json'))
    .sort((a, b) => b.localeCompare(a)); // 최신순 정렬

  return files.length > 0 ? path.join(dataDir, files[0]) : null;
};

const seedIfEmpty = async () => {
  try {
    const count = await CulturalSite.countDocuments();

    if (count > 0) {
      console.log(`✅ DB already has ${count} cultural sites. Skipping seed.`);
      return;
    }

    console.log('🔍 No data found in MongoDB. Checking for local data files...');

    // 1. check for existing data file (e.g., berlin_cultural_sites_*.json)
    const existingFile = getExistingDataFile('berlin');

    if (existingFile) {
      console.log(`📂 Found existing data file: ${path.basename(existingFile)}`);
      console.log('🚀 Skipping API fetch and starting import...');
    } else {
      // 2. if no file, fetch from Overpass API and save to local file
      console.log('🌐 No local data found. Fetching from Overpass API (This may take a while)...');
      await fetchAndSaveCulturalSites('berlin', 62422);
    }

    //3. Execute importGeojson (read file and insertMany into DB)
    //Avoid heavy reverse geocoding by giving false as the second argument
    await importGeojson(false, 'berlin');

    console.log('✅ Seeding process completed successfully.');
  } catch (err) {
    console.error('❌ Error during conditional seeding:', err);
  }
};

module.exports = seedIfEmpty;