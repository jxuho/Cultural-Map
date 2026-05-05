// backend/services/overpassUpdater.js
/**
 * In app.js, use the cron scheduler to run the function periodically.
 * If there is a place among the results of baseCulturalSiteQuery that is not saved in my db, add it.
 * If the sourceID (node/1234567890) of the location is stored in the excludeSourceIds array, it is excluded.
 */

require('dotenv').config();
const axios = require('axios');
const CulturalSite = require('../models/CulturalSite');
const { OVERPASS_API_URL } = require('../config/apiUrls');
const { baseCulturalSiteQuery } = require('../config/osmData');
const {
  processOsmElementForCulturalSite,
} = require('../utils/osmDataProcessor');
const ExcludeSourceId = require('../models/ExcludeSourceId');
const path = require('path');
const fs = require('fs/promises'); // For async file operations
const isEqual = require('node:util').isDeepStrictEqual;

// Define the log directory
const LOG_DIR = path.join(__dirname, '../logs'); // Adjust path as needed

// A simple logger to collect messages
let logMessages = [];

// Function to log messages and store them
const customLogger = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
  console.log(formattedMessage); // Still log to console for immediate feedback
  logMessages.push(formattedMessage);
};

// Function to write collected logs to a file
const writeLogsToFile = async () => {
  try {
    // Ensure the log directory exists
    await fs.mkdir(LOG_DIR, { recursive: true });

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    const second = String(now.getSeconds()).padStart(2, '0');

    const logFileName = `overpass_update_log_${year}${month}${day}_${hour}${minute}${second}.log`;
    const logFilePath = path.join(LOG_DIR, logFileName);

    await fs.writeFile(logFilePath, logMessages.join('\n') + '\n');
    console.log(`Logs saved to: ${logFilePath}`);
  } catch (err) {
    console.error('Failed to write logs to file:', err);
  } finally {
    logMessages = []; // Clear messages after writing
  }
};

/**
 * Executes a query against the Overpass API and returns the results as an array.
 * @param {string} query -Overpass query string.
 * @returns {"elements": [{"type": "node", "id":"" "lat": "", "lon": "", "tags": [...]}]}
 * @throws {Error} -An error occurs when an API call fails.
 */
