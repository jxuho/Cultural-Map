const CulturalSite = require('../models/CulturalSite');
const Review = require('../models/Review');
const User = require('../models/User');
const ExcludeSourceId = require('../models/ExcludeSourceId');
const fs = require('fs/promises');
const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const {
  addSourceIdToExclusion,
} = require('../services/excludeSourceIdService');
const { isPointInCity, isValidLatLng } = require('../utils/locationUtils');
const { extendedCulturalSiteQuery, CITY_RELATION_IDS } = require('../config/osmData');
const { queryOverpass } = require('../services/overpassService');
const {
  processOsmElementForCulturalSite,
} = require('../utils/osmDataProcessor');
const {
  CULTURAL_SITE_UPDATABLE_FIELDS,
  CULTURAL_CATEGORY,
} = require('../config/culturalSiteConfig');

let districtBoundariesCache = null;

const parseBboxParams = (query) => {
  const bboxRaw = query.bbox;
  if (!bboxRaw || typeof bboxRaw !== 'string') {
    return null;
  }

  const values = bboxRaw.split(',').map((value) => Number(value.trim()));
  if (values.length !== 4 || values.some(Number.isNaN)) {
    return null;
  }

  const [minLng, minLat, maxLng, maxLat] = values;
  if (minLng >= maxLng || minLat >= maxLat) {
    return null;
  }

  return { minLng, minLat, maxLng, maxLat };
};


const getAllCulturalSites = asyncHandler(async (req, res, next) => {
  // 1. 페이지네이션 설정
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20000; // 전체 데이터 호출 대응
  const skip = (page - 1) * limit;

  // 2. 정렬 설정 (비정규화된 필드 averageRating, reviewCount 사용 가능)
  let sortStr = '-createdAt';
  if (req.query.sort) {
    sortStr = req.query.sort.split(',').join(' ');
  }

  // 3. 쿼리 실행
  // - 별도의 $lookup이나 $addFields 없이 바로 find()를 사용하여 성능 극대화
  // - select()를 통해 지도 마커에 불필요한 무거운 필드(description 등) 제외
  const bbox = parseBboxParams(req.query);
  const queryFilter = {};

  if (bbox) {
    queryFilter.location = {
      $geoWithin: {
        $box: [
          [bbox.minLng, bbox.minLat],
          [bbox.maxLng, bbox.maxLat],
        ],
      },
    };
  }

  const culturalSites = await CulturalSite.find(queryFilter)
    .sort(sortStr)
    .skip(skip)
    .limit(limit)
    .select('name category location averageRating reviewCount imageUrl');

  // 4. 전체 개수 확인 (페이지네이션용)
  const totalResults = await CulturalSite.countDocuments(queryFilter);
  const totalPages = Math.ceil(totalResults / limit);

  // 5. 응답 전송
  res.status(200).json({
    status: 'success',
    results: culturalSites.length,
    totalResults,
    page,
    totalPages,
    data: {
      culturalSites,
    },
  });
});

