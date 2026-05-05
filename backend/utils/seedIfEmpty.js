const CulturalSite = require('../models/CulturalSite');
const fetchAndSaveCulturalSites = require('../scripts/fetchAndSaveCulturalSites');
const importGeojson = require('../scripts/importGeojson');

const seedIfEmpty = async () => {
  try {
    const count = await CulturalSite.countDocuments();

    if (count > 0) {
      console.log(`DB already has ${count} cultural sites. Skipping seed.`);
      return;
    }

    console.log('No data found. Running seed script...');

    const filePath = await fetchAndSaveCulturalSites();
    await importGeojson(false); // --no-reverse-geocode

    console.log('Seeding completed.');
  } catch (err) {
    console.error('Error during conditional seeding:', err);
  }
};

module.exports = seedIfEmpty;
