// backend/services/excludeSourceIdService.js
/**
 * Add or remove sourceId from mongodb's excludeSourceIds collection.
 * Consider the case where the session is passed as an argument and the corresponding work must be performed in a transaction.
 * Currently used in the delete option of deleteCulturalSiteById and approveProposal.
 *
 */
const ExcludeSourceId = require('../models/ExcludeSourceId');

/**
 * Add a specific sourceId to the exclusion list.
 * @param {string} sourceId -sourceId to exclude (e.g. "node/12345")
 * @param {object} [session] -Mongoose session object for transactions (optional)
 */
const addSourceIdToExclusion = async (sourceId, session = null) => {
  try {
    const options = session ? { session } : {}; // Add to options when session is passed

    // Modify findOne to also receive session options
    const existingEntry = await ExcludeSourceId.findOne(
      { sourceId: sourceId },
      null,
      options,
    );
    if (!existingEntry) {
      // create expects an array, so pass it in array form and apply options
      await ExcludeSourceId.create([{ sourceId: sourceId }], options);
      console.log(
        `[ExcludeService] SourceId '${sourceId}' successfully added to exclusion list.`,
      );
      return true;
    } else {
      console.log(
        `[ExcludeService] SourceId '${sourceId}' already exists in exclusion list.`,
      );
      return false;
    }
  } catch (error) {
    // MongoDB E11000 uniqueness constraint violation error (duplicate key error)
    if (error.code === 11000) {
      console.warn(
        `[ExcludeService] Attempted to add duplicate sourceId '${sourceId}'.`,
      );
      // If a unique error occurs within a transaction, the transaction automatically fails.
      // Here we throw and let the parent catch block handle it.
    }
    console.error(
      `[ExcludeService] Error adding sourceId '${sourceId}' to exclusion list:`,
      error,
    );
    throw error; // Re-throws an error so the caller can handle it
  }
};

const removeSourceIdFromExclusion = async (sourceId, session = null) => {
  // remove also added session option
  try {
    const options = session ? { session } : {};
    const result = await ExcludeSourceId.deleteOne(
      { sourceId: sourceId },
      options,
    );
    if (result.deletedCount > 0) {
      console.log(
        `[ExcludeService] SourceId '${sourceId}' successfully removed from exclusion list.`,
      );
      return true;
    } else {
      console.log(
        `[ExcludeService] SourceId '${sourceId}' not found in exclusion list.`,
      );
      return false;
    }
  } catch (error) {
    console.error(
      `[ExcludeService] Error removing sourceId '${sourceId}' from exclusion list:`,
      error,
    );
    throw error;
  }
};

module.exports = {
  addSourceIdToExclusion,
  removeSourceIdFromExclusion,
};
