// backend/scripts/fetchAndSaveCulturalSites.js
const fs = require('fs');
const path = require('path');
const { baseCulturalSiteQuery } = require('../config/osmData');
const { queryOverpass } = require('../services/overpassService');

async function fetchAndSaveCulturalSites(cityName = 'berlin', areaId = 62422) {
  console.log(`Starting to import ${cityName} (ID: ${areaId}) cultural sites data...`);
  
  const OVERPASS_QUERY = baseCulturalSiteQuery(areaId);
  
  try {
    const osmData = await queryOverpass(OVERPASS_QUERY);
    const fileName = `${cityName.toLowerCase()}_cultural_sites_${Date.now()}.json`;
    const dataDir = path.join(__dirname, '../data');
    const filePath = path.join(dataDir, fileName);

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(osmData, null, 2));
    console.log(`OSM data saved to ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error occurred:', error.message);
  }
}

// CLI 실행 부분: node fetchAndSaveCulturalSites.js berlin 62422
if (require.main === module) {
  const args = process.argv.slice(2);
  const cityName = args[0] || 'berlin';
  const areaId = parseInt(args[1], 10) || 62422;
  fetchAndSaveCulturalSites(cityName, areaId);
}

module.exports = fetchAndSaveCulturalSites;

// /**
//  * Apply query to OSM to retrieve geojson file.
//  */
// const fs = require('fs');
// const path = require('path');

// const { baseCulturalSiteQuery } = require('../config/osmData');
// const { queryOverpass } = require('../services/overpassService');

// async function fetchAndSaveCulturalSites() {
//   console.log(
//     'Starting to import Chemnitz cultural sites data from Overpass API...',
//   );
//   const OVERPASS_QUERY = baseCulturalSiteQuery();
//   try {
//     const osmData = await queryOverpass(OVERPASS_QUERY);
//     const fileName = `chemnitz_cultural_sites_${Date.now()}.json`;
//     const filePath = path.join(__dirname, '../data', fileName); // Save to ‘data’ folder

//     // If the 'data' folder does not exist, create it.
//     const dataDir = path.join(__dirname, '../data');
//     if (!fs.existsSync(dataDir)) {
//       fs.mkdirSync(dataDir, { recursive: true });
//     }

//     fs.writeFile(filePath, JSON.stringify(osmData, null, 2), (err) => {
//       if (err) {
//         console.error('An error occurred while saving the file:', err);
//       } else {
//         console.log(`OSM data was successfully saved to ${filePath}.`);
//         console.log(
//           `A total of ${osmData.elements ? osmData.elements.length : 0} cultural sites were retrieved.`,
//         );
//       }
//     });
//     return filePath; // Return the path of the saved file for further processing
//   } catch (error) {
//     console.error('Error occurred while calling Overpass API:', error.message);
//     if (error.response) {
//       console.error('Response Status Code:', error.response.status);
//       console.error('Response data:', error.response.data);
//     }
//   }
// }

// // function execution
// // fetchAndSaveCulturalSites();

// module.exports = fetchAndSaveCulturalSites;

// // CLI execution
// if (require.main === module) {
//   fetchAndSaveCulturalSites();
// }