const getCulturalSiteById = asyncHandler(async (req, res, next) => {
  const siteId = req.params.id;

  // Sorting criteria parameters received from the client (e.g. ?reviewSort=newest, ?reviewSort=highestRating, ?reviewSort=lowestRating)
  const reviewSortParam = req.query.reviewSort || 'newest'; // Default is latest

  // 1. Check if it is a valid ObjectId (optional but good practice)
  if (!mongoose.isObjectIdOrHexString(siteId)) {
    // Enhanced validation using mongoose.isObjectIdOrHexString
    return next(new AppError('Not valid Id.', 400));
  }

  const pipeline = [
    {
      $match: { _id: mongoose.Types.ObjectId.createFromHexString(siteId) }, // Find documents matching a specific _id
    },
    {
      $lookup: {
        from: 'reviews', // Review model's collection name (lowercase, plural)
        localField: 'reviews', // CulturalSite's reviews field (ObjectId array)
        foreignField: '_id', // _id field in Review
        as: 'reviewsData', // Temporary field where the joined review data will be stored
      },
    },
    // Separate the review data array into individual documents. Ensures cultural heritage documents are maintained even without reviews.
    {
      $unwind: {
        path: '$reviewsData',
        preserveNullAndEmptyArrays: true, // Ensure that cultural heritage documents are maintained even in the absence of reviews
      },
    },
    {
      $lookup: {
        from: 'users', // Collection name in User model
        localField: 'reviewsData.user', // user field in reviewsData
        foreignField: '_id', // User's _id field
        as: 'reviewsData.userPopulated', // Field where joined user information will be stored
      },
    },
    {
      $unwind: {
        path: '$reviewsData.userPopulated',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        // Copy only the desired fields of userPopulated to reviewsData
        'reviewsData.user': {
          _id: '$reviewsData.userPopulated._id',
          username: '$reviewsData.userPopulated.username',
          profileImage: '$reviewsData.userPopulated.profileImage',
        },
      },
    },
    {
      $group: {
        _id: '$_id', // Group by _id of culturalSite
        name: { $first: '$name' },
        description: { $first: '$description' },
        category: { $first: '$category' },
        location: { $first: '$location' },
        address: { $first: '$address' },
        website: { $first: '$website' },
        imageUrl: { $first: '$imageUrl' },
        openingHours: { $first: '$openingHours' },
        licenseInfo: { $first: '$licenseInfo' },
        sourceId: { $first: '$sourceId' },
        favoritesCount: { $first: '$favoritesCount' },
        proposedBy: { $first: '$proposedBy' },
        registeredBy: { $first: '$registeredBy' },
        createdAt: { $first: '$createdAt' },
        updatedAt: { $first: '$updatedAt' },
        // Re-arrange review information (before sorting options)
        reviews: {
          $push: {
            $cond: {
              if: { $ne: ['$reviewsData', null] }, // push only if reviewsData is not null
              then: {
                _id: '$reviewsData._id',
                rating: '$reviewsData.rating',
                comment: '$reviewsData.comment',
                createdAt: '$reviewsData.createdAt',
                user: '$reviewsData.user',
              },
              else: '$$REMOVE', // Remove if null
            },
          },
        },
      },
    },
    // Cleaning up review array (removing null/empty objects)
    {
      $addFields: {
        reviews: {
          $filter: {
            input: '$reviews',
            as: 'review',
            cond: { $ne: ['$$review', null] },
          },
        },
      },
    },
  ];

  // Add review sorting logic
  let reviewSortOrder = {};
  if (reviewSortParam === 'newest') {
    reviewSortOrder = { createdAt: -1 }; // Latest
  } else if (reviewSortParam === 'highestRating') {
    reviewSortOrder = { rating: -1 }; // Highest rated
  } else if (reviewSortParam === 'lowestRating') {
    reviewSortOrder = { rating: 1 }; // Lowest rating
  } else {
    reviewSortOrder = { createdAt: -1 }; // default
  }

  pipeline.push(
    {
      $addFields: {
        reviews: {
          $sortArray: {
            input: '$reviews',
            sortBy: reviewSortOrder, // Dynamically apply sorting criteria
          },
        },
      },
    },
    // Finally calculate averageRating and reviewCount
    {
      $addFields: {
        averageRating: { $ifNull: [{ $avg: '$reviews.rating' }, 0] },
        reviewCount: { $size: '$reviews' },
      },
    },
    {
      $project: {
        // Select fields to be included in the final result document.
        name: 1,
        description: 1,
        category: 1,
        location: 1,
        address: 1,
        website: 1,
        imageUrl: 1,
        openingHours: 1,
        licenseInfo: 1,
        sourceId: 1,
        favoritesCount: 1,
        proposedBy: 1,
        registeredBy: 1,
        createdAt: 1,
        updatedAt: 1,
        reviews: 1, // Review data is also returned
        averageRating: 1,
        reviewCount: 1,
      },
    },
  );

  const culturalSite = await CulturalSite.aggregate(pipeline);

  // ---From here, data post-processing using JavaScript just before the backend response ---
  // To solve the problem where reviews: [user: {}] is returned when the reviews array is empty.
  // I tried to solve this problem with the aggregation pipeline, but it failed. The method of manipulating it through js below is the next best option.
  let finalCulturalSite = culturalSite[0];

  // 1. Filter reviews array: remove reviews without _id or without user._id
  // Reviews: Filters out things like [{ user: {} }] .
  if (finalCulturalSite.reviews && finalCulturalSite.reviews.length > 0) {
    finalCulturalSite.reviews = finalCulturalSite.reviews.filter(
      (review) => review && review._id && review.user && review.user._id, // Review object, review _id, user object, user _id must all be valid
    );
  } else {
    // In case the reviews array itself does not exist or is empty (initialize with an empty array instead of null)
    finalCulturalSite.reviews = [];
  }

  // 2. Recalculate averageRating and reviewCount based on the filtered reviews array
  if (finalCulturalSite.reviews.length > 0) {
    const totalRating = finalCulturalSite.reviews.reduce(
      (sum, review) => sum + review.rating,
      0,
    );
    finalCulturalSite.averageRating = parseFloat(
      (totalRating / finalCulturalSite.reviews.length).toFixed(1),
    );
    finalCulturalSite.reviewCount = finalCulturalSite.reviews.length;
  } else {
    finalCulturalSite.averageRating = 0;
    finalCulturalSite.reviewCount = 0;
  }
  // ---End of post-processing ---

  res.status(200).json({
    status: 'success',
    data: {
      culturalSite: finalCulturalSite, // aggregate returns an array, so use the first element
    },
  });
});

