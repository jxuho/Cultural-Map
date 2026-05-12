const fs = require('fs');
const path = require('path');
const { baseCulturalSiteQuery,
  historicMonumentsQuery,
  historicMemorialQuery,
  historicCastlesRuinsQuery,
  historicArchaeologyQuery,
  buildingCastleQuery,
  buildingChurchQuery,
  buildingManorQuery,
  buildingMonasteryQuery,
  protectedHeritageQuery,
  museumsQuery,
  culturalVenuesQuery,
  attractionHistoricQuery,
  attractionCulturalQuery,
  attractionMonumentQuery,
  publicArtQuery,
} = require('../config/osmData');
const { queryOverpass } = require('../services/overpassService');

const CULTURAL_QUERY_MAP = [
  // Historic Sites
  { key: 'historic_monuments', fn: historicMonumentsQuery, priority: 'low' },
  { key: 'historic_memorials', fn: historicMemorialQuery, priority: 'high' },
  { key: 'historic_castles_ruins', fn: historicCastlesRuinsQuery, priority: 'medium' },
  { key: 'historic_archaeology', fn: historicArchaeologyQuery, priority: 'low' },

  // Heritage Buildings (heavy → run later)
  { key: 'building_castle', fn: buildingCastleQuery, priority: 'heavy' },
  { key: 'building_church', fn: buildingChurchQuery, priority: 'heavy' },
  { key: 'building_manor', fn: buildingManorQuery, priority: 'heavy' },
  { key: 'building_monastery', fn: buildingMonasteryQuery, priority: 'heavy' },

  // Protected Heritage
  { key: 'protected_heritage', fn: protectedHeritageQuery, priority: 'medium' },

  // Museums & Galleries
  { key: 'museums', fn: museumsQuery, priority: 'low' },

  // Cultural Venues
  { key: 'cultural_venues', fn: culturalVenuesQuery, priority: 'low' },

  // Attractions (medium-heavy depending on city)
  { key: 'attraction_historic', fn: attractionHistoricQuery, priority: 'medium' },
  { key: 'attraction_cultural', fn: attractionCulturalQuery, priority: 'medium' },
  { key: 'attraction_monument', fn: attractionMonumentQuery, priority: 'medium' },

  // Public Art
  { key: 'public_art', fn: publicArtQuery, priority: 'low' },
];


const sleep = (ms) => new Promise(res => setTimeout(res, ms));

// Add jitter to make request times irregular (to help avoid bot detection)
const jitter = (base) => base + Math.floor(Math.random() * 2000);

const priorityOrder = {
  low: 1,
  medium: 2,
  heavy: 3,
};

function getElementKey(el) {
  return `${el.type}-${el.id}`;
}

/**
 * Retry wrapper: Processes 429 (Rate Limit) and 504 (Timeout) separately
 */
async function retryQuery(fn, args, retries = 5) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn(...args);
    } catch (err) {
      const status = err.response?.status;
      const isRateLimit = status === 429 || err.message?.includes('429');
      const isTimeout = status === 504 || err.message?.includes('504');

      if ((!isRateLimit && !isTimeout) || i === retries - 1) throw err;
      const baseDelay = isRateLimit ? 20000 : 8000;
      const delay = (i + 1) * baseDelay + jitter(1000);

      console.log(`⏳ ${isRateLimit ? 'Rate Limited' : 'Server Timeout'}. Retry ${i + 1}/${retries} after ${delay}ms`);
      await sleep(delay);
    }
  }
}

/**
 * Fetch cultural sites from Overpass API (Sequential version)
 */
async function fetchAndSaveCulturalSites(
  cityName = 'berlin',
  areaId = 62422,
  radius,
  lat,
  lon
) {
  console.log(`🚀 Starting import: ${cityName}`);

  const results = [];
  const seen = new Set();
  const failed = [];

  // Sort by priority
  const sortedQueries = [...CULTURAL_QUERY_MAP].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  for (let i = 0; i < sortedQueries.length; i++) {
    const q = sortedQueries[i];

    try {
      console.log(`📡 [${i + 1}/${sortedQueries.length}] Running: ${q.key} (Priority: ${q.priority})`);
      const data = await retryQuery(queryOverpass, [
        q.fn(areaId, radius, lat, lon),
      ]);

      const elements = data.elements || [];
      let added = 0;

      for (const el of elements) {
        const key = getElementKey(el);
        if (!seen.has(key)) {
          seen.add(key);
          results.push({
            ...el,
            _category: q.key,
          });
          added++;
        }
      }

      console.log(`   ➜ ${q.key}: +${added} items (Total: ${results.length})`);

      //Give the server a break after a successful query
      //Rest longer after 'heavy' queries with a lot of data.
      const cooldown = q.priority === 'heavy' ? 10000 : 5000;
      await sleep(jitter(cooldown));

    } catch (err) {
      console.error(`❌ [FAILED] ${q.key}:`, err.message);
      failed.push({
        category: q.key,
        error: err.message,
      });
      await sleep(20000);
    }
  }

  const fileName = `${cityName}_cultural_sites_${Date.now()}.json`;
  const dataDir = path.join(__dirname, '../data');

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const filePath = path.join(dataDir, fileName);
  const payload = {
    city: cityName,
    areaId,
    total: results.length,
    failed_queries: failed,
    elements: results,
    generatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));

  console.log(`\n✅ Finished! Saved ${results.length} elements`);
  if (failed.length > 0) {
    console.log(`⚠️ Warning: ${failed.length} queries failed.`);
  }
  console.log(`📁 File: ${filePath}`);

  return filePath;
}

// when executing the script directly (e.g., node fetchAndSaveCulturalSites.js), run the main function
if (require.main === module) {
  const args = process.argv.slice(2);
  const cityName = args[0] || 'berlin';
  const areaId = parseInt(args[1], 10) || 62422;
  fetchAndSaveCulturalSites(cityName, areaId);
}

module.exports = fetchAndSaveCulturalSites;