const queryOverpass = async (query) => {
  try {
    const response = await axios.post(OVERPASS_API_URL, query, {
      headers: {
        'Content-Type': 'text/plain',
        'User-Agent': 'ChemnitzCulturalSitesApp/1.0 (jxuholee@gmail.com)',
      },
      timeout: 60000, // Set timeout to 60 seconds
    });
    return response.data;
  } catch (error) {
    console.error('Error querying Overpass API:', error.message);
    if (error.response) {
      console.error(
        'Overpass API Response Error:',
        error.response.status,
        error.response.data,
      );
      throw new Error(
        `Overpass API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
      );
    } else if (error.request) {
      throw new Error(
        'Overpass API could not be reached. There might be a network issue.',
      );
    } else {
      throw new Error(
        `Unknown error occurred while querying Overpass API: ${error.message}`,
      );
    }
  }
};

/**
 * Used with cron
 * Compare the information received from the overpass API and add any items that did not exist before.
 * 1. Added when an item that does not previously exist is added.
 * 2. Among existing items, overwrite when the contents of CulturalSite.originalTags are changed.
 */
const overpassUpdater = async () => {
  customLogger('Weekly Overpass data update task started...');
  logMessages = []; // Reset logs for each run

  try {
    // 1. Fetch latest data from Overpass API
    customLogger('Fetching data from Overpass API...');
    const OVERPASS_QUERY = baseCulturalSiteQuery();
    const overpassData = await queryOverpass(OVERPASS_QUERY);
    const elements = overpassData.elements || [];

    if (elements.length === 0) {
      customLogger('No elements found from Overpass API.', 'warn');
      return; // Exit if no elements
    }

    // 2. Get existing cultural sites and exclusion list from the database
    const dbExcludedSourceIds = new Set(
      (await ExcludeSourceId.find({}, { sourceId: 1 }).lean()).map(
        (item) => item.sourceId,
      ),
    );

    const existingCulturalSitesObject = {};
    const existingSites = await CulturalSite.find(
      {},
      { sourceId: 1, originalTags: 1, name: 1 },
    ).lean();
    existingSites.forEach((site) => {
      existingCulturalSitesObject[site.sourceId] = site;
    });

    const newCulturalSitesToInsert = [];
    const culturalSitesToUpdate = [];

    // 3. Iterate and process Overpass elements
    for (const element of elements) {
      const elementType = element.type;
      const elementId = element.id;
      const sourceId = elementType + '/' + elementId;
      // 3.1. Check if in exclusion list
      if (dbExcludedSourceIds.has(sourceId)) {
        customLogger(
          `SourceId ${sourceId} is in exclusion list. Skipping.`,
          'info',
        );
        continue;
      }
      try {
        // 3.2. Check if it's an existing cultural site
        const existingSite = existingCulturalSitesObject[sourceId];

        if (existingSite) {
          // 3.2.1. Existing cultural site: Check if originalTags changed
          if (!isEqual(existingSite.originalTags, element.tags)) {
            customLogger(
              `[UPDATE] ${existingSite.name} (sourceId: ${sourceId})`,
            );
            culturalSitesToUpdate.push({
              id: existingSite._id,
              tags: element.tags,
            });
          }
        } else {
          // 3.2.2. New cultural site: Add to insert list
          customLogger(`[INSERT] SourceId: ${sourceId}`);

          const processedCulturalSiteData =
            await processOsmElementForCulturalSite(element);
          if (processedCulturalSiteData === null) {
            customLogger(
              `Skipping element ${sourceId} as it did not yield valid cultural site data.`,
              'warn',
            );
            continue;
          }

          newCulturalSitesToInsert.push(processedCulturalSiteData);
        }
      } catch (error) {
        customLogger(
          `Error processing OSM element ${sourceId}: ${error.message}`,
          'error',
        );
        // Invalid elements are skipped, proceed to the next element
      }
    }

    // 4. Add new cultural sites
    if (newCulturalSitesToInsert.length > 0) {
      customLogger(
        `Attempting to insert ${newCulturalSitesToInsert.length} new CulturalSites.`,
      );
      const result = await CulturalSite.insertMany(newCulturalSitesToInsert, {
        ordered: false,
      });
      customLogger(`Successfully inserted ${result.length} new CulturalSites.`);
    } else {
      customLogger('No new cultural sites to insert.');
    }

    // 5. Update existing cultural sites
    if (culturalSitesToUpdate.length > 0) {
      customLogger(
        `Attempting to update ${culturalSitesToUpdate.length} existing CulturalSites.`,
      );
      for (const updateItem of culturalSitesToUpdate) {
        try {
          // Update only the originalTags field
          await CulturalSite.findByIdAndUpdate(
            updateItem.id,
            {
              $set: {
                originalTags: updateItem.tags,
              },
            },
            { new: true, runValidators: true },
          );
          customLogger(
            `Successfully updated originalTags for cultural site with ID: ${updateItem.id}`,
          );
        } catch (updateError) {
          customLogger(
            `Error updating originalTags for cultural site ${updateItem.id}: ${updateError.message}`,
            'error',
          );
        }
      }
      customLogger(`Completed updates for existing CulturalSites.`);
    } else {
      customLogger('No existing cultural sites to update.');
    }
  } catch (error) {
    customLogger(
      `Error during weekly Overpass data update task: ${error.message}`,
      'error',
    );
    if (error.writeErrors) {
      customLogger(
        `Write Errors: ${error.writeErrors.map((e) => e.errmsg).join('; ')}`,
        'error',
      );
    }
  } finally {
    customLogger('Weekly Overpass data update task completed.');
    await writeLogsToFile(); // Ensure logs are written even if an error occurs
  }
};

module.exports = {
  queryOverpass,
  overpassUpdater,
};