const updateCulturalSiteById = asyncHandler(async (req, res, next) => {
  // 1. Check administrator privileges
  if (!req.user || req.user.role !== 'admin') {
    return next(
      new AppError(
        'You do not have permission to edit cultural heritage. Only administrators can do so.',
        403,
      ),
    );
  }

  // 2. Configure updateData by extracting only fields that are allowed to be modified
  const updateData = {};
  for (const field of CULTURAL_SITE_UPDATABLE_FIELDS) {
    // If the field is defined in req.body and is not null (null is when you do not want to update it)
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  // 3. Additional validation for each field (in addition to Mongoose Validator, you can also pre-process this here).
  // Example: Manually checking if the category field is in the CULTURAL_CATEGORY enum
  if (updateData.category && !CULTURAL_CATEGORY.includes(updateData.category)) {
    return next(
      new AppError(`Invalid category value: ${updateData.category}`, 400),
    );
  }
  // Checking the length of the name field (there is a Mongoose validator, but this can give faster feedback to the client)
  if (
    updateData.name &&
    (updateData.name.length < 2 || updateData.name.length > 100)
  ) {
    return next(
      new AppError('Name must be between 2 and 100 characters long.', 400),
    );
  }
  // Check length of description field
  if (updateData.description && updateData.description.length > 1000) {
    return next(
      new AppError('Description cannot exceed 1000 characters.', 400),
    );
  }

  // 4. If there are no fields to update
  if (Object.keys(updateData).length === 0) {
    return next(
      new AppError(
        'The field to be updated is not provided or is invalid.',
        400,
      ),
    );
  }

  // 5. CulturalSite document update
  // { new: true } : Returns the document after update.
  // { runValidators: true } : Runs validation (minlength, maxlength, enum, etc.) defined in the schema.
  const culturalSite = await CulturalSite.findByIdAndUpdate(
    req.params.id,
    updateData,
    {
      new: true,
      runValidators: true,
      // If set to true, fields that are not in updateData will also be set to default values.
      // However, since we only update fields explicitly added to updateData, we leave the default option at its default value.
    },
  );

  // 6. Handle when document does not exist
  if (!culturalSite) {
    return next(new AppError('No cultural heritage with that ID found.', 404));
  }

  // 7. Return success response
  res.status(200).json({
    status: 'success',
    message: 'Cultural heritage information has been successfully updated.',
    data: {
      culturalSite, // Respond with updated cultural heritage information
    },
  });
});

const deleteCulturalSiteById = asyncHandler(async (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(
      new AppError(
        'Do not have the authority to directly register cultural heritage. Only administrators can do this.',
        403,
      ),
    );
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const culturalSite = await CulturalSite.findById(req.params.id).session(
      session,
    );

    if (!culturalSite) {
      await session.abortTransaction();
      return next(
        new AppError('No cultural heritage with that ID found.', 404),
      );
    }
    // Delete Cultural Site
    await CulturalSite.findByIdAndDelete(req.params.id, { session });

    // Delete relevant reviews and remove them from user review lists
    if (culturalSite.reviews && culturalSite.reviews.length > 0) {
      await Review.deleteMany({ culturalSite: culturalSite._id }, { session });
      const usersWithDeletedReviews = await User.find({
        reviews: { $in: culturalSite.reviews },
      }).session(session);
      for (const userDoc of usersWithDeletedReviews) {
        await User.findByIdAndUpdate(
          userDoc._id,
          { $pullAll: { reviews: culturalSite.reviews } },
          { session },
        );
      }
    }

    // Remove cultural heritage from user favorites list
    await User.updateMany(
      { favoriteSites: req.params.id },
      { $pull: { favoriteSites: req.params.id } },
      { session },
    );

    // Add sourceId to ExcludeSourceId
    await addSourceIdToExclusion(culturalSite.sourceId, session);

    await session.commitTransaction();

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    await session.abortTransaction();
    console.error('Cultural heritage deletion transaction failed:', error);

    // Handling duplicate key errors that can occur with `addSourceIdToExclusion`
    if (error.code === 11000) {
      return next(
        new AppError('The ID already exists in the exclusion list.', 409),
      );
    }

    return next(
      new AppError('Error occurred while deleting cultural heritage.', 500),
    );
  } finally {
    session.endSession();
  }
});

