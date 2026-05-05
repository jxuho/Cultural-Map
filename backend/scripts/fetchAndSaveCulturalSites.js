/**
 * Apply query to OSM to retrieve geojson file.
 */
const fs = require('fs');
const path = require('path');

const { baseCulturalSiteQuery } = require('../config/osmData');
const { queryOverpass } = require('../services/overpassService');

async function fetchAndSaveCulturalSites() {
  console.log(
    'Starting to import Chemnitz cultural sites data from Overpass API...',
  );
  const OVERPASS_QUERY = baseCulturalSiteQuery();
  try {
    const osmData = await queryOverpass(OVERPASS_QUERY);
    const fileName = `chemnitz_cultural_sites_${Date.now()}.json`;
    const filePath = path.join(__dirname, '../data', fileName); // Save to ‘data’ folder

    // If the 'data' folder does not exist, create it.
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFile(filePath, JSON.stringify(osmData, null, 2), (err) => {
      if (err) {
        console.error('An error occurred while saving the file:', err);
      } else {
        console.log(`OSM data was successfully saved to ${filePath}.`);
        console.log(
          `A total of ${osmData.elements ? osmData.elements.length : 0} cultural sites were retrieved.`,
        );
      }
    });
  } catch (error) {
    console.error('Error occurred while calling Overpass API:', error.message);
    if (error.response) {
      console.error('Response Status Code:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// function execution
fetchAndSaveCulturalSites();