/**
 * Returns OSM locations within 50m based on the latitude/longitude passed from the client.
 * Use extendedQuery.
 * Returns CulturalSite array (processed osm)
 * GET /api/v1/cultural-sites/nearby-osm?lat={latitude}&lon={longitude}
 */
const getNearbyOsmCulturalSites = asyncHandler(async (req, res, next) => {
  const { lon, lat, noReverseGeocode } = req.query; // Added noReverseGeocode query parameter
  const currentCity = process.env.CITY_NAME || 'berlin';
  // Determine the flag for reverse geocoding
  // If noReverseGeocode is 'true' (string), then set performReverseGeocoding to false.
  // Otherwise, it defaults to true.
  const performReverseGeocoding = noReverseGeocode !== 'true';

  // 1. Latitude/longitude validation
  if (!isValidLatLng(lon, lat)) {
    return next(
      new AppError(
        'Effective latitude and longitude query parameters are required.',
        400,
      ),
    );
  }

  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);
  const radius = 50; // 50m radius (used for Overpass queries)

  // 2. See inside ${currentCity} city limits (optional)
  try {
    if (!isPointInCity(parsedLat, parsedLon, currentCity)) {
      return next(
        new AppError(
          `Since the input location is not inside the boundary when ${currentCity}, the surrounding OSM cultural heritage cannot be searched.`,
          400,
        ),
      );
    }
  } catch (error) {
    return next(
      new AppError(
        `Error occurs during location validation: ${error.message}`,
        500,
      ),
    );
  }

  // 3. Create Overpass query
  const currentCityAreaId = CITY_RELATION_IDS[currentCity];
  if (!currentCityAreaId) {
    return next(
      new AppError(`OSM area ID for city "${currentCity}" is not defined.`, 400),
    );
  }
  const overpassQuery = extendedCulturalSiteQuery(currentCityAreaId, radius, parsedLat, parsedLon);

  // 4. Overpass API call
  let osmData;
  try {
    osmData = await queryOverpass(overpassQuery);
  } catch (error) {
    return next(
      new AppError(
        `Failed to bring about the surrounding OSM cultural site information: ${error.message}`,
        500,
      ),
    );
  }

  const osmElements = osmData.elements || [];

  // Pass the performReverseGeocoding flag to the mapping function
  const processedSitesPromises = osmElements.map((el) =>
    processOsmElementForCulturalSite(el, performReverseGeocoding),
  );

  let processedSites;
  try {
    processedSites = await Promise.all(processedSitesPromises);
    processedSites = processedSites.filter(
      (site) => site !== null && !site.name.startsWith('Unnamed Site (ID:'),
    );
  } catch (error) {
    return next(
      new AppError(
        `Errors occur during cultural heritage data processing: ${error.message}`,
        500,
      ),
    );
  }

  // 5. Filter out sites already in your CulturalSite DB ---
  const osmSourceIds = processedSites
    .map((site) => site.sourceId)
    .filter(Boolean); // Extract only those with sourceId

  let existingCulturalSites = [];
  if (osmSourceIds.length > 0) {
    try {
      // Find CulturalSites with the corresponding sourceId in MongoDB.
      // Assume your CulturalSite model has a sourceId field.
      existingCulturalSites = await CulturalSite.find({
        sourceId: { $in: osmSourceIds },
      }).select('sourceId'); // Increase efficiency by only getting the sourceId.
    } catch (error) {
      return next(
        new AppError(
          `Errors occur during existing cultural site information request: ${error.message}`,
          500,
        ),
      );
    }
  }

  // The sourceId of existing cultural assets is created as a Set to enable quick search.
  const existingSourceIdsSet = new Set(
    existingCulturalSites.map((site) => site.sourceId),
  );

  // 6. Filter only OSM cultural assets not in the database
  const uniqueProcessedSites = processedSites.filter(
    (site) => !existingSourceIdsSet.has(site.sourceId),
  );

  // 7. Return results (adjust step number)
  res.status(200).json({
    status: 'success',
    results: uniqueProcessedSites.length,
    data: {
      osmCulturalSites: uniqueProcessedSites,
    },
  });
});

/**
 * Receives already processed data in CulturalSite schema format and stores it in the DB.
 * This function accepts the result of `processAndPreviewOsmCulturalSite` or processed data generated directly by the client.
 * POST /api/v1/cultural-sites/save-processed
 * Request Body: { ... culturalSiteData (CulturalSite Schema compliant) ... }
 */
const saveCulturalSiteToDb = asyncHandler(async (req, res, next) => {
  const currentCity = process.env.CITY_NAME || 'berlin';
  if (!req.user || req.user.role !== 'admin') {
    return next(
      new AppError(
        'Do not have the authority to directly register cultural heritage. Only administrators can do this.',
        403,
      ),
    );
  }

  const culturalSiteData = req.body; // Assuming this is already a format that fits the CulturalSite schema

  console.log(culturalSiteData);

  // Recheck whether required fields exist (defensive coding)
  if (
    !culturalSiteData.name ||
    !culturalSiteData.category ||
    !culturalSiteData.location ||
    !Array.isArray(culturalSiteData.location.coordinates) ||
    culturalSiteData.location.coordinates.length !== 2 ||
    !culturalSiteData.sourceId
  ) {
    return next(
      new AppError(
        'The required fields for the cultural heritage data to be saved are missing or not in the correct format.',
        400,
      ),
    );
  }

  const [parsedLon, parsedLat] = culturalSiteData.location.coordinates;

  // 1. Internal confirmation of ${currentCity} city boundary (final verification when saving in DB)
  try {
    if (!isPointInCity(parsedLat, parsedLon, currentCity)) {
      return next(
        new AppError(
          `The entered location is not within the ${currentCity} city boundary. Only cultural heritage within ${currentCity} can be registered.`,
          400,
        ),
      );
    }
  } catch (error) {
    return next(
      new AppError(
        `Error occurred during location validation: ${error.message}`,
        500,
      ),
    );
  }

  // 2. Check sourceId duplicate (if it already exists in DB)
  const existingCulturalSite = await CulturalSite.findOne({
    sourceId: culturalSiteData.sourceId,
  });
  if (existingCulturalSite) {
    return next(
      new AppError(
        `sourceId '${culturalSiteData.sourceId}' is already registered as a cultural heritage site.`,
        409,
      ),
    );
  }

  // 3. Check if sourceId is in exclude list (ExcludeSourceId)
  const isExcluded = await ExcludeSourceId.findOne({
    sourceId: culturalSiteData.sourceId,
  });
  if (isExcluded) {
    return next(
      new AppError(
        `sourceId '${culturalSiteData.sourceId}' is in the exclusion list.`,
        403,
      ),
    );
  }

  // 4. Create and save CulturalSite instance
  try {
    const newCulturalSite = await CulturalSite.create({
      ...culturalSiteData,
      registeredBy: req.user.id, // Record who registered
    });

    res.status(201).json({
      status: 'success',
      message:
        'Processed cultural heritage has been successfully saved to the database.',
      data: {
        culturalSite: newCulturalSite,
      },
    });
  } catch (error) {
    console.error('Error saving processed cultural site to DB:', error);
    if (error.code === 11000) {
      return next(
        new AppError(
          `Error occurred while saving to database: ${error.message}`,
          409,
        ),
      );
    }
    return next(
      new AppError(
        `Error occurred while saving processed cultural heritage: ${error.message}`,
        500,
      ),
    );
  }
});

const getDistrictStats = asyncHandler(async (req, res) => {
  const stats = await CulturalSite.aggregate([
    {
      // active한 사이트만 필터링 (필요시)
      $match: { active: true }
    },
    {
      // address.district 필드를 기준으로 그룹화
      $group: {
        _id: '$address.district',
        count: { $sum: 1 },
        // 각 구의 대표 좌표를 하나 가져오거나, 
        // 미리 정의된 구별 중심 좌표를 프론트에서 써도 됩니다.
      }
    },
    { $sort: { count: -1 } }
  ]);

  res.status(200).json({
    status: 'success',
    data: stats
  });
});

const getDistrictBoundaries = asyncHandler(async (req, res, next) => {
  if (!districtBoundariesCache) {
    const boundaryFilePath = path.join(
      __dirname,
      '..',
      'data',
      'berlin_district_boundary.geojson',
    );

    try {
      const rawGeojson = await fs.readFile(boundaryFilePath, 'utf8');
      districtBoundariesCache = JSON.parse(rawGeojson);
    } catch (error) {
      return next(
        new AppError(
          `Failed to load district boundaries: ${error.message}`,
          500,
        ),
      );
    }
  }

  res.status(200).json({
    status: 'success',
    data: {
      districtBoundaries: districtBoundariesCache,
    },
  });
});


module.exports = {
  getAllCulturalSites,
  getCulturalSiteById,
  saveCulturalSiteToDb,
  updateCulturalSiteById,
  deleteCulturalSiteById,
  getNearbyOsmCulturalSites,
  getDistrictStats,
  getDistrictBoundaries,
};
